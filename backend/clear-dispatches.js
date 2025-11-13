const { Client } = require('pg');

// URL de Railway
const DATABASE_URL = 'postgresql://postgres:IHzPKoSONKsAmWdVBUaqifJxVHJBHcSo@switchyard.proxy.rlwy.net:57551/railway';

async function clearDispatches() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Railway');

    // Contar despachos antes de borrar
    const countResult = await client.query('SELECT COUNT(*) FROM dispatches');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 Despachos encontrados: ${count}`);

    // Borrar todos los despachos
    await client.query('DELETE FROM dispatches');
    console.log(`🗑️  ${count} despachos eliminados correctamente`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Desconectado');
  }
}

clearDispatches();
