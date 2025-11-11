import db from '../db/database';

export async function migrateAddClientFields() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Agregando campos adicionales a tabla clients...');
    
    // Agregar campo RNC (Registro Nacional de Contribuyentes)
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS rnc VARCHAR(20)
    `);
    
    // Agregar campo dirección
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS direccion TEXT
    `);
    
    // Agregar campo obra
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS obra TEXT
    `);
    
    // Agregar campo número de orden de compra
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS numero_orden_compra VARCHAR(50)
    `);
    
    // Agregar campo descuento (porcentaje: 0.00 a 100.00)
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS descuento DECIMAL(5, 2) DEFAULT 0.00
    `);
    
    // Agregar timestamps
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    console.log('✅ Campos adicionales agregados a clients: RNC, dirección, obra, número_orden_compra, descuento');
    
  } catch (error: any) {
    if (error.code === '42701') {
      console.log('ℹ️ Campos adicionales ya existen en clients, omitiendo...');
    } else {
      console.error('❌ Error en migración add-client-fields:', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}
