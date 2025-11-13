-- Script para agregar la columna itbis_rate a la tabla products
-- Ejecutar en Railway PostgreSQL si la columna no existe

-- Agregar columna itbis_rate si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'itbis_rate'
  ) THEN
    ALTER TABLE products ADD COLUMN itbis_rate DECIMAL(4, 2) DEFAULT 0.00;
    
    -- Actualizar productos procesados con 18% ITBIS
    UPDATE products SET itbis_rate = 0.18 
    WHERE LOWER(name) LIKE '%lavada%' 
       OR LOWER(name) LIKE '%gravillín%' 
       OR LOWER(name) LIKE '%base%';
    
    RAISE NOTICE 'Columna itbis_rate agregada y configurada correctamente';
  ELSE
    RAISE NOTICE 'La columna itbis_rate ya existe';
  END IF;
END $$;

SELECT 'Migración completada' AS resultado;
