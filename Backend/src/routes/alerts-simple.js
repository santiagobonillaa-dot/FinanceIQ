import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/alerts - Obtener alertas del usuario
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Por ahora, retornamos datos de ejemplo
    const mockAlerts = [
      {
        _id: '1',
        userId,
        title: 'Presupuesto de Supermercado Casi Completo',
        message: 'Tu presupuesto de supermercado está al 95% del límite',
        type: 'budget-warning',
        category: 'financial',
        priority: 'medium',
        status: 'active',
        timing: {
          createdAt: new Date(),
          readAt: null,
          acknowledgedAt: null,
          resolvedAt: null,
          dismissedAt: null
        },
        details: {
          categoryName: 'food',
          budgetLimit: 1000000,
          actualSpending: 950000,
          utilization: 95
        },
        source: {
          type: 'rule-engine',
          moduleId: 'budget-monitor',
          entityId: 'expense-1',
          entityType: 'expense'
        },
        actions: [{
          type: 'view-details',
          label: 'Verificar Gasto',
          url: '/expenses/1',
          isPrimary: true
        }]
      },
      {
        _id: '2',
        userId,
        title: 'Flujo de Caja Negativo',
        message: 'Tu flujo de caja es de -$1,900,000 negativo',
        type: 'cash-flow-low',
        category: 'financial',
        priority: 'high',
        status: 'active',
        timing: {
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          readAt: null,
          acknowledgedAt: null,
          resolvedAt: null,
          dismissedAt: null
        },
        details: {
          income: 5500000,
          expenses: 2600000,
          debts: 4800000,
          netCashFlow: -1900000
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
      },
      {
        _id: '3',
        userId,
        title: 'Meta de Ahorro Próxima',
        message: 'Tu meta "Fondo de Emergencia" vence en 5 días',
        type: 'savings-goal',
        category: 'financial',
        priority: 'medium',
        status: 'active',
        timing: {
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          readAt: null,
          acknowledgedAt: null,
          resolvedAt: null,
          dismissedAt: null
        },
        details: {
          goalId: 'savings-1',
          goalName: 'Fondo de Emergencia',
          targetAmount: 10000000,
          currentAmount: 2500000,
          daysRemaining: 5,
          progress: 25
        },
        source: {
          type: 'scheduler',
          moduleId: 'savings-monitor',
          entityId: 'savings-1',
          entityType: 'savings-goal'
        },
        actions: [{
          type: 'contribute',
          label: 'Contribuir',
          url: '/savings/1/contribute',
          isPrimary: true
        }]
      }
    ];

    res.json({
      success: true,
      data: {
        alerts: mockAlerts,
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1
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

// GET /api/alerts/summary - Obtener resumen de alertas
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const mockSummary = {
      summary: [
        { _id: 'high', count: 1, latest: new Date() },
        { _id: 'medium', count: 2, latest: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        { _id: 'low', count: 0, latest: null }
      ],
      totalAlerts: 3,
      alertsByType: [
        { _id: 'budget-warning', count: 1 },
        { _id: 'cash-flow-low', count: 1 },
        { _id: 'savings-goal', count: 1 }
      ],
      recentAlerts: [
        {
          _id: '1',
          title: 'Presupuesto de Supermercado Casi Completo',
          type: 'budget-warning',
          priority: 'medium',
          createdAt: new Date()
        },
        {
          _id: '2',
          title: 'Flujo de Caja Negativo',
          type: 'cash-flow-low',
          priority: 'high',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          _id: '3',
          title: 'Meta de Ahorro Próxima',
          type: 'savings-goal',
          priority: 'medium',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      ]
    };

    res.json({
      success: true,
      data: mockSummary
    });
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de alertas'
    });
  }
});

// GET /api/alerts/active - Obtener alertas activas
router.get('/active', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const mockActiveAlerts = [
      {
        _id: '1',
        userId,
        title: 'Presupuesto de Supermercado Casi Completo',
        message: 'Tu presupuesto de supermercado está al 95% del límite',
        type: 'budget-warning',
        category: 'financial',
        priority: 'medium',
        status: 'active'
      },
      {
        _id: '2',
        userId,
        title: 'Flujo de Caja Negativo',
        message: 'Tu flujo de caja es de -$1,900,000 negativo',
        type: 'cash-flow-low',
        category: 'financial',
        priority: 'high',
        status: 'active'
      },
      {
        _id: '3',
        userId,
        title: 'Meta de Ahorro Próxima',
        message: 'Tu meta "Fondo de Emergencia" vence en 5 días',
        type: 'savings-goal',
        category: 'financial',
        priority: 'medium',
        status: 'active'
      }
    ];

    res.json({
      success: true,
      data: mockActiveAlerts
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
    
    const mockCriticalAlerts = [
      {
        _id: '2',
        userId,
        title: 'Flujo de Caja Negativo',
        message: 'Tu flujo de caja es de -$1,900,000 negativo',
        type: 'cash-flow-low',
        category: 'financial',
        priority: 'high',
        status: 'active',
        details: {
          income: 5500000,
          expenses: 2600000,
          debts: 4800000,
          netCashFlow: -1900000
        }
      }
    ];

    res.json({
      success: true,
      data: mockCriticalAlerts
    });
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas críticas'
    });
  }
});

