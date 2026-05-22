import express from 'express';
import SavingsGoal from '../models/SavingsGoal.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Debt from '../models/Debt.js';
import Investment from '../models/Investment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/savings - Obtener todas las metas de ahorro
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority,
      type,
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
    if (priority) filters.priority = priority;
    if (type) filters.type = type;

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const savingsGoals = await SavingsGoal.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SavingsGoal.countDocuments(filters);

    res.json({
      success: true,
      data: {
        savingsGoals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las metas de ahorro'
    });
  }
});

// GET /api/savings/active - Obtener metas activas
router.get('/active', async (req, res) => {
  try {
    const userId = req.user._id;
    const activeGoals = await SavingsGoal.find({ userId, status: 'active' })
      .sort({ priority: -1, 'timeline.targetDate': 1 });

    res.json({
      success: true,
      data: activeGoals
    });
  } catch (error) {
    console.error('Error fetching active savings goals:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las metas activas'
    });
  }
});

// GET /api/savings/summary - Obtener resumen de ahorro
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener todas las metas de ahorro
    const allGoals = await SavingsGoal.find({ userId });
    
    // Calcular métricas
    const totalTargetAmount = allGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = allGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalRemaining = allGoals.reduce((sum, goal) => sum + goal.amountRemaining, 0);
    const totalMonthlyTarget = allGoals.reduce((sum, goal) => sum + goal.contribution.amount, 0);

    // Agrupar por estado
    const goalsByStatus = {
      active: allGoals.filter(goal => goal.status === 'active'),
      completed: allGoals.filter(goal => goal.status === 'completed'),
      paused: allGoals.filter(goal => goal.status === 'paused'),
      cancelled: allGoals.filter(goal => goal.status === 'cancelled')
    };

    // Agrupar por tipo
    const goalsByType = allGoals.reduce((acc, goal) => {
      if (!acc[goal.type]) {
        acc[goal.type] = {
          count: 0,
          totalTarget: 0,
          totalCurrent: 0
        };
      }
      acc[goal.type].count++;
      acc[goal.type].totalTarget += goal.targetAmount;
      acc[goal.type].totalCurrent += goal.currentAmount;
      return acc;
    }, {});

    // Calcular progreso promedio
    const averageProgress = allGoals.length > 0 
      ? allGoals.reduce((sum, goal) => sum + goal.progress.percentage, 0) / allGoals.length 
      : 0;

    // Metas próximas a vencer
    const upcomingDeadlines = allGoals
      .filter(goal => goal.status === 'active' && goal.daysRemaining > 0 && goal.daysRemaining <= 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    res.json({
      success: true,
      data: {
        summary: {
          totalGoals: allGoals.length,
          totalTargetAmount,
          totalCurrentAmount,
          totalRemaining,
          totalMonthlyTarget,
          averageProgress,
          completionRate: (goalsByStatus.completed.length / allGoals.length) * 100
        },
        byStatus: {
          active: goalsByStatus.active.length,
          completed: goalsByStatus.completed.length,
          paused: goalsByStatus.paused.length,
          cancelled: goalsByStatus.cancelled.length
        },
        byType: goalsByType,
        upcomingDeadlines: upcomingDeadlines.map(goal => ({
          name: goal.name,
          daysRemaining: goal.daysRemaining,
          progress: goal.progress.percentage,
          amountRemaining: goal.amountRemaining
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de ahorro'
    });
  }
});

// GET /api/savings/:id - Obtener una meta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });
    }

    res.json({
      success: true,
      data: savingsGoal
    });
  } catch (error) {
    console.error('Error fetching savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la meta de ahorro'
    });
  }
});

