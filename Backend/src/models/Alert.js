import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'budget-exceeded', 'budget-warning', 'debt-due', 'debt-overdue',
      'investment-gain', 'investment-loss', 'market-alert', 'savings-goal',
      'income-received', 'expense-registered', 'cash-flow-low', 'recommendation',
      'milestone-achieved', 'deadline-approaching', 'account-balance', 'system'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['financial', 'investment', 'budget', 'debt', 'savings', 'market', 'system'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  source: {
    type: {
      type: String,
      enum: ['system', 'user', 'api', 'rule-engine', 'scheduler'],
      required: true
    },
    moduleId: {
      type: String,
      maxlength: 100
    },
    entityId: {
      type: String,
      maxlength: 100
    },
    entityType: {
      type: String,
      enum: ['income', 'expense', 'debt', 'investment', 'savings-goal', 'user'],
      default: null
    }
  },
  status: {
    type: String,
    enum: ['active', 'read', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  actions: [{
    type: {
      type: String,
      enum: ['view-details', 'mark-paid', 'adjust-budget', 'rebalance', 'contribute', 'dismiss', 'custom'],
      required: true
    },
    label: {
      type: String,
      required: true,
      maxlength: 50
    },
    url: {
      type: String,
      maxlength: 500
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  delivery: {
    channels: [{
      type: {
        type: String,
        enum: ['in-app', 'email', 'push', 'sms', 'webhook'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'skipped'],
        default: 'pending'
      },
      sentAt: {
        type: Date,
        default: null
      },
      deliveredAt: {
        type: Date,
        default: null
      },
      error: {
        type: String,
        default: null
      },
      retryCount: {
        type: Number,
        default: 0
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }],
    preferences: {
      inApp: {
        enabled: {
          type: Boolean,
          default: true
        },
        sound: {
          type: Boolean,
          default: true
        },
        badge: {
          type: Boolean,
          default: true
        }
      },
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        template: {
          type: String,
          default: 'default'
        }
      },
      push: {
        enabled: {
          type: Boolean,
          default: false
        },
        sound: {
          type: String,
          default: 'default'
        }
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false
        }
      }
    }
  },
  timing: {
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  recurrence: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: null
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    nextOccurrence: {
      type: Date,
      default: null
    },
    maxOccurrences: {
      type: Number,
      default: null
    },
    occurrenceCount: {
      type: Number,
      default: 0
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  conditions: {
    triggers: [{
      metric: {
        type: String,
        required: true
      },
      operator: {
        type: String,
        enum: ['greater-than', 'less-than', 'equals', 'not-equals', 'percentage-change', 'threshold'],
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      timeWindow: {
        type: String,
        enum: ['instant', 'daily', 'weekly', 'monthly'],
        default: 'instant'
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastTriggered: {
      type: Date,
      default: null
    }
  },
  metadata: {
    template: {
      type: String,
      maxlength: 100
    },
    language: {
      type: String,
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'America/Bogota'
    },
    tags: [{
      type: String,
      maxlength: 30
    }],
    sessionId: {
      type: String,
      maxlength: 100
    },
    correlationId: {
      type: String,
      maxlength: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ userId: 1, priority: 1 });
alertSchema.index({ userId: 1, type: 1 });
alertSchema.index({ userId: 1, 'timing.createdAt': -1 });
alertSchema.index({ userId: 1, 'recurrence.nextOccurrence': 1 });
alertSchema.index({ 'timing.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Virtuals
alertSchema.virtual('isExpired').get(function() {
  if (!this.timing.expiresAt) return false;
  return new Date() > this.timing.expiresAt;
});

alertSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'active') return false;
  if (this.isExpired) return true;
  
  // Alertas críticas expiran más rápido
  const expirationHours = {
    'critical': 24,
    'high': 48,
    'medium': 168, // 1 semana
    'low': 720    // 1 mes
  };
  
  const hours = expirationHours[this.priority] || 168;
  const expirationTime = new Date(this.timing.createdAt.getTime() + hours * 60 * 60 * 1000);
  
  return new Date() > expirationTime;
});

alertSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.timing.createdAt) / (1000 * 60 * 60 * 24));
});

alertSchema.virtual('hasUnreadChannels').get(function() {
  return this.delivery.channels.some(channel => 
    channel.status === 'sent' && channel.type === 'in-app'
  );
});

// Métodos de instancia
alertSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.timing.readAt = new Date();
  return this.save();
};

alertSchema.methods.acknowledge = function() {
  this.status = 'acknowledged';
  this.timing.acknowledgedAt = new Date();
  return this.save();
};

alertSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.timing.resolvedAt = new Date();
  return this.save();
};

alertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

alertSchema.methods.addAction = function(actionData) {
  this.actions.push(actionData);
  return this.save();
};

alertSchema.methods.markChannelAsDelivered = function(channelType, deliveredAt = new Date()) {
  const channel = this.delivery.channels.find(c => c.type === channelType);
  if (channel) {
    channel.status = 'delivered';
    channel.deliveredAt = deliveredAt;
    return this.save();
  }
  return Promise.resolve(this);
};

alertSchema.methods.scheduleNextOccurrence = function() {
  if (!this.recurrence.isRecurring) return null;
  
  const now = new Date();
  let nextDate = new Date(this.recurrence.nextOccurrence || now);
  
  switch (this.recurrence.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + this.recurrence.interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * this.recurrence.interval));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + this.recurrence.interval);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + (3 * this.recurrence.interval));
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + this.recurrence.interval);
      break;
  }
  
  // Verificar si no excede la fecha final
  if (this.recurrence.endDate && nextDate > this.recurrence.endDate) {
    return null;
  }
  
  // Verificar si no excede el número máximo de ocurrencias
  if (this.recurrence.maxOccurrences && 
      this.recurrence.occurrenceCount >= this.recurrence.maxOccurrences) {
    return null;
  }
  
  this.recurrence.nextOccurrence = nextDate;
  this.recurrence.occurrenceCount += 1;
  
  return nextDate;
};

