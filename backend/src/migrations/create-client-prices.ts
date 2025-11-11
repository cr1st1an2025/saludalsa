import db from '../db/database';

export async function migrateCreateClientPrices() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Creando tabla client_prices para precios especiales por cliente...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_prices (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        client_name VARCHAR(200) NOT NULL,
        special_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, client_name)
      )
    `);
    
    // Crear índice para búsquedas rápidas
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_client_prices_lookup 
      ON client_prices(client_name, product_id)
    `);
    
    console.log('✅ Tabla client_prices creada con índice de búsqueda');
    
  } catch (error: any) {
    if (error.code === '42P07') {
      console.log('ℹ️ Tabla client_prices ya existe, omitiendo...');
    } else {
      console.error('❌ Error en migración create-client-prices:', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}
