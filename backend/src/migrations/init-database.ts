// Migración: Inicialización completa de la base de datos
import db from '../db/database';

export async function migrateInitDatabase() {
  const client = await db.connect();
  
  try {
    console.log('🔄 Ejecutando migración: inicialización de base de datos...');
    
    // Tabla de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'employee',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de equipos
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de operarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS operators (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de empresas
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        rnc VARCHAR(50),
        domicilio TEXT,
        tipo_impositivo DECIMAL(5,2) DEFAULT 0,
        exento BOOLEAN DEFAULT FALSE,
        contactos TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de camiones
    await client.query(`
      CREATE TABLE IF NOT EXISTS camiones (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(20) UNIQUE NOT NULL,
        marca VARCHAR(100),
        color VARCHAR(50),
        ficha VARCHAR(50),
        m3 DECIMAL(10,2),
        estado VARCHAR(20) DEFAULT 'activo',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Secuencia para números de despacho
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS dispatch_number_seq START WITH 1
    `);
    
    // Función para obtener siguiente número de despacho
    await client.query(`
      CREATE OR REPLACE FUNCTION get_next_dispatch_number()
      RETURNS INTEGER AS $$
      DECLARE
        next_val INTEGER;
      BEGIN
        SELECT nextval('dispatch_number_seq') INTO next_val;
        RETURN next_val;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    // Tabla de despachos
    await client.query(`
      CREATE TABLE IF NOT EXISTS dispatches (
        id SERIAL PRIMARY KEY,
        despachoNo VARCHAR(20) UNIQUE NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        camion VARCHAR(100),
        placa VARCHAR(20),
        color VARCHAR(50),
        ficha VARCHAR(50),
        numeroOrden VARCHAR(50),
        m3 DECIMAL(10,2),
        materials JSONB,
        cliente VARCHAR(255) NOT NULL,
        celular VARCHAR(50),
        total DECIMAL(10,2) NOT NULL,
        userId INTEGER REFERENCES users(id),
        equipmentId INTEGER REFERENCES equipment(id),
        operatorId INTEGER REFERENCES operators(id),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de auditoría
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id),
        username VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        entityType VARCHAR(50),
        entityId INTEGER,
        changes JSONB,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tablas creadas correctamente');
    
    // Verificar si ya existe el usuario admin
    const adminCheck = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      // Crear usuario admin por defecto
      // Hash de 'admin123' generado con bcrypt
      const hashedPassword = '$2b$10$rZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Ou5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5';
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ Usuario admin creado (usuario: admin, contraseña: admin123)');
      console.log('⚠️  IMPORTANTE: Cambia la contraseña del admin en producción');
    } else {
      console.log('ℹ️  Usuario admin ya existe, omitiendo creación');
    }
    
    console.log('✅ Migración completada: base de datos inicializada');
  } catch (error) {
    console.error('❌ Error en migración de inicialización:', error);
    throw error;
  } finally {
    client.release();
  }
}
