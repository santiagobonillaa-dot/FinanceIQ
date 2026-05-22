import express from 'express';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Debt from '../models/Debt.js';
import Investment from '../models/Investment.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Alert from '../models/Alert.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/dashboard/overview - Obtener visión general del dashboard
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener datos de todos los módulos
    const [
      incomeSummary,
      expenseSummary,
      debtSummary,
      investmentSummary,
      savingsSummary
    ] = await Promise.all([
      Income.getMonthlyIncome(userId),
      Expense.getMonthlyExpenses(userId),
      Debt.getMonthlyDebtPayments(userId),
      Investment.getPortfolioSummary(userId),
      SavingsGoal.getMonthlySavingsTarget(userId)
    ]);

    const incomeData = incomeSummary[0] || { totalMonthly: 0, totalAnnual: 0, incomesCount: 0 };
    const expenseData = expenseSummary[0] || { totalMonthly: 0, totalAnnual: 0, expensesCount: 0, fixedExpenses: 0, variableExpenses: 0 };
    const debtData = debtSummary[0] || { totalMonthlyPayments: 0, totalInsurance: 0, totalImpact: 0, debtsCount: 0, totalBalance: 0 };
    const investmentData = investmentSummary[0] || { totalValue: 0, totalInvested: 0, totalGainLoss: 0, totalReturnPercent: 0, investmentsCount: 0 };
    const savingsData = savingsSummary[0] || { totalMonthlyTarget: 0, count: 0 };

    // Calcular métricas clave
    const netMonthlyCashFlow = incomeData.totalMonthly - expenseData.totalMonthly - debtData.totalImpact;
    const netAnnualCashFlow = incomeData.totalAnnual - expenseData.totalAnnual - (debtData.totalImpact * 12);
    const totalMonthlyExpenses = expenseData.totalMonthly + debtData.totalImpact;
    const savingsRate = incomeData.totalMonthly > 0 ? ((incomeData.totalMonthly - totalMonthlyExpenses) / incomeData.totalMonthly) * 100 : 0;
    const debtToIncomeRatio = incomeData.totalMonthly > 0 ? (debtData.totalImpact / incomeData.totalMonthly) * 100 : 0;
    const investmentToIncomeRatio = incomeData.totalMonthly > 0 ? (investmentData.totalValue / incomeData.totalMonthly) : 0;

    // Calcular patrimonio neto
    const liquidAssets = incomeData.totalAnnual / 12 + investmentData.totalValue;
    const totalLiabilities = debtData.totalBalance;
    const netWorth = liquidAssets - totalLiabilities;

    // Calcular salud financiera
    const financialHealthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      investmentToIncomeRatio,
      netMonthlyCashFlow
    });

    res.json({
      success: true,
      data: {
        summary: {
          netWorth,
          netMonthlyCashFlow,
          netAnnualCashFlow,
          savingsRate,
          financialHealthScore,
          debtToIncomeRatio,
          investmentToIncomeRatio
        },
        income: {
          totalMonthly: incomeData.totalMonthly,
          totalAnnual: incomeData.totalAnnual,
          count: incomeData.incomesCount,
          averagePerIncome: incomeData.incomesCount > 0 ? incomeData.totalMonthly / incomeData.incomesCount : 0
        },
        expenses: {
          totalMonthly: expenseData.totalMonthly,
          totalAnnual: expenseData.totalAnnual,
          count: expenseData.expensesCount,
          fixedExpenses: expenseData.fixedExpenses,
          variableExpenses: expenseData.variableExpenses,
          averagePerExpense: expenseData.expensesCount > 0 ? expenseData.totalMonthly / expenseData.expensesCount : 0
        },
        debts: {
          totalMonthlyPayments: debtData.totalMonthlyPayments,
          totalBalance: debtData.totalBalance,
          count: debtData.debtsCount,
          averageInterestRate: debtData.totalInterestRate,
          totalInsurance: debtData.totalInsurance
        },
        investments: {
          totalValue: investmentData.totalValue,
          totalInvested: investmentData.totalInvested,
          totalGainLoss: investmentData.totalGainLoss,
          totalReturnPercent: investmentData.totalReturnPercent,
          count: investmentData.investmentsCount,
          dividendIncome: investmentData.dividendIncome
        },
        savings: {
          totalMonthlyTarget: savingsData.totalMonthlyTarget,
          count: savingsData.count
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la visión general del dashboard'
    });
  }
});

