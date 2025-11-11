import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const DispatchNumberConfig: React.FC = () => {
  const [startNumber, setStartNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/config/dispatch_start_number`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStartNumber(parseInt(data.value) || 1);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/config/dispatch_start_number`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value: startNumber.toString() })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'danger', text: 'Error al guardar configuración' });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setMessage({ type: 'danger', text: 'Error al guardar configuración' });
    }
  };

  if (loading) {
    return <div>Cargando configuración...</div>;
  }

  return (
    <Card>
      <Card.Header>
        <strong>Configuración de Numeración de Despachos</strong>
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
            {message.text}
          </Alert>
        )}
        
        <Form.Group className="mb-3">
          <Form.Label>Número Inicial para Próximos Despachos</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
          />
          <Form.Text className="text-muted">
            <strong>ℹ️ Información:</strong> Este número se usa cuando NO hay despachos en el sistema.<br/>
            <strong>📝 Nota:</strong> También puedes editar manualmente el número de cualquier despacho 
            usando el botón <strong>"Editar"</strong> en el historial. Los siguientes despachos continuarán 
            automáticamente desde el último número usado.
          </Form.Text>
        </Form.Group>

        <Button variant="primary" onClick={handleSave}>
          Guardar Configuración
        </Button>
      </Card.Body>
    </Card>
  );
};

export default DispatchNumberConfig;
