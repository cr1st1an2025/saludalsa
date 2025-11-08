import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import dispatchRoutes from './routes/dispatchRoutes';
import userRoutes from './routes/userRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import operatorRoutes from './routes/operatorRoutes';
import companyRoutes from './routes/companyRoutes';
import clientRoutes from './routes/clientRoutes';
import caminoRoutes from './routes/caminoRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes';
import authenticateToken from './middleware/authMiddleware';
import checkRole from './middleware/roleMiddleware';
import { migrateAddNumeroOrden } from './migrations/add-numero-orden';
import { migrateAddCompanyFields } from './migrations/add-company-fields';

const app = express();
const port = process.env.PORT || 3002;

// Configuración de CORS para Railway + Vercel
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Permitir requests sin origin (Postman, curl, etc.)
    if (!origin) {
      console.log('✅ Request sin origin (permitido)');
      return callback(null, true);
    }
    
    console.log('🔍 Verificando origin:', origin);
    
    // Patrones permitidos
    const allowedPatterns = [
      /^http:\/\/localhost:(3000|3001)$/,  // Localhost desarrollo
      /^https:\/\/gestion-despachos-2sls.*\.vercel\.app$/,  // Todas las URLs de Vercel (production y preview)
      /^https:\/\/gestion-despachos-2sls-[a-z0-9]+-xgens-projects\.vercel\.app$/,  // Preview deployments específicos
      /^https:\/\/.*\.vercel\.app$/,  // Cualquier subdominio de Vercel (permisivo)
      /^https:\/\/.*\.netlify\.app$/,  // Cualquier subdominio de Netlify
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
    } else {
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

app.use(cors(corsOptions));
app.use(express.json());

// Endpoint de prueba de conexión a BD
app.get('/api/test-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Obtener información del usuario admin
    const userResult = await pool.query('SELECT id, username, role, LEFT(password, 20) as password_preview FROM users WHERE username = \'admin\'');
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    
    await pool.end();
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
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Endpoint de test de login con debugging
app.post('/api/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    res.json({
      received: { username, password, hasBody: !!req.body },
      headers: req.headers['content-type']
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
// GET permitido para todos, POST/PUT/DELETE solo para admin
app.use('/api/dispatches', authenticateToken, dispatchRoutes);

// Rutas de usuarios, equipos, operarios: GET para todos autenticados, resto solo admin
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/operators', authenticateToken, operatorRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/camiones', caminoRoutes);
app.use('/api/audit', checkRole('admin'), auditRoutes); // Logs de auditoría solo para admin
app.use('/api/clients', clientRoutes); // Permitir sin autenticación para facilitar auto-registro

app.get('/', (req, res) => {
  res.send('Backend del sistema de despachos funcionando!');
});

// Iniciar el servidor (excepto cuando se exporta para Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(port, async () => {
    console.log(`✅ Backend escuchando en puerto ${port}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 CORS configurado para Vercel frontend`);
    
    // Ejecutar migraciones automáticamente
    try {
      await migrateAddNumeroOrden();
      await migrateAddCompanyFields();
    } catch (error) {
      console.error('⚠️ Error ejecutando migraciones:', error);
    }
  });
}

// Manejo de cierre de la aplicación
process.on('SIGINT', () => {
  console.log('Cerrando servidor...');
  process.exit(0);
});

// Exportar para Vercel
export default app;