// GET /api/dashboard/cash-flow - Análisis de flujo de caja
router.get('/cash-flow', async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;

    // Obtener datos históricos y proyecciones
    const [
      incomeForecast,
      expenseForecast,
      debtPayments
    ] = await Promise.all([
      getIncomeForecast(userId, months),
      getExpenseForecast(userId, months),
      getDebtPaymentsForecast(userId, months)
    ]);

    // Construir análisis de flujo de caja
    const cashFlowAnalysis = [];
    const today = new Date();

    for (let i = 0; i < parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthData = {
        date: forecastDate,
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1,
        income: 0,
        expenses: 0,
        debtPayments: 0,
        netCashFlow: 0,
        cumulativeCashFlow: 0
      };

      // Sumar ingresos proyectados
      if (incomeForecast && incomeForecast[i]) {
        monthData.income = incomeForecast[i].expectedIncome;
      }

      // Sumar egresos proyectados
      if (expenseForecast && expenseForecast[i]) {
        monthData.expenses = expenseForecast[i].expectedExpenses;
      }

      // Sumar pagos de deuda proyectados
      if (debtPayments && debtPayments[i]) {
        monthData.debtPayments = debtPayments[i].totalPayments;
      }

      // Calcular flujo neto
      monthData.netCashFlow = monthData.income - monthData.expenses - monthData.debtPayments;
      
      // Calcular flujo acumulado
      if (i === 0) {
        monthData.cumulativeCashFlow = monthData.netCashFlow;
      } else {
        monthData.cumulativeCashFlow = cashFlowAnalysis[i - 1].cumulativeCashFlow + monthData.netCashFlow;
      }

      cashFlowAnalysis.push(monthData);
    }

    res.json({
      success: true,
      data: cashFlowAnalysis
    });
  } catch (error) {
    console.error('Error fetching cash flow analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de flujo de caja'
    });
  }
});

// GET /api/dashboard/net-worth - Evolución del patrimonio neto
router.get('/net-worth', async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 12 } = req.query;

    // Obtener datos históricos y proyecciones
    const netWorthData = await getNetWorthProjection(userId, months);

    res.json({
      success: true,
      data: netWorthData
    });
  } catch (error) {
    console.error('Error fetching net worth:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evolución del patrimonio neto'
    });
  }
});

// GET /api/dashboard/budget-performance - Rendimiento del presupuesto
router.get('/budget-performance', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener análisis de presupuestos
    const [budgetAnalysis, categoryAnalysis] = await Promise.all([
      getBudgetAnalysis(userId),
      Expense.getExpensesByCategory(userId, 'monthly')
    ]);

    // Calcular métricas de presupuesto
    const totalBudget = budgetAnalysis.reduce((sum, item) => sum + item.totalBudget, 0);
    const totalSpent = budgetAnalysis.reduce((sum, item) => sum + item.totalSpent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Categorías con mejor/peor rendimiento
    const categoryPerformance = categoryAnalysis.map(category => ({
      category: category._id,
      totalAmount: category.totalAmount,
      averageMonthly: category.averageMonthly,
      budgetUtilization: category.totalBudget > 0 ? (category.totalAmount / category.totalBudget) * 100 : 0,
      variance: category.totalBudget > 0 ? ((category.totalAmount - category.totalBudget) / category.totalBudget) * 100 : 0
    })).sort((a, b) => b.variance - a.variance);

    res.json({
      success: true,
      data: {
        summary: {
          totalBudget,
          totalSpent,
          totalRemaining,
          budgetUtilization,
          categoriesCount: budgetAnalysis.length
        },
        categories: categoryPerformance,
        alerts: budgetAnalysis.filter(item => item.utilization > 90)
      }
    });
  } catch (error) {
    console.error('Error fetching budget performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rendimiento del presupuesto'
    });
  }
});

