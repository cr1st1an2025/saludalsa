import db from '../db/database';

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string; // 'CREATE', 'UPDATE', 'DELETE'
  entityType: string; // 'user', 'dispatch', 'company', etc.
  entityId?: number;
  details?: string; // JSON string con detalles del cambio
  ipAddress?: string;
  createdAt: Date;
}

export class AuditLogModel {
  static async createTable() {
    const client = await db.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          userId INTEGER NOT NULL,
          username VARCHAR(50) NOT NULL,
          action VARCHAR(20) NOT NULL,
          entityType VARCHAR(50) NOT NULL,
          entityId INTEGER,
          details TEXT,
          ipAddress VARCHAR(45),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Crear índices para búsquedas rápidas
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_userid ON audit_logs(userId);
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entityType, entityId);
        CREATE INDEX IF NOT EXISTS idx_audit_createdat ON audit_logs(createdAt DESC);
      `);
    } finally {
      client.release();
    }
  }

  static async log(
    userId: number,
    username: string,
    action: string,
    entityType: string,
    entityId?: number,
    details?: any,
    ipAddress?: string
  ): Promise<void> {
    const client = await db.connect();
    
    try {
      await client.query(
        `INSERT INTO audit_logs (userId, username, action, entityType, entityId, details, ipAddress) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, username, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]
      );
    } finally {
      client.release();
    }
  }

  static async getRecentLogs(limit: number = 100): Promise<AuditLog[]> {
    const client = await db.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT $1`,
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async getLogsByUser(userId: number, limit: number = 50): Promise<AuditLog[]> {
    const client = await db.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM audit_logs WHERE userId = $1 ORDER BY createdAt DESC LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async getLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    const client = await db.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM audit_logs WHERE entityType = $1 AND entityId = $2 ORDER BY createdAt DESC`,
        [entityType, entityId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
}
