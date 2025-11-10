export interface AuditLog {
    id: number;
    userId: number;
    username: string;
    action: string;
    entityType: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    createdAt: Date;
}
export declare class AuditLogModel {
    static createTable(): Promise<void>;
    static log(userId: number, username: string, action: string, entityType: string, entityId?: number, details?: any, ipAddress?: string): Promise<void>;
    static getRecentLogs(limit?: number): Promise<AuditLog[]>;
    static getLogsByUser(userId: number, limit?: number): Promise<AuditLog[]>;
    static getLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;
}
//# sourceMappingURL=AuditLog.d.ts.map