import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      // Temporalmente desactivado para evitar errores de conexión
      // En producción, configurar las variables de entorno EMAIL_USER y EMAIL_PASS
      console.log('📧 Servicio de email desactivado temporalmente para desarrollo');
      this.transporter = null;
      
      // Descomentar cuando se configuren las credenciales de email
      /*
      // Configurar transporter (usando Gmail para desarrollo)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'financeiq.demo@gmail.com', // Cambia esto
          pass: process.env.EMAIL_PASS || 'tu-app-password' // Cambia esto
        }
      });

      // Verificar conexión
      await this.transporter.verify();
      console.log('✅ Servicio de email configurado correctamente');
      */
    } catch (error) {
      console.error('❌ Error configurando email:', error);
      // Para desarrollo, continuar sin email real
      this.transporter = null;
    }
  }

  async sendVerificationCode(email, code) {
    try {
      if (!this.transporter) {
        console.log(`📧 Simulación: Código ${code} para ${email}`);
        return { success: true, simulated: true };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'FinanceIQ <noreply@financeiq.com>',
        to: email,
        subject: '🔐 Código de Verificación - FinanceIQ',
        html: this.generateVerificationEmail(code)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado a ${email}:`, result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }
  }

  generateVerificationEmail(code) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación - FinanceIQ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f8f9fa; padding: 40px; text-align: center; border-radius: 0 0 10px 10px; }
          .code { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block; }
          .code-number { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .security-info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; text-align: left; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 FinanceIQ</h1>
            <p style="color: white; margin: 10px 0 0 0;">Código de Verificación</p>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 10px;">Recupera tu Contraseña</h2>
            <p style="color: #666; margin-bottom: 30px;">Usa el siguiente código de 6 dígitos para restablecer tu contraseña:</p>
            
            <div class="code">
              <p class="code-number">${code}</p>
            </div>
            
            <div class="security-info">
              <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
              <ul style="margin: 10px 0 0 20px;">
                <li>Este código expira en 10 minutos</li>
                <li>No compartas este código con nadie</li>
                <li>Solo es válido para esta sesión</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si no solicitaste este código, ignora este email.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 FinanceIQ - Plataforma Financiera Segura</p>
            <p style="font-size: 12px; margin-top: 10px;">
              Este es un email automático, no responder.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetConfirmation(email) {
    try {
      if (!this.transporter) {
        console.log(`📧 Simulación: Confirmación de reset para ${email}`);
        return { success: true, simulated: true };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'FinanceIQ <noreply@financeiq.com>',
        to: email,
        subject: '✅ Contraseña Restablecida - FinanceIQ',
        html: this.generatePasswordResetEmail()
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Confirmación enviada a ${email}:`, result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error enviando confirmación:', error);
      return { success: false, error: error.message };
    }
  }

  generatePasswordResetEmail() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Restablecida - FinanceIQ</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f8f9fa; padding: 40px; text-align: center; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; color: #4caf50; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ FinanceIQ</h1>
            <p style="color: white; margin: 10px 0 0 0;">Contraseña Restablecida</p>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            <h2 style="color: #333; margin-bottom: 10px;">¡Tu Contraseña Ha Sido Restablecida!</h2>
            <p style="color: #666; margin-bottom: 30px;">Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
            
            <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; text-align: left;">
              <p style="margin: 0;"><strong>🔐 Sugerencias de seguridad:</strong></p>
              <ul style="margin: 10px 0 0 20px;">
                <li>Usa contraseñas únicas para cada servicio</li>
                <li>Combina letras, números y símbolos</li>
                <li>Cambia tu contraseña periódicamente</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si no realizaste este cambio, contacta nuestro soporte inmediatamente.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 FinanceIQ - Plataforma Financiera Segura</p>
            <p style="font-size: 12px; margin-top: 10px;">
              Este es un email automático, no responder.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
