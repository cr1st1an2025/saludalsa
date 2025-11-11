import express from 'express';
import { ProductModel } from '../models/Product';

const router = express.Router();

// GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const products = await ProductModel.getAllProducts(activeOnly);
    res.json({ data: products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await ProductModel.getProductById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products - Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { name, price, unit, itbisRate } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    
    const product = await ProductModel.createProduct(
      name, 
      parseFloat(price), 
      unit || 'm³',
      itbisRate !== undefined ? parseFloat(itbisRate) : 0.00
    );
    res.status(201).json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, price, unit, itbisRate } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    
    const product = await ProductModel.updateProduct(
      id, 
      name, 
      parseFloat(price), 
      unit || 'm³',
      itbisRate !== undefined ? parseFloat(itbisRate) : 0.00
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id - Desactivar producto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await ProductModel.deleteProduct(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto desactivado correctamente' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id/activate - Reactivar producto
router.put('/:id/activate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await ProductModel.activateProduct(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto activado correctamente' });
  } catch (error: any) {
    console.error('Error activating product:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
