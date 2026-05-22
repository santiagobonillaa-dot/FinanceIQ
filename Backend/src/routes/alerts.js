import express from 'express';
import Alert from '../models/Alert.js';
import { authenticateToken } from '../middleware/auth.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Debt from '../models/Debt.js';
import Investment from '../models/Investment.js';
import SavingsGoal from '../models/SavingsGoal.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/alerts - Obtener alertas del usuario
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      priority,
      status,
      limit = 20,
      page = 1,
      sortBy = 'timing.createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { userId };
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (status) filters.status = status;

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const alerts = await Alert.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(filters);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las alertas'
    });
  }
});

// GET /api/alerts/unread - Obtener alertas no leídas
router.get('/unread', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const unreadAlerts = await Alert.find({ 
      userId, 
      status: { $in: ['active', 'read'] }
    })
      .sort({ 'timing.createdAt': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: unreadAlerts
    });
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas no leídas'
    });
  }
});

// GET /api/alerts/summary - Obtener resumen de alertas
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    const alertSummary = await Alert.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 },
        latest: { $max: '$timing.createdAt' }
      }},
      { $sort: { count: -1 } }
    ]);

    const totalAlerts = await Alert.countDocuments({ userId });

    const alertsByType = await Alert.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$type',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    const recentAlerts = await Alert.find({ userId })
      .sort({ 'timing.createdAt': -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: alertSummary,
        totalAlerts,
        alertsByType,
        recentAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de alertas'
    });
  }
});

// GET /api/alerts/:id - Obtener una alerta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la alerta'
    });
  }
});

// POST /api/alerts - Crear una nueva alerta
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const alertData = {
      ...req.body,
      userId
    };

    // Validaciones básicas
    const requiredFields = ['title', 'message', 'type', 'category', 'priority'];
    for (const field of requiredFields) {
      if (!alertData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Establecer valores por defecto
    if (!alertData.status) {
      alertData.status = 'active';
    }
    if (!alertData.timing) {
      alertData.timing = {};
    }
    if (!alertData.timing.createdAt) {
      alertData.timing.createdAt = new Date();
    }
    if (!alertData.delivery) {
      alertData.delivery = {
        channels: [{
          type: 'in-app',
          status: 'sent',
          sentAt: new Date(),
          deliveredAt: new Date()
        }]
      };
    }
    if (!alertData.delivery.channels) {
      alertData.delivery.channels = alertData.delivery.channels || [];
    }

    const alert = new Alert(alertData);
    await alert.save();

    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la alerta'
    });
  }
});

// PUT /api/alerts/:id - Actualizar una alerta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        alert[key] = updateData[key];
      }
    });

    await alert.save();

    res.json({
      success: true,
      message: 'Alerta actualizada exitosamente',
      data: alert
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la alerta'
    });
  }
});

// PATCH /api/alerts/:id/status - Cambiar estado de la alerta
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { status } = req.body;

    if (!['active', 'read', 'acknowledged', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    alert.status = status;
    
    // Actualizar timestamps según el estado
    switch (status) {
      case 'read':
        alert.timing.readAt = new Date();
        break;
      case 'acknowledged':
        alert.timing.acknowledgedAt = new Date();
        break;
      case 'resolved':
        alert.timing.resolvedAt = new Date();
        break;
      case 'dismissed':
        alert.timing.dismissedAt = new Date();
        break;
    }

    await alert.save();

    res.json({
      success: true,
      message: `Alerta marcada como ${status} exitosamente`,
      data: alert
    });
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la alerta'
    });
  }
});

// POST /api/alerts/:id/mark-as-read - Marcar alerta como leída
router.post('/:id/mark-as-read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    alert.status = 'read';
    alert.timing.readAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: 'Alerta marcada como leída',
      data: alert
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta como leída'
    });
  }
});

// POST /api/alerts/:id/acknowledge - Reconocer alerta
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    alert.status = 'acknowledged';
    alert.timing.acknowledgedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: 'Alerta reconocida exitosamente',
      data: alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reconocer alerta'
    });
  }
});

