import express from 'express';
import Debt from '../models/Debt.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/debts - Obtener todas las deudas del usuario
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      priority,
      creditorType,
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { userId };
    if (status) filters.status = status;
    if (type) filters['loanDetails.type'] = type;
    if (priority) filters.priority = priority;
    if (creditorType) filters['creditor.type'] = creditorType;

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const debts = await Debt.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Debt.countDocuments(filters);

    res.json({
      success: true,
      data: {
        debts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las deudas'
    });
  }
});

// GET /api/debts/active - Obtener deudas activas
router.get('/active', async (req, res) => {
  try {
    const userId = req.user._id;
    const activeDebts = await Debt.getActiveDebts(userId);

    res.json({
      success: true,
      data: activeDebts
    });
  } catch (error) {
    console.error('Error fetching active debts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las deudas activas'
    });
  }
});

// GET /api/debts/summary - Obtener resumen de deudas
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const monthlyDebtPayments = await Debt.getMonthlyDebtPayments(userId);

    res.json({
      success: true,
      data: monthlyDebtPayments[0] || {
        totalMonthlyPayments: 0,
        totalInsurance: 0,
        totalImpact: 0,
        debtsCount: 0,
        totalBalance: 0,
        totalInterestRate: 0
      }
    });
  } catch (error) {
    console.error('Error fetching debt summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de deudas'
    });
  }
});

// GET /api/debts/overdue - Obtener deudas vencidas
router.get('/overdue', async (req, res) => {
  try {
    const userId = req.user._id;
    const overdueDebts = await Debt.getOverdueDebts(userId);

    res.json({
      success: true,
      data: overdueDebts
    });
  } catch (error) {
    console.error('Error fetching overdue debts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener deudas vencidas'
    });
  }
});

// GET /api/debts/summary-by-status - Resumen por estado
router.get('/summary-by-status', async (req, res) => {
  try {
    const userId = req.user._id;
    const debtSummary = await Debt.getDebtSummary(userId);

    res.json({
      success: true,
      data: debtSummary
    });
  } catch (error) {
    console.error('Error fetching debt summary by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen por estado'
    });
  }
});

// GET /api/debts/:id - Obtener una deuda específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    res.json({
      success: true,
      data: debt
    });
  } catch (error) {
    console.error('Error fetching debt:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la deuda'
    });
  }
});

// POST /api/debts - Crear una nueva deuda
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const debtData = {
      ...req.body,
      userId
    };

    // Validaciones básicas
    const requiredFields = ['name', 'originalAmount', 'currentBalance', 'interestRate', 'paymentSchedule'];
    for (const field of requiredFields) {
      if (!debtData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Validar montos
    if (debtData.originalAmount <= 0 || debtData.currentBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Los montos deben ser mayores a 0'
      });
    }

    // Validar tasa de interés
    if (debtData.interestRate.annual < 0 || debtData.interestRate.annual > 100) {
      return res.status(400).json({
        success: false,
        message: 'La tasa de interés anual debe estar entre 0 y 100'
      });
    }

    // Establecer fechas si no se proporcionan
    if (!debtData.paymentSchedule.startDate) {
      debtData.paymentSchedule.startDate = new Date();
    }
    if (!debtData.paymentSchedule.nextPaymentDate) {
      debtData.paymentSchedule.nextPaymentDate = debtData.paymentSchedule.startDate;
    }

    // Calcular detalles del próximo pago
    const debt = new Debt(debtData);
    debt.nextPaymentDetails = debt.getNextPaymentDetails();

    await debt.save();

    res.status(201).json({
      success: true,
      message: 'Deuda creada exitosamente',
      data: debt
    });
  } catch (error) {
    console.error('Error creating debt:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la deuda'
    });
  }
});

// PUT /api/debts/:id - Actualizar una deuda
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    // Validar montos si se proporcionan
    if (updateData.originalAmount && updateData.originalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto original debe ser mayor a 0'
      });
    }

    if (updateData.currentBalance && updateData.currentBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'El saldo actual no puede ser negativo'
      });
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        debt[key] = updateData[key];
      }
    });

    // Recalcular detalles del próximo pago si cambió algo relevante
    if (updateData.paymentSchedule || updateData.currentBalance || updateData.interestRate) {
      debt.nextPaymentDetails = debt.getNextPaymentDetails();
    }

    await debt.save();

    res.json({
      success: true,
      message: 'Deuda actualizada exitosamente',
      data: debt
    });
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la deuda'
    });
  }
});

// PATCH /api/debts/:id/status - Cambiar estado de la deuda
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { status } = req.body;

    if (!['active', 'paid', 'defaulted', 'restructured', 'paused'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    debt.status = status;
    
    // Si se marca como pagada, actualizar saldo a 0
    if (status === 'paid') {
      debt.currentBalance = 0;
      debt.timeline.completedDate = new Date();
    }

    await debt.save();

    res.json({
      success: true,
      message: `Deuda marcada como ${status} exitosamente`,
      data: debt
    });
  } catch (error) {
    console.error('Error updating debt status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la deuda'
    });
  }
});

