import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  type: {
    type: String,
    enum: ['emergency-fund', 'retirement', 'vacation', 'home', 'car', 'education', 'wedding', 'investment', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['COP', 'USD', 'EUR'],
    default: 'COP',
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  timeline: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    targetDate: {
      type: Date,
      required: true
    },
    completedDate: {
      type: Date,
      default: null
    }
  },
  contribution: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: 1
    },
    autoTransfer: {
      enabled: {
        type: Boolean,
        default: false
      },
      sourceAccount: {
        type: String,
        maxlength: 100
      },
      nextTransferDate: {
        type: Date,
        default: null
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    onTrack: {
      type: Boolean,
      default: true
    },
    monthsRemaining: {
      type: Number,
      default: 0
    },
    requiredMonthlyContribution: {
      type: Number,
      default: 0
    }
  },
  allocations: [{
    fromSource: {
      type: String,
      enum: ['income', 'expense-savings', 'investment-return', 'bonus', 'other'],
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  milestones: [{
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    achievedDate: {
      type: Date,
      default: null
    },
    isAchieved: {
      type: Boolean,
      default: false
    },
    reward: {
      type: String,
      maxlength: 200
    }
  }],
  contributions: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    source: {
      type: String,
      enum: ['manual', 'auto-transfer', 'income-allocation', 'bonus', 'other'],
      required: true
    },
    notes: {
      type: String,
      maxlength: 200
    },
    transactionId: {
      type: String,
      maxlength: 100
    }
  }],
  withdrawals: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      enum: ['goal-complete', 'emergency', 're-allocation', 'other'],
      required: true
    },
    notes: {
      type: String,
      maxlength: 200
    }
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['contribution', 'milestone', 'deadline', 'progress'],
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'one-time'],
      required: true
    },
    nextReminder: {
      type: Date,
      required: true
    },
    message: {
      type: String,
      maxlength: 500
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  visualization: {
    color: {
      type: String,
      default: '#4CAF50'
    },
    icon: {
      type: String,
      default: 'savings'
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'template', 'import', 'ai-suggestion'],
      default: 'manual'
    },
    templateId: {
      type: String,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    confidence: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
savingsGoalSchema.index({ userId: 1, status: 1 });
savingsGoalSchema.index({ userId: 1, priority: 1 });
savingsGoalSchema.index({ userId: 1, 'timeline.targetDate': 1 });
savingsGoalSchema.index({ userId: 1, type: 1 });

// Virtuals
savingsGoalSchema.virtual('amountRemaining').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

savingsGoalSchema.virtual('isCompleted').get(function() {
  return this.currentAmount >= this.targetAmount;
});

savingsGoalSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const targetDate = new Date(this.timeline.targetDate);
  const today = new Date();
  return Math.max(0, Math.floor((targetDate - today) / (1000 * 60 * 60 * 24)));
});

savingsGoalSchema.virtual('totalContributions').get(function() {
  return this.contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
});

savingsGoalSchema.virtual('totalWithdrawals').get(function() {
  return this.withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
});

savingsGoalSchema.virtual('averageMonthlyContribution').get(function() {
  if (this.contributions.length === 0) return 0;
  
  const firstContribution = this.contributions.reduce((earliest, contribution) => 
    contribution.date < earliest.date ? contribution : earliest
  );
  
  const monthsActive = Math.max(1, 
    Math.floor((new Date() - firstContribution.date) / (1000 * 60 * 60 * 24 * 30))
  );
  
  return this.totalContributions / monthsActive;
});

savingsGoalSchema.virtual('projectedCompletionDate').get(function() {
  const monthlyContribution = this.averageMonthlyContribution;
  if (monthlyContribution <= 0) return null;
  
  const remaining = this.amountRemaining;
  const monthsNeeded = Math.ceil(remaining / monthlyContribution);
  
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
  
  return projectedDate;
});

savingsGoalSchema.virtual('isOnTrack').get(function() {
  if (this.status === 'completed') return true;
  
  const today = new Date();
  const targetDate = new Date(this.timeline.targetDate);
  const startDate = new Date(this.timeline.startDate);
  
  const totalDays = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysPassed <= 0) return true;
  
  const expectedProgress = (daysPassed / totalDays) * 100;
  const actualProgress = this.progress.percentage;
  
  return actualProgress >= expectedProgress;
});

// Middleware para actualizar progreso automáticamente
savingsGoalSchema.pre('save', function(next) {
  this.updateProgress();
  this.updateMilestones();
  next();
});

// Métodos de instancia
savingsGoalSchema.methods.updateProgress = function() {
  this.progress.percentage = Math.min(100, (this.currentAmount / this.targetAmount) * 100);
  this.progress.onTrack = this.isOnTrack;
  this.progress.monthsRemaining = Math.max(0, Math.ceil(this.daysRemaining / 30));
  
  // Calcular contribución mensual requerida
  const remaining = this.amountRemaining;
  const monthsRemaining = this.progress.monthsRemaining;
  this.progress.requiredMonthlyContribution = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
  
  // Actualizar estado si está completado
  if (this.isCompleted && this.status === 'active') {
    this.status = 'completed';
    this.timeline.completedDate = new Date();
  }
};

