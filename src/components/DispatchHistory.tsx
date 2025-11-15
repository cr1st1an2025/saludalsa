import React, { useState, useEffect } from 'react';
import { Table, Card, Button } from 'react-bootstrap';
import { Dispatch } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DispatchDetailModal from './DispatchDetailModal';
import EditDispatchModal from './EditDispatchModal';

interface Props {
  dispatches: Dispatch[];
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number | string;
  unit: string;
  itbis_rate?: number | string;
  active: boolean;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// ... existing code ...

const DispatchHistory: React.FC<Props> = ({ dispatches, onDelete, isAdmin = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<Dispatch | null>(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };
    fetchProducts();
  }, []);

  // Función para obtener el nombre del material (soporta IDs antiguos y nuevos)
  const getMaterialName = (id: string | number): string => {
    // Mapeo antiguo (para compatibilidad con despachos antiguos)
    const legacyMaterials: Record<string, string> = {
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
    
    // Si es un string, buscar en mapeo antiguo
    if (typeof id === 'string' && legacyMaterials[id]) {
      return legacyMaterials[id];
    }
    
    // Si es un número o string numérico, buscar en productos
    const productId = typeof id === 'string' ? parseInt(id) : id;
    if (!isNaN(productId)) {
      const product = products.find(p => p.id === productId);
      if (product) {
        return product.name;
      }
    }
    
    // Fallback: retornar el ID como string
    return String(id);
  };

  // Función para obtener el precio del material (soporta IDs antiguos y nuevos)
  const getMaterialPrice = (id: string | number): number => {
    // Mapeo antiguo (para compatibilidad con despachos antiguos)
    const legacyPrices: Record<string, number> = {
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
    
    // Si es un string, buscar en mapeo antiguo
    if (typeof id === 'string' && legacyPrices[id]) {
      return legacyPrices[id];
    }
    
    // Si es un número o string numérico, buscar en productos
    const productId = typeof id === 'string' ? parseInt(id) : id;
    if (!isNaN(productId)) {
      const product = products.find(p => p.id === productId);
      if (product) {
        return typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      }
    }
    
    return 0;
  };

  const handleExport = () => {
    try {
      // Crear datos detallados para exportar
      const worksheetData = dispatches.map(d => {
        // Asegurar que materials es un array
        const materials = Array.isArray(d.materials) 
          ? d.materials 
          : (typeof d.materials === 'string' ? JSON.parse(d.materials) : []);
        
        // Calcular detalles de materiales
        const materialNames = materials.map((material: { id: string | number; quantity: number }) => {
          const name = getMaterialName(material.id);
          console.log(`📄 Material ID: ${material.id}, Nombre: ${name}`);
          return name;
        });
        const materialDetails = materialNames.join(', ');
        
        return {
          'Nº DESPACHO': d.despachoNo,
          'FECHA': d.fecha,
          'HORA': d.hora,
          'CLIENTE': d.cliente.toUpperCase(),
          'PLACA': d.placa || 'NO ESPECIFICADO',
          'CAMIÓN': d.camion || 'NO ESPECIFICADO',
          'COLOR': d.color || 'NO ESPECIFICADO',
          'FICHA': d.ficha || 'NO ESPECIFICADO',
          'M³': d.m3 > 0 ? d.m3 : 'N/A',
          'NÚMERO DE ORDEN': d.numeroOrden || 'N/A',
          'CHOFER': d.chofer || 'N/A',
          'TICKET Nº ORDEN': d.ticketOrden || 'N/A',
          'MATERIALES': materialDetails,
          'TOTAL (RD$)': d.total.toFixed(2),
          'ATENDIDO POR': d.userName || 'NO ESPECIFICADO',
          'EQUIPO': d.equipmentName || 'NO ESPECIFICADO',
          'OPERARIO': d.operatorName || 'NO ESPECIFICADO',
          'CELULAR': d.celular || 'NO ESPECIFICADO'
        };
      });

      // Crear hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Aplicar formato a la hoja
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Establecer ancho de columnas
      worksheet['!cols'] = [
        { wch: 15 }, // Nº DESPACHO
        { wch: 12 }, // FECHA
        { wch: 10 }, // HORA
        { wch: 25 }, // CLIENTE
        { wch: 12 }, // PLACA
        { wch: 15 }, // CAMIÓN
        { wch: 12 }, // COLOR
        { wch: 12 }, // FICHA
        { wch: 10 }, // M³
        { wch: 18 }, // NÚMERO DE ORDEN
        { wch: 20 }, // CHOFER
        { wch: 18 }, // TICKET Nº ORDEN
        { wch: 25 }, // MATERIALES
        { wch: 15 }, // TOTAL
        { wch: 20 }, // ATENDIDO POR
        { wch: 15 }, // EQUIPO
        { wch: 15 }, // OPERARIO
        { wch: 15 }  // CELULAR
      ];
      
      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DESPACHOS");
      
      // Aplicar estilos a los encabezados
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center" }
        };
      }
      
      // Aplicar formato a las celdas de totales
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const address = XLSX.utils.encode_cell({ r: R, c: 13 }); // Columna de TOTAL (ahora es la 14va columna, índice 13)
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E7E6E6" } },
          alignment: { horizontal: "right" }
        };
      }
      