// POST /api/savings - Crear una nueva meta de ahorro
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const goalData = {
      ...req.body,
      userId
    };

    // Validaciones básicas
    const requiredFields = ['name', 'targetAmount', 'timeline', 'contribution'];
    for (const field of requiredFields) {
      if (!goalData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Validar montos
    if (goalData.targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto objetivo debe ser mayor a 0'
      });
    }

    if (goalData.contribution.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto de contribución debe ser mayor a 0'
      });
    }

    // Establecer fecha de inicio si no se proporciona
    if (!goalData.timeline.startDate) {
      goalData.timeline.startDate = new Date();
    }

    // Establecer estado inicial
    if (!goalData.status) {
      goalData.status = 'active';
    }

    // Establecer prioridad si no se proporciona
    if (!goalData.priority) {
      goalData.priority = 'medium';
    }

    const savingsGoal = new SavingsGoal(goalData);
    await savingsGoal.save();

    res.status(201).json({
      success: true,
      message: 'Meta de ahorro creada exitosamente',
      data: savingsGoal
    });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la meta de ahorro'
    });
  }
});

// PUT /api/savings/:id - Actualizar una meta de ahorro
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });
    }

    // Validar montos si se proporcionan
    if (updateData.targetAmount && updateData.targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto objetivo debe ser mayor a 0'
      });
    }

    if (updateData.contribution && updateData.contribution.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto de contribución debe ser mayor a 0'
      });
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        savingsGoal[key] = updateData[key];
      }
    });

    await savingsGoal.save();

    res.json({
      success: true,
      message: 'Meta de ahorro actualizada exitosamente',
      data: savingsGoal
    });
  } catch (error) {
    console.error('Error updating savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la meta de ahorro'
    });
  }
});

// PATCH /api/savings/:id/status - Cambiar estado de la meta
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { status } = req.body;

    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });
    }

    savingsGoal.status = status;
    
    // Si se marca como completada, actualizar fecha de completado
    if (status === 'completed') {
      savingsGoal.timeline.completedDate = new Date();
    }

    await savingsGoal.save();

    res.json({
      success: true,
      message: `Meta marcada como ${status} exitosamente`,
      data: savingsGoal
    });
  } catch (error) {
    console.error('Error updating savings goal status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la meta'
    });
  }
});

// POST /api/savings/:id/contribute - Realizar una contribución
router.post('/:id/contribute', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { amount, source = 'manual', notes = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto de la contribución debe ser mayor a 0'
      });
    }

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });

    if (savingsGoal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden realizar contribuciones en metas activas'
      });
    }

    await savingsGoal.addContribution(amount, source, notes);

    res.json({
      success: true,
      message: 'Contribución realizada exitosamente',
      data: savingsGoal
    });
  } catch (error) {
    console.error('Error making contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error al realizar la contribución'
    });
  }
});

// POST /api/savings/:id/withdraw - Realizar un retiro
router.post('/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { amount, reason = 'other', notes = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del retiro debe ser mayor a 0'
      });
    }

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });
    }

    if (amount > savingsGoal.currentAmount) {
      return res.status(400).json({
        success: false,
        message: 'El monto del retiro excede el saldo actual'
      });
    }

    await savingsGoal.addWithdrawal(amount, reason, notes);

    res.json({
      success: true,
      message: 'Retiro realizado exitosamente',
      data: savingsGoal
    });
  } catch (error) {
    console.error('Error making withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al realizar el retiro'
    });
  }
});

// POST /api/savings/:id/calculate-next-contribution - Calcular próxima contribución
router.post('/:id/calculate-next-contribution', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });
    }

    const nextContributionDate = savingsGoal.getNextContributionDate();
    const optimalContribution = savingsGoal.calculateOptimalContribution();

    res.json({
      success: true,
      data: {
        nextContributionDate,
        optimalContribution,
        isOnTrack: savingsGoal.isOnTrack,
        recommendations: savingsGoal.generateRecommendations()
      }
    });
  } catch (error) {
    console.error('Error calculating next contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular la próxima contribución'
    });
  }
});

// GET /api/savings/forecast - Proyección de ahorro
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;

    const activeGoals = await SavingsGoal.find({ userId, status: 'active' });
    
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthForecast = {
        date: forecastDate,
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1,
        totalContributions: 0,
        totalWithdrawals: 0,
        netSavings: 0,
        goals: []
      };

      activeGoals.forEach(goal => {
        if (!goal.timeline.endDate || goal.timeline.endDate > forecastDate) {
          const contribution = goal.contribution.amount;
          
          monthForecast.totalContributions += contribution;
          monthForecast.goals.push({
            name: goal.name,
            contribution,
            currentAmount: goal.currentAmount,
            targetAmount: goal.targetAmount,
            progress: goal.progress.percentage,
            type: goal.type
          });
        }
      });

      monthForecast.netSavings = monthForecast.totalContributions - monthForecast.totalWithdrawals;
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
      message: 'Error al generar proyección de ahorro'
    });
  }
});