alertSchema.methods.evaluateConditions = function(context) {
  if (!this.conditions.isActive) return false;
  
  return this.conditions.triggers.every(trigger => {
    const { metric, operator, value } = trigger;
    const contextValue = context[metric];
    
    if (contextValue === undefined) return false;
    
    switch (operator) {
      case 'greater-than':
        return contextValue > value;
      case 'less-than':
        return contextValue < value;
      case 'equals':
        return contextValue === value;
      case 'not-equals':
        return contextValue !== value;
      case 'percentage-change':
        const change = ((contextValue - value) / value) * 100;
        return Math.abs(change) >= trigger.threshold || 0;
      case 'threshold':
        return contextValue >= value;
      default:
        return false;
    }
  });
};

// Métodos estáticos
alertSchema.statics.getActiveAlerts = function(userId) {
  return this.find({ 
    userId, 
    status: 'active',
    $or: [
      { 'timing.expiresAt': null },
      { 'timing.expiresAt': { $gt: new Date() } }
    ]
  }).sort({ priority: -1, 'timing.createdAt': -1 });
};

alertSchema.statics.getUnreadAlerts = function(userId) {
  return this.find({ 
    userId, 
    status: { $in: ['active', 'read'] }
  }).sort({ priority: -1, 'timing.createdAt': -1 });
};

alertSchema.statics.getAlertsByType = function(userId, type) {
  return this.find({ userId, type })
    .sort({ 'timing.createdAt': -1 });
};

alertSchema.statics.getAlertsByPriority = function(userId, priority) {
  return this.find({ userId, priority, status: 'active' })
    .sort({ 'timing.createdAt': -1 });
};

alertSchema.statics.getOverdueAlerts = function(userId) {
  return this.find({
    userId,
    status: 'active',
    'timing.createdAt': { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }).sort({ priority: -1, 'timing.createdAt': -1 });
};

alertSchema.statics.getAlertsSummary = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      byPriority: {
        $push: {
          priority: '$priority',
          count: 1
        }
      },
      byType: {
        $push: {
          type: '$type',
          count: 1
        }
      }
    }},
    { $sort: { count: -1 } }
  ]);
};

