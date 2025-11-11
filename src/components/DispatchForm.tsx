import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { Dispatch } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CaminoAutocomplete from './CaminoAutocomplete';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

interface AdminData {
  id: number;
  name: string;
}

const initialFormState = {
  despachoNo: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
  camion: '',
  placa: '',
  color: '',
  ficha: '',
  numeroOrden: '', // Número de orden del transportista
  ticketOrden: '', // Ticket número de orden
  chofer: '', // Nombre del chofer
  m3: 0,
  cliente: '',
  celular: '',
  userId: 0,
  equipmentId: 0,
  operatorId: 0,
  caminoId: 0,
};

interface Product {
  id: number;
  name: string;
  price: number | string;
  unit: string;
  active: boolean;
}

interface MaterialData {
  id: string;
  label: string;
  price: number;
}

interface Props {
  onSubmit: (dispatch: Omit<Dispatch, 'id'>) => void;
}

const DispatchForm: React.FC<Props> = ({ onSubmit }) => {
  const { user } = useAuth(); // Obtener usuario logueado
  const [formData, setFormData] = useState(initialFormState);
  const [caminoData, setCaminoData] = useState<any>(null); // Datos del camión encontrado
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [users, setUsers] = useState<AdminData[]>([]);
  const [equipment, setEquipment] = useState<AdminData[]>([]);
  const [operators, setOperators] = useState<AdminData[]>([]);
  const [materialsData, setMaterialsData] = useState<MaterialData[]>([]);
  const [capacidadExcedida, setCapacidadExcedida] = useState(false); // Nueva validación

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación. Redirigiendo al login...');
      window.location.href = '/login';
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Cargar productos desde la API
    fetch(`${API_URL}/products?active=true`, { headers })
      .then(res => {
        if (res.status === 401) {
          console.error('❌ Token expirado o inválido. Redirigiendo al login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        const products: Product[] = data.data || [];
        // Convertir productos a formato MaterialData
        const materials: MaterialData[] = products.map(p => ({
          id: String(p.id),
          label: p.name,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
        }));
        setMaterialsData(materials);
        console.log('📦 Productos cargados:', materials);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          console.error('Error al cargar productos:', err);
        }
      });

    // Cargar datos con manejo de errores 401
    fetch(`${API_URL}/users`, { headers })
      .then(res => {
        if (res.status === 401) {
          console.error('❌ Token expirado o inválido. Redirigiendo al login...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => setUsers(data.data || []))
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          console.error('Error al cargar usuarios:', err);
        }
      });

    fetch(`${API_URL}/equipment`, { headers })
      .then(res => res.status === 401 ? Promise.reject('Unauthorized') : res.json())
      .then(data => setEquipment(data.data || []))
      .catch(err => err !== 'Unauthorized' && console.error('Error al cargar equipos:', err));

    fetch(`${API_URL}/operators`, { headers })
      .then(res => res.status === 401 ? Promise.reject('Unauthorized') : res.json())
      .then(data => setOperators(data.data || []))
      .catch(err => err !== 'Unauthorized' && console.error('Error al cargar operarios:', err));
  }, []);

  // Auto-seleccionar el usuario logueado en "Atendido por" (garantizar que siempre tenga valor)
  useEffect(() => {
    if (user && user.id) {
      setFormData(prev => ({ ...prev, userId: user.id }));
    }
  }, [user]);

  // Calcular M³ total seleccionado
  const m3Seleccionados = useMemo(() => {
    return Object.keys(selectedMaterials).reduce((acc, key) => {
      if (selectedMaterials[key].selected) {
        return acc + selectedMaterials[key].quantity;
      }
      return acc;
    }, 0);
  }, [selectedMaterials]);

  // Calcular total: Precio × M³ seleccionados
  const total = useMemo(() => {
    return Object.keys(selectedMaterials).reduce((acc, key) => {
      const material = materialsData.find(m => m.id === key);
      if (material && selectedMaterials[key].selected) {
        return acc + (material.price * selectedMaterials[key].quantity);
      }
      return acc;
    }, 0);
  }, [selectedMaterials]);

  // Validar si se excede la capacidad del camión
  useEffect(() => {
    const m3Capacity = Number(formData.m3);
    if (caminoData && m3Capacity > 0) {
      setCapacidadExcedida(m3Seleccionados > m3Capacity);
    }
  }, [m3Seleccionados, formData.m3, caminoData]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = event.target;
    
    // Campos que deben convertirse a MAYÚSCULAS
    const uppercaseFields = ['camion', 'color', 'ficha', 'numeroOrden', 'ticketOrden', 'chofer', 'cliente'];
    const numericFields = ['userId', 'equipmentId', 'operatorId'];
    
    let finalValue: any;
    
    if (uppercaseFields.includes(id)) {
      // Convertir a MAYÚSCULAS
      finalValue = value.toUpperCase();
    } else if (numericFields.includes(id)) {
      // Convertir a número
      finalValue = parseInt(value) || 0;
    } else {
      // Mantener el valor original
      finalValue = value;
    }
    
    setFormData(prev => ({ ...prev, [id]: finalValue }));
  };

  const handleMaterialSelect = (materialId: string) => {
    // Solo permitir seleccionar UN material a la vez
    const isCurrentlySelected = selectedMaterials[materialId]?.selected;
    
    if (isCurrentlySelected) {
      // Si ya está seleccionado, deseleccionarlo
      setSelectedMaterials(prev => ({
        ...prev,
        [materialId]: { selected: false, quantity: 0 },
      }));
    } else {
      // Si no está seleccionado, deseleccionar TODOS los demás y seleccionar este
      const newMaterials: Record<string, { selected: boolean; quantity: number }> = {};
      Object.keys(selectedMaterials).forEach(key => {
        newMaterials[key] = { selected: false, quantity: 0 };
      });
      
      // Autocompletar con los M³ del camión
      const autoQuantity = Number(formData.m3) > 0 ? Number(formData.m3) : 0;
      newMaterials[materialId] = { selected: true, quantity: autoQuantity };
      
      console.log(`📦 Material seleccionado: ${materialId}, cantidad automática: ${autoQuantity} M³`);
      setSelectedMaterials(newMaterials);
    }
  };

  const handleQuantityChange = (materialId: string, quantity: string) => {
    const newQuantity = parseFloat(quantity) || 0;
    
    // Validar que no exceda la capacidad del camión
    const m3Capacity = Number(formData.m3);
    if (m3Capacity > 0 && newQuantity > m3Capacity) {
      alert(`⚠️ La cantidad máxima permitida es ${m3Capacity.toFixed(1)} M³ (capacidad del camión)`);
      return;
    }
    
    setSelectedMaterials(prev => ({
      ...prev,
      [materialId]: { ...prev[materialId], quantity: newQuantity },
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedMaterials({});
    setCaminoData(null);
  };

  // Handlers para el camión autocomplete
  const handlePlacaChange = (placa: string) => {
    setFormData(prev => ({ ...prev, placa: placa.toUpperCase() }));
  };

  const handleCaminoFound = (camino: any) => {
    console.log('🚛 handleCaminoFound ejecutado con:', camino);
    console.log('📋 formData ANTES:', formData);
    setCaminoData(camino);
    const newFormData = {
      ...formData,
      placa: camino.placa,
      camion: camino.marca,
      color: camino.color,
      ficha: camino.ficha,
      // numeroOrden NO se autorellena, se escribe manualmente cada vez
      m3: typeof camino.m3 === 'string' ? parseFloat(camino.m3) : (camino.m3 || 0),
      caminoId: camino.id
    };
    console.log('📝 Nuevo formData:', newFormData);
    console.log('✅ Actualizando state con setFormData...');
    setFormData(newFormData);
    console.log('✅ State actualizado');
  };

  const handleCaminoNotFound = () => {
    setCaminoData(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validar campos requeridos
    if (!formData.fecha || !formData.hora) {
      alert('⚠️ Fecha y hora son requeridos');
      return;
    }
    
    if (!formData.placa || !formData.placa.trim()) {
      alert('⚠️ Debes buscar un camión por placa antes de continuar');
      return;
    }
    
    if (!formData.camion || !formData.camion.trim()) {
      alert('⚠️ Marca del camión es requerida');
      return;
    }
    
    if (!formData.cliente || !formData.cliente.trim()) {
      alert('⚠️ Cliente es requerido');
      return;
    }
    
    // Validar que haya al menos un material seleccionado
    const hasMaterials = Object.keys(selectedMaterials).some(
      key => selectedMaterials[key].selected && selectedMaterials[key].quantity > 0
    );
    
    if (!hasMaterials) {
      alert('⚠️ Debes seleccionar al menos un material');
      return;
    }
    
    // Validar que la cantidad no exceda la capacidad del camión
    const totalM3 = Object.keys(selectedMaterials)
      .filter(key => selectedMaterials[key].selected)
      .reduce((sum, key) => sum + (selectedMaterials[key].quantity || 0), 0);
    
    const m3Capacity = Number(formData.m3);
    if (m3Capacity > 0 && totalM3 > m3Capacity) {
      alert(`⚠️ La cantidad total (${totalM3.toFixed(1)} M³) excede la capacidad del camión (${m3Capacity.toFixed(1)} M³)`);
      return;
    }
    
    if (total <= 0) {
      alert('⚠️ El total debe ser mayor a 0');
      return;
    }
    
    // Asegurar que userId tenga un valor válido antes de enviar
    const finalUserId = formData.userId || user?.id || 1; // Fallback a admin si no hay usuario
    
    const newDispatch: Omit<Dispatch, 'id'> = {
      ...formData,
      userId: finalUserId,
      materials: Object.keys(selectedMaterials)
        .filter(key => selectedMaterials[key].selected && selectedMaterials[key].quantity > 0)
        .map(key => ({ id: key, quantity: selectedMaterials[key].quantity })),
      total,
      ticketOrden: formData.ticketOrden || '', // Asegurar que siempre tenga valor
      chofer: formData.chofer || '', // Asegurar que siempre tenga valor
    };
    
    console.log('📤 Enviando despacho:', newDispatch);
    onSubmit(newDispatch);
    resetForm();
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Nuevo Ticket</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="despachoNo">
              <Form.Label>Ticket Nº</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.despachoNo} 
                onChange={handleInputChange}
                readOnly={user?.role === 'employee'}
                placeholder={user?.role === 'employee' ? 'Se asignará automáticamente' : '7 dígitos numéricos (ej: 0000001)'}
                maxLength={7}
                pattern="[0-9]{7}"
              />
              {user?.role === 'employee' && <Form.Text className="text-muted">El número se generará automáticamente (7 dígitos)</Form.Text>}
            </Form.Group>
            <Form.Group as={Col} controlId="fecha">
              <Form.Label>Fecha</Form.Label>
              <Form.Control 
                type="date" 
                value={formData.fecha} 
                onChange={handleInputChange}
                readOnly={user?.role === 'employee'}
              />
              {user?.role === 'employee' && <Form.Text className="text-muted">No puedes cambiar la fecha</Form.Text>}
            </Form.Group>
            <Form.Group as={Col} controlId="hora">
              <Form.Label>Hora</Form.Label>
              <Form.Control 
                type="time" 
                value={formData.hora} 
                onChange={handleInputChange}
                readOnly={user?.role === 'employee'}
              />
              {user?.role === 'employee' && <Form.Text className="text-muted">No puedes cambiar la hora</Form.Text>}
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="userId">
              <Form.Label>Atendido por</Form.Label>
              <Form.Select value={formData.userId} onChange={handleInputChange} disabled={user?.role === 'employee'}>
                  <option value={0}>-- Seleccione --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Form.Select>
              {user?.role === 'employee' && <Form.Text className="text-muted">Automáticamente asignado a tu usuario</Form.Text>}
            </Form.Group>
            <Form.Group as={Col} controlId="equipmentId">
              <Form.Label>Equipo</Form.Label>
              <Form.Select value={formData.equipmentId} onChange={handleInputChange}>
                  <option value={0}>-- Seleccione --</option>
                  {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col} controlId="operatorId">
              <Form.Label>Operario</Form.Label>
              <Form.Select value={formData.operatorId} onChange={handleInputChange}>
                  <option value={0}>-- Seleccione --</option>
                  {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Form.Select>
            </Form.Group>
          </Row>

          <hr />

          {/* Autocomplete de Camión por Placa */}
          <CaminoAutocomplete
            placa={formData.placa}
            onPlacaChange={handlePlacaChange}
            onCaminoFound={handleCaminoFound}
            onCaminoNotFound={handleCaminoNotFound}
            isReadOnly={user?.role === 'employee'}
          />

          {/* DEBUG: Estado actual */}
          {process.env.NODE_ENV === 'development' && (
            <div className="alert alert-info mb-3" style={{fontSize: '11px'}}>
              <strong>DEBUG:</strong> formData.camion="{formData.camion}" | formData.color="{formData.color}" | formData.m3={formData.m3} | caminoData={caminoData ? 'SET' : 'NULL'}
            </div>
          )}

          {/* Campos del Camión rellenados automáticamente */}
          <Row className="mb-3">
            <Form.Group as={Col} controlId="camion">
              <Form.Label>Marca *</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.camion} 
                onChange={handleInputChange}
                readOnly={caminoData !== null && user?.role === 'employee'}
                placeholder={caminoData ? "Automático" : "Escribe la marca del camión"}
                required
              />
              {user?.role === 'employee' && caminoData && <Form.Text className="text-muted">Camión ya registrado (solo admin puede modificar)</Form.Text>}
            </Form.Group>
            <Form.Group as={Col} controlId="color">
              <Form.Label>Color</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.color} 
                onChange={handleInputChange}
                readOnly={caminoData !== null && user?.role === 'employee'}
                placeholder={caminoData ? "Automático" : "Color del camión"}
              />
              {user?.role === 'employee' && caminoData && <Form.Text className="text-muted">Camión ya registrado (solo admin puede modificar)</Form.Text>}
            </Form.Group>
            <Form.Group as={Col} controlId="ficha">
              <Form.Label>Ficha</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.ficha} 
                onChange={handleInputChange}
                readOnly={caminoData !== null && user?.role === 'employee'}
                placeholder="Alfanumérico"
              />
              {user?.role === 'employee' && caminoData && <Form.Text className="text-muted">Camión ya registrado (solo admin puede modificar)</Form.Text>}
            </Form.Group>
          </Row>
          
          <Row className="mb-3">
            <Form.Group as={Col} controlId="numeroOrden">
              <Form.Label>Número de Orden</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.numeroOrden} 
                onChange={handleInputChange}
                placeholder="Número de orden del transportista"
              />
              <Form.Text className="text-muted">Este número lo proporciona la empresa transportista para cada viaje</Form.Text>
            </Form.Group>
            <Form.Group as={Col} controlId="chofer">
              <Form.Label>Chofer</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.chofer} 
                onChange={handleInputChange}
                placeholder="Nombre del chofer"
              />
              <Form.Text className="text-muted">Solo letras (nombre completo del conductor)</Form.Text>
            </Form.Group>
          </Row>
          
          <Row className="mb-3">
            <Form.Group as={Col} controlId="ticketOrden">
              <Form.Label>Ticket Nº Orden</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.ticketOrden} 
                onChange={handleInputChange}
                placeholder="Ticket número de orden"
              />
            </Form.Group>
            <Form.Group as={Col} controlId="m3">
              <Form.Label>M³ *</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.m3} 
                onChange={handleInputChange}
                readOnly={caminoData !== null && user?.role === 'employee'}
                placeholder={caminoData ? "Automático" : "Capacidad del camión"}
                step="0.1"
                required
              />
              {user?.role === 'employee' && caminoData && <Form.Text className="text-muted">Camión ya registrado (solo admin puede modificar)</Form.Text>}
            </Form.Group>
          </Row>

          <hr />

          <h5>Material (Solo UNO por camión) - Capacidad: {caminoData ? `${m3Seleccionados.toFixed(1)} / ${Number(formData.m3).toFixed(1)} M³` : 'Selecciona un camión'}</h5>
          <p className="text-muted small">⚠️ Importante: Cada camión solo puede transportar UN tipo de material por viaje</p>
          {capacidadExcedida && (
            <div className="alert alert-danger" role="alert">
              ⚠️ <strong>Advertencia:</strong> Has seleccionado {m3Seleccionados.toFixed(1)} M³ pero el camión solo tiene capacidad para {Number(formData.m3).toFixed(1)} M³. Por favor, reduce la cantidad.
            </div>
          )}
          <Row>
            {materialsData.map(material => (
              <Col md={6} key={material.id} className="mb-2">
                <InputGroup>
                  <InputGroup.Checkbox 
                    checked={selectedMaterials[material.id]?.selected || false}
                    onChange={() => handleMaterialSelect(material.id)} 
                  />
                  <InputGroup.Text>{material.label} (RD${material.price}/M³)</InputGroup.Text>
                  {selectedMaterials[material.id]?.selected && (
                    <>
                      <Form.Control
                        type="number"
                        placeholder={Number(formData.m3) > 0 ? `Máx: ${Number(formData.m3).toFixed(1)} M³` : 'M³'}
                        value={selectedMaterials[material.id]?.quantity || ''}
                        onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                        min="0"
                        max={Number(formData.m3) > 0 ? Number(formData.m3) : undefined}
                        step="0.1"
                      />
                      <InputGroup.Text>
                        = RD${(material.price * (selectedMaterials[material.id]?.quantity || 0)).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </InputGroup.Text>
                    </>
                  )}
                </InputGroup>
              </Col>
            ))}
          </Row>

          <hr />

          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="cliente">
              <Form.Label>Cliente *</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.cliente} 
                onChange={handleInputChange}
                required
                placeholder="Nombre del cliente"
              />
            </Form.Group>
            <Form.Group as={Col} md={6} controlId="celular">
              <Form.Label>Celular</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.celular} 
                onChange={handleInputChange}
                placeholder="Teléfono del cliente"
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6} controlId="total">
              <Form.Label>Total a Pagar (RD$)</Form.Label>
              <Form.Control type="number" readOnly value={total.toFixed(2)} />
            </Form.Group>
          </Row>

          <Button 
            variant="primary" 
            type="submit"
            disabled={capacidadExcedida || m3Seleccionados === 0}
          >
            Guardar Despacho
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default DispatchForm;