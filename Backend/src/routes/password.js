import express from 'express';
import { User } from '../models/User.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Almacenamiento temporal de códigos (en producción, usar Redis)
const resetCodes = new Map();

// Generar código de 6 dígitos
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Enviar código de recuperación
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No existe una cuenta con este correo'
      });
    }

    // Generar y guardar código
    const code = generateCode();
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos
      attempts: 0
    });

    // Enviar código por email
    const emailResult = await emailService.sendVerificationCode(email, code);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Código enviado al correo electrónico',
        // En desarrollo o simulación, mostrar el código
        debugCode: (process.env.NODE_ENV !== 'production' || emailResult.simulated) ? code : undefined
      });
    } else {
      // Si el email falla, devolver el código para desarrollo
      console.log(`📧 Email falló, usando código de respaldo para ${email}: ${code}`);
      res.json({
        success: true,
        message: 'Código generado (email temporalmente no disponible)',
        debugCode: code
      });
    }

  } catch (error) {
    console.error('Error sending code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el código'
    });
  }
});

// Verificar código y restablecer contraseña
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Verificar código
    const resetData = resetCodes.get(email);
    if (!resetData) {
      return res.status(400).json({
        success: false,
        message: 'Código no solicitado o expirado'
      });
    }

    // Verificar expiración
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Código expirado. Solicita uno nuevo'
      });
    }

    // Verificar intentos
    if (resetData.attempts >= 3) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Demasiados intentos. Solicita un nuevo código'
      });
    }

    // Verificar código
    if (resetData.code !== code) {
      resetData.attempts++;
      return res.status(400).json({
        success: false,
        message: 'Código incorrecto'
      });
    }

    // Buscar usuario y actualizar contraseña
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Encriptar nueva contraseña
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    user.password = hashedPassword;
    await user.save();

    // Limpiar código
    resetCodes.delete(email);

    // Enviar confirmación de cambio de contraseña
    await emailService.sendPasswordResetConfirmation(email);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el código'
    });
  }
});

export default router;
