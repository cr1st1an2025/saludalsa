import { Router, Request } from 'express';
import db from '../db/database';
import { logManualAction } from '../middleware/auditMiddleware';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

const router = Router();

// Almacenamiento simulado para modo desarrollo
let devDispatches: any[] = [];
let nextDispatchId = 1;

// GET /api/dispatches
router.get('/', async (req, res) => {
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  const { placa } = req.query; // Parámetro de búsqueda por placa
  
  if (disableAuth) {
    // En modo desarrollo, retornar despachos simulados
    let result = devDispatches;
    if (placa) {
      result = devDispatches.filter(d => d.placa && d.placa.toUpperCase().includes((placa as string).toUpperCase()));
    }
    return res.json({ data: result });
  }
  
  const client = await db.connect();
  
  try {
    let sql = `
      SELECT 
        d.*,
        u.username as userName,
        e.name as equipmentName,
        o.name as operatorName
      FROM dispatches d
      LEFT JOIN users u ON u.id = d.userId
      LEFT JOIN equipment e ON e.id = d.equipmentId
      LEFT JOIN operators o ON o.id = d.operatorId
    `;
    
    const params: any[] = [];
    
    // Filtrar por placa si se proporciona
    if (placa) {
      sql += ` WHERE d.placa ILIKE $1`;
      params.push(`%${placa}%`);
    }
    
    sql += ` ORDER BY d.fecha DESC, d.hora DESC`;
    
    const result = await client.query(sql, params);
    
    // Mapear las columnas de PostgreSQL (minúsculas) al formato esperado por el frontend (camelCase)
    const mappedData = result.rows.map(row => ({
      id: row.id,
      despachoNo: row.despachono,
      fecha: new Date(row.fecha).toISOString().split('T')[0], // Corregir la zona horaria
      hora: row.hora,
      camion: row.camion,
      placa: row.placa,
      color: row.color,
      ficha: row.ficha,
      numeroOrden: row.numeroorden || '',
      ticketOrden: row.ticketorden || '',
      chofer: row.chofer || '',
      m3: row.m3 || 0,
      materials: row.materials,
      cliente: row.cliente,
      celular: row.celular,
      total: row.total,
      userId: row.userid,
      equipmentId: row.equipmentid,
      operatorId: row.operatorid,
      userName: row.username,
      equipmentName: row.equipmentname,
      operatorName: row.operatorname
    }));
    
    // Log para debugging
    if (mappedData.length > 0) {
      console.log('📦 Primer despacho enviado al frontend:', {
        despachoNo: mappedData[0].despachoNo,
        userName: mappedData[0].userName,
        userId: mappedData[0].userId,
        numeroOrden: mappedData[0].numeroOrden,
        ticketOrden: mappedData[0].ticketOrden,
        chofer: mappedData[0].chofer,
        m3: mappedData[0].m3
      });
    }
    
    res.json({ data: mappedData });
  } catch (err) {
    console.error('Error al obtener despachos:', err);
    res.status(500).json({ error: 'Error al obtener despachos', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// POST /api/dispatches
router.post('/', async (req: AuthRequest, res) => {
  const { fecha, hora, camion, placa, color, ficha, numeroOrden, ticketOrden, chofer, m3, materials, cliente, celular, total, userId, equipmentId, operatorId } = req.body;
  
  // 🕒 Capturar fecha y hora del servidor (República Dominicana UTC-4)
  const now = new Date();
  const serverFecha = fecha || now.toLocaleString('en-CA', { timeZone: 'America/Santo_Domingo' }).split(',')[0];
  const serverHora = hora || now.toLocaleString('en-GB', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Convertir campos de texto a MAYÚSCULAS
  const camionUpper = camion ? camion.toUpperCase() : '';
  const placaUpper = placa ? placa.toUpperCase() : '';
  const colorUpper = color ? color.toUpperCase() : '';
  const fichaUpper = ficha ? ficha.toUpperCase() : '';
  const numeroOrdenUpper = numeroOrden ? numeroOrden.toUpperCase() : '';
  const ticketOrdenUpper = ticketOrden ? ticketOrden.toUpperCase() : '';
  const choferUpper = chofer ? chofer.toUpperCase() : '';
  const clienteUpper = cliente ? cliente.toUpperCase() : '';
  
  console.log('📥 Backend recibiendo despacho:', JSON.stringify({ fecha: serverFecha, hora: serverHora, camion: camionUpper, placa: placaUpper, numeroOrden: numeroOrdenUpper, ticketOrden: ticketOrdenUpper, chofer: choferUpper, m3, cliente: clienteUpper, userId, total, materials }, null, 2));
  
  // Validación básica de datos requeridos (fecha y hora ahora se generan automáticamente en el servidor)
  if (!camionUpper || !placaUpper || !clienteUpper) {
    console.error('❌ Faltan campos requeridos:', { camion: !!camionUpper, placa: !!placaUpper, cliente: !!clienteUpper });
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      missing: {
        camion: !camionUpper,
        placa: !placaUpper,
        cliente: !clienteUpper
      }
    });
  }
  
  // Convertir y validar tipos
  const finalTotal = typeof total === 'string' ? parseFloat(total) : total;
  const finalM3 = m3 && m3 > 0 ? (typeof m3 === 'string' ? parseFloat(m3) : m3) : null;
  const finalUserId = userId && userId > 0 ? userId : 1; // Fallback a admin si no hay userId válido
  const finalEquipmentId = equipmentId && equipmentId > 0 ? equipmentId : null;
  const finalOperatorId = operatorId && operatorId > 0 ? operatorId : null;
  
  if (isNaN(finalTotal) || finalTotal < 0) {
    console.error('❌ Total inválido:', total);
    return res.status(400).json({ error: 'Total inválido' });
  }
  
  // Validar y procesar materials
  let finalMaterials;
  if (Array.isArray(materials)) {
    finalMaterials = materials;
  } else if (typeof materials === 'string') {
    try {
      finalMaterials = JSON.parse(materials);
    } catch (e) {
      console.error('❌ Error al parsear materials:', e);
      return res.status(400).json({ error: 'Formato de materiales inválido' });
    }
  } else {
    finalMaterials = [];
  }
  
  console.log('✅ Datos validados:', { userId: finalUserId, total: finalTotal, m3: finalM3, materials: finalMaterials.length });
  
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  
  if (disableAuth) {
    // En modo desarrollo, almacenar en memoria con número automático
    const despachoNo = String(nextDispatchId).padStart(7, '0'); // 7 dígitos numéricos
    const newDispatch = {
      id: nextDispatchId++,
      despachoNo,
      fecha: serverFecha,
      hora: serverHora,
      camion: camionUpper,
      placa: placaUpper,
      color: colorUpper,
      ficha: fichaUpper,
      materials: finalMaterials,
      cliente: clienteUpper,
      celular,
      total: finalTotal,
      userId: finalUserId,
      equipmentId: finalEquipmentId,
      operatorId: finalOperatorId,
      userName: 'Usuario',
      equipmentName: 'Equipo',
      operatorName: 'Operario'
    };
    devDispatches.push(newDispatch);
    return res.json({ id: newDispatch.id, despachoNo });
  }
  
  const client = await db.connect();
  
  try {
    // 1. Guardar o actualizar datos del camión usando UPSERT
    if (placaUpper) {
      console.log('🚛 Procesando datos del camión, placa:', placaUpper, 'm3:', finalM3);
      
      // Usar UPSERT (INSERT ... ON CONFLICT) para evitar duplicados
      await client.query(
        `INSERT INTO camiones (placa, marca, color, ficha, m3, estado, createdat, updatedat)
         VALUES ($1, $2, $3, $4, $5, 'activo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (placa) 
         DO UPDATE SET 
           marca = COALESCE($2, camiones.marca),
           color = COALESCE($3, camiones.color),
           ficha = COALESCE($4, camiones.ficha),
           m3 = COALESCE($5, camiones.m3),
           updatedat = CURRENT_TIMESTAMP`,
        [placaUpper, camionUpper || 'SIN ESPECIFICAR', colorUpper, fichaUpper, finalM3]
      );
      console.log('✅ Camión guardado/actualizado');
    }
    
    // 2. Obtener siguiente número de despacho desde configuración
    // Primero obtener el número inicial configurado
    const configResult = await client.query(
      "SELECT value FROM config WHERE key = 'dispatch_start_number'"
    );
    const startNumber = configResult.rows.length > 0 ? parseInt(configResult.rows[0].value) : 1;
    
    // Obtener el último número de despacho usado
    const lastDispatchResult = await client.query(
      "SELECT despachoNo FROM dispatches ORDER BY id DESC LIMIT 1"
    );
    
    let nextNumber: number;
    if (lastDispatchResult.rows.length === 0) {
      // No hay despachos, usar el número inicial configurado
      nextNumber = startNumber;
    } else {
      // Hay despachos, tomar el último y sumarle 1
      const lastNumber = parseInt(lastDispatchResult.rows[0].despachono) || 0;
      nextNumber = Math.max(lastNumber + 1, startNumber);
    }
    
    const despachoNo = String(nextNumber).padStart(7, '0'); // 7 dígitos numéricos
    
    console.log('🔢 Número generado:', despachoNo, '(config start:', startNumber, ', last:', lastDispatchResult.rows[0]?.despachono || 'ninguno', ')');
    
    const sql = `INSERT INTO dispatches (despachoNo, fecha, hora, camion, placa, color, ficha, numeroOrden, ticketOrden, chofer, m3, materials, cliente, celular, total, userId, equipmentId, operatorId)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`;
    const params = [despachoNo, serverFecha, serverHora, camionUpper, placaUpper, colorUpper, fichaUpper, numeroOrdenUpper, ticketOrdenUpper, choferUpper, finalM3, JSON.stringify(finalMaterials), clienteUpper, celular, finalTotal, finalUserId, finalEquipmentId, finalOperatorId];
    
    console.log('💾 Insertando en BD con userId:', finalUserId);
    console.log('📋 Valores a insertar:', {
      numeroOrden: numeroOrdenUpper,
      ticketOrden: ticketOrdenUpper,
      chofer: choferUpper,
      m3: finalM3
    });
    
    const result = await client.query(sql, params);
    const dispatchId = result.rows[0].id;
    
    console.log('✅ Despacho creado exitosamente. ID:', dispatchId, 'Número:', despachoNo);
    
    // Registrar en auditoría
    if (req.user) {
      await logManualAction(
        req.user.id,
        req.user.username,
        'CREATE',
        'dispatch',
        dispatchId,
        { despachoNo, cliente, total: finalTotal },
        req
      );
    }
    
    res.json({ id: dispatchId, despachoNo });
  } catch (err) {
    console.error('❌ Error al crear despacho:', err);
    res.status(500).json({ error: 'Error al crear despacho', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// PUT /api/dispatches/:id - Editar despacho completo (solo admin)
router.put('/:id', async (req: AuthRequest, res) => {
  console.log('📥 PUT /api/dispatches/:id - Recibido');
  console.log('ID del parámetro:', req.params.id);
  console.log('Body completo:', req.body);
  
  // Verificar que el usuario sea admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden editar despachos.' });
  }
  
  const id = parseInt(req.params.id);
  const { fecha, hora, camion, placa, color, ficha, numeroOrden, ticketOrden, chofer, m3, materials, cliente, celular, total, userId, equipmentId, operatorId, despachoNo } = req.body;
  
  console.log('🔢 ID parseado:', id);
  console.log('📅 Fecha recibida:', fecha);
  console.log('🔢 despachoNo recibido:', despachoNo);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  
  // Convertir campos de texto a MAYÚSCULAS
  const camionUpper = camion ? camion.toUpperCase() : '';
  const placaUpper = placa ? placa.toUpperCase() : '';
  const colorUpper = color ? color.toUpperCase() : '';
  const fichaUpper = ficha ? ficha.toUpperCase() : '';
  const numeroOrdenUpper = numeroOrden ? numeroOrden.toUpperCase() : '';
  const ticketOrdenUpper = ticketOrden ? ticketOrden.toUpperCase() : '';
  const choferUpper = chofer ? chofer.toUpperCase() : '';
  const clienteUpper = cliente ? cliente.toUpperCase() : '';
  
  // Validación básica
  if (!fecha || !hora || !camionUpper || !placaUpper || !clienteUpper) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  // Convertir y validar tipos
  const finalTotal = typeof total === 'string' ? parseFloat(total) : total;
  const finalM3 = m3 && m3 > 0 ? (typeof m3 === 'string' ? parseFloat(m3) : m3) : null;
  const finalUserId = userId && userId > 0 ? userId : 1;
  const finalEquipmentId = equipmentId && equipmentId > 0 ? equipmentId : null;
  const finalOperatorId = operatorId && operatorId > 0 ? operatorId : null;
  
  if (isNaN(finalTotal) || finalTotal < 0) {
    return res.status(400).json({ error: 'Total inválido' });
  }
  
  // Validar y procesar materials
  let finalMaterials;
  if (Array.isArray(materials)) {
    finalMaterials = materials;
  } else if (typeof materials === 'string') {
    try {
      finalMaterials = JSON.parse(materials);
    } catch (e) {
      return res.status(400).json({ error: 'Formato de materiales inválido' });
    }
  } else {
    finalMaterials = [];
  }
  
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  
  if (disableAuth) {
    const dispatch = devDispatches.find(d => d.id === id);
    if (!dispatch) {
      return res.status(404).json({ error: 'Despacho no encontrado' });
    }
    
    Object.assign(dispatch, {
      fecha, hora,
      camion: camionUpper, placa: placaUpper, color: colorUpper, ficha: fichaUpper,
      numeroOrden: numeroOrdenUpper, ticketOrden: ticketOrdenUpper, chofer: choferUpper,
      m3: finalM3, materials: finalMaterials, cliente: clienteUpper, celular,
      total: finalTotal, userId: finalUserId, equipmentId: finalEquipmentId, operatorId: finalOperatorId
    });
    
    return res.json({ message: 'Despacho actualizado correctamente' });
  }
  
  const client = await db.connect();
  
  try {
    // Actualizar camión si cambió la placa
    if (placaUpper) {
      await client.query(
        `INSERT INTO camiones (placa, marca, color, ficha, m3, estado, createdat, updatedat)
         VALUES ($1, $2, $3, $4, $5, 'activo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (placa) 
         DO UPDATE SET 
           marca = COALESCE($2, camiones.marca),
           color = COALESCE($3, camiones.color),
           ficha = COALESCE($4, camiones.ficha),
           m3 = COALESCE($5, camiones.m3),
           updatedat = CURRENT_TIMESTAMP`,
        [placaUpper, camionUpper || 'SIN ESPECIFICAR', colorUpper, fichaUpper, finalM3]
      );
    }
    
    // Actualizar despacho
    const sql = `UPDATE dispatches 
                 SET despachoNo = $1, fecha = $2, hora = $3, camion = $4, placa = $5, color = $6, ficha = $7, 
                     numeroOrden = $8, ticketOrden = $9, chofer = $10, m3 = $11, 
                     materials = $12, cliente = $13, celular = $14, total = $15, 
                     userId = $16, equipmentId = $17, operatorId = $18
                 WHERE id = $19`;
    const params = [
      despachoNo, // Número de despacho (puede ser editado por admin)
      fecha, hora, camionUpper, placaUpper, colorUpper, fichaUpper,
      numeroOrdenUpper, ticketOrdenUpper, choferUpper, finalM3,
      JSON.stringify(finalMaterials), clienteUpper, celular, finalTotal,
      finalUserId, finalEquipmentId, finalOperatorId, id
    ];
    
    console.log('💾 Ejecutando UPDATE con params:', params);
    
    const result = await client.query(sql, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Despacho no encontrado' });
    }
    
    // Registrar en auditoría
    if (req.user) {
      await logManualAction(
        req.user.id,
        req.user.username,
        'UPDATE',
        'dispatch',
        id,
        { cliente: clienteUpper, total: finalTotal },
        req
      );
    }
    
    res.json({ message: 'Despacho actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar despacho:', err);
    res.status(500).json({ error: 'Error al actualizar despacho', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// PUT /api/dispatches/:id/number (solo admin puede cambiar el número)
router.put('/:id/number', async (req: AuthRequest, res) => {
  // Verificar que el usuario sea admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden modificar el número de ticket.' });
  }
  
  const id = parseInt(req.params.id);
  const { despachoNo } = req.body;
  
  // Validación
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  
  if (!despachoNo || typeof despachoNo !== 'string') {
    return res.status(400).json({ error: 'Número de despacho inválido' });
  }
  
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  
  if (disableAuth) {
    // En modo desarrollo
    const dispatch = devDispatches.find(d => d.id === id);
    if (!dispatch) {
      return res.status(404).json({ error: 'Despacho no encontrado' });
    }
    dispatch.despachoNo = despachoNo;
    return res.json({ message: 'Número de despacho actualizado correctamente', despachoNo });
  }
  
  const client = await db.connect();
  
  try {
    const sql = `UPDATE dispatches SET despachoNo = $1 WHERE id = $2`;
    const result = await client.query(sql, [despachoNo, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Despacho no encontrado' });
    }
    
    // Registrar en auditoría
    if (req.user) {
      await logManualAction(
        req.user.id,
        req.user.username,
        'UPDATE',
        'dispatch',
        id,
        { field: 'despachoNo', newValue: despachoNo },
        req
      );
    }
    
    res.json({ message: 'Número de despacho actualizado correctamente', despachoNo });
  } catch (err) {
    console.error('Error al actualizar número de despacho:', err);
    res.status(500).json({ error: 'Error al actualizar número de despacho', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// DELETE /api/dispatches/:id (solo admin)
router.delete('/:id', async (req: AuthRequest, res) => {
  // Verificar que el usuario sea admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden eliminar despachos.' });
  }
  const id = parseInt(req.params.id);
  
  // Validación de ID
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  
  if (disableAuth) {
    // En modo desarrollo, eliminar del almacenamiento simulado
    const index = devDispatches.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Despacho no encontrado' });
    }
    devDispatches.splice(index, 1);
    return res.json({ message: 'Despacho eliminado correctamente' });
  }
  
  const client = await db.connect();
  
  try {
    const sql = `DELETE FROM dispatches WHERE id = $1`;
    const result = await client.query(sql, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Despacho no encontrado' });
    }
    
    // Registrar en auditoría
    if (req.user) {
      await logManualAction(
        req.user.id,
        req.user.username,
        'DELETE',
        'dispatch',
        id,
        { deletedId: id },
        req
      );
    }
    
    res.json({ message: 'Despacho eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar despacho:', err);
    res.status(500).json({ error: 'Error al eliminar despacho', details: (err as Error).message });
  } finally {
    client.release();
  }
});

// DELETE /api/dispatches/clear-all - ENDPOINT TEMPORAL para borrar todos los despachos (solo admin)
router.delete('/clear-all', async (req: AuthRequest, res) => {
  console.log('⚠️ DELETE /api/dispatches/clear-all - BORRAR TODOS LOS DESPACHOS');
  
  // Verificar que el usuario sea admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden borrar todos los despachos.' });
  }
  
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  
  if (disableAuth) {
    devDispatches = [];
    nextDispatchId = 1;
    return res.json({ message: 'Todos los despachos han sido eliminados (modo desarrollo)', count: 0 });
  }
  
  const client = await db.connect();
  
  try {
    const countResult = await client.query('SELECT COUNT(*) FROM dispatches');
    const count = parseInt(countResult.rows[0].count);
    
    await client.query('DELETE FROM dispatches');
    
    console.log(`✅ ${count} despachos eliminados correctamente`);
    
    // Registrar en auditoría
    if (req.user) {
      await logManualAction(
        req.user.id,
        req.user.username,
        'DELETE',
        'dispatch',
        0,
        { action: 'clear_all', count },
        req
      );
    }
    
    res.json({ message: `Todos los despachos han sido eliminados (${count} registros)`, count });
  } catch (err) {
    console.error('Error al eliminar todos los despachos:', err);
    res.status(500).json({ error: 'Error al eliminar todos los despachos', details: (err as Error).message });
  } finally {
    client.release();
  }
});

export default router;