// POST /api/alerts - Crear una nueva alerta
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const alertData = req.body;

    const newAlert = {
      _id: Date.now().toString(),
      userId,
      title: alertData.title || 'Nueva Alerta',
      message: alertData.message || 'Mensaje de alerta',
      type: alertData.type || 'info',
      category: alertData.category || 'general',
      priority: alertData.priority || 'medium',
      status: 'active',
      timing: {
        createdAt: new Date(),
        readAt: null,
        acknowledgedAt: null,
        resolvedAt: null,
        dismissedAt: null
      },
      details: alertData.details || {},
      source: {
        type: 'manual',
        moduleId: 'user-input',
        entityId: alertData.entityId || 'manual',
        entityType: 'manual'
      }
    };

    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: newAlert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la alerta'
    });
  }
});

// POST /api/alerts/:id/mark-as-read - Marcar alerta como leída
router.post('/:id/mark-as-read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const updatedAlert = {
      _id: id,
      userId,
      title: 'Alerta de Prueba',
      message: 'Esta es una alerta de prueba',
      type: 'test',
      category: 'system',
      priority: 'medium',
      status: 'read',
      timing: {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        readAt: new Date(),
        acknowledgedAt: null,
        resolvedAt: null,
        dismissedAt: null
      }
    };

    res.json({
      success: true,
      message: 'Alerta marcada como leída',
      data: updatedAlert
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

    const updatedAlert = {
      _id: id,
      userId,
      title: 'Alerta de Prueba',
      message: 'Esta es una alerta de prueba',
      type: 'test',
      category: 'system',
      priority: 'medium',
      status: 'acknowledged',
      timing: {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        readAt: new Date(),
        acknowledgedAt: new Date(),
        resolvedAt: null,
        dismissedAt: null
      }
    };

    res.json({
      success: true,
      message: 'Alerta reconocida exitosamente',
      data: updatedAlert
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

    const updatedAlert = {
      _id: id,
      userId,
      title: 'Alerta de Prueba',
      message: 'Esta es una alerta de prueba',
      type: 'test',
      category: 'system',
      priority: 'medium',
      status: 'resolved',
      timing: {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        readAt: new Date(),
        acknowledgedAt: new Date(),
        resolvedAt: new Date(),
        dismissedAt: null
      },
      resolution: resolution || {
        action: 'test-completed',
        notes: 'Alerta de prueba resuelta exitosamente'
      }
    };

    res.json({
      success: true,
      message: 'Alerta resuelta exitosamente',
      data: updatedAlert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resolver alerta'
    });
  }
});

// GET /api/alerts/search - Buscar alertas
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

    const mockSearchResults = [
      {
        _id: '1',
        userId,
        title: 'Presupuesto de Supermercado Casi Completo',
        message: 'Tu presupuesto de supermercado está al 95% del límite',
        type: 'budget-warning',
        category: 'financial',
        priority: 'medium',
        status: 'active'
      }
    ].filter(alert => 
      alert.title.toLowerCase().includes(query.toLowerCase()) ||
      alert.message.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      success: true,
      data: mockSearchResults
    });
  } catch (error) {
    console.error('Error searching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar alertas'
    });
  }
});

// GET /api/alerts/statistics - Estadísticas de alertas
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    const mockStatistics = {
      period,
      totalAlerts: 3,
      trends: {
        byPriority: [
          { _id: 'high', count: 1 },
          { _id: 'medium', count: 2 },
          { _id: 'low', count: 0 }
        ],
        byType: [
          { _id: 'budget-warning', count: 1 },
          { _id: 'cash-flow-low', count: 1 },
          { _id: 'savings-goal', count: 1 }
        ],
        byStatus: [
          { _id: 'active', count: 3 },
          { _id: 'read', count: 0 },
          { _id: 'acknowledged', count: 0 },
          { _id: 'resolved', count: 0 }
        ],
        total: [
          { _id: null, count: 3 }
        ]
      }
    };

    res.json({
      success: true,
      data: mockStatistics
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de alertas'
    });
  }
});

export default router;
