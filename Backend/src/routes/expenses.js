import express from 'express';
import { ObjectId } from 'mongodb';
import Expense from '../models/Expense.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas (temporalmente desactivado)
// router.use(authenticateToken);

// GET /api/expenses - Obtener todos los egresos del usuario
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      frequency, 
      isActive, 
      currency,
      priority,
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011'); // ObjectId válido temporal
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { userId };
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (frequency) filters.frequency = frequency;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (currency) filters.currency = currency;
    if (priority) filters.priority = priority;

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(filters);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los egresos'
    });
  }
});

// GET /api/expenses/active - Obtener egresos activos
router.get('/active', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const activeExpenses = await Expense.getActiveExpenses(userId);

    res.json({
      success: true,
      data: activeExpenses
    });
  } catch (error) {
    console.error('Error fetching active expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los egresos activos'
    });
  }
});

// GET /api/expenses/summary - Obtener resumen de egresos
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const monthlyExpenses = await Expense.getMonthlyExpenses(userId);

    res.json({
      success: true,
      data: monthlyExpenses[0] || {
        totalMonthly: 0,
        totalAnnual: 0,
        expensesCount: 0,
        fixedExpenses: 0,
        variableExpenses: 0
      }
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de egresos'
    });
  }
});

// GET /api/expenses/category-analysis - Análisis por categoría
router.get('/category-analysis', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const { period = 'monthly' } = req.query;

    const categoryAnalysis = await Expense.getExpensesByCategory(userId, period);

    res.json({
      success: true,
      data: categoryAnalysis
    });
  } catch (error) {
    console.error('Error fetching category analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis por categoría'
    });
  }
});

// GET /api/expenses/overdue - Obtener egresos vencidos
router.get('/overdue', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const overdueExpenses = await Expense.getOverdueExpenses(userId);

    res.json({
      success: true,
      data: overdueExpenses
    });
  } catch (error) {
    console.error('Error fetching overdue expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener egresos vencidos'
    });
  }
});

// GET /api/expenses/budget-alerts - Obtener alertas de presupuesto
router.get('/budget-alerts', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const budgetAlerts = await Expense.getBudgetAlerts(userId);

    res.json({
      success: true,
      data: budgetAlerts
    });
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas de presupuesto'
    });
  }
});

// GET /api/expenses/:id - Obtener un egreso específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');

    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el egreso'
    });
  }
});

// POST /api/expenses - Crear un nuevo egreso
router.post('/', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011'); // ObjectId válido temporal
    const expenseData = {
      ...req.body,
      userId
    };

    // Validaciones básicas
    const requiredFields = ['name', 'amount', 'type', 'frequency', 'category'];
    for (const field of requiredFields) {
      if (!expenseData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Validar montos
    if (expenseData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Establecer fecha de inicio usando siempre el campo date del formulario
    console.log('🔧 📅 Fecha recibida del formulario:', expenseData.date);
    console.log('🔧 📅 Tipo de dato de fecha:', typeof expenseData.date);
    
    if (expenseData.date) {
      const startDate = new Date(expenseData.date);
      console.log('🔧 📅 Fecha parseada:', startDate);
      console.log('🔧 📅 Fecha válida?:', !isNaN(startDate.getTime()));
      
      if (!isNaN(startDate.getTime())) {
        expenseData.startDate = startDate;
        console.log('🔧 ✅ startDate establecido:', expenseData.startDate);
      } else {
        console.error('Fecha inválida proporcionada:', expenseData.date);
        expenseData.startDate = new Date();
        console.log('🔧 ⚠️ Usando fecha actual como fallback:', expenseData.startDate);
      }
    } else {
      expenseData.startDate = new Date();
      console.log('🔧 ⚠️ Sin fecha proporcionada, usando fecha actual:', expenseData.startDate);
    }

    // Calcular próxima fecha de pago
    const expense = new Expense(expenseData);
    expense.nextPaymentDate = expense.calculateNextPayment();

    await expense.save();

    console.log('🔧 💾 Gasto guardado en BD:', {
      id: expense._id,
      name: expense.name,
      amount: expense.amount,
      startDate: expense.startDate,
      createdAt: expense.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Egreso creado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el egreso'
    });
  }
});

// PUT /api/expenses/:id - Actualizar un egreso
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const updateData = req.body;

    const expense = await Expense.findOne({ _id: new ObjectId(id), userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }

    // Validar montos si se proporcionan
    if (updateData.amount && updateData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        expense[key] = updateData[key];
      }
    });

    // Si se actualiza el campo 'date', también actualizar 'startDate'
    console.log('🔧 📅 Actualización - Fecha recibida:', updateData.date);
    console.log('🔧 📅 Actualización - startDate actual:', expense.startDate);
    
    if (updateData.date) {
      const newDate = new Date(updateData.date);
      console.log('🔧 📅 Actualización - Nueva fecha parseada:', newDate);
      console.log('🔧 📅 Actualización - Fecha válida?:', !isNaN(newDate.getTime()));
      
      if (!isNaN(newDate.getTime())) {
        expense.startDate = newDate;
        console.log('🔧 ✅ Actualización - startDate actualizado:', expense.startDate);
      } else {
        console.error('Fecha inválida proporcionada:', updateData.date);
      }
    }

    // Recalcular próxima fecha de pago si cambió la frecuencia o la fecha
    if (updateData.frequency || updateData.startDate || updateData.date) {
      expense.nextPaymentDate = expense.calculateNextPayment();
    }

    await expense.save();

    console.log('🔧 💾 Gasto actualizado en BD:', {
      id: expense._id,
      name: expense.name,
      amount: expense.amount,
      startDate: expense.startDate,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    });

    res.json({
      success: true,
      message: 'Egreso actualizado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el egreso'
    });
  }
});