// POST /api/alerts/:id/resolve - Resolver alerta
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { resolution } = req.body;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    alert.status = 'resolved';
    alert.timing.resolvedAt = new Date();
    if (resolution) {
      alert.resolution = resolution;
    }

    await alert.save();

    res.json({
      success: true,
      message: 'Alerta resuelta exitosamente',
      data: alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resolver alerta'
    });
  }
});

// POST /api/alerts/:id/dismiss - Descartar alerta
router.post('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    alert.status = 'dismissed';
    alert.timing.dismissedAt = new Date();
    if (reason) {
      alert.details.dismissalReason = reason;
    }

    await alert.save();

    res.json({
      success: true,
      message: 'Alerta descartada exitosamente',
      data: alert
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descartar alerta'
    });
  }
});

// GET /api/alerts/auto-generate - Generar alertas automáticas
router.post('/auto-generate', async (req, res) => {
  try {
    const userId = req.user._id;

    const generatedAlerts = [];

    // Generar alertas de presupuesto
    const budgetAlerts = await generateBudgetAlerts(userId);
    generatedAlerts.push(...budgetAlerts);

    // Generar alertas de deudas
    const debtAlerts = await generateDebtAlerts(userId);
    generatedAlerts.push(...debtAlerts);

    // Generar alertas de inversiones
    const investmentAlerts = await generateInvestmentAlerts(userId);
    generatedAlerts.push(...investmentAlerts);

    // Generar alertas de metas de ahorro
    const savingsAlerts = await generateSavingsAlerts(userId);
    generatedAlerts.push(...savingsAlerts);

    // Generar alertas de flujo de caja
    const cashFlowAlerts = await generateCashFlowAlerts(userId);
    generatedAlerts.push(...cashFlowAlerts);

    res.json({
      success: true,
      message: `${generatedAlerts.length} alertas generadas automáticamente`,
      data: {
        generatedAlerts,
        summary: {
          total: generatedAlerts.length,
          byType: {
            budget: budgetAlerts.length,
            debt: debtAlerts.length,
            investment: investmentAlerts.length,
            savings: savingsAlerts.length,
            cashFlow: cashFlowAlerts.length
          }
        }
      }
    });
  } catch (error) {
    console.error('Error auto-generating alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar alertas automáticas'
    });
  }
});

// GET /api/alerts/active - Obtener alertas activas
router.get('/active', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const activeAlerts = await Alert.find({ 
      userId, 
      status: 'active',
      $or: [
        { 'timing.expiresAt': null },
        { 'timing.expiresAt': { $gt: new Date() }
      ]
    })
      .sort({ priority: -1, 'timing.createdAt': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: activeAlerts
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas activas'
    });
  }
});

// GET /api/alerts/critical - Obtener alertas críticas
router.get('/critical', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 5 } = req.query;

    const criticalAlerts = await Alert.find({ 
      userId, 
      priority: 'critical',
      status: 'active',
      $or: [
        { 'timing.expiresAt': null },
        { 'timing.expiresAt': { $gt: new Date() }
      ]
    })
      .sort({ 'timing.createdAt': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: criticalAlerts
    });
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas críticas'
    });
  }
});

// GET /api/alerts/search - Buscar alertas
router.get('/search', async (req, res) => {
  try {
    const userId = req.user._id;
    const { q: query, type, priority, status } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query de búsqueda requerido'
      });
    }

    const searchFilters = { userId };
    if (type) searchFilters.type = type;
    if (priority) searchFilters.priority = priority;
    if (status) searchFilters.status = status;
    
    // Búsqueda en título y mensaje
    searchFilters.$or = [
      { title: { $regex: query, $options: 'i' } },
      { message: { $regex: query, $options: 'i' } }
    ];

    const searchResults = await Alert.find(searchFilters)
      .sort({ priority: -1, 'timing.createdAt': -1 })
      .limit(20);

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Error searching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar alertas'
    });
  }
});

