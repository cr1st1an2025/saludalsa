import bcrypt from 'bcryptjs';
import db from '../db/database';

export interface User {
  id: number;
  username: string;
  password: string;
  role: string; // 'admin' o 'employee'
  created_by?: number; // ID del usuario que creó este registro
  created_at?: Date;
}

export class UserModel {
  static async createTable() {
    const client = await db.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'employee' NOT NULL,
          createdby INTEGER REFERENCES users(id),
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  static async createUser(username: string, password: string, role: string = 'employee', createdBy?: number): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await db.connect();
    
    try {
      console.log('👤 Creando usuario:', { username, role, createdBy });
      const result = await client.query(
        'INSERT INTO users (username, password, role, createdby) VALUES ($1, $2, $3, $4) RETURNING id, username, password, role, createdby as created_by, createdat as created_at',
        [username, hashedPassword, role, createdBy || null]
      );
      console.log('✅ Usuario creado:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error en createUser:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByUsername(username: string): Promise<User | null> {
    const client = await db.connect();
    
    try {
      const result = await client.query(
        'SELECT id, username, password, role FROM users WHERE username = $1',
        [username]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static async getAllUsers(): Promise<User[]> {
    const client = await db.connect();
    
    try {
      console.log('🔍 Obteniendo todos los usuarios...');
      const result = await client.query(
        'SELECT id, username, role, createdby as created_by, createdat as created_at FROM users ORDER BY id ASC'
      );
      console.log('✅ Usuarios encontrados:', result.rows.length);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en getAllUsers:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteUser(id: number): Promise<boolean> {
    const client = await db.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }
}