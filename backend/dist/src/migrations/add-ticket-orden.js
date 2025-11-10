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
exports.migrateAddTicketOrden = migrateAddTicketOrden;
// Migración: Agregar columna ticketorden a la tabla dispatches
const database_1 = __importDefault(require("../db/database"));
function migrateAddTicketOrden() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield database_1.default.connect();
        try {
            console.log('🔄 Ejecutando migración: agregar columna ticketorden a dispatches...');
            // Agregar columna ticketorden
            yield client.query(`
      ALTER TABLE dispatches 
      ADD COLUMN IF NOT EXISTS ticketorden VARCHAR(50)
    `);
            console.log('✅ Migración completada: columna ticketorden agregada a dispatches');
        }
        catch (error) {
            console.error('❌ Error en migración:', error);
            throw error;
        }
        finally {
            client.release();
        }
    });
}
//# sourceMappingURL=add-ticket-orden.js.map