// GET /api/alerts/:id/history - Obtener historial de una alerta
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
      message: 'Alerta no encontrada'
      });
    }

    const history = {
      createdAt: alert.timing.createdAt,
      readAt: alert.timing.readAt,
      acknowledgedAt: alert.timing.acknowledgedAt,
      resolvedAt: alert.timing.resolvedAt,
      dismissedAt: alert.timing.dismissedAt,
      status: alert.status,
      actions: alert.actions
    };

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de alerta'
    });
  }
});

// GET /api/alerts/statistics - Estadísticas de alertas
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    const startDate = new Date();
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const statistics = await Alert.aggregate([
      { $match: { userId, 'timing.createdAt': { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 },
        created: { $sum: 1 }
      }},
      { $group: {
        _id: '$type',
        count: { $sum: 1 }
      }},
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }},
      { $group: {
        _id: null,
        count: { $sum: 1 }
      }
    ]);

    const totalAlerts = await Alert.countDocuments({ 
      userId,
      'timing.createdAt': { $gte: startDate, $lte: endDate }
    });

    res.json({
      success: true,
      data: {
        period,
        totalAlerts,
        statistics,
        trends: {
          byPriority: statistics[0],
          byType: statistics[1],
          byStatus: statistics[2],
          total: statistics[3]
        }
      }
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de alertas'
    });
  }
});

