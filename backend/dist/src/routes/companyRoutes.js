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
const express_1 = require("express");
const database_1 = __importDefault(require("../db/database"));
const router = (0, express_1.Router)();
// GET all companies
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield database_1.default.connect();
    try {
        const result = yield client.query("SELECT * FROM companies");
        res.json({ data: result.rows });
    }
    catch (err) {
        console.error('Error al obtener empresas:', err);
        res.status(500).json({ error: 'Error al obtener empresas', details: err.message });
    }
    finally {
        client.release();
    }
}));
// POST new company
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, address, phone, email, rnc, domicilio, tipo_impositivo, exento, contactos } = req.body;
    // Validación básica
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nombre de empresa es requerido' });
    }
    if (!rnc || rnc.trim() === '') {
        return res.status(400).json({ error: 'RNC es requerido' });
    }
    const client = yield database_1.default.connect();
    try {
        const result = yield client.query("INSERT INTO companies (name, address, phone, email, rnc, domicilio, tipo_impositivo, exento, contactos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *", [name.trim(), address, phone, email, rnc.trim(), domicilio, tipo_impositivo || 0, exento || false, contactos]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error al crear empresa:', err);
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key')) {
            return res.status(400).json({ error: 'El nombre de empresa o RNC ya existe' });
        }
        res.status(500).json({ error: 'Error al crear empresa', details: err.message });
    }
    finally {
        client.release();
    }
}));
// PUT update company
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    const { name, address, phone, email, rnc, domicilio, tipo_impositivo, exento, contactos } = req.body;
    // Validación de ID
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    // Validación básica
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nombre de empresa es requerido' });
    }
    if (!rnc || rnc.trim() === '') {
        return res.status(400).json({ error: 'RNC es requerido' });
    }
    const client = yield database_1.default.connect();
    try {
        const result = yield client.query("UPDATE companies SET name = $1, address = $2, phone = $3, email = $4, rnc = $5, domicilio = $6, tipo_impositivo = $7, exento = $8, contactos = $9 WHERE id = $10 RETURNING *", [name.trim(), address, phone, email, rnc.trim(), domicilio, tipo_impositivo || 0, exento || false, contactos, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error al actualizar empresa:', err);
        res.status(500).json({ error: 'Error al actualizar empresa', details: err.message });
    }
    finally {
        client.release();
    }
}));
// DELETE company
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    // Validación de ID
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    const client = yield database_1.default.connect();
    try {
        const result = yield client.query("DELETE FROM companies WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        res.json({ message: 'Empresa eliminada correctamente' });
    }
    catch (err) {
        console.error('Error al eliminar empresa:', err);
        res.status(500).json({ error: 'Error al eliminar empresa', details: err.message });
    }
    finally {
        client.release();
    }
}));
exports.default = router;
//# sourceMappingURL=companyRoutes.js.map