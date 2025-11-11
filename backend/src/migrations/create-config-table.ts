import db from '../db/database';

export async function migrateCreateConfigTable() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Creando tabla de configuración del sistema...');
    
    // Crear tabla config
    await client.query(`
      CREATE TABLE IF NOT EXISTS config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabla config creada');
    
    // Insertar configuración inicial del número de inicio de despachos
    await client.query(`
      INSERT INTO config (key, value, description)
      VALUES ('dispatch_start_number', '1', 'Número inicial para la secuencia de despachos')
      ON CONFLICT (key) DO NOTHING
    `);
    
    console.log('✅ Configuración inicial insertada: dispatch_start_number = 1');
    
  } catch (error: any) {
    if (error.code === '42P07') {
      console.log('ℹ️ Tabla config ya existe, omitiendo...');
    } else {
      console.error('❌ Error en migración create-config-table:', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}