      // Guardar archivo
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, "HISTORIAL_DESPACHOS.xlsx");
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar el archivo. Por favor, intenta de nuevo.');
    }
  };

  // Función para formatear la fecha sin problemas de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) {
      return dateString;
    }
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
    }
    return dateString;
  };

  const handleDelete = async (id: number) => {
    if (onDelete) {
      onDelete(id);
    } else {
      // Implementación por defecto si no se proporciona onDelete
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
      try {
        const response = await fetch(`${API_URL}/dispatches/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Error al eliminar el despacho');
        }
        
        // Recargar la página para reflejar los cambios
        window.location.reload();
      } catch (error) {
        console.error("Error eliminando despacho:", error);
        alert("Error al eliminar el despacho");
      }
    }
  };

  const handleViewDetails = (dispatch: Dispatch) => {
    try {
      setSelectedDispatch(dispatch);
      setShowModal(true);
    } catch (error) {
      console.error('Error al abrir detalles:', error);
      alert('Error al mostrar los detalles del despacho.');
    }
  };

  const handleEdit = (dispatch: Dispatch) => {
    setEditingDispatch(dispatch);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedDispatch: Dispatch) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
      const token = localStorage.getItem('token');
      
      // VALIDACIÓN CRITICA: Verificar que el ID existe
      if (!updatedDispatch.id) {
        alert('❌ Error: No se puede actualizar un despacho sin ID');
        console.error('Despacho sin ID:', updatedDispatch);
        return;
      }
      
      console.log('📤 Actualizando despacho ID:', updatedDispatch.id);
      console.log('📝 Datos a enviar:', updatedDispatch);
      
      const response = await fetch(`${API_URL}/dispatches/${updatedDispatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedDispatch)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al actualizar el despacho');
      }
      
      alert('Despacho actualizado correctamente');
      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al guardar despacho:', error);
      alert('Error al guardar los cambios: ' + (error as Error).message);
    }
  };

  const handlePrintPDF = (dispatch: Dispatch) => {
    try {
      console.log('PDF - Dispatch completo:', dispatch);
      console.log('PDF - userName:', dispatch.userName);
      
      const doc = new jsPDF();
      let yPosition = 20;

      // Asegurar que materials es un array
      const materials = Array.isArray(dispatch.materials) 
        ? dispatch.materials 
        : (typeof dispatch.materials === 'string' ? JSON.parse(dispatch.materials) : []);

      // Encabezado
      doc.setFontSize(16);
      doc.text('Mina "SALUDALSA"', 105, yPosition, { align: 'center' });
      yPosition += 10;
      doc.setFontSize(12);
      doc.text('Código 6700', 105, yPosition, { align: 'center' });
      yPosition += 10;
      doc.setFontSize(14);
      doc.text(`Despacho #${dispatch.despachoNo}`, 105, yPosition, { align: 'center' });
      yPosition += 15;

      // Información del despacho
      doc.setFontSize(10);
      const info = [
        `Fecha: ${formatDate(dispatch.fecha)}`,
        `Hora: ${dispatch.hora}`,
        `Cliente: ${dispatch.cliente}`,
        `Atendido por: ${dispatch.userName || 'No especificado'}`,
        `Placa: ${dispatch.placa || 'No especificado'}`,
        `Camión: ${dispatch.camion || 'No especificado'}`,
        `Color: ${dispatch.color || 'No especificado'}`,
        `Ficha: ${dispatch.ficha || 'No especificado'}`,
        ...(dispatch.m3 > 0 ? [`Capacidad: ${dispatch.m3} m³`] : []),
        ...(dispatch.numeroOrden ? [`Número de Orden: ${dispatch.numeroOrden}`] : []),
        ...(dispatch.chofer ? [`Chofer: ${dispatch.chofer}`] : []),
        ...(dispatch.ticketOrden ? [`Ticket Nº Orden: ${dispatch.ticketOrden}`] : [])
      ];
      
      info.forEach(line => {
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 5;

      // Tabla de materiales
      const tableData = materials.map((material: { id: string | number; quantity: number }) => [
        getMaterialName(material.id),
        material.quantity.toString(),
        `RD$ ${getMaterialPrice(material.id).toFixed(2)}`,
        `RD$ ${(getMaterialPrice(material.id) * material.quantity).toFixed(2)}`
      ]);

      tableData.push([
        'TOTAL',
        '',
        '',
        `RD$ ${dispatch.total.toFixed(2)}`
      ]);

      

      autoTable(doc, {
        head: [['Material', 'Cantidad (m³)', 'Precio Unitario', 'Total']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        margin: { left: 20, right: 20 },
        didDrawPage: (data: any) => {
          if (data.pageCount > 1) {
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.getHeight();
            doc.setFontSize(10);
            doc.text(`Página ${data.pageNumber}`, pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
          }
        }
      });

      // Firmas
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 20;
      doc.text('___________________________', 30, finalY + 20);
      doc.text('Firma del responsable', 30, finalY + 27);
      doc.text('___________________________', 130, finalY + 20);
      doc.text(`Firmado por ${dispatch.chofer || 'chofer'}`, 130, finalY + 27);

      // Guardar PDF
      doc.save(`Despacho_${dispatch.despachoNo}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  };

  const handlePrint = (dispatch: Dispatch) => {
    try {
      // Asegurar que materials es un array
      const materials = Array.isArray(dispatch.materials) 
        ? dispatch.materials 
        : (typeof dispatch.materials === 'string' ? JSON.parse(dispatch.materials) : []);
      
      // Crear una ventana de impresión
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Despacho #${dispatch.despachoNo}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .info-section { margin-bottom: 20px; }
                .materials-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .materials-table th, .materials-table td { border: 1px solid #000; padding: 8px; text-align: left; }
                .total-row { font-weight: bold; }
                .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Mina "SALUDALSA"</h1>
                <h2>Código 6700</h2>
                <h3>Despacho #${dispatch.despachoNo}</h3>
              </div>
              
              <div class="info-section">
                <p><strong>Fecha:</strong> ${formatDate(dispatch.fecha)}</p>
                <p><strong>Hora:</strong> ${dispatch.hora}</p>
                <p><strong>Cliente:</strong> ${dispatch.cliente}</p>
                <p><strong>Atendido por:</strong> ${dispatch.userName || 'No especificado'}</p>
              </div>
              
              <div class="info-section">
                <p><strong>Placa:</strong> ${dispatch.placa || 'No especificado'}</p>
                <p><strong>Camión:</strong> ${dispatch.camion || 'No especificado'}</p>
                <p><strong>Color:</strong> ${dispatch.color || 'No especificado'}</p>
                <p><strong>Ficha:</strong> ${dispatch.ficha || 'No especificado'}</p>
                ${dispatch.m3 > 0 ? `<p><strong>Capacidad:</strong> ${dispatch.m3} m³</p>` : ''}
                ${dispatch.numeroOrden ? `<p><strong>Número de Orden:</strong> ${dispatch.numeroOrden}</p>` : ''}
                ${dispatch.chofer ? `<p><strong>Chofer:</strong> ${dispatch.chofer}</p>` : ''}
                ${dispatch.ticketOrden ? `<p><strong>Ticket Nº Orden:</strong> ${dispatch.ticketOrden}</p>` : ''}
              </div>
              
              <table class="materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Cantidad (m³)</th>
                  </tr>
                </thead>
                <tbody>
                  ${materials.map((material: { id: string; quantity: number }) => {
                    const materialName = getMaterialName(material.id);
                    return `
                      <tr>
                        <td>${materialName}</td>
                        <td>${material.quantity}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              
              <div class="signature-section">
                <div>
                  <p>___________________________</p>
                  <p>Firma del responsable</p>
                </div>
                <div>
                  <p>___________________________</p>
                  <p>Firmado por ${dispatch.chofer || 'chofer'}</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      alert('Error al abrir la ventana de impresión. Por favor, intenta de nuevo.');
    }
  };

  return (
    <Card className="mt-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Card.Title className="mb-0">Historial de Despachos</Card.Title>
          {/* Botón de Exportar a Excel solo visible para admin */}
          {isAdmin && (
            <Button variant="success" onClick={handleExport} disabled={dispatches.length === 0}>
              <i className="bi bi-file-earmark-excel me-2"></i>
              Exportar a Excel
            </Button>
          )}
        </div>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nº Despacho</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Placa</th>
              <th>Total (RD$)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.map(dispatch => (
              <tr key={dispatch.id}>
                <td>{dispatch.despachoNo}</td>
                <td>{formatDate(dispatch.fecha)}</td>
                <td>{dispatch.cliente}</td>
                <td>{dispatch.placa}</td>
                <td>{dispatch.total.toFixed(2)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Button variant="primary" size="sm" className="me-1" title="Ver detalles" onClick={() => handleViewDetails(dispatch)}>
                    Ver
                  </Button>
                  <Button variant="warning" size="sm" className="me-1" title="Imprimir" onClick={() => handlePrint(dispatch)}>
                    Imprimir
                  </Button>
                  <Button variant="info" size="sm" className="me-1" title="Descargar PDF" onClick={() => handlePrintPDF(dispatch)}>
                    PDF
                  </Button>
                  {/* Botón de editar solo para administradores */}
                  {isAdmin && (
                    <Button variant="success" size="sm" className="me-1" title="Editar" onClick={() => handleEdit(dispatch)}>
                      Editar
                    </Button>
                  )}
                  {/* Solo mostrar botón de eliminar a administradores */}
                  {isAdmin && (
                    <Button variant="danger" size="sm" onClick={() => handleDelete(dispatch.id)}>
                      Eliminar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>

      {/* Modal para ver detalles del despacho */}
      <DispatchDetailModal 
        dispatch={selectedDispatch}
        show={showModal}
        onHide={() => setShowModal(false)}
        onPrint={handlePrint}
      />

      {/* Modal para editar despacho */}
      <EditDispatchModal
        dispatch={editingDispatch}
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
      />
    </Card>
  );
};

export default DispatchHistory;