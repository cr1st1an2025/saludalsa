// Script para migrar datos de Render a Railway
const { Pool } = require('pg');

// Configuración de base de datos ORIGEN (Render)
const renderPool = new Pool({
  connectionString: 'postgresql://gestion_despachos_user:DN0eX71qsu0L3TVYxiPklmB2pVaNWPpi@dpg-d40hvrs9c44c73bbfna0-a.oregon-postgres.render.com/gestion_despachos',
  ssl: { rejectUnauthorized: false }
});

// Configuración de base de datos DESTINO (Railway)
const railwayPool = new Pool({
  connectionString: 'postgresql://postgres:XoFTkkJdsyQwxURZsRLolihBXLVQHcOj@yamabiko.proxy.rlwy.net:57991/railway',
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  try {
    console.log('🔄 Iniciando migración de datos...\n');

    // 1. Migrar usuarios
    console.log('👥 Migrando usuarios...');
    const users = await renderPool.query('SELECT * FROM users');
    for (const user of users.rows) {
      await railwayPool.query(
        'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [user.id, user.username, user.password, user.role]
      );
    }
    console.log(`✅ ${users.rows.length} usuarios migrados\n`);

    // 2. Migrar equipos
    console.log('🔧 Migrando equipos...');
    const equipment = await renderPool.query('SELECT * FROM equipment');
    for (const equip of equipment.rows) {
      await railwayPool.query(
        'INSERT INTO equipment (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [equip.id, equip.name]
      );
    }
    console.log(`✅ ${equipment.rows.length} equipos migrados\n`);

    // 3. Migrar operarios
    console.log('👷 Migrando operarios...');
    const operators = await renderPool.query('SELECT * FROM operators');
    for (const operator of operators.rows) {
      await railwayPool.query(
        'INSERT INTO operators (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [operator.id, operator.name]
      );
    }
    console.log(`✅ ${operators.rows.length} operarios migrados\n`);

    // 4. Migrar camiones
    console.log('🚛 Migrando camiones...');
    const camiones = await renderPool.query('SELECT * FROM camiones');
    for (const camion of camiones.rows) {
      await railwayPool.query(
        'INSERT INTO camiones (id, placa, marca, color, ficha, m3, estado, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
        [camion.id, camion.placa, camion.marca, camion.color, camion.ficha, camion.m3, camion.estado, camion.createdat, camion.updatedat]
      );
    }
    console.log(`✅ ${camiones.rows.length} camiones migrados\n`);

    // 5. Migrar empresas
    console.log('🏢 Migrando empresas...');
    const companies = await renderPool.query('SELECT * FROM companies');
    for (const company of companies.rows) {
      await railwayPool.query(
        'INSERT INTO companies (id, name, rnc, address, phone) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [company.id, company.name, company.rnc, company.address, company.phone]
      );
    }
    console.log(`✅ ${companies.rows.length} empresas migradas\n`);

    // 6. Migrar despachos (SIN ticketorden y m3, se agregarán después con las migraciones)
    console.log('📦 Migrando despachos...');
    const dispatches = await renderPool.query('SELECT * FROM dispatches ORDER BY id');
    for (const dispatch of dispatches.rows) {
      try {
        await railwayPool.query(
          `INSERT INTO dispatches (id, despachono, fecha, hora, camion, placa, color, ficha, numeroorden, materials, cliente, celular, total, userid, equipmentid, operatorid)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ON CONFLICT (id) DO NOTHING`,
          [
            dispatch.id,
            dispatch.despachono,
            dispatch.fecha,
            dispatch.hora,
            dispatch.camion,
            dispatch.placa,
            dispatch.color,
            dispatch.ficha,
            dispatch.numeroorden,
            dispatch.materials,
            dispatch.cliente,
            dispatch.celular,
            dispatch.total,
            dispatch.userid,
            dispatch.equipmentid,
            dispatch.operatorid
          ]
        );
      } catch (err) {
        console.error(`⚠️  Error en despacho ${dispatch.id}:`, err.message);
      }
    }
    console.log(`✅ ${dispatches.rows.length} despachos migrados\n`);

    // 7. Actualizar secuencias
    console.log('🔢 Actualizando secuencias...');
    
    const maxUserId = await railwayPool.query('SELECT MAX(id) as max FROM users');
    if (maxUserId.rows[0].max) {
      await railwayPool.query(`SELECT setval('users_id_seq', ${maxUserId.rows[0].max})`);
    }

    const maxEquipmentId = await railwayPool.query('SELECT MAX(id) as max FROM equipment');
    if (maxEquipmentId.rows[0].max) {
      await railwayPool.query(`SELECT setval('equipment_id_seq', ${maxEquipmentId.rows[0].max})`);
    }

    const maxOperatorId = await railwayPool.query('SELECT MAX(id) as max FROM operators');
    if (maxOperatorId.rows[0].max) {
      await railwayPool.query(`SELECT setval('operators_id_seq', ${maxOperatorId.rows[0].max})`);
    }

    const maxDispatchId = await railwayPool.query('SELECT MAX(id) as max FROM dispatches');
    if (maxDispatchId.rows[0].max) {
      await railwayPool.query(`SELECT setval('dispatches_id_seq', ${maxDispatchId.rows[0].max})`);
    }

    console.log('✅ Secuencias actualizadas\n');

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - ${users.rows.length} usuarios`);
    console.log(`   - ${equipment.rows.length} equipos`);
    console.log(`   - ${operators.rows.length} operarios`);
    console.log(`   - ${camiones.rows.length} camiones`);
    console.log(`   - ${companies.rows.length} empresas`);
    console.log(`   - ${dispatches.rows.length} despachos`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await renderPool.end();
    await railwayPool.end();
  }
}

migrateData();
