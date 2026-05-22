import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/savings - Obtener todas las metas de ahorro
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Por ahora, retornamos datos de ejemplo
    const mockGoals = [
      {
        _id: '1',
        userId,
        name: 'Fondo de Emergencia',
        targetAmount: 10000000,
        currentAmount: 2500000,
        currency: 'COP',
        type: 'emergency-fund',
        priority: 'critical',
        status: 'active',
        progress: {
          percentage: 25,
          onTrack: true
        },
        timeline: {
          targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      {
        _id: '2',
        userId,
        name: 'Vacaciones',
        targetAmount: 5000000,
        currentAmount: 1000000,
        currency: 'COP',
        type: 'vacation',
        priority: 'medium',
        status: 'active',
        progress: {
          percentage: 20,
          onTrack: false
        },
        timeline: {
          targetDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000)
        }
      }
    ];

    res.json({
      success: true,
      data: {
        savingsGoals: mockGoals,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
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

// GET /api/savings/summary - Obtener resumen de ahorro
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Datos de ejemplo
    const mockSummary = {
      summary: {
        totalGoals: 2,
        totalTargetAmount: 15000000,
        totalCurrentAmount: 3500000,
        totalRemaining: 11500000,
        totalMonthlyTarget: 1900000,
        averageProgress: 22.5,
        completionRate: 0
      },
      byStatus: {
        active: 2,
        completed: 0,
        paused: 0,
        cancelled: 0
      },
      byType: {
        'emergency-fund': {
          count: 1,
          totalTarget: 10000000,
          totalCurrent: 2500000,
          averageProgress: 25
        },
        'vacation': {
          count: 1,
          totalTarget: 5000000,
          totalCurrent: 1000000,
          averageProgress: 20
        }
      },
      upcomingDeadlines: []
    };

    res.json({
      success: true,
      data: mockSummary
    });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de ahorro'
    });
  }
});

// GET /api/savings/forecast - Proyección de ahorro
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;
    
    // Datos de ejemplo
    const mockForecast = [];
    const today = new Date();

    for (let i = 0; i < parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      mockForecast.push({
        date: forecastDate,
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1,
        totalContributions: 1900000,
        totalWithdrawals: 0,
        netSavings: 1900000,
        goals: [
          {
            name: 'Fondo de Emergencia',
            contribution: 1500000,
            currentAmount: 2500000 + (i * 1500000),
            targetAmount: 10000000,
            progress: Math.min(100, ((2500000 + (i * 1500000)) / 10000000) * 100),
            type: 'emergency-fund'
          },
          {
            name: 'Vacaciones',
            contribution: 400000,
            currentAmount: 1000000 + (i * 400000),
            targetAmount: 5000000,
            progress: Math.min(100, ((1000000 + (i * 400000)) / 5000000) * 100),
            type: 'vacation'
          }
        ]
      });
    }

    res.json({
      success: true,
      data: mockForecast
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar proyección de ahorro'
    });
  }
});

// GET /api/savings/recommendations - Recomendaciones de ahorro
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Datos de ejemplo
    const mockRecommendations = {
      recommendations: [
        {
          type: 'increase-savings',
          priority: 'high',
          title: 'Aumentar tasa de ahorro',
          description: 'Tu tasa de ahorro actual es 13%. Se recomienda aumentarla al menos al 20% para una salud financiera óptima.',
          action: 'Considera reducir gastos no esenciales o aumentar ingresos para mejorar tu tasa de ahorro.',
          potentialImpact: 'Mejora significativa de salud financiera a largo plazo'
        },
        {
          type: 'optimize-savings',
          priority: 'medium',
          title: 'Optimizar asignación de ahorro',
          description: 'Con un flujo neto de $700000, podrías destinar $210000 mensuales a ahorro.',
          action: 'Distribuye este monto entre tus metas existentes o crea nuevas metas.',
          potentialImpact: 'Aceleración significativa en el logro de metas financieras'
        }
      ],
      summary: {
        netMonthlyCashFlow: 700000,
        currentSavingsRate: 13,
        totalGoals: 2,
        activeGoals: 2,
        goalsBehindSchedule: 1
      }
    };

    res.json({
      success: true,
      data: mockRecommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar recomendaciones'
    });
  }
});

export default router;
