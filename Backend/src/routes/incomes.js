import express from 'express';
import Income from '../models/Income.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Endpoint de prueba sin autenticación
router.get('/test', async (req, res) => {
  try {
    const incomes = await Income.find({}).limit(10);
    res.json({
      success: true,
      data: incomes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Middleware de autenticación para todas las rutas excepto /test
router.use(authenticateToken);

// GET /api/incomes - Obtener todos los ingresos del usuario
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      frequency, 
      isActive, 
      currency,
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const userId = req.user.id;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { userId };
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (frequency) filters.frequency = frequency;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (currency) filters.currency = currency;

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const incomes = await Income.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Income.countDocuments(filters);

    res.json({
      success: true,
      data: {
        incomes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los ingresos'
    });
  }
});

// GET /api/incomes/active - Obtener ingresos activos
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.id;
    const activeIncomes = await Income.getActiveIncomes(userId);

    res.json({
      success: true,
      data: activeIncomes
    });
  } catch (error) {
    console.error('Error fetching active incomes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los ingresos activos'
    });
  }
});

// GET /api/incomes/summary - Obtener resumen de ingresos
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const monthlyIncome = await Income.getMonthlyIncome(userId);

    res.json({
      success: true,
      data: monthlyIncome[0] || {
        totalMonthly: 0,
        totalAnnual: 0,
        incomesCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching income summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de ingresos'
    });
  }
});

// GET /api/incomes/:id - Obtener un ingreso específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const income = await Income.findOne({ _id: id, userId });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    res.json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el ingreso'
    });
  }
});

// POST /api/incomes - Crear un nuevo ingreso
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const incomeData = {
      ...req.body,
      userId
    };

    // Validaciones básicas
    const requiredFields = ['name', 'amount', 'type', 'frequency', 'category'];
    for (const field of requiredFields) {
      if (!incomeData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Validar montos
    if (incomeData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Establecer fecha de inicio si no se proporciona
    if (!incomeData.startDate) {
      incomeData.startDate = new Date();
    }

    // Calcular próxima fecha de pago
    const income = new Income(incomeData);
    income.nextPaymentDate = income.calculateNextPayment();

    await income.save();

    res.status(201).json({
      success: true,
      message: 'Ingreso creado exitosamente',
      data: income
    });
  } catch (error) {
    console.error('Error creating income:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al crear el ingreso',
      error: error.message
    });
  }
});

// PUT /api/incomes/:id - Actualizar un ingreso
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const income = await Income.findOne({ _id: id, userId });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
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
        income[key] = updateData[key];
      }
    });

    // Recalcular próxima fecha de pago si cambió la frecuencia
    if (updateData.frequency || updateData.startDate) {
      income.nextPaymentDate = income.calculateNextPayment();
    }

    await income.save();

    res.json({
      success: true,
      message: 'Ingreso actualizado exitosamente',
      data: income
    });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el ingreso'
    });
  }
});

// PATCH /api/incomes/:id/status - Cambiar estado activo/inactivo
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive debe ser un valor booleano'
      });
    }

    const income = await Income.findOne({ _id: id, userId });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    income.isActive = isActive;
    await income.save();

    res.json({
      success: true,
      message: `Ingreso ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: income
    });
  } catch (error) {
    console.error('Error updating income status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del ingreso'
    });
  }
});

// POST /api/incomes/:id/calculate-next-payment - Calcular próxima fecha de pago
router.post('/:id/calculate-next-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const income = await Income.findOne({ _id: id, userId });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    const nextPaymentDate = income.calculateNextPayment();

    res.json({
      success: true,
      data: {
        nextPaymentDate,
        isOverdue: income.isOverdue
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

// GET /api/incomes/analytics/by-type - Análisis de ingresos por tipo
router.get('/analytics/by-type', async (req, res) => {
  try {
    const userId = req.user.id;

    const analysis = await Income.aggregate([
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

// GET /api/incomes/analytics/by-category - Análisis de ingresos por categoría
router.get('/analytics/by-category', async (req, res) => {
  try {
    const userId = req.user.id;

    const analysis = await Income.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$category',
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
    console.error('Error fetching analytics by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis por categoría'
    });
  }
});

// GET /api/incomes/analytics/monthly-trend - Tendencia mensual de ingresos
router.get('/analytics/monthly-trend', async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 12 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const trend = await Income.aggregate([
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

// GET /api/incomes/forecast - Proyección de ingresos futuros
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 12 } = req.query;

    const activeIncomes = await Income.getActiveIncomes(userId);
    
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthForecast = {
        date: forecastDate,
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1,
        expectedIncome: 0,
        incomes: []
      };

      activeIncomes.forEach(income => {
        if (income.isActive && (!income.endDate || income.endDate > forecastDate)) {
          monthForecast.expectedIncome += income.averageMonthlyAmount;
          monthForecast.incomes.push({
            name: income.name,
            amount: income.averageMonthlyAmount,
            currency: income.currency,
            type: income.type
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
      message: 'Error al generar proyección de ingresos'
    });
  }
});

// DELETE /api/incomes/:id - Eliminar un ingreso
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const income = await Income.findOne({ _id: id, userId });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    await Income.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Ingreso eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el ingreso'
    });
  }
});

export default router;