// GET /api/dashboard/investment-allocation - Asignación del portafolio
router.get('/investment-allocation', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener asignación actual y análisis
    const [currentAllocation, performanceByType, riskAnalysis] = await Promise.all([
      getInvestmentAllocation(userId),
      Investment.getPerformanceByType(userId),
      getInvestmentRiskAnalysis(userId)
    ]);

    // Calcular diversificación
    const totalValue = currentAllocation.reduce((sum, item) => sum + item.totalValue, 0);
    const diversificationScore = calculateDiversificationScore(currentAllocation);

    res.json({
      success: true,
      data: {
        currentAllocation,
        performanceByType,
        riskAnalysis,
        totalValue,
        diversificationScore,
        recommendations: getRebalancingRecommendations(currentAllocation)
      }
    });
  } catch (error) {
    console.error('Error fetching investment allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asignación del portafolio'
    });
  }
});

// GET /api/dashboard/debt-analysis - Análisis de deudas
router.get('/debt-analysis', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener análisis de deudas
    const [debtSummary, debtByType, debtByPriority, debtByCreditor] = await Promise.all([
      Debt.getDebtSummary(userId),
      Debt.getDebtAnalysis(userId),
      Debt.getDebtAnalysis(userId),
      Debt.getDebtAnalysis(userId)
    ]);

    // Calcular métricas de deuda
    const totalDebt = debtSummary.reduce((sum, item) => sum + item.totalBalance, 0);
    const totalMonthlyPayments = debtSummary.reduce((sum, item) => sum + item.totalMonthlyPayments, 0);
    const averageInterestRate = debtSummary.reduce((sum, item) => sum + item.avgInterestRate, 0) / (debtSummary.length || 1);

    // Calcular tiempo de pago promedio
    const averagePayoffTime = calculateAveragePayoffTime(debtByType);

    // Calcular score de salud de deuda
    const debtHealthScore = calculateDebtHealthScore({
      totalDebt,
      totalMonthlyPayments,
      averageInterestRate,
      debtCount: debtSummary.length
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalDebt,
          totalMonthlyPayments,
          averageInterestRate,
          debtCount: debtSummary.length,
          debtHealthScore,
          averagePayoffTime
        },
        byType: debtByType,
        byPriority: debtByPriority,
        byCreditor: debtByCreditor,
        recommendations: getDebtReductionStrategies(debtByType)
      }
    });
  } catch (error) {
    console.error('Error fetching debt analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de deudas'
    });
  }
});

// GET /api/dashboard/alerts - Alertas y notificaciones
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, type, priority } = req.query;

    // Obtener alertas activas
    const filters = { userId, status: 'active' };
    if (type) filters.type = type;
    if (priority) filters.priority = priority;

    const alerts = await Alert.find(filters)
      .sort({ 'timing.createdAt': -1 })
      .limit(parseInt(limit));

    // Obtener resumen de alertas
    const alertSummary = await Alert.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 },
        latest: { $max: '$timing.createdAt' }
      }},
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        summary: alertSummary,
        unreadCount: alerts.filter(alert => alert.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas'
    });
  }
});

