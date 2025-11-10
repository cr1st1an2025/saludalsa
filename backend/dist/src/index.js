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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
// ========================================
// VALIDACIÓN DE SEGURIDAD CRÍTICA
// ========================================
function validateEnvironment() {
    const errors = [];
    const warnings = [];
    // Validar JWT_SECRET (obligatorio)
    if (!process.env.JWT_SECRET) {
        errors.push('❌ JWT_SECRET no está configurado');
    }
    else if (process.env.JWT_SECRET === 'secreto_por_defecto' ||
        process.env.JWT_SECRET === 'secreto_de_desarrollo_jwt_12345') {
        if (process.env.NODE_ENV === 'production') {
            errors.push('❌ JWT_SECRET usa un valor por defecto inseguro en producción');
        }
        else {
            warnings.push('⚠️ JWT_SECRET usa valor por defecto (solo desarrollo)');
        }
    }
    // Validar DATABASE_URL en producción
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
        errors.push('❌ DATABASE_URL no configurado en producción');
    }
    // Validar DISABLE_AUTH en producción
    if (process.env.NODE_ENV === 'production' && process.env.DISABLE_AUTH === 'true') {
        errors.push('❌ DISABLE_AUTH=true en producción es INSEGURO');
    }
    // Mostrar resultados
    if (errors.length > 0) {
        console.error('\n🛑 ERRORES CRÍTICOS DE SEGURIDAD:');
        errors.forEach(err => console.error(`  ${err}`));
        console.error('\n⛔ El servidor NO puede iniciar con estos errores.\n');
        process.exit(1);
    }
    if (warnings.length > 0) {
        console.warn('\n⚠️ ADVERTENCIAS DE SEGURIDAD:');
        warnings.forEach(warn => console.warn(`  ${warn}`));
        console.warn('');
    }
    console.log('✅ Validación de seguridad completada');
}
// Ejecutar validación al inicio
validateEnvironment();
const dispatchRoutes_1 = __importDefault(require("./routes/dispatchRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const equipmentRoutes_1 = __importDefault(require("./routes/equipmentRoutes"));
const operatorRoutes_1 = __importDefault(require("./routes/operatorRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const caminoRoutes_1 = __importDefault(require("./routes/caminoRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const authMiddleware_1 = __importDefault(require("./middleware/authMiddleware"));
const roleMiddleware_1 = __importDefault(require("./middleware/roleMiddleware"));
const init_database_1 = require("./migrations/init-database");
const add_numero_orden_1 = require("./migrations/add-numero-orden");
const add_company_fields_1 = require("./migrations/add-company-fields");
const add_ticket_orden_1 = require("./migrations/add-ticket-orden");
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
// Configuración de CORS para Railway + Vercel
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (Postman, curl, etc.)
        if (!origin) {
            console.log('✅ Request sin origin (permitido)');
            return callback(null, true);
        }
        console.log('🔍 Verificando origin:', origin);
        // Patrones permitidos
        const allowedPatterns = [
            /^http:\/\/localhost:(3000|3001)$/, // Localhost desarrollo
            /^https:\/\/gestion-despachos-2sls.*\.vercel\.app$/, // Todas las URLs de Vercel (production y preview)
            /^https:\/\/gestion-despachos-2sls-[a-z0-9]+-xgens-projects\.vercel\.app$/, // Preview deployments específicos
            /^https:\/\/.*\.vercel\.app$/, // Cualquier subdominio de Vercel (permisivo)
            /^https:\/\/.*\.netlify\.app$/, // Cualquier subdominio de Netlify
        ];
        // Lista explícita de orígenes permitidos
        const allowedOrigins = [
            'https://gestion-despachos-2sls.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        // Verificar contra lista explícita
        const inList = allowedOrigins.some(allowed => origin === allowed);
        // Verificar contra patrones regex
        const matchesPattern = allowedPatterns.some(pattern => pattern.test(origin));
        if (inList || matchesPattern) {
            console.log('✅ Origin permitido:', origin);
            callback(null, true);
        }
        else {
            console.log('❌ Origin bloqueado por CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Endpoint de prueba de conexión a BD
app.get('/api/test-db', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        // Obtener información del usuario admin
        const userResult = yield pool.query('SELECT id, username, role, LEFT(password, 20) as password_preview FROM users WHERE username = \'admin\'');
        const countResult = yield pool.query('SELECT COUNT(*) as count FROM users');
        yield pool.end();
        res.json({
            message: 'Conexión exitosa a PostgreSQL',
            userCount: countResult.rows[0].count,
            adminUser: userResult.rows[0],
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                databaseUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NO CONFIGURADA',
                hasJwtSecret: !!process.env.JWT_SECRET,
                jwtSecretPreview: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NO CONFIGURADO',
                nodeEnv: process.env.NODE_ENV,
                disableAuth: process.env.DISABLE_AUTH
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasJwtSecret: !!process.env.JWT_SECRET,
                nodeEnv: process.env.NODE_ENV
            }
        });
    }
}));
// Endpoint de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});
// Endpoint de test de login con debugging
app.post('/api/test-login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        res.json({
            received: { username, password, hasBody: !!req.body },
            headers: req.headers['content-type']
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes_1.default);
// Rutas protegidas (requieren autenticación)
// GET permitido para todos, POST/PUT/DELETE solo para admin
app.use('/api/dispatches', authMiddleware_1.default, dispatchRoutes_1.default);
// Rutas de usuarios, equipos, operarios: GET para todos autenticados, resto solo admin
app.use('/api/users', authMiddleware_1.default, userRoutes_1.default);
app.use('/api/equipment', authMiddleware_1.default, equipmentRoutes_1.default);
app.use('/api/operators', authMiddleware_1.default, operatorRoutes_1.default);
app.use('/api/companies', authMiddleware_1.default, companyRoutes_1.default);
app.use('/api/products', authMiddleware_1.default, productRoutes_1.default);
app.use('/api/camiones', caminoRoutes_1.default);
app.use('/api/audit', (0, roleMiddleware_1.default)('admin'), auditRoutes_1.default); // Logs de auditoría solo para admin
app.use('/api/clients', clientRoutes_1.default); // Permitir sin autenticación para facilitar auto-registro
app.get('/', (req, res) => {
    res.send('Backend del sistema de despachos funcionando!');
});
// Iniciar el servidor (excepto cuando se exporta para Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`✅ Backend escuchando en puerto ${port}`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 CORS configurado para Vercel frontend`);
        // Ejecutar migraciones automáticamente (en orden)
        try {
            yield (0, init_database_1.migrateInitDatabase)(); // Primero: crear tablas
            yield (0, add_numero_orden_1.migrateAddNumeroOrden)(); // Segundo: agregar columnas a dispatches
            yield (0, add_company_fields_1.migrateAddCompanyFields)(); // Tercero: agregar campos a companies
            yield (0, add_ticket_orden_1.migrateAddTicketOrden)(); // Cuarto: agregar ticketorden a dispatches
        }
        catch (error) {
            console.error('⚠️ Error ejecutando migraciones:', error);
        }
    }));
}
// Manejo de cierre de la aplicación
process.on('SIGINT', () => {
    console.log('Cerrando servidor...');
    process.exit(0);
});
// Exportar para Vercel
exports.default = app;
//# sourceMappingURL=index.js.map