import express from 'express';
import { ClientPriceModel } from '../models/ClientPrice';

const router = express.Router();

// GET /api/client-prices - Obtener todos los precios especiales
router.get('/', async (req, res) => {
  try {
    const clientPrices = await ClientPriceModel.getAllClientPrices();
    res.json({ data: clientPrices });
  } catch (error: any) {
    console.error('Error fetching client prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-prices/client/:clientName - Obtener precios de un cliente
router.get('/client/:clientName', async (req, res) => {
  try {
    const clientName = decodeURIComponent(req.params.clientName);
    const prices = await ClientPriceModel.getClientPrices(clientName);
    res.json({ data: prices });
  } catch (error: any) {
    console.error('Error fetching client prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-prices/product/:productId - Obtener clientes con precio especial para un producto
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const prices = await ClientPriceModel.getProductClientPrices(productId);
    res.json({ data: prices });
  } catch (error: any) {
    console.error('Error fetching product client prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client-prices/:clientName/:productId - Obtener precio especial específico
router.get('/:clientName/:productId', async (req, res) => {
  try {
    const clientName = decodeURIComponent(req.params.clientName);
    const productId = parseInt(req.params.productId);
    const price = await ClientPriceModel.getClientPrice(clientName, productId);
    
    if (price === null) {
      return res.status(404).json({ error: 'Precio especial no encontrado' });
    }
    
    res.json({ price });
  } catch (error: any) {
    console.error('Error fetching client price:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client-prices - Crear o actualizar precio especial
router.post('/', async (req, res) => {
  try {
    const { clientName, productId, specialPrice } = req.body;
    
    if (!clientName || !productId || specialPrice === undefined) {
      return res.status(400).json({ error: 'Cliente, producto y precio son requeridos' });
    }
    
    const clientPrice = await ClientPriceModel.setClientPrice(
      clientName,
      parseInt(productId),
      parseFloat(specialPrice)
    );
    
    res.status(201).json(clientPrice);
  } catch (error: any) {
    console.error('Error setting client price:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/client-prices/:clientName/:productId - Eliminar precio especial
router.delete('/:clientName/:productId', async (req, res) => {
  try {
    const clientName = decodeURIComponent(req.params.clientName);
    const productId = parseInt(req.params.productId);
    
    const success = await ClientPriceModel.deleteClientPrice(clientName, productId);
    
    if (!success) {
      return res.status(404).json({ error: 'Precio especial no encontrado' });
    }
    
    res.json({ message: 'Precio especial eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting client price:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