router.get('/kpis', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener datos de cada módulo usando las funciones auxiliares
    const overviewData = await getDashboardOverview(userId);
    const cashFlowData = await getCashFlowAnalysis(userId, 6);
    const netWorthData = await getNetWorthProjection(userId, 12);
    const budgetData = await getBudgetPerformance(userId);
    const allocationData = await getInvestmentAllocation(userId);
    const debtData = await getDebtAnalysis(userId);
    const alertsData = await getAlertsSummary(userId);

    // Consolidar KPIs clave
    const kpis = {
      financial: {
        netWorth: netWorthData.data[netWorthData?.length - 1]?.netWorth || 0,
        netMonthlyCashFlow: overviewData.data.summary.netMonthlyCashFlow,
        savingsRate: overviewData.data.summary.savingsRate,
        financialHealthScore: overviewData.data.summary.financialHealthScore
      },
      income: {
        totalMonthly: overviewData.data.income.totalMonthly,
        totalAnnual: overviewData.data.income.totalAnnual,
        count: overviewData.data.income.count,
        averagePerIncome: overviewData.data.income.averagePerIncome
      },
      expenses: {
        totalMonthly: overviewData.data.expenses.totalMonthly,
        totalAnnual: overviewData.data.expenses.totalAnnual,
        count: overviewData.data.expenses.count,
        budgetUtilization: budgetData.data.summary.budgetUtilization,
        variableExpenseRatio: overviewData.data.expenses.variableExpenses / overviewData.data.expenses.totalMonthly * 100
      },
      debts: {
        totalBalance: debtData.data.summary.totalDebt,
        totalMonthlyPayments: debtData.data.summary.totalMonthlyPayments,
        count: debtData.data.summary.debtCount,
        debtToIncomeRatio: overviewData.data.summary.debtToIncomeRatio,
        debtHealthScore: debtData.data.summary.debtHealthScore
      },
      investments: {
        totalValue: overviewData.data.investments.totalValue,
        totalInvested: overviewData.data.investments.totalInvested,
        totalReturn: overviewData.data.investments.totalGainLoss,
        totalReturnPercent: overviewData.data.investments.totalReturnPercent,
        count: overviewData.data.investments.investmentsCount,
        diversificationScore: allocationData.data.diversificationScore
      },
      cashFlow: {
        trend: cashFlowData.data.slice(-6), // Últimos 6 meses
        averageMonthly: cashFlowData.data.reduce((sum, item) => sum + item.netCashFlow, 0) / cashFlowData.data.length,
        volatility: calculateCashFlowVolatility(cashFlowData.data)
      },
      alerts: {
        activeCount: alertsData.data.unreadCount,
        criticalCount: alertsData.data.summary.filter(a => a._id === 'critical').length,
        byPriority: alertsData.data.summary
      }
    };

    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs clave'
    });
  }
});

// Funciones auxiliares
async function getIncomeForecast(userId, months) {
  const activeIncomes = await Income.getActiveIncomes(userId);
  const forecast = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const forecastDate = new Date(today);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    const monthForecast = {
      date: forecastDate,
      expectedIncome: 0,
      incomes: []
    };

    activeIncomes.forEach(income => {
      if (income.isActive && (!income.endDate || income.endDate > forecastDate)) {
        monthForecast.expectedIncome += income.averageMonthlyAmount;
        monthForecast.incomes.push({
          name: income.name,
          amount: income.averageMonthlyAmount,
          type: income.type,
          category: income.category
        });
      }
    });

    forecast.push(monthForecast);
  }

  return forecast;
}

async function getExpenseForecast(userId, months) {
  const activeExpenses = await Expense.getActiveExpenses(userId);
  const forecast = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const forecastDate = new Date(today);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    const monthForecast = {
      date: forecastDate,
      expectedExpenses: 0,
      expenses: []
    };

    activeExpenses.forEach(expense => {
      if (expense.isActive && (!expense.endDate || expense.endDate > forecastDate)) {
        monthForecast.expectedExpenses += expense.averageMonthlyAmount;
        monthForecast.expenses.push({
          name: expense.name,
          amount: expense.averageMonthlyAmount,
          type: expense.type,
          category: expense.category,
          priority: expense.priority
        });
      }
    });

    forecast.push(monthForecast);
  }

  return forecast;
}

async function getDebtPaymentsForecast(userId, months) {
  const activeDebts = await Debt.getActiveDebts(userId);
  const forecast = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const forecastDate = new Date(today);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    const monthForecast = {
      date: forecastDate,
      totalPayments: 0,
      debts: []
    };

    activeDebts.forEach(debt => {
      if (debt.isActive && (!debt.timeline.endDate || debt.timeline.endDate > forecastDate)) {
        monthForecast.totalPayments += debt.paymentSchedule.paymentAmount;
        monthForecast.debts.push({
          name: debt.name,
          paymentAmount: debt.paymentSchedule.paymentAmount,
          principalAmount: debt.nextPaymentDetails.principalAmount,
          interestAmount: debt.nextPaymentDetails.interestAmount,
          currency: debt.currency,
          creditor: debt.creditor.name
        });
      }
    });

    forecast.push(monthForecast);
  }

  return forecast;
}

