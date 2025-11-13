import db from '../db/database';

export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string; // 'm³', 'ton', 'unit', etc.
  itbis_rate: number; // Tasa de ITBIS (0.00 o 0.18)
  active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class ProductModel {
  static async createTable() {
    const client = await db.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          unit VARCHAR(20) DEFAULT 'm³',
          itbis_rate DECIMAL(4, 2) DEFAULT 0.00,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insertar productos iniciales si la tabla está vacía
      const count = await client.query('SELECT COUNT(*) as count FROM products');
      if (parseInt(count.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO products (name, price, unit) VALUES
          ('Arena lavada', 1500.00, 'm³'),
          ('Arena sin lavar', 1200.00, 'm³'),
          ('Grava', 1800.00, 'm³'),
          ('Sub-base', 1000.00, 'm³'),
          ('Grava Arena', 1600.00, 'm³'),
          ('Granzote', 2000.00, 'm³'),
          ('Gravillín', 2200.00, 'm³'),
          ('Cascajo gris (Relleno)', 800.00, 'm³'),
          ('Base', 1100.00, 'm³'),
          ('Relleno amarillento', 700.00, 'm³')
        `);
      }
    } finally {
      client.release();
    }
  }

  static async getAllProducts(activeOnly: boolean = false): Promise<Product[]> {
    const client = await db.connect();
    try {
      const query = activeOnly 
        ? 'SELECT * FROM products WHERE active = true ORDER BY name ASC'
        : 'SELECT * FROM products ORDER BY name ASC';
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async getProductById(id: number): Promise<Product | null> {
    const client = await db.connect();
    try {
      const result = await client.query('SELECT * FROM products WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  static async createProduct(name: string, price: number, unit: string = 'm³', itbisRate: number = 0.00): Promise<Product> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'INSERT INTO products (name, price, unit, itbis_rate) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, price, unit, itbisRate]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async updateProduct(id: number, name: string, price: number, unit: string, itbisRate: number = 0.00): Promise<Product | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'UPDATE products SET name = $1, price = $2, unit = $3, itbis_rate = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, price, unit, itbisRate, id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  static async deleteProduct(id: number): Promise<boolean> {
    const client = await db.connect();
    try {
      // Soft delete: marcar como inactivo en lugar de eliminar
      const result = await client.query(
        'UPDATE products SET active = false WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  static async activateProduct(id: number): Promise<boolean> {
    const client = await db.connect();
    try {
      const result = await client.query(
        'UPDATE products SET active = true WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }
}
