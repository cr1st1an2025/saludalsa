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
exports.migrateAddCompanyFields = migrateAddCompanyFields;
// Migración: Agregar campos de facturación a la tabla companies
const database_1 = __importDefault(require("../db/database"));
function migrateAddCompanyFields() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield database_1.default.connect();
        try {
            console.log('🔄 Ejecutando migración: agregar campos de facturación a companies...');
            // Agregar columnas si no existen
            yield client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS rnc VARCHAR(50),
      ADD COLUMN IF NOT EXISTS domicilio TEXT,
      ADD COLUMN IF NOT EXISTS tipo_impositivo DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS exento BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS contactos TEXT
    `);
            console.log('✅ Migración completada: campos de facturación agregados a companies');
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
//# sourceMappingURL=add-company-fields.js.map