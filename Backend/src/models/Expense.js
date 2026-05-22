import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
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
  amount: {
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
  type: {
    type: String,
    enum: ['fixed', 'variable', 'essential', 'discretionary', 'emergency'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'housing', 'transport', 'food', 'utilities', 'healthcare', 
      'education', 'entertainment', 'shopping', 'personal', 'debt-payment',
      'savings', 'investment', 'insurance', 'taxes', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    maxlength: 50,
    trim: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  nextPaymentDate: {
    type: Date,
    default: null
  },
  averageMonthlyAmount: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isTaxDeductible: {
    type: Boolean,
    default: false
  },
  budgetLimit: {
    type: Number,
    default: null,
    min: 0
  },
  actualSpending: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'digital-wallet', 'other'],
    default: 'cash'
  },
  vendor: {
    name: {
      type: String,
      maxlength: 100,
      trim: true
    },
    category: {
      type: String,
      maxlength: 50
    },
    website: {
      type: String,
      maxlength: 200
    }
  },
  tags: [{
    type: String,
    maxlength: 30,
    trim: true
  }],
  attachments: [{
    type: String, // URLs a documentos
    maxlength: 500
  }],
  recurringSettings: {
    autoCharge: {
      type: Boolean,
      default: false
    },
    reminderDays: {
      type: Number,
      default: 3,
      min: 0,
      max: 30
    },
    maxOccurrences: {
      type: Number,
      default: null,
      min: 1
    },
    occurrenceCount: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'api', 'bank-sync'],
      default: 'manual'
    },
    externalId: {
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

// Índices compuestos
expenseSchema.index({ userId: 1, isActive: 1 });
expenseSchema.index({ userId: 1, type: 1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, nextPaymentDate: 1 });
expenseSchema.index({ userId: 1, priority: 1 });
expenseSchema.index({ userId: 1, frequency: 1 });

// Virtuals
expenseSchema.virtual('isOverBudget').get(function() {
  if (!this.budgetLimit) return false;
  return this.actualSpending > this.budgetLimit;
});

expenseSchema.virtual('budgetUtilization').get(function() {
  if (!this.budgetLimit) return 0;
  return (this.actualSpending / this.budgetLimit) * 100;
});

expenseSchema.virtual('isOverdue').get(function() {
  if (!this.nextPaymentDate || !this.isActive) return false;
  return new Date() > this.nextPaymentDate;
});

expenseSchema.virtual('annualAmount').get(function() {
  const frequencyMultipliers = {
    'daily': 365,
    'weekly': 52,
    'biweekly': 26,
    'monthly': 12,
    'quarterly': 4,
    'yearly': 1,
    'one-time': 0
  };
  return this.amount * (frequencyMultipliers[this.frequency] || 0);
});

// Middleware para cálculos automáticos
expenseSchema.pre('save', function() {
  if (this.isModified('amount') || this.isModified('frequency')) {
    const frequencyMultipliers = {
      'daily': 30.42,
      'weekly': 4.33,
      'biweekly': 2.17,
      'monthly': 1,
      'quarterly': 0.33,
      'yearly': 0.083,
      'one-time': 0
    };
    this.averageMonthlyAmount = this.amount * (frequencyMultipliers[this.frequency] || 0);
  }
});

// Métodos de instancia
expenseSchema.methods.calculateNextPayment = function() {
  if (!this.isActive || this.frequency === 'one-time') return null;
  
  const now = new Date();
  const lastPayment = this.nextPaymentDate || this.startDate;
  
  let nextDate = new Date(lastPayment);
  
  switch (this.frequency) {
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
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

expenseSchema.methods.updateSpending = function(amount) {
  this.actualSpending += amount;
  this.recurringSettings.occurrenceCount += 1;
  this.nextPaymentDate = this.calculateNextPayment();
  
  // Verificar si debe desactivarse por límite de ocurrencias
  if (this.recurringSettings.maxOccurrences && 
      this.recurringSettings.occurrenceCount >= this.recurringSettings.maxOccurrences) {
    this.isActive = false;
  }
  
  return this.save();
};

expenseSchema.methods.updateActiveStatus = function() {
  if (this.endDate && new Date() > this.endDate) {
    this.isActive = false;
  }
  return this.save();
};

// Métodos estáticos
expenseSchema.statics.getActiveExpenses = function(userId) {
  return this.find({ 
    userId, 
    isActive: true,
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  }).sort({ priority: -1, nextPaymentDate: 1 });
};

expenseSchema.statics.getMonthlyExpenses = function(userId) {
  return this.aggregate([
    { $match: { userId, isActive: true } },
    { $group: { 
      _id: null, 
      totalMonthly: { $sum: '$averageMonthlyAmount' },
      totalAnnual: { $sum: '$annualAmount' },
      expensesCount: { $sum: 1 },
      fixedExpenses: { 
        $sum: { 
          $cond: [{ $eq: ['$type', 'fixed'] }, '$averageMonthlyAmount', 0] 
        } 
      },
      variableExpenses: { 
        $sum: { 
          $cond: [{ $eq: ['$type', 'variable'] }, '$averageMonthlyAmount', 0] 
        } 
      }
    }}
  ]);
};

expenseSchema.statics.getExpensesByCategory = function(userId, period = 'monthly') {
  const groupField = period === 'monthly' ? '$category' : {
    $concat: ['$category', '-', { $dateToString: { format: "%Y-%m", date: "$createdAt" } }]
  };
  
  return this.aggregate([
    { $match: { userId, isActive: true } },
    { $group: { 
      _id: groupField,
      totalAmount: { $sum: '$amount' },
      averageMonthly: { $sum: '$averageMonthlyAmount' },
      count: { $sum: 1 }
    }},
    { $sort: { totalAmount: -1 } }
  ]);
};

expenseSchema.statics.getOverdueExpenses = function(userId) {
  return this.find({
    userId,
    isActive: true,
    nextPaymentDate: { $lt: new Date() }
  }).sort({ nextPaymentDate: 1 });
};

expenseSchema.statics.getBudgetAlerts = function(userId) {
  return this.find({
    userId,
    isActive: true,
    budgetLimit: { $exists: true, $gt: 0 },
    $expr: { $gt: ['$actualSpending', '$budgetLimit'] }
  });
};

export default mongoose.model('Expense', expenseSchema);
