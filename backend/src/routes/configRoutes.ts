import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/config/:key - Obtener valor de configuración
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  
  const client = await db.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM config WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener configuración:', err);
    res.status(500).json({ error: 'Error al obtener configuración', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// PUT /api/config/:key - Actualizar valor de configuración (solo admin)
router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  if (!value) {
    return res.status(400).json({ error: 'Valor requerido' });
  }
  
  const client = await db.connect();
  
  try {
    const result = await client.query(
      `UPDATE config 
       SET value = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE key = $2 
       RETURNING *`,
      [value, key]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar configuración:', err);
    res.status(500).json({ error: 'Error al actualizar configuración', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// GET /api/config - Obtener todas las configuraciones
router.get('/', async (req, res) => {
  const client = await db.connect();
  
  try {
    const result = await client.query('SELECT * FROM config ORDER BY key');
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error al obtener configuraciones:', err);
    res.status(500).json({ error: 'Error al obtener configuraciones', details: (err as Error).message });
  } finally {
    client.release();
  }
});

export default router;
