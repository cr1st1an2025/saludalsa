import db from '../db/database';

export interface ClientPrice {
  id: number;
  product_id: number;
  client_name: string;
  special_price: number;
  created_at?: Date;
  updated_at?: Date;
}

export class ClientPriceModel {
  // Obtener precio especial para un cliente y producto
  static async getClientPrice(clientName: string, productId: number): Promise<number | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT special_price FROM client_prices WHERE client_name = $1 AND product_id = $2',
        [clientName.toUpperCase(), productId]
      );
      return result.rows.length > 0 ? parseFloat(result.rows[0].special_price) : null;
    } finally {
      client.release();
    }
  }

  // Obtener todos los precios especiales de un cliente
  static async getClientPrices(clientName: string): Promise<ClientPrice[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM client_prices WHERE client_name = $1',
        [clientName.toUpperCase()]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Obtener todos los clientes con precios especiales para un producto
  static async getProductClientPrices(productId: number): Promise<ClientPrice[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM client_prices WHERE product_id = $1 ORDER BY client_name',
        [productId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Crear o actualizar precio especial para cliente
  static async setClientPrice(clientName: string, productId: number, specialPrice: number): Promise<ClientPrice> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO client_prices (client_name, product_id, special_price)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, client_name) 
         DO UPDATE SET special_price = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [clientName.toUpperCase(), productId, specialPrice]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Eliminar precio especial
  static async deleteClientPrice(clientName: string, productId: number): Promise<boolean> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'DELETE FROM client_prices WHERE client_name = $1 AND product_id = $2',
        [clientName.toUpperCase(), productId]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  // Listar todos los precios especiales (para administración)
  static async getAllClientPrices(): Promise<ClientPrice[]> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT * FROM client_prices ORDER BY client_name, product_id'
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
}