// GET /api/savings/progress - Análisis de progreso
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user._id;

    const goals = await SavingsGoal.find({ userId });
    
    const progressAnalysis = {
      overallProgress: 0,
      goalsOnTrack: 0,
      goalsBehindSchedule: 0,
      averageTimeToComplete: 0,
      totalSaved: 0,
      totalTarget: 0,
      byType: {},
      byPriority: {},
      monthlyContributionTrend: []
    };

    // Calcular progreso general
    if (goals.length > 0) {
      progressAnalysis.totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      progressAnalysis.totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      progressAnalysis.overallProgress = (progressAnalysis.totalSaved / progressAnalysis.totalTarget) * 100;
      
      // Contar metas en progreso vs retrasadas
      progressAnalysis.goalsOnTrack = goals.filter(goal => goal.isOnTrack).length;
      progressAnalysis.goalsBehindSchedule = goals.filter(goal => !goal.isOnTrack && goal.status === 'active').length;
      
      // Tiempo promedio para completar
      const activeGoals = goals.filter(goal => goal.status === 'active');
      if (activeGoals.length > 0) {
        progressAnalysis.averageTimeToComplete = activeGoals.reduce((sum, goal) => sum + goal.daysRemaining, 0) / activeGoals.length;
      }
      
      // Análisis por tipo
      goals.forEach(goal => {
        if (!progressAnalysis.byType[goal.type]) {
          progressAnalysis.byType[goal.type] = {
            count: 0,
            totalSaved: 0,
            totalTarget: 0,
            averageProgress: 0
          };
        }
        progressAnalysis.byType[goal.type].count++;
        progressAnalysis.byType[goal.type].totalSaved += goal.currentAmount;
        progressAnalysis.byType[goal.type].totalTarget += goal.targetAmount;
        progressAnalysis.byType[goal.type].averageProgress += goal.progress.percentage;
      });
      
      // Calcular promedios por tipo
      Object.keys(progressAnalysis.byType).forEach(type => {
        const typeData = progressAnalysis.byType[type];
        typeData.averageProgress = typeData.averageProgress / typeData.count;
        typeData.progressPercentage = (typeData.totalSaved / typeData.totalTarget) * 100;
      });
      
      // Análisis por prioridad
      goals.forEach(goal => {
        if (!progressAnalysis.byPriority[goal.priority]) {
          progressAnalysis.byPriority[goal.priority] = {
            count: 0,
            totalSaved: 0,
            totalTarget: 0,
            averageProgress: 0
          };
        }
        progressAnalysis.byPriority[goal.priority].count++;
        progressAnalysis.byPriority[goal.priority].totalSaved += goal.currentAmount;
        progressAnalysis.byPriority[goal.priority].totalTarget += goal.targetAmount;
        progressAnalysis.byPriority[goal.priority].averageProgress += goal.progress.percentage;
      });
      
      // Calcular promedios por prioridad
      Object.keys(progressAnalysis.byPriority).forEach(priority => {
        const priorityData = progressAnalysis.byPriority[priority];
        priorityData.averageProgress = priorityData.averageProgress / priorityData.count;
        priorityData.progressPercentage = (priorityData.totalSaved / priorityData.totalTarget) * 100;
      });
    }

    res.json({
      success: true,
      data: progressAnalysis
    });
  } catch (error) {
    console.error('Error fetching progress analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de progreso'
    });
  }
});

