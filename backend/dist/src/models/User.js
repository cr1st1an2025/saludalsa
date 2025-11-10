"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../db/database"));
class UserModel {
    static createTable() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield database_1.default.connect();
            try {
                yield client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'employee' NOT NULL,
          createdby INTEGER REFERENCES users(id),
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            }
            finally {
                client.release();
            }
        });
    }
    static createUser(username_1, password_1) {
        return __awaiter(this, arguments, void 0, function* (username, password, role = 'employee', createdBy) {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            const client = yield database_1.default.connect();
            try {
                console.log('👤 Creando usuario:', { username, role, createdBy });
                const result = yield client.query('INSERT INTO users (username, password, role, createdby) VALUES ($1, $2, $3, $4) RETURNING id, username, password, role, createdby as created_by, createdat as created_at', [username, hashedPassword, role, createdBy || null]);
                console.log('✅ Usuario creado:', result.rows[0].id);
                return result.rows[0];
            }
            catch (error) {
                console.error('❌ Error en createUser:', error);
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    static findByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield database_1.default.connect();
            try {
                const result = yield client.query('SELECT id, username, password, role FROM users WHERE username = $1', [username]);
                return result.rows.length > 0 ? result.rows[0] : null;
            }
            finally {
                client.release();
            }
        });
    }
    static validatePassword(user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcryptjs_1.default.compare(password, user.password);
        });
    }
    static getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield database_1.default.connect();
            try {
                console.log('🔍 Obteniendo todos los usuarios...');
                const result = yield client.query('SELECT id, username, role, createdby as created_by, createdat as created_at FROM users ORDER BY id ASC');
                console.log('✅ Usuarios encontrados:', result.rows.length);
                return result.rows;
            }
            catch (error) {
                console.error('❌ Error en getAllUsers:', error);
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    static deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield database_1.default.connect();
            try {
                const result = yield client.query('DELETE FROM users WHERE id = $1', [id]);
                return (result.rowCount || 0) > 0;
            }
            finally {
                client.release();
            }
        });
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map