// Migración: Agregar columna ticketorden a la tabla dispatches
import db from '../db/database';

export async function migrateAddTicketOrden() {
  const client = await db.connect();
  
  try {
    console.log('🔄 Ejecutando migración: agregar columna ticketorden a dispatches...');
    
    // Agregar columna ticketorden
    await client.query(`
      ALTER TABLE dispatches 
      ADD COLUMN IF NOT EXISTS ticketorden VARCHAR(50)
    `);
    
    console.log('✅ Migración completada: columna ticketorden agregada a dispatches');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
  }
}