// POST /api/debts/:id/payment - Realizar un pago
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { amount, paymentDate = new Date() } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del pago debe ser mayor a 0'
      });
    }

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    if (debt.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden realizar pagos en deudas activas'
      });
    }

    await debt.makePayment(amount, paymentDate);

    res.json({
      success: true,
      message: 'Pago realizado exitosamente',
      data: debt
    });
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al realizar el pago'
    });
  }
});

// POST /api/debts/:id/calculate-next-payment - Calcular próxima fecha de pago
router.post('/:id/calculate-next-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    const nextPaymentDate = debt.calculateNextPaymentDate();
    const nextPaymentDetails = debt.getNextPaymentDetails();

    res.json({
      success: true,
      data: {
        nextPaymentDate,
        nextPaymentDetails,
        isOverdue: debt.isOverdue
      }
    });
  } catch (error) {
    console.error('Error calculating next payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular la próxima fecha de pago'
    });
  }
});

// POST /api/debts/:id/amortization-schedule - Obtener tabla de amortización
router.post('/:id/amortization-schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    const amortizationSchedule = debt.calculateAmortizationSchedule();

    res.json({
      success: true,
      data: amortizationSchedule
    });
  } catch (error) {
    console.error('Error calculating amortization schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular tabla de amortización'
    });
  }
});

// POST /api/debts/:id/prepayment-impact - Calcular impacto de prepago
router.post('/:id/prepayment-impact', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { extraAmount } = req.body;

    if (!extraAmount || extraAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto extra debe ser mayor a 0'
      });
    }

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    const prepaymentImpact = debt.prepaymentImpact(extraAmount);

    res.json({
      success: true,
      data: prepaymentImpact
    });
  } catch (error) {
    console.error('Error calculating prepayment impact:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular impacto de prepago'
    });
  }
});

// GET /api/debts/analytics/by-type - Análisis de deudas por tipo
router.get('/analytics/by-type', async (req, res) => {
  try {
    const userId = req.user._id;

    const analysis = await Debt.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$loanDetails.type',
        totalBalance: { $sum: '$currentBalance' },
        totalOriginal: { $sum: '$originalAmount' },
        averageInterestRate: { $avg: '$interestRate.annual' },
        count: { $sum: 1 },
        totalMonthlyPayments: { $sum: '$paymentSchedule.paymentAmount' }
      }},
      { $sort: { totalBalance: -1 } }
    ]);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error fetching analytics by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis por tipo'
    });
  }
});

// GET /api/debts/analytics/by-creditor - Análisis de deudas por acreedor
router.get('/analytics/by-creditor', async (req, res) => {
  try {
    const userId = req.user._id;

    const analysis = await Debt.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$creditor.name',
        totalBalance: { $sum: '$currentBalance' },
        averageInterestRate: { $avg: '$interestRate.annual' },
        count: { $sum: 1 },
        totalMonthlyPayments: { $sum: '$paymentSchedule.paymentAmount' }
      }},
      { $sort: { totalBalance: -1 } }
    ]);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error fetching analytics by creditor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis por acreedor'
    });
  }
});

// GET /api/debts/analytics/by-priority - Análisis de deudas por prioridad
router.get('/analytics/by-priority', async (req, res) => {
  try {
    const userId = req.user._id;

    const analysis = await Debt.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$priority',
        totalBalance: { $sum: '$currentBalance' },
        averageInterestRate: { $avg: '$interestRate.annual' },
        count: { $sum: 1 },
        totalMonthlyPayments: { $sum: '$paymentSchedule.paymentAmount' }
      }},
      { $sort: { totalBalance: -1 } }
    ]);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error fetching analytics by priority:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis por prioridad'
    });
  }
});

// GET /api/debts/forecast - Proyección de pagos futuros
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;

    const activeDebts = await Debt.getActiveDebts(userId);
    
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthForecast = {
        date: forecastDate,
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1,
        totalPayments: 0,
        totalInterest: 0,
        totalPrincipal: 0,
        debts: []
      };

      activeDebts.forEach(debt => {
        if (debt.isActive && (!debt.timeline.endDate || debt.timeline.endDate > forecastDate)) {
          const paymentDetails = debt.getNextPaymentDetails();
          monthForecast.totalPayments += paymentDetails.totalAmount;
          monthForecast.totalInterest += paymentDetails.interestAmount;
          monthForecast.totalPrincipal += paymentDetails.principalAmount;
          
          monthForecast.debts.push({
            name: debt.name,
            paymentAmount: paymentDetails.totalAmount,
            principalAmount: paymentDetails.principalAmount,
            interestAmount: paymentDetails.interestAmount,
            currency: debt.currency,
            creditor: debt.creditor.name
          });
        }
      });

      forecast.push(monthForecast);
    }

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar proyección de pagos'
    });
  }
});

// DELETE /api/debts/:id - Eliminar una deuda
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const debt = await Debt.findOne({ _id: id, userId });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Deuda no encontrada'
      });
    }

    await Debt.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Deuda eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la deuda'
    });
  }
});

export default router;
