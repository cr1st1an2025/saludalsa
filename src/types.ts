export interface Dispatch {
  id: number;
  despachoNo: string;
  fecha: string;
  hora: string;
  camion: string;
  placa: string;
  color: string;
  ficha: string;
  m3: number;
  numeroOrden: string; // Número de orden del transportista/empresa
  ticketOrden: string; // Ticket número de orden
  chofer: string; // Nombre del chofer
  materials: { id: string; quantity: number }[];
  cliente: string;
  celular: string;
  recibido?: string; // Campo antiguo, ya no se usa
  total: number;
  userId: number;
  equipmentId: number;
  operatorId: number;
  caminoId?: number; // ID del camión si existe
  // Campos opcionales que vienen de los JOINs
  userName?: string;
  equipmentName?: string;
  operatorName?: string;
}