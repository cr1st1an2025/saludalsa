import React from 'react';
import { Modal, Button, Table, Row, Col, Card } from 'react-bootstrap';
import { Dispatch } from '../types';

interface DispatchDetailModalProps {
  dispatch: Dispatch | null;
  show: boolean;
  onHide: () => void;
  onPrint: (dispatch: Dispatch) => void;
}

// Función para obtener el nombre del material
const getMaterialName = (id: string) => {
  const materials: Record<string, string> = {
    'arenaLavada': 'Arena lavada',
    'arenaSinLavar': 'Arena sin lavar',
    'grava': 'Grava',
    'subBase': 'Sub-base',
    'gravaArena': 'Grava Arena',
    'granzote': 'Granzote',
    'gravillin': 'Gravillín',
    'cascajoGris': 'Cascajo gris (Relleno)',
    'base': 'Base',
    'rellenoAmarillento': 'Relleno amarillento'
  };
  return materials[id] || id;
};

// Función para obtener el precio del material
const getMaterialPrice = (id: string) => {
  const prices: Record<string, number> = {
    'arenaLavada': 1500,
    'arenaSinLavar': 1200,
    'grava': 1800,
    'subBase': 1000,
    'gravaArena': 1600,
    'granzote': 2000,
    'gravillin': 2200,
    'cascajoGris': 800,
    'base': 1100,
    'rellenoAmarillento': 700
  };
  return prices[id] || 0;
};

const DispatchDetailModal: React.FC<DispatchDetailModalProps> = ({ dispatch, show, onHide, onPrint }) => {
  if (!show || !dispatch) return null;

  // Asegurar que materials es un array
  const materials = Array.isArray(dispatch.materials) 
    ? dispatch.materials 
    : (typeof dispatch.materials === 'string' ? JSON.parse(dispatch.materials) : []);

  // Formatear la fecha directamente desde el string (evitar conversión UTC)
  const formatDate = (dateString: string) => {
    // dateString viene en formato "YYYY-MM-DD" de la BD
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
  };
  
  const formattedDate = formatDate(dispatch.fecha);

  // Calcular totales por material
  const materialTotals = materials.map((material: { id: string; quantity: number }) => {
    const materialName = getMaterialName(material.id);
    const price = getMaterialPrice(material.id);
    const total = price * material.quantity;
    return {
      ...material,
      name: materialName,
      price,
      total
    };
  });

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Despacho #{dispatch.despachoNo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-3">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5>Información General</h5>
                <p><strong>Fecha:</strong> {formattedDate}</p>
                <p><strong>Hora:</strong> {dispatch.hora}</p>
                <p><strong>Cliente:</strong> {dispatch.cliente}</p>
                <p><strong>Recibido por:</strong> {dispatch.recibido}</p>
              </Col>
              <Col md={6}>
                <h5>Información del Vehículo</h5>
                <p><strong>Camión:</strong> {dispatch.camion || 'No especificado'}</p>
                <p><strong>Placa:</strong> {dispatch.placa || 'No especificado'}</p>
                <p><strong>Color:</strong> {dispatch.color || 'No especificado'}</p>
                <p><strong>Ficha:</strong> {dispatch.ficha || 'No especificado'}</p>
                {dispatch.m3 > 0 && (
                  <p><strong>Capacidad:</strong> <span className="badge bg-info text-dark">{dispatch.m3} m³</span></p>
                )}
                {dispatch.numeroOrden && (
                  <p><strong>Número de Orden:</strong> <span className="badge bg-warning text-dark">{dispatch.numeroOrden}</span></p>
                )}
                {dispatch.chofer && (
                  <p><strong>Chofer:</strong> <span className="badge bg-primary text-white">{dispatch.chofer}</span></p>
                )}
                {dispatch.ticketOrden && (
                  <p><strong>Ticket Nº Orden:</strong> <span className="badge bg-success text-white">{dispatch.ticketOrden}</span></p>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <h5>Materiales Despachados</h5>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Cantidad (m³)</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {materialTotals.map((material: any, index: number) => (
                  <tr key={index}>
                    <td>{material.name}</td>
                    <td>{material.quantity}</td>
                    <td>RD$ {material.price.toFixed(2)}</td>
                    <td>RD$ {material.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="text-end"><strong>Total General:</strong></td>
                  <td><strong>RD$ {dispatch.total.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button variant="info" onClick={() => onPrint(dispatch)}>
          <i className="bi bi-printer me-2"></i>
          Imprimir
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DispatchDetailModal;