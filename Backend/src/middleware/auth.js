import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Buscar usuario
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};
