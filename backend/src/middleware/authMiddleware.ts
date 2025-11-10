import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  username: string;
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Verificar si la autenticación está deshabilitada para desarrollo
  const disableAuth = process.env.DISABLE_AUTH === 'true';
  
  if (disableAuth) {
    console.log('Autenticación deshabilitada para desarrollo');
    (req as any).user = { id: 1, username: 'dev_user' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  // Validar que JWT_SECRET esté configurado
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET no está configurado en las variables de entorno');
    return res.status(500).json({ error: 'Configuración de seguridad inválida.' });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido.' });
  }
};

export default authenticateToken;