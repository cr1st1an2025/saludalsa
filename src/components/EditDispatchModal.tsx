import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { Dispatch } from '../types';

interface Props {
  dispatch: Dispatch | null;
  show: boolean;
  onHide: () => void;
  onSave: (dispatch: Dispatch) => void;
}

const EditDispatchModal: React.FC<Props> = ({ dispatch, show, onHide, onSave }) => {
  const [formData, setFormData] = useState<Partial<Dispatch>>({});

  useEffect(() => {
    if (dispatch) {
      setFormData({ ...dispatch });
    }
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      onSave(formData as Dispatch);
    }
  };

  if (!dispatch) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Editar Despacho</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Fecha *</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha"
                  value={formData.fecha || ''}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Hora *</Form.Label>
                <Form.Control
                  type="time"
                  name="hora"
                  value={formData.hora || ''}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Cliente *</Form.Label>
                <Form.Control
                  type="text"
                  name="cliente"
                  value={formData.cliente || ''}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Celular</Form.Label>
                <Form.Control
                  type="text"
                  name="celular"
                  value={formData.celular || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Placa *</Form.Label>
                <Form.Control
                  type="text"
                  name="placa"
                  value={formData.placa || ''}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Camión</Form.Label>
                <Form.Control
                  type="text"
                  name="camion"
                  value={formData.camion || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Color</Form.Label>
                <Form.Control
                  type="text"
                  name="color"
                  value={formData.color || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Ficha</Form.Label>
                <Form.Control
                  type="text"
                  name="ficha"
                  value={formData.ficha || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>M³</Form.Label>
                <Form.Control
                  type="number"
                  name="m3"
                  value={formData.m3 || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Número de Orden</Form.Label>
                <Form.Control
                  type="text"
                  name="numeroOrden"
                  value={formData.numeroOrden || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Ticket Nº Orden</Form.Label>
                <Form.Control
                  type="text"
                  name="ticketOrden"
                  value={formData.ticketOrden || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Chofer</Form.Label>
                <Form.Control
                  type="text"
                  name="chofer"
                  value={formData.chofer || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Total (RD$) *</Form.Label>
                <Form.Control
                  type="number"
                  name="total"
                  value={formData.total || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditDispatchModal;
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditDispatchModal;
