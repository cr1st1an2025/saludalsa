import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Modal, Alert } from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  price: number | string; // Puede venir como string desde la BD
  unit: string;
  active: boolean;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const ProductPriceManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', price: 0, unit: 'm³' });
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, unit: 'm³' });
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token en localStorage:', token ? 'Existe' : 'NO EXISTE');
      
      const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Status de respuesta:', response.status);
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (!response.ok) {
        setMessage({ type: 'danger', text: `Error ${response.status}: ${data.error || 'Error desconocido'}` });
        return;
      }
      
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'danger', text: 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ 
      name: product.name, 
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price, 
      unit: product.unit 
    });
  };

  const handleSavePrice = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Producto actualizado correctamente' });
        fetchProducts();
        setEditingId(null);
      } else {
        setMessage({ type: 'danger', text: 'Error al actualizar producto' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage({ type: 'danger', text: 'Error al actualizar producto' });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.price <= 0) {
      setMessage({ type: 'warning', text: 'Nombre y precio son requeridos' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Producto agregado correctamente' });
        fetchProducts();
        setShowAddModal(false);
        setNewProduct({ name: '', price: 0, unit: 'm³' });
      } else {
        setMessage({ type: 'danger', text: 'Error al agregar producto' });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage({ type: 'danger', text: 'Error al agregar producto' });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('¿Está seguro de desactivar este producto?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Producto desactivado' });
        fetchProducts();
      } else {
        setMessage({ type: 'danger', text: 'Error al desactivar producto' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'danger', text: 'Error al desactivar producto' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (loading) {
    return <div className="text-center mt-4"><p>Cargando productos...</p></div>;
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <span>Configuración de Precios de Productos</span>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            Agregar Producto
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
            {message.text}
          </Alert>
        )}
        
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio (RD$)</th>
              <th>Unidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ opacity: product.active ? 1 : 0.5 }}>
                <td>
                  {editingId === product.id ? (
                    <Form.Control 
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    product.name
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <Form.Control 
                      type="number" 
                      value={editForm.price} 
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    Number(product.price).toFixed(2)
                  )}
                </td>
                <td>
                  {editingId === product.id ? (
                    <Form.Control 
                      type="text" 
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    />
                  ) : (
                    product.unit
                  )}
                </td>
                <td>{product.active ? '✅ Activo' : '❌ Inactivo'}</td>
                <td>
                  {editingId === product.id ? (
                    <>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="me-2" 
                        onClick={() => handleSavePrice(product.id)}
                      >
                        Guardar
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditPrice(product)}
                        disabled={!product.active}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={!product.active}
                      >
                        Desactivar
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>

      {/* Modal para agregar producto */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Nuevo Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Producto *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Arena gruesa"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Precio (RD$) *</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Unidad *</Form.Label>
            <Form.Select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
            >
              <option value="m³">m³ (metros cúbicos)</option>
              <option value="ton">ton (toneladas)</option>
              <option value="unit">unidad</option>
              <option value="kg">kg (kilogramos)</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddProduct}>
            Agregar
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ProductPriceManager;