import express from 'express';
import Investment from '../models/Investment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/investments - Obtener todas las inversiones del usuario
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      exchange,
      isActive,
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters = { userId };
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (exchange) filters.exchange = exchange;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const investments = await Investment.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Investment.countDocuments(filters);

    res.json({
      success: true,
      data: {
        investments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las inversiones'
    });
  }
});

// GET /api/investments/active - Obtener inversiones activas
router.get('/active', async (req, res) => {
  try {
    const userId = req.user._id;
    const activeInvestments = await Investment.getActiveInvestments(userId);

    res.json({
      success: true,
      data: activeInvestments
    });
  } catch (error) {
    console.error('Error fetching active investments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las inversiones activas'
    });
  }
});

// GET /api/investments/summary - Obtener resumen del portafolio
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolioSummary = await Investment.getPortfolioSummary(userId);

    res.json({
      success: true,
      data: portfolioSummary[0] || {
        totalValue: 0,
        totalInvested: 0,
        totalGainLoss: 0,
        totalReturnPercent: 0,
        investmentsCount: 0,
        dividendIncome: 0
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen del portafolio'
    });
  }
});

// GET /api/investments/performance-by-type - Rendimiento por tipo
router.get('/performance-by-type', async (req, res) => {
  try {
    const userId = req.user._id;
    const performanceByType = await Investment.getPerformanceByType(userId);

    res.json({
      success: true,
      data: performanceByType
    });
  } catch (error) {
    console.error('Error fetching performance by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rendimiento por tipo'
    });
  }
});

// GET /api/investments/top-performers - Mejores inversiones
router.get('/top-performers', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const topPerformers = await Investment.getTopPerformers(userId, parseInt(limit));

    res.json({
      success: true,
      data: topPerformers
    });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mejores inversiones'
    });
  }
});

// GET /api/investments/worst-performers - Peores inversiones
router.get('/worst-performers', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const worstPerformers = await Investment.getWorstPerformers(userId, parseInt(limit));

    res.json({
      success: true,
      data: worstPerformers
    });
  } catch (error) {
    console.error('Error fetching worst performers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener peores inversiones'
    });
  }
});

// GET /api/investments/allocation - Asignación del portafolio
router.get('/allocation', async (req, res) => {
  try {
    const userId = req.user._id;

    const allocation = await Investment.aggregate([
      { $match: { userId, isActive: true } },
      { $group: {
        _id: '$category',
        totalValue: { $sum: '$performance.currentValue' },
        totalInvested: { $sum: '$performance.totalInvested' },
        count: { $sum: 1 },
        avgReturn: { $avg: '$performance.totalReturnPercent' }
      }},
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      success: true,
      data: allocation
    });
  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asignación del portafolio'
    });
  }
});

// GET /api/investments/:id - Obtener una inversión específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    res.json({
      success: true,
      data: investment
    });
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la inversión'
    });
  }
});