savingsGoalSchema.methods.addContribution = function(amount, source = 'manual', notes = '') {
  const contribution = {
    date: new Date(),
    amount,
    source,
    notes
  };
  
  this.contributions.push(contribution);
  this.currentAmount += amount;
  this.updateProgress();
  
  return this.save();
};

savingsGoalSchema.methods.addWithdrawal = function(amount, reason, notes = '') {
  const withdrawal = {
    date: new Date(),
    amount,
    reason,
    notes
  };
  
  this.withdrawals.push(withdrawal);
  this.currentAmount = Math.max(0, this.currentAmount - amount);
  this.updateProgress();
  
  return this.save();
};

savingsGoalSchema.methods.updateMilestones = function() {
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && this.currentAmount >= milestone.targetAmount) {
      milestone.isAchieved = true;
      milestone.achievedDate = new Date();
    }
  });
};

savingsGoalSchema.methods.calculateOptimalContribution = function() {
  const remaining = this.amountRemaining;
  const daysRemaining = this.daysRemaining;
  
  if (daysRemaining <= 0) return 0;
  
  const dailyRequired = remaining / daysRemaining;
  
  // Convertir a frecuencia de contribución
  const frequencyMultipliers = {
    'daily': 1,
    'weekly': 7,
    'biweekly': 14,
    'monthly': 30.42,
    'quarterly': 91.25,
    'yearly': 365
  };
  
  const multiplier = frequencyMultipliers[this.contribution.frequency] || 1;
  return dailyRequired * multiplier;
};

savingsGoalSchema.methods.getNextContributionDate = function() {
  const lastContribution = this.contributions.length > 0 ? 
    this.contributions[this.contributions.length - 1].date : 
    this.timeline.startDate;
  
  let nextDate = new Date(lastContribution);
  
  switch (this.contribution.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(Math.min(this.contribution.dayOfMonth, 
        new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'one-time':
      return null;
  }
  
  return nextDate;
};

savingsGoalSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  if (!this.progress.onTrack) {
    recommendations.push({
      type: 'increase-contribution',
      message: `Considera aumentar tu contribución mensual a ${this.progress.requiredMonthlyContribution.toFixed(2)} ${this.currency} para alcanzar tu meta`,
      priority: 'high'
    });
  }
  
  if (this.contribution.amount < this.progress.requiredMonthlyContribution) {
    recommendations.push({
      type: 'adjust-frequency',
      message: 'Considera aumentar la frecuencia de tus contribuciones',
      priority: 'medium'
    });
  }
  
  if (this.daysRemaining < 30 && !this.isCompleted) {
    recommendations.push({
      type: 'deadline-approaching',
      message: 'Tu fecha límite está cerca. Considera hacer una contribución adicional',
      priority: 'high'
    });
  }
  
  return recommendations;
};

// Métodos estáticos
savingsGoalSchema.statics.getActiveGoals = function(userId) {
  return this.find({ userId, status: 'active' })
    .sort({ priority: -1, 'timeline.targetDate': 1 });
};

savingsGoalSchema.statics.getGoalsSummary = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    { $group: {
      _id: '$status',
      totalTarget: { $sum: '$targetAmount' },
      totalCurrent: { $sum: '$currentAmount' },
      totalRemaining: { $sum: '$amountRemaining' },
      count: { $sum: 1 },
      avgProgress: { $avg: '$progress.percentage' }
    }},
    { $sort: { count: -1 } }
  ]);
};

savingsGoalSchema.statics.getMonthlySavingsTarget = function(userId) {
  return this.aggregate([
    { $match: { userId, status: 'active' } },
    { $group: {
      _id: null,
      totalMonthlyTarget: { $sum: '$contribution.amount' },
      totalRequired: { $sum: '$progress.requiredMonthlyContribution' },
      goalsCount: { $sum: 1 }
    }}
  ]);
};

savingsGoalSchema.statics.getUpcomingDeadlines = function(userId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  return this.find({
    userId,
    status: 'active',
    'timeline.targetDate': { $lte: cutoffDate },
    currentAmount: { $lt: '$targetAmount' }
  }).sort({ 'timeline.targetDate': 1 });
};

savingsGoalSchema.statics.getOverdueGoals = function(userId) {
  return this.find({
    userId,
    status: 'active',
    'timeline.targetDate': { $lt: new Date() },
    currentAmount: { $lt: '$targetAmount' }
  }).sort({ 'timeline.targetDate': 1 });
};

savingsGoalSchema.statics.getGoalsByType = function(userId) {
  return this.aggregate([
    { $match: { userId, status: 'active' } },
    { $group: {
      _id: '$type',
      totalTarget: { $sum: '$targetAmount' },
      totalCurrent: { $sum: '$currentAmount' },
      avgProgress: { $avg: '$progress.percentage' },
      count: { $sum: 1 }
    }},
    { $sort: { totalTarget: -1 } }
  ]);
};

savingsGoalSchema.statics.getTopPriorityGoals = function(userId, limit = 5) {
  return this.find({ userId, status: 'active' })
    .sort({ priority: -1, 'progress.percentage': 1 })
    .limit(limit);
};

export default mongoose.model('SavingsGoal', savingsGoalSchema);
