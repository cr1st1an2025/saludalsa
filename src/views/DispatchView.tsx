import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import DispatchForm from '../components/DispatchForm';
import DispatchFilter from '../components/DispatchFilter';
import DispatchHistory from '../components/DispatchHistory';
import { useAuth } from '../contexts/AuthContext';
import { Dispatch } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const DispatchView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [filteredDispatches, setFilteredDispatches] = useState<Dispatch[]>([]);

  const fetchDispatches = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dispatches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('📥 Despachos recibidos del backend:', data.data.slice(0, 2)); // Mostrar primeros 2 para debugging
      
      const formattedData = data.data.map((d: any) => ({
        ...d, // ← Mantener TODOS los campos originales, incluido despachoNo y userName
        materials: typeof d.materials === 'string' ? JSON.parse(d.materials) : d.materials,
        id: Number(d.id),
        userId: Number(d.userId),
        equipmentId: Number(d.equipmentId),
        operatorId: Number(d.operatorId),
        total: Number(d.total)
      }));
      
      console.log('📦 Primer despacho formateado:', formattedData[0]);
      
      setDispatches(formattedData);
      setFilteredDispatches(formattedData);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    }
  }, []);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const handleFilter = (filtered: Dispatch[]) => {
    setFilteredDispatches(filtered);
  };

  const handleCreateDispatch = async (newDispatch: Omit<Dispatch, 'id'>) => {
    console.log('📤 Frontend enviando despacho:', newDispatch);
    
    try {
      // Guardar cliente automáticamente si no existe
      if (newDispatch.cliente && newDispatch.cliente.trim()) {
        try {
          await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: newDispatch.cliente,
              companyId: 1 // Default company
            }),
          }).catch(() => {}); // Ignorar si ya existe
        } catch (error) {
          console.log('Cliente ya existe o error al crear');
        }
      }

      // Preparar el despacho para enviar
      const dispatchToSend = {
        fecha: newDispatch.fecha,
        hora: newDispatch.hora,
        camion: newDispatch.camion,
        placa: newDispatch.placa,
        color: newDispatch.color || '',
        ficha: newDispatch.ficha || '',
        numeroOrden: newDispatch.numeroOrden || '',
        ticketOrden: newDispatch.ticketOrden || '',
        chofer: newDispatch.chofer || '',
        m3: newDispatch.m3 || null,
        materials: newDispatch.materials,
        cliente: newDispatch.cliente,
        celular: newDispatch.celular || '',
        total: newDispatch.total,
        userId: newDispatch.userId || 1,
        equipmentId: newDispatch.equipmentId || null,
        operatorId: newDispatch.operatorId || null
      };

      console.log('🔑 Token presente:', !!localStorage.getItem('token'));
      console.log('📦 Datos a enviar:', dispatchToSend);

      // Crear el despacho
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dispatches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dispatchToSend),
      });
      
      console.log('📡 Respuesta status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ticket creado:', result);
        // Mostrar mensaje con el número de ticket generado
        if (result.despachoNo) {
          alert(`Ticket creado exitosamente: ${result.despachoNo}`);
        }
        // Actualizar la lista de despachos
        fetchDispatches();
      } else {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        console.error('❌ Detalles completos:', JSON.stringify(errorData, null, 2));
        alert(`Error al crear ticket (${response.status}): ${errorData.error || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      alert('Error al crear ticket. Verifica tu conexión.');
    }
  };

  const deleteDispatch = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dispatches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchDispatches();
      } else {
        const errorData = await response.json();
        console.error("Error deleting dispatch:", errorData.error);
      }
    } catch (error) {
      console.error("Error deleting dispatch:", error);
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={12}>
          <DispatchForm onSubmit={handleCreateDispatch} />
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={12}>
          {/* Filtro y exportar solo visible para admin */}
          {isAdmin && (
            <>
              <DispatchFilter dispatches={dispatches} onFilter={handleFilter} />
            </>
          )}
          <DispatchHistory dispatches={filteredDispatches} onDelete={deleteDispatch} isAdmin={isAdmin} />
        </Col>
      </Row>
    </Container>
  );
};

export default DispatchView;