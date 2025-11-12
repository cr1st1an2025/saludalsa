const { Pool } = require('pg');

// Configuración de la base de datos (ajusta según tu entorno si es diferente)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gestion_despachos',
  password: '123456',
  port: 5432,
});

async function resetDispatches() {
  let client;
  try {
    console.log('Conectando a la base de datos para reiniciar despachos...');
    client = await pool.connect();
    console.log('Conexión exitosa. Reiniciando tabla "dispatches"...');

    // Ejecutar TRUNCATE TABLE para la tabla de despachos
    // RESTART IDENTITY: Reinicia la secuencia de IDs (auto-incremento)
    // CASCADE: Elimina cualquier registro dependiente en otras tablas (si los hay)
    const query = 'TRUNCATE TABLE dispatches RESTART IDENTITY CASCADE;';
    await client.query(query);

    console.log('✅ Tabla "dispatches" reiniciada exitosamente.');
    
  } catch (err) {
    console.error('❌ Error al reiniciar la tabla "dispatches":', err);
    process.exit(1); // Salir con código de error
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log('Conexión a la base de datos cerrada.');
  }
}

resetDispatches();
