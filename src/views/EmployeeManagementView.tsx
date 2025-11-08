import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

interface Employee {
  id: number;
  username: string;
  role: string;
  created_by?: number;
  created_at?: string;
}

const EmployeeManagementView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  // Cargar lista de empleados
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔍 Cargando empleados...');
        const response = await fetch(`${API_URL}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📡 Respuesta status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Datos recibidos:', data);
          
          // El backend devuelve { data: [...] }
          const usersList = data.data || data;
          console.log('👥 Lista de usuarios:', usersList);
          
          setEmployees(Array.isArray(usersList) ? usersList : []);
        } else {
          console.error('❌ Error al cargar empleados:', response.statusText);
          setEmployees([]);
        }
      } catch (error) {
        console.error('❌ Error al cargar empleados:', error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!username || !password || !confirmPassword) {
      setMessage({type: 'danger', text: 'Todos los campos son requeridos'});
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({type: 'danger', text: 'Las contraseñas no coinciden'});
      return;
    }
    
    if (password.length < 6) {
      setMessage({type: 'danger', text: 'La contraseña debe tener al menos 6 caracteres'});
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, role })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({type: 'success', text: `Usuario ${role === 'admin' ? 'administrador' : 'empleado'} creado exitosamente`});
        // Recargar lista de empleados
        const usersResponse = await fetch(`${API_URL}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('🔄 Usuarios actualizados:', usersData);
          // El backend devuelve { data: [...] }
          const usersList = usersData.data || usersData;
          setEmployees(Array.isArray(usersList) ? usersList : []);
        }
        // Limpiar formulario
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRole('employee');
        // Cerrar modal después de 2 segundos
        setTimeout(() => setShowModal(false), 2000);
      } else {
        setMessage({type: 'danger', text: data.error || 'Error al crear usuario'});
      }
    } catch (error) {
      setMessage({type: 'danger', text: 'Error de conexión con el servidor'});
      console.error('Error al registrar usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este usuario?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/auth/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setEmployees(prev => prev.filter(emp => emp.id !== id));
          setMessage({type: 'success', text: 'Usuario eliminado exitosamente'});
        } else {
          const data = await response.json();
          setMessage({type: 'danger', text: data.error || 'Error al eliminar usuario'});
        }
      } catch (error) {
        setMessage({type: 'danger', text: 'Error de conexión con el servidor'});
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>Gestión de Empleados</span>
                <Button variant="success" onClick={() => setShowModal(true)}>
                  Agregar Empleado
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant={message.type}>{message.text}</Alert>}
              
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre de Usuario</th>
                    <th>Rol</th>
                    <th>Creado Por (ID)</th>
                    <th>Fecha de Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.username}</td>
                      <td>{employee.role === 'admin' ? 'Administrador' : 'Empleado'}</td>
                      <td>{employee.created_by || '-'}</td>
                      <td>
                        {employee.created_at 
                          ? new Date(employee.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </td>
                      <td>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDeleteEmployee(employee.id)}
                          disabled={employee.id === user?.id} // No permitir autoeliminación
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para crear nuevo empleado */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3" controlId="modalUsername">
              <Form.Label>Nombre de usuario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="modalPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingrese contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Form.Text className="text-muted">
                La contraseña debe tener al menos 6 caracteres.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="modalConfirmPassword">
              <Form.Label>Confirmar contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirme contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="modalRole">
              <Form.Label>Rol</Form.Label>
              <Form.Select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EmployeeManagementView;