// POST /api/investments - Crear una nueva inversión
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const investmentData = {
      ...req.body,
      userId
    };

    // Validaciones básicas
    const requiredFields = ['name', 'type', 'category', 'symbol'];
    for (const field of requiredFields) {
      if (!investmentData[field]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${field} es requerido`
        });
      }
    }

    // Establecer valores por defecto
    if (!investmentData.currency) {
      investmentData.currency = 'USD';
    }
    if (!investmentData.exchange) {
      investmentData.exchange = 'OTHER';
    }
    if (!investmentData.holdings) {
      investmentData.holdings = [];
    }
    if (!investmentData.currentData) {
      investmentData.currentData = {
        price: 0,
        currency: investmentData.currency,
        lastUpdated: new Date()
      };
    }
    if (!investmentData.performance) {
      investmentData.performance = {
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        unrealizedGainLoss: 0,
        realizedGainLoss: 0
      };
    }
    if (!investmentData.risk) {
      investmentData.risk = {
        level: 'medium',
        beta: 1,
        alpha: 0,
        standardDeviation: 0
      };
    }
    if (!investmentData.allocation) {
      investmentData.allocation = {
        targetPercentage: 0,
        currentPercentage: 0,
        rebalanceThreshold: 5
      };
    }
    if (!investmentData.isActive) {
      investmentData.isActive = true;
    }

    const investment = new Investment(investmentData);
    await investment.save();

    res.status(201).json({
      success: true,
      message: 'Inversión creada exitosamente',
      data: investment
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la inversión'
    });
  }
});

// PUT /api/investments/:id - Actualizar una inversión
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    // Actualizar campos
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        investment[key] = updateData[key];
      }
    });

    // Actualizar rendimiento si cambió el precio
    if (updateData.currentData && updateData.currentData.price) {
      investment.updatePerformance();
    }

    await investment.save();

    res.json({
      success: true,
      message: 'Inversión actualizada exitosamente',
      data: investment
    });
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la inversión'
    });
  }
});

// PATCH /api/investments/:id/status - Cambiar estado activo/inactivo
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive debe ser un valor booleano'
      });
    }

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    investment.isActive = isActive;
    await investment.save();

    res.json({
      success: true,
      message: `Inversión ${isActive ? 'activada' : 'desactivada'} exitosamente`,
      data: investment
    });
  } catch (error) {
    console.error('Error updating investment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la inversión'
    });
  }
});

// POST /api/investments/:id/add-holding - Agregar una tenencia
router.post('/:id/add-holding', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const holdingData = req.body;

    if (!holdingData.quantity || holdingData.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    if (!holdingData.price || holdingData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (!holdingData.transactionType) {
      holdingData.transactionType = 'buy';
    }

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    await investment.addHolding(holdingData);

    res.json({
      success: true,
      message: 'Tenencia agregada exitosamente',
      data: investment
    });
  } catch (error) {
    console.error('Error adding holding:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al agregar la tenencia',
      error: error.message
    });
  }
});

// POST /api/investments/:id/update-price - Actualizar precio de mercado
router.post('/:id/update-price', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { price, currency = 'USD', source = 'manual' } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    await investment.updateCurrentPrice(price, currency, source);

    res.json({
      success: true,
      message: 'Precio actualizado exitosamente',
      data: investment
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el precio'
    });
  }
});

// POST /api/investments/:id/rebalance-check - Verificar si necesita rebalanceo
router.post('/:id/rebalance-check', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    const needsRebalance = investment.calculateRebalanceNeed();

    res.json({
      success: true,
      data: {
        needsRebalance,
        targetPercentage: investment.allocation.targetPercentage,
        currentPercentage: investment.allocation.currentPercentage,
        threshold: investment.allocation.rebalanceThreshold
      }
    });
  } catch (error) {
    console.error('Error checking rebalance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar rebalanceo'
    });
  }
});

// GET /api/investments/search - Buscar inversiones
router.get('/search', async (req, res) => {
  try {
    const userId = req.user._id;
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query de búsqueda requerido'
      });
    }

    const searchResults = await Investment.searchInvestments(userId, query);

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Error searching investments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar inversiones'
    });
  }
});

// GET /api/investments/dividends - Obtener ingresos por dividendos
router.get('/dividends', async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Construir filtros de fecha
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dividends = await Investment.aggregate([
      { $match: { userId, isActive: true } },
      { $unwind: '$dividends' },
      { $match: { 'dividends.exDate': dateFilter } },
      { $group: {
        _id: null,
        totalDividends: { $sum: '$dividends.totalAmount' },
        count: { $sum: 1 },
        dividends: { $push: '$dividends' }
      }},
      { $sort: { 'dividends.exDate': -1 } }
    ]);

    res.json({
      success: true,
      data: dividends[0] || { totalDividends: 0, count: 0, dividends: [] }
    });
  } catch (error) {
    console.error('Error fetching dividends:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dividendos'
    });
  }
});

// GET /api/investments/performance-summary - Resumen de rendimiento
router.get('/performance-summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '1M' } = req.query;

    const performanceSummary = await Investment.aggregate([
      { $match: { userId, isActive: true } },
      { $group: {
        _id: null,
        totalValue: { $sum: '$performance.currentValue' },
        totalInvested: { $sum: '$performance.totalInvested' },
        totalGainLoss: { $sum: '$performance.unrealizedGainLoss' },
        avgReturn: { $avg: '$performance.totalReturnPercent' },
        totalDividends: { $sum: '$dividendIncome' },
        count: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            value: '$performance.currentValue',
            return: '$performance.totalReturnPercent'
          }
        }
      }},
      { $project: {
        _id: 0,
        totalValue: 1,
        totalInvested: 1,
        totalGainLoss: 1,
        avgReturn: 1,
        totalDividends: 1,
        count: 1,
        byType: 1
      }}
    ]);

    res.json({
      success: true,
      data: performanceSummary[0] || {
        totalValue: 0,
        totalInvested: 0,
        totalGainLoss: 0,
        avgReturn: 0,
        totalDividends: 0,
        count: 0,
        byType: []
      }
    });
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de rendimiento'
    });
  }
});

// DELETE /api/investments/:id - Eliminar una inversión
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const investment = await Investment.findOne({ _id: id, userId });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Inversión no encontrada'
      });
    }

    await Investment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Inversión eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la inversión'
    });
  }
});

export default router;
