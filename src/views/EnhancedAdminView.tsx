import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import CompanyManager from '../components/CompanyManager';
import ClientManager from '../components/ClientManager';
import ProductPriceManager from '../components/ProductPriceManager';
import AdvancedReports from '../components/AdvancedReports';
import DispatchNumberConfig from '../components/DispatchNumberConfig';
import { Dispatch } from '../types';

interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://gestion-despachos.onrender.com/api' : 'http://localhost:3002/api');

const EnhancedAdminView: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState('companies');

  const fetchDispatches = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dispatches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const formattedData = data.data.map((d: any) => ({
        ...d, 
        materials: typeof d.materials === 'string' ? JSON.parse(d.materials) : d.materials,
        id: Number(d.id),
        userId: Number(d.userId),
        equipmentId: Number(d.equipmentId),
        operatorId: Number(d.operatorId),
        total: Number(d.total)
      }));
      setDispatches(formattedData);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDispatches();
    fetchCompanies();
  }, [fetchDispatches, fetchCompanies]);

  return (
    <Container className="mt-4">
      <h2>Administración Avanzada</h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'companies')}
        className="mb-3"
      >
        {/* Gestión de Empresas */}
        <Tab eventKey="companies" title="Empresas">
          <Row className="mt-3">
            <Col md={12}>
              <CompanyManager />
            </Col>
          </Row>
        </Tab>

        {/* Gestión de Clientes */}
        <Tab eventKey="clients" title="Clientes">
          <Row className="mt-3">
            <Col md={12}>
              <ClientManager />
            </Col>
          </Row>
        </Tab>

        {/* Gestión de Productos */}
        <Tab eventKey="products" title="Productos">
          <Row className="mt-3">
            <Col md={12}>
              <ProductPriceManager />
            </Col>
          </Row>
        </Tab>

        {/* Configuración del Sistema */}
        <Tab eventKey="config" title="Configuración">
          <Row className="mt-3">
            <Col md={12}>
              <DispatchNumberConfig />
            </Col>
          </Row>
        </Tab>

        {/* Reportes y Exportación */}
        <Tab eventKey="reports" title="Reportes">
          <Row className="mt-3">
            <Col md={12}>
              <AdvancedReports dispatches={dispatches} companies={companies} />
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default EnhancedAdminView;