async function getNetWorthProjection(userId, months) {
  const [incomeForecast, expenseForecast, debtPaymentsForecast, investmentForecast] = await Promise.all([
    getIncomeForecast(userId, months),
    getExpenseForecast(userId, months),
    getDebtPaymentsForecast(userId, months),
    getInvestmentForecast(userId, months)
  ]);

  const netWorthData = [];
  let cumulativeNetWorth = 0;

  for (let i = 0; i < months; i++) {
    const income = incomeForecast[i]?.expectedIncome || 0;
    const expenses = expenseForecast[i]?.expectedExpenses || 0;
    const debtPayments = debtPaymentsForecast[i]?.totalPayments || 0;
    const investments = investmentForecast[i]?.currentValue || 0;

    const monthlyNetWorth = income - expenses - debtPayments + investments;
    cumulativeNetWorth += monthlyNetWorth;

    netWorthData.push({
      date: incomeForecast[i]?.date,
      netWorth: cumulativeNetWorth,
      monthlyNetWorth,
      components: {
        income,
        expenses,
        debtPayments,
        investments
      }
    });
  }

  return netWorthData;
}

async function getBudgetAnalysis(userId) {
  return Expense.aggregate([
    { $match: { userId, budgetLimit: { $exists: true, $gt: 0 } } },
    { $group: {
      _id: '$category',
      totalBudget: { $sum: '$budgetLimit' },
      totalSpent: { $sum: '$actualSpending' },
      count: { $sum: 1 },
      averageSpent: { $avg: '$actualSpending' }
    }}
  ]);
}