alertSchema.statics.createAlert = function(alertData) {
  const alert = new this(alertData);
  
  // Configurar canales de entrega por defecto
  if (!alert.delivery.channels.length) {
    alert.delivery.channels.push({
      type: 'in-app',
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date()
    });
  }
  
  return alert.save();
};

alertSchema.statics.createBudgetAlert = function(userId, expense, utilization) {
  const priority = utilization >= 100 ? 'critical' : 
                   utilization >= 80 ? 'high' : 'medium';
  
  const type = utilization >= 100 ? 'budget-exceeded' : 'budget-warning';
  
  return this.createAlert({
    userId,
    type,
    category: 'budget',
    priority,
    title: utilization >= 100 ? 'Presupuesto Excedido' : 'Alerta de Presupuesto',
    message: `Tu gasto en ${expense.category} ha alcanzado el ${utilization.toFixed(1)}% de tu presupuesto.`,
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
      label: 'Ver Detalles',
      url: `/expenses/${expense._id}`,
      isPrimary: true
    }, {
      type: 'adjust-budget',
      label: 'Ajustar Presupuesto',
      url: `/expenses/${expense._id}/edit`
    }]
  });
};

alertSchema.statics.createDebtAlert = function(userId, debt, daysUntilDue) {
  const type = daysUntilDue < 0 ? 'debt-overdue' : 'debt-due';
  const priority = daysUntilDue < 0 ? 'critical' : 
                   daysUntilDue <= 3 ? 'high' : 'medium';
  
  return this.createAlert({
    userId,
    type,
    category: 'debt',
    priority,
    title: daysUntilDue < 0 ? 'Pago de Deuda Vencido' : 'Recordatorio de Pago de Deuda',
    message: `Tu pago de ${debt.name} por ${debt.paymentSchedule.paymentAmount} ${debt.currency} ${daysUntilDue < 0 ? 'está vencido' : `vence en ${daysUntilDue} días`}.`,
    details: {
      debtId: debt._id,
      debtName: debt.name,
      amount: debt.paymentSchedule.paymentAmount,
      currency: debt.currency,
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
      label: 'Ver Detalles',
      url: `/debts/${debt._id}`
    }]
  });
};

alertSchema.statics.createInvestmentAlert = function(userId, investment, changePercent) {
  const type = changePercent > 0 ? 'investment-gain' : 'investment-loss';
  const priority = Math.abs(changePercent) >= 10 ? 'high' : 'medium';
  
  return this.createAlert({
    userId,
    type,
    category: 'investment',
    priority,
    title: changePercent > 0 ? ' Ganancia en Inversión' : 'Pérdida en Inversión',
    message: `Tu inversión en ${investment.name} ha ${changePercent > 0 ? 'ganado' : 'perdido'} ${Math.abs(changePercent).toFixed(2)}% hoy.`,
    details: {
      investmentId: investment._id,
      symbol: investment.symbol,
      currentPrice: investment.currentData.price,
      changePercent,
      currentValue: investment.currentValue
    },
    source: {
      type: 'api',
      moduleId: 'market-monitor',
      entityId: investment._id,
      entityType: 'investment'
    },
    actions: [{
      type: 'view-details',
      label: 'Ver Inversión',
      url: `/investments/${investment._id}`,
      isPrimary: true
    }]
  });
};

alertSchema.statics.cleanupExpiredAlerts = function() {
  return this.deleteMany({
    'timing.expiresAt': { $lt: new Date() },
    status: { $in: ['active', 'read'] }
  });
};

// Middleware para limpieza automática
alertSchema.index({ 'timing.expiresAt': 1 }, { 
  expireAfterSeconds: 0,
  name: 'alerts_ttl_index'
});

export default mongoose.model('Alert', alertSchema);
