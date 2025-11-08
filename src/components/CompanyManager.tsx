import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Form, Button, Modal } from 'react-bootstrap';

interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  rnc: string; // RNC
  domicilio: string; // Domicilio fiscal
  tipo_impositivo: number; // Porcentaje de impuesto
  exento: boolean; // Si está exento de impuestos
  contactos: string; // Contactos adicionales
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const CompanyManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    rnc: '',
    domicilio: '',
    tipo_impositivo: 0,
    exento: false,
    contactos: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCompanies(data.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCompany 
        ? `${API_URL}/companies/${editingCompany.id}` 
        : `${API_URL}/companies`;
      
      const method = editingCompany ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        fetchCompanies();
        resetForm();
      } else {
        const errorData = await response.json();
        console.error("Error saving company:", errorData.error);
      }
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      rnc: company.rnc || '',
      domicilio: company.domicilio || '',
      tipo_impositivo: company.tipo_impositivo || 0,
      exento: company.exento || false,
      contactos: company.contactos || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar esta empresa?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/companies/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchCompanies();
        } else {
          const errorData = await response.json();
          console.error("Error deleting company:", errorData.error);
        }
      } catch (error) {
        console.error("Error deleting company:", error);
      }
    }
  };

  const resetForm = () => {
    setEditingCompany(null);
    setFormData({ name: '', address: '', phone: '', email: '', rnc: '', domicilio: '', tipo_impositivo: 0, exento: false, contactos: '' });
    setShowModal(false);
  };

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <span>Gestión de Empresas</span>
          <Button variant="success" onClick={() => setShowModal(true)}>
            Agregar Empresa
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <ListGroup>
          {companies.map(company => (
            <ListGroup.Item key={company.id} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{company.name}</strong>
                {company.rnc && <div><strong>RNC:</strong> {company.rnc}</div>}
                {company.address && <div><strong>Dirección:</strong> {company.address}</div>}
                {company.domicilio && <div><strong>Domicilio Fiscal:</strong> {company.domicilio}</div>}
                {company.phone && <div><strong>Teléfono:</strong> {company.phone}</div>}
                {company.email && <div><strong>Email:</strong> {company.email}</div>}
                {company.contactos && <div><strong>Contactos:</strong> {company.contactos}</div>}
                <div><strong>Tipo Impositivo:</strong> {company.tipo_impositivo}%</div>
                {company.exento && <div className="badge bg-success">Exento de Impuestos</div>}
              </div>
              <div>
                <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(company)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(company.id)}>
                  Eliminar
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>

      {/* Modal para agregar/editar empresa */}
      <Modal show={showModal} onHide={resetForm}>
        <Modal.Header closeButton>
          <Modal.Title>{editingCompany ? 'Editar Empresa' : 'Agregar Nueva Empresa'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Empresa *</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleInputChange} 
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>RNC *</Form.Label>
              <Form.Control 
                type="text" 
                name="rnc"
                value={formData.rnc} 
                onChange={handleInputChange}
                placeholder="Registro Nacional de Contribuyentes"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control 
                type="text" 
                name="address"
                value={formData.address} 
                onChange={handleInputChange} 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Domicilio Fiscal</Form.Label>
              <Form.Control 
                type="text" 
                name="domicilio"
                value={formData.domicilio} 
                onChange={handleInputChange}
                placeholder="Dirección fiscal oficial"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control 
                type="text" 
                name="phone"
                value={formData.phone} 
                onChange={handleInputChange} 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleInputChange} 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Contactos Adicionales</Form.Label>
              <Form.Control 
                as="textarea"
                rows={2}
                name="contactos"
                value={formData.contactos} 
                onChange={handleInputChange}
                placeholder="Nombres de contacto, teléfonos adicionales, etc."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tipo Impositivo (%)</Form.Label>
              <Form.Control 
                type="number" 
                name="tipo_impositivo"
                value={formData.tipo_impositivo} 
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max="100"
              />
              <Form.Text className="text-muted">Porcentaje de impuesto aplicable (ej: 18 para ITBIS 18%)</Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="exento"
                label="Exento de Impuestos"
                checked={formData.exento}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={resetForm}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingCompany ? 'Actualizar' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
};

export default CompanyManager;