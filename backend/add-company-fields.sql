-- Script para agregar campos de facturación a la tabla companies
-- Ejecutar en Railway (PostgreSQL)

-- Agregar campos nuevos
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS rnc VARCHAR(50),
ADD COLUMN IF NOT EXISTS domicilio TEXT,
ADD COLUMN IF NOT EXISTS tipo_impositivo DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exento BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contactos TEXT;

-- Verificar que se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;
