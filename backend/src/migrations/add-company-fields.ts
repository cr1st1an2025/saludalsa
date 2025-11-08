// Migración: Agregar campos de facturación a la tabla companies
import db from '../db/database';

export async function migrateAddCompanyFields() {
  const client = await db.connect();
  
  try {
    console.log('🔄 Ejecutando migración: agregar campos de facturación a companies...');
    
    // Agregar columnas si no existen
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS rnc VARCHAR(50),
      ADD COLUMN IF NOT EXISTS domicilio TEXT,
      ADD COLUMN IF NOT EXISTS tipo_impositivo DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS exento BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS contactos TEXT
    `);
    
    console.log('✅ Migración completada: campos de facturación agregados a companies');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
  }
}