async function getInvestmentAllocation(userId) {
  return Investment.aggregate([
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
}

async function getInvestmentRiskAnalysis(userId) {
  return Investment.aggregate([
    { $match: { userId, isActive: true } },
    { $group: {
      _id: '$risk.level',
      totalValue: { $sum: '$performance.currentValue' },
      totalInvested: { $sum: '$performance.totalInvested' },
      count: { $sum: 1 },
      avgBeta: { $avg: '$risk.beta' },
      avgReturn: { $avg: '$performance.totalReturnPercent' }
    }},
    { $sort: { totalValue: -1 } }
  ]);
}

function calculateFinancialHealthScore({ savingsRate, debtToIncomeRatio, investmentToIncomeRatio, netMonthlyCashFlow }) {
  let score = 0;
  
  // Puntuación por tasa de ahorro (40%)
  if (savingsRate >= 20) score += 40;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate >= 0) score += 10;
  
  // Puntuación por ratio deuda-ingreso (30%)
  if (debtToIncome <= 20) score += 30;
  else if (debtToIncome <= 40) score += 20;
  else if (debtToIncome <= 60) score += 10;
  
  // Puntuación por ratio inversión-ingreso (20%)
  if (investmentToIncomeRatio >= 10) score += 20;
  else if (investmentToIncomeRatio >= 5) score += 15;
  else if (investmentToIncomeRatio >= 2) score += 10;
  
  // Puntuación por flujo de caja positivo (10%)
  if (netMonthlyCashFlow > 0) score += 10;
  
  return Math.min(100, score);
}

function calculateDiversificationScore(allocation) {
  const totalValue = allocation.reduce((sum, item) => sum + item.totalValue, 0);
  const categoryCount = allocation.length;
  
  if (categoryCount === 1) return 0;
  
  // Calcular índice de Herfindahl-Hirschman
  const proportions = allocation.map(item => item.totalValue / totalValue);
  const herfindahlIndex = proportions.reduce((sum, proportion) => sum + Math.pow(proportion, 2), 0);
  const maxIndex = Math.pow(1 / categoryCount, 2);
  
  return (herfindahlIndex / maxIndex) * 100;
}

function calculateCashFlowVolatility(cashFlowData) {
  if (cashFlowData.length < 2) return 0;
  
  const mean = cashFlowData.reduce((sum, item) => sum + item.netCashFlow, 0) / cashFlowData.length;
  const variance = cashFlowData.reduce((sum, item) => sum + Math.pow(item.netCashFlow - mean, 2), 0) / (cashFlowData.length - 1);
  
  return Math.sqrt(variance) / mean;
}

function calculateAveragePayoffTime(debtByType) {
  const totalMonths = debtByType.reduce((sum, type) => {
    const avgTerm = type.avgTerm || 240; // 20 años por defecto
    return sum + avgTerm;
  }, 0);
  
  return totalMonths / (debtByType.length || 1);
}

function calculateDebtHealthScore({ totalDebt, totalMonthlyPayments, averageInterestRate, debtCount }) {
  let score = 50; // Base score
  
  // Penalizar por alta tasa de interés
  if (averageInterestRate < 10) score += 20;
  else if (averageInterestRate < 15) score += 10;
  else if (averageInterestRate < 20) score += 5;
  else score -= 10;
  
  // Penalizar por alta relación deuda-ingreso
  const debtToIncomeRatio = totalMonthlyPayments > 0 ? (totalDebt * 12 / totalMonthlyPayments) : 0;
  if (debtToIncome < 2) score += 20;
  else if (debtToIncome < 5) score += 10;
  else if (debtToIncome < 10) score += 5;
  else score -= 10;
  
  // Penalizar por cantidad de deudas
  if (debtCount === 1) score += 10;
  else if (debtCount <= 3) score += 5;
  else score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function getRebalancingRecommendations(allocation) {
  const recommendations = [];
  
  allocation.forEach(item => {
    const variance = item.avgReturn > 0 ? ((item.totalValue / item.totalInvested) - 1) * 100 : 0;
    const targetPercentage = item.targetPercentage;
    const currentPercentage = (item.totalValue / allocation.reduce((sum, inv) => sum + inv.totalValue, 0)) * 100;
    
    if (Math.abs(currentPercentage - targetPercentage) > 10) {
      recommendations.push({
        category: item._id,
        action: currentPercentage < targetPercentage ? 'increase' : 'decrease',
        currentPercentage,
        targetPercentage,
        variance,
        impact: Math.abs(currentPercentage - targetPercentage)
      });
    }
  });
  
  return recommendations;
}

function getDebtReductionStrategies(debtByType) {
  const strategies = [];
  
  debtByType.forEach(debtType => {
    const avgInterestRate = debtType.avgInterestRate;
    const totalBalance = debtType.totalBalance;
    
    if (avgInterestRate > 15) {
      strategies.push({
        type: debtType._id,
        strategy: 'refinance',
        description: 'Considerar refinanciar para obtener una tasa más baja',
        potentialSavings: 'Reducción del ' + (avgInterestRate - 10) + '% en intereses'
      });
    }
    
    if (totalBalance > 50000000) {
      strategies.push({
        type: debtType._id,
        strategy: 'prepayment',
        description: 'Realizar pagos adicionales para reducir el capital',
        potentialSavings: 'Reducción de plazo y ahorro en intereses'
      });
    }
    
    strategies.push({
      type: debtType._id,
      strategy: 'consolidation',
      description: 'Considerar consolidar deudas con tasas altas',
      potentialSavings: 'Simplificación de pagos y mejor tasa promedio'
    });
  });
  
  return strategies;
}

// Funciones auxiliares
async function getDashboardOverview(userId) {
  const [
    incomeSummary,
    expenseSummary,
    debtSummary,
    investmentSummary,
    savingsSummary
  ] = await Promise.all([
    Income.getMonthlyIncome(userId),
    Expense.getMonthlyExpenses(userId),
    Debt.getMonthlyDebtPayments(userId),
    Investment.getPortfolioSummary(userId),
    SavingsGoal.getMonthlySavingsTarget(userId)
  ]);

  const incomeData = incomeSummary[0] || { totalMonthly: 0, totalAnnual: 0, incomesCount: 0 };
  const expenseData = expenseSummary[0] || { totalMonthly: 0, totalAnnual: 0, expensesCount: 0, fixedExpenses: 0, variableExpenses: 0 };
  const debtData = debtSummary[0] || { totalMonthlyPayments: 0, totalInsurance: 0, totalImpact: 0, debtsCount: 0, totalBalance: 0 };
  const investmentData = investmentSummary[0] || { totalValue: 0, totalInvested: 0, totalGainLoss: 0, totalReturnPercent: 0, investmentsCount: 0 };
  const savingsData = savingsSummary[0] || { totalMonthlyTarget: 0, count: 0 };

  // Calcular métricas clave
  const netMonthlyCashFlow = incomeData.totalMonthly - expenseData.totalMonthly - debtData.totalImpact;
  const netAnnualCashFlow = incomeData.totalAnnual - expenseData.totalAnnual - (debtData.totalImpact * 12);
  const totalMonthlyExpenses = expenseData.totalMonthly + debtData.totalImpact;
  const savingsRate = incomeData.totalMonthly > 0 ? ((incomeData.totalMonthly - totalMonthlyExpenses) / incomeData.totalMonthly) * 100 : 0;
  const debtToIncomeRatio = incomeData.totalMonthly > 0 ? (debtData.totalImpact / incomeData.totalMonthly) * 100 : 0;
  const investmentToIncomeRatio = incomeData.totalMonthly > 0 ? (investmentData.totalValue / incomeData.totalMonthly) : 0;

  // Calcular patrimonio neto
  const liquidAssets = incomeData.totalAnnual / 12 + investmentData.totalValue;
  const totalLiabilities = debtData.totalBalance;
  const netWorth = liquidAssets - totalLiabilities;

  // Calcular salud financiera
  const financialHealthScore = calculateFinancialHealthScore({
    savingsRate,
    debtToIncomeRatio,
    investmentToIncomeRatio,
    netMonthlyCashFlow
  });

  return {
    summary: {
      netWorth,
      netMonthlyCashFlow,
      netAnnualCashFlow,
      savingsRate,
      financialHealthScore,
      debtToIncomeRatio,
      investmentToIncomeRatio
    },
    income: {
      totalMonthly: incomeData.totalMonthly,
      totalAnnual: incomeData.totalAnnual,
      count: incomeData.incomesCount,
      averagePerIncome: incomeData.incomesCount > 0 ? incomeData.totalMonthly / incomeData.incomesCount : 0
    },
    expenses: {
      totalMonthly: expenseData.totalMonthly,
      totalAnnual: expenseData.totalAnnual,
      count: expenseData.expensesCount,
      fixedExpenses: expenseData.fixedExpenses,
      variableExpenses: expenseData.variableExpenses,
      averagePerExpense: expenseData.expensesCount > 0 ? expenseData.totalMonthly / expenseData.expensesCount : 0
    },
    debts: {
      totalMonthlyPayments: debtData.totalMonthlyPayments,
      totalBalance: debtData.totalBalance,
      count: debtData.debtsCount,
      averageInterestRate: debtData.totalInterestRate,
      totalInsurance: debtData.totalInsurance
    },
    investments: {
      totalValue: investmentData.totalValue,
      totalInvested: investmentData.totalInvested,
      totalGainLoss: investmentData.totalGainLoss,
      totalReturnPercent: investmentData.totalReturnPercent,
      count: investmentData.investmentsCount,
      dividendIncome: investmentData.dividendIncome
    },
    savings: {
      totalMonthlyTarget: savingsData.totalMonthlyTarget,
      count: savingsData.count
    }
  };
}

async function getAlertsSummary(userId) {
  const filters = { userId, status: 'active' };
  const alerts = await Alert.find(filters)
    .sort({ 'timing.createdAt': -1 })
    .limit(10);

  const alertSummary = await Alert.aggregate([
    { $match: { userId } },
    { $group: {
      _id: '$priority',
      count: { $sum: 1 },
      latest: { $max: '$timing.createdAt' }
    }},
    { $sort: { '_id': 1 } }
  ]);

  return {
    alerts,
    summary: alertSummary,
    unreadCount: alerts.filter(alert => alert.status === 'active').length
  };
}

export default router;