// PATCH /api/expenses/:id/status - Cambiar estado activo/inactivo
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive debe ser un valor booleano'
      });
    }

    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }

    expense.isActive = isActive;
    await expense.save();

    res.json({
      success: true,
      message: `Egreso ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: expense
    });
  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del egreso'
    });
  }
});

// POST /api/expenses/:id/calculate-next-payment - Calcular próxima fecha de pago
router.post('/:id/calculate-next-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');

    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }

    const nextPaymentDate = expense.calculateNextPayment();

    res.json({
      success: true,
      data: {
        nextPaymentDate,
        isOverdue: expense.isOverdue
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

// POST /api/expenses/:id/update-spending - Actualizar gasto real
router.post('/:id/update-spending', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }

    await expense.updateSpending(amount);

    res.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error updating spending:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el gasto'
    });
  }
});

// GET /api/expenses/analytics/by-type - Análisis de egresos por tipo
router.get('/analytics/by-type', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');

    const analysis = await Expense.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        count: { $sum: 1 },
        totalMonthly: { $sum: '$averageMonthlyAmount' },
        currencies: { $addToSet: '$currency' }
      }},
      { $sort: { totalMonthly: -1 } }
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

// GET /api/expenses/analytics/by-priority - Análisis de egresos por prioridad
router.get('/analytics/by-priority', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');

    const analysis = await Expense.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$priority',
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        count: { $sum: 1 },
        totalMonthly: { $sum: '$averageMonthlyAmount' }
      }},
      { $sort: { totalMonthly: -1 } }
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

// GET /api/expenses/analytics/monthly-trend - Tendencia mensual de egresos
router.get('/analytics/monthly-trend', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const { months = 12 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const trend = await Expense.aggregate([
      { 
        $match: { 
          userId,
          startDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('Error fetching monthly trend:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tendencia mensual'
    });
  }
});

// GET /api/expenses/forecast - Proyección de egresos futuros
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');
    const { months = 12 } = req.query;

    const activeExpenses = await Expense.getActiveExpenses(userId);
    
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthForecast = {
        date: forecastDate,
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1,
        expectedExpenses: 0,
        expenses: []
      };

      activeExpenses.forEach(expense => {
        if (expense.isActive && (!expense.endDate || expense.endDate > forecastDate)) {
          monthForecast.expectedExpenses += expense.averageMonthlyAmount;
          monthForecast.expenses.push({
            name: expense.name,
            amount: expense.averageMonthlyAmount,
            currency: expense.currency,
            type: expense.type,
            category: expense.category
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
      message: 'Error al generar proyección de egresos'
    });
  }
});

// GET /api/expenses/budget-analysis - Análisis de presupuestos
router.get('/budget-analysis', async (req, res) => {
  try {
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');

    const budgetAnalysis = await Expense.aggregate([
      { $match: { userId, budgetLimit: { $exists: true, $gt: 0 } } },
      { $group: {
        _id: '$category',
        totalBudget: { $sum: '$budgetLimit' },
        totalSpent: { $sum: '$actualSpending' },
        remaining: { $sum: { $subtract: ['$budgetLimit', '$actualSpending'] } },
        utilization: { $avg: { $multiply: [{ $divide: ['$actualSpending', '$budgetLimit'] }, 100] } },
        count: { $sum: 1 }
      }},
      { $sort: { utilization: -1 } }
    ]);

    res.json({
      success: true,
      data: budgetAnalysis
    });
  } catch (error) {
    console.error('Error fetching budget analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de presupuestos'
    });
  }
});

// DELETE /api/expenses/:id - Eliminar un egreso
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || new ObjectId('507f1f77bcf86cd799439011');

    const expense = await Expense.findOne({ _id: new ObjectId(id), userId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }

    await Expense.findByIdAndDelete(new ObjectId(id));

    res.json({
      success: true,
      message: 'Egreso eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el egreso'
    });
  }
});

export default router;