// Funciones auxiliares para generar alertas automáticas
async function generateBudgetAlerts(userId) {
  const alerts = [];
  
  try {
    const expenses = await Expense.find({ userId, isActive: true, budgetLimit: { $gt: 0 } });
    
    for (const expense of expenses) {
      const utilization = (expense.actualSpending / expense.budgetLimit) * 100;
      
      if (utilization >= 90) {
        alerts.push({
          userId,
          type: 'budget-exceeded',
          category: 'financial',
          priority: utilization >= 100 ? 'critical' : 'high',
          title: `Presupuesto ${utilization >= 100 ? 'excedido' : 'cerca del límite'}`,
          message: `Tu gasto en ${expense.category} ha alcanzado el ${utilization.toFixed(1)}% del presupuesto de $${expense.budgetLimit.toLocaleString('es-CO')}`,
          details: {
            expenseId: expense._id,
            categoryName: expense.category,
            budgetLimit: expense.budgetLimit,
            actualSpending: expense.actualSpending,
            utilization
          },
          source: {
            type: 'rule-engine',
            moduleId: 'budget-monitor',
            entityId: expense._id,
            entityType: 'expense'
          },
          actions: [{
            type: 'view-details',
            label: 'Verificar Gasto',
            url: `/expenses/${expense._id}`,
            isPrimary: true
          }, {
            type: 'adjust-budget',
            label: 'Ajustar Presupuesto',
            url: `/expenses/${expense._id}/edit`
          }]
        });
      } else if (utilization >= 75) {
        alerts.push({
          userId,
          type: 'budget-warning',
          category: 'financial',
          priority: 'medium',
          title: 'Alerta de Presupuesto',
          message: `Tu gasto en ${expense.category} está cerca del límite del presupuesto`,
          details: {
            expenseId: expense._id,
            categoryName: expense.category,
            budgetLimit: expense.budgetLimit,
            actualSpending: expense.actualSpending,
            utilization
          },
          source: {
            type: 'rule-engine',
            moduleId: 'budget-monitor',
            entityId: expense._id,
            entityType: 'expense'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error generating budget alerts:', error);
  }
  
  return alerts;
}

async function generateDebtAlerts(userId) {
  const alerts = [];
  
  try {
    const debts = await Debt.find({ userId, status: 'active' });
    
    for (const debt of debts) {
      const daysUntilDue = Math.floor((debt.paymentSchedule.nextPaymentDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        alerts.push({
          userId,
          type: 'debt-due',
          category: 'financial',
          priority: daysUntilDue <= 3 ? 'critical' : 'high',
          title: daysUntilDue <= 3 ? 'Pago de Deuda Vencido' : 'Recordatorio de Pago de Deuda',
          message: `Tu pago de ${debt.name} por $${debt.paymentSchedule.paymentAmount} ${daysUntilDue < 0 ? 'está vencido' : 'vence en ${daysUntilDue} días'}`,
          details: {
            debtId: debt._id,
            debtName: debt.name,
            amount: debt.paymentSchedule.paymentAmount,
            dueDate: debt.paymentSchedule.nextPaymentDate,
            daysUntilDue
          },
          source: {
            type: 'scheduler',
            moduleId: 'debt-monitor',
            entityId: debt._id,
            entityType: 'debt'
          },
          actions: [{
            type: 'mark-paid',
            label: 'Marcar como Pagado',
            url: `/debts/${debt._id}/payment`,
            isPrimary: true
          }, {
            type: 'view-details',
            label: 'Verificar Deuda',
            url: `/debts/${debt._id}`,
            isPrimary: false
          }]
        });
      } else if (daysUntilDue <= 30 && daysUntilDue > 7) {
        alerts.push({
          userId,
          type: 'debt-due',
          category: 'financial',
          priority: 'medium',
          title: 'Próximo Pago de Deuda',
          message: `Tu pago de ${debt.name} vence en ${daysUntilDue} días`,
          details: {
            debtId: debt._id,
            debtName: debt.name,
            amount: debt.paymentSchedule.paymentAmount,
            dueDate: debt.paymentSchedule.nextPaymentDate,
            daysUntilDue
          },
          source: {
            type: 'scheduler',
            moduleId: 'debt-monitor',
            entityId: debt._id,
            entityType: 'debt'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error generating debt alerts:', error);
  }
  
  return alerts;
}

async function generateInvestmentAlerts(userId) {
  const alerts = [];
  
  try {
    const investments = await Investment.find({ userId, isActive: true });
    
    for (const investment of investments) {
      const changePercent = Math.abs(investment.performance.totalReturnPercent);
      
      if (changePercent >= 10) {
        alerts.push({
          userId,
          type: changePercent > 0 ? 'investment-gain' : 'investment-loss',
          category: 'investment',
          priority: changePercent >= 20 ? 'high' : 'medium',
          title: changePercent > 0 ? 'Ganancia en Inversión' : 'Pérdida en Inversión',
          message: `Tu inversión en ${investment.name} ha ${changePercent > 0 ? 'ganado' : 'perdido'} ${Math.abs(changePercent).toFixed(2)}% hoy`,
          details: {
            investmentId: investment._id,
            investmentName: investment.name,
            symbol: investment.symbol,
            currentPrice: investment.currentData.price,
            changePercent,
            currentValue: investment.performance.currentValue
          },
          source: {
            type: 'api',
            moduleId: 'market-monitor',
            entityId: investment._id,
            entityType: 'investment'
          },
          actions: [{
            type: 'view-details',
            label: 'Verificar Inversión',
            url: `/investments/${investment._id}`,
            isPrimary: true
          }]
        });
      }
    }
  } catch (error) {
    console.error('Error generating investment alerts:', error);
  }
  
  return alerts;
}

async function generateSavingsGoalsAlerts(userId) {
  const alerts = [];
  
  try {
    const savingsGoals = await SavingsGoal.find({ userId, status: 'active' });
    
    for (const goal of savingsGoals) {
      const daysRemaining = Math.floor((goal.timeline.targetDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 7 && daysRemaining >= 0) {
        alerts.push({
          userId,
          type: 'savings-goal',
          category: 'financial',
          priority: daysRemaining <= 3 ? 'critical' : 'high',
          title: daysRemaining <= 3 ? 'Meta de Ahorroro Vencida' : 'Meta de Ahorro Próxima',
          message: `Tu meta "${goal.name}" vence en ${daysRemaining} días`,
          details: {
            goalId: goal._id,
            goalName: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            daysRemaining,
            progress: goal.progress.percentage
          },
          source: {
            type: 'scheduler',
            moduleId: 'savings-monitor',
            entityId: goal._id,
            entityType: 'savings-goal'
          },
          actions: [{
            type: 'contribute',
            label: 'Contribuir',
            url: `/savings/${goal._id}/contribute`,
            isPrimary: true
          }]
        });
      } else if (daysRemaining <= 30 && daysRemaining > 7) {
        alerts.push({
          userId,
          type: 'milestone-approaching',
          category: 'financial',
          priority: 'medium',
          title: 'Meta de Ahorro Próxima',
          message: `Tu meta "${goal.name}" se acerca de completar en ${daysRemaining} días`,
          details: {
            goalId: goal._id,
            goalName: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            daysRemaining,
            progress: goal.progress.percentage
          },
          source: {
            type: 'scheduler',
            moduleId: 'savings-monitor',
            entityId: goal._id,
            entityType: 'savings-goal'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error generating savings alerts:', error);
  }
  
  return alerts;
}

async function generateCashFlowAlerts(userId) {
  const alerts = [];
  
  try {
    // Obtener datos financieros del usuario
    const [incomeSummary, expenseSummary, debtSummary] = await Promise.all([
      Income.getMonthlyIncome(userId),
      Expense.getMonthlyExpenses(userId),
      Debt.getMonthlyDebtPayments(userId)
    ]);

    const incomeData = incomeSummary[0] || { totalMonthly: 0 };
    const expenseData = expenseSummary[0] || { totalMonthly: 0 };
    const debtData = debtSummary[0] || { totalMonthlyImpact: 0 };

    const netCashFlow = incomeData.totalMonthly - expenseData.totalMonthly - debtData.totalImpact;

    // Alerta de flujo de caja negativo
    if (netCashFlow < 0) {
      alerts.push({
        userId,
        type: 'cash-flow-low',
        category: 'financial',
        priority: netCashFlow < -500000 ? 'critical' : 'high',
        title: 'Flujo de Caja Negativo',
        message: `Tu flujo de caja es de $${Math.abs(netCashFlow).toLocaleString('es-CO')} negativo`,
        details: {
          income: incomeData.totalMonthly,
          expenses: expenseData.totalMonthly,
          debts: debtData.totalImpact,
          netCashFlow
        },
        source: {
          type: 'rule-engine',
          moduleId: 'cash-flow-monitor',
          entityId: userId,
          entityType: 'user'
        },
        actions: [{
          type: 'view-analysis',
          label: 'Verificar Flujo',
          url: '/dashboard/cash-flow',
          isPrimary: true
        }]
      });
    } else if (netCashFlow < 200000) {
      alerts.push({
        userId,
        type: 'cash-flow-low',
        category: 'financial',
        priority: 'medium',
        title: 'Flujo de Caja Bajo',
        message: `Tu flujo de caja es de $${netCashFlow.toLocaleString('es-CO')} (considera aumentar ingresos o reducir gastos)`,
        details: {
          income: incomeData.totalMonthly,
          expenses: expenseData.totalMonthly,
          debts: debtData.totalImpact,
          netCashFlow
        },
        source: {
          type: 'rule-engine',
          moduleId: 'cash-flow-monitor',
          entityId: userId,
          entityType: 'user'
        }
      });
    }

    // Alerta de flujo de caja positivo excedente
    if (netCashFlow > 1000000) {
      alerts.push({
        userId,
        type: 'cash-flow-excess',
        category: 'financial',
        priority: 'low',
        title: 'Flujo de Caja Excedente',
        message: `Tu flujo de caja es de $${netCashFlow.toLocaleString('es-CO')} (considera aumentar inversiones)`,
        details: {
          income: incomeData.totalMonthly,
          expenses: expenseData.totalMonthly,
          debts: debtData.totalImpact,
          netCashFlow
        },
        source: {
          type: 'rule-engine',
          moduleId: 'cash-flow-monitor',
          entityId: userId,
          entityType: 'user'
        }
      });
    }
  } catch (error) {
    console.error('Error generating cash flow alerts:', error);
  }
  
  return alerts;
}

export default router;