// GET /api/savings/recommendations - Recomendaciones de ahorro
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener datos financieros del usuario
    const [incomeSummary, expenseSummary, debtSummary, savingsGoals] = await Promise.all([
      Income.getMonthlyIncome(userId),
      Expense.getMonthlyExpenses(userId),
      Debt.getMonthlyDebtPayments(userId),
      SavingsGoal.find({ userId })
    ]);

    const incomeData = incomeSummary[0] || { totalMonthly: 0 };
    const expenseData = expenseSummary[0] || { totalMonthly: 0 };
    const debtData = debtSummary[0] || { totalMonthlyPayments: 0 };

    const netMonthlyCashFlow = incomeData.totalMonthly - expenseData.totalMonthly - debtData.totalImpact;
    const currentSavingsRate = incomeData.totalMonthly > 0 ? 
      ((incomeData.totalMonthly - expenseData.totalMonthly - debtData.totalImpact) / incomeData.totalMonthly) * 100 : 0;

    const recommendations = [];

    // Recomendaciones basadas en tasa de ahorro
    if (currentSavingsRate < 10) {
      recommendations.push({
        type: 'increase-savings',
        priority: 'high',
        title: 'Aumentar tasa de ahorro',
        description: `Tu tasa de ahorro actual es ${currentSavingsRate.toFixed(1)}%. Se recomienda aumentarla al menos al 20% para una salud financiera óptima.`,
        action: 'Considera reducir gastos no esenciales o aumentar ingresos para mejorar tu tasa de ahorro.',
        potentialImpact: 'Mejora significativa de salud financiera a largo plazo'
      });
    }

    // Recomendaciones basadas en metas existentes
    const goalsBehindSchedule = savingsGoals.filter(goal => 
      goal.status === 'active' && !goal.isOnTrack
    );

    if (goalsBehindSchedule.length > 0) {
      recommendations.push({
        type: 'catch-up-contributions',
        priority: 'medium',
        title: 'Ajustar contribuciones a metas',
        description: `Tienes ${goalsBehindSchedule.length} metas que están detrás de schedule.`,
        action: 'Considera aumentar las contribuciones mensuales o retrasar las fechas objetivo.',
        goals: goalsBehindSchedule.map(goal => ({
          name: goal.name,
          currentProgress: goal.progress.percentage,
          recommendedContribution: goal.progress.requiredMonthlyContribution,
          currentContribution: goal.contribution.amount
        }))
      });
    }

    // Recomendaciones basadas en flujo de caja
    if (netMonthlyCashFlow > 0) {
      const recommendedSavings = netMonthlyCashFlow * 0.3; // 30% del flujo neto
      
      recommendations.push({
        type: 'optimize-savings',
        priority: 'medium',
        title: 'Optimizar asignación de ahorro',
        description: `Con un flujo neto de $${netMonthlyCashFlow.toFixed(0)}, podrías destinar $${recommendedSavings.toFixed(0)} mensuales a ahorro.`,
        action: 'Distribuye este monto entre tus metas existentes o crea nuevas metas.',
        potentialImpact: 'Aceleración significativa en el logro de metas financieras'
      });
    }

    // Recomendaciones basadas en diversificación
    const goalsByType = savingsGoals.reduce((acc, goal) => {
      acc[goal.type] = (acc[goal.type] || 0) + 1;
      return acc;
    }, {});

    const totalTypes = Object.keys(goalsByType).length;
    if (totalTypes < 3 && savingsGoals.length > 0) {
      recommendations.push({
        type: 'diversify-goals',
        priority: 'low',
        title: 'Diversificar metas de ahorro',
        description: 'Actualmente tienes metas concentradas en pocas categorías.',
        action: 'Considera crear metas en diferentes categorías como emergencia, jubilación, educación, etc.',
        potentialImpact: 'Mayor resiliencia financiera y mejor planificación a largo plazo'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          netMonthlyCashFlow,
          currentSavingsRate,
          totalGoals: savingsGoals.length,
          activeGoals: savingsGoals.filter(g => g.status === 'active').length,
          goalsBehindSchedule: goalsBehindSchedule.length
        }
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar recomendaciones'
    });
  }
});

// DELETE /api/savings/:id - Eliminar una meta de ahorro
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const savingsGoal = await SavingsGoal.findOne({ _id: id, userId });

    if (!savingsGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta de ahorro no encontrada'
      });
    }

    await SavingsGoal.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Meta de ahorro eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la meta de ahorro'
    });
  }
});

export default router;
