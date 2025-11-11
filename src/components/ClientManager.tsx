import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Modal, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: number;
  name: string;
  rnc?: string;
  direccion?: string;
  obra?: string;
  numero_orden_compra?: string;
  descuento?: number | string;
  companyId?: number;
  created_at?: string;
  updated_at?: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const ClientManager: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    rnc: '',
    direccion: '',
    obra: '',
    numero_orden_compra: '',
    descuento: 0
  });
  
  const [newClient, setNewClient] = useState({
    name: '',
    rnc: '',
    direccion: '',
    obra: '',
    numero_orden_compra: '',
    descuento: 0
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage({ type: 'danger', text: `Error ${response.status}: ${data.error || 'Error desconocido'}` });
        return;
      }
      
      setClients(data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setMessage({ type: 'danger', text: 'Error al cargar clientes' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingId(client.id);
    setEditForm({
      name: client.name,
      rnc: client.rnc || '',
      direccion: client.direccion || '',
      obra: client.obra || '',
      numero_orden_compra: client.numero_orden_compra || '',
      descuento: typeof client.descuento === 'string' ? parseFloat(client.descuento) : (client.descuento || 0)
    });
  };

  const handleSaveClient = async (clientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cliente actualizado correctamente' });
        fetchClients();
        setEditingId(null);
      } else {
        setMessage({ type: 'danger', text: 'Error al actualizar cliente' });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setMessage({ type: 'danger', text: 'Error al actualizar cliente' });
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name.trim()) {
      setMessage({ type: 'warning', text: 'Nombre del cliente es requerido' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cliente agregado correctamente' });
        fetchClients();
        setShowAddModal(false);
        setNewClient({
          name: '',
          rnc: '',
          direccion: '',
          obra: '',
          numero_orden_compra: '',
          descuento: 0
        });
      } else {
        setMessage({ type: 'danger', text: 'Error al agregar cliente' });
      }
    } catch (error) {
      console.error('Error adding client:', error);
      setMessage({ type: 'danger', text: 'Error al agregar cliente' });
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cliente eliminado' });
        fetchClients();
      } else {
        setMessage({ type: 'danger', text: 'Error al eliminar cliente' });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      setMessage({ type: 'danger', text: 'Error al eliminar cliente' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="text-center mt-4"><p>Cargando clientes...</p></div>;
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <span>Gestión de Clientes</span>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            Agregar Cliente
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
            {message.text}
          </Alert>
        )}
        
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RNC</th>
                <th>Dirección</th>
                <th>Obra</th>
                <th>Nº Orden Compra</th>
                <th>Descuento (%)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td>
                    {editingId === client.id ? (
                      <Form.Control 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <strong>{client.name}</strong>
                    )}
                  </td>
                  <td>
                    {editingId === client.id ? (
                      <Form.Control 
                        type="text" 
                        value={editForm.rnc}
                        onChange={(e) => setEditForm({ ...editForm, rnc: e.target.value })}
                        placeholder="RNC"
                      />
                    ) : (
                      client.rnc || '-'
                    )}
                  </td>
                  <td>
                    {editingId === client.id ? (
                      <Form.Control 
                        type="text" 
                        value={editForm.direccion}
                        onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                        placeholder="Dirección"
                      />
                    ) : (
                      client.direccion || '-'
                    )}
                  </td>
                  <td>
                    {editingId === client.id ? (
                      <Form.Control 
                        type="text" 
                        value={editForm.obra}
                        onChange={(e) => setEditForm({ ...editForm, obra: e.target.value })}
                        placeholder="Obra"
                      />
                    ) : (
                      client.obra || '-'
                    )}
                  </td>
                  <td>
                    {editingId === client.id ? (
                      <Form.Control 
                        type="text" 
                        value={editForm.numero_orden_compra}
                        onChange={(e) => setEditForm({ ...editForm, numero_orden_compra: e.target.value })}
                        placeholder="Nº Orden"
                      />
                    ) : (
                      client.numero_orden_compra || '-'
                    )}
                  </td>
                  <td>
                    {editingId === client.id && isAdmin ? (
                      <Form.Control 
                        type="number" 
                        value={editForm.descuento}
                        onChange={(e) => setEditForm({ ...editForm, descuento: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    ) : (
                      <>
                        {Number(client.descuento || 0).toFixed(2)}%
                        {!isAdmin && editingId === client.id && (
                          <Badge bg="warning" className="ms-2">Solo admin</Badge>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    {editingId === client.id ? (
                      <>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2" 
                          onClick={() => handleSaveClient(client.id)}
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
                          onClick={() => handleEditClient(client)}
                        >
                          Editar
                        </Button>
                        {isAdmin && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>

      {/* Modal para agregar cliente */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Nuevo Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nombre del cliente"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>RNC</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: 132574508"
              value={newClient.rnc}
              onChange={(e) => setNewClient({ ...newClient, rnc: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Dirección del cliente"
              value={newClient.direccion}
              onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Obra</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nombre de la obra"
              value={newClient.obra}
              onChange={(e) => setNewClient({ ...newClient, obra: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Número de Orden de Compra</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nº de orden"
              value={newClient.numero_orden_compra}
              onChange={(e) => setNewClient({ ...newClient, numero_orden_compra: e.target.value })}
            />
          </Form.Group>
          {isAdmin && (
            <Form.Group className="mb-3">
              <Form.Label>Descuento (%)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newClient.descuento}
                onChange={(e) => setNewClient({ ...newClient, descuento: parseFloat(e.target.value) || 0 })}
              />
              <Form.Text className="text-muted">
                Solo administradores pueden modificar el descuento
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddClient}>
            Agregar
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ClientManager;
