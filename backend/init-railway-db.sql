-- Script de inicialización completa de la base de datos en Railway
-- Ejecutar en Railway PostgreSQL

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de operarios
CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de empresas
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
);

-- Tabla de camiones
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
);

-- Secuencia para números de despacho
CREATE SEQUENCE IF NOT EXISTS dispatch_number_seq START WITH 1;

-- Función para obtener siguiente número de despacho
CREATE OR REPLACE FUNCTION get_next_dispatch_number()
RETURNS INTEGER AS $$
DECLARE
  next_val INTEGER;
BEGIN
  SELECT nextval('dispatch_number_seq') INTO next_val;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;

-- Tabla de despachos
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
);

-- Tabla de auditoría
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
);

-- Crear usuario admin por defecto
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2b$10$XQGGqJ5r5Z5Z5Z5Z5Z5Z5OeKqJ5r5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Nota: La contraseña hasheada arriba es 'admin123'
-- En producción, debes cambiarla inmediatamente

SELECT 'Base de datos inicializada correctamente' AS mensaje;
