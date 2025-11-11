import db from '../db/database';

export async function migrateAddItbisToProducts() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Agregando campo itbis_rate a tabla products...');
    
    // Agregar columna itbis_rate (tasa de ITBIS: 0.00 o 0.18)
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS itbis_rate DECIMAL(4, 2) DEFAULT 0.00
    `);
    
    console.log('✅ Campo itbis_rate agregado');
    
    // Actualizar productos procesados con ITBIS 18%
    const processedProducts = [
      'Arena lavada',
      'Gravillín',
      'Base'
    ];
    
    for (const productName of processedProducts) {
      await client.query(
        'UPDATE products SET itbis_rate = 0.18 WHERE name = $1',
        [productName]
      );
    }
    
    console.log('✅ ITBIS configurado: productos procesados tienen 18%, naturales 0%');
    
  } catch (error: any) {
    if (error.code === '42701') {
      console.log('ℹ️ Campo itbis_rate ya existe, omitiendo...');
    } else {
      console.error('❌ Error en migración add-itbis-to-products:', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}
