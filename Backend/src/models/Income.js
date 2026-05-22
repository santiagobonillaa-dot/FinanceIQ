import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
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
    enum: ['fixed', 'variable', 'investment', 'freelance', 'salary', 'other'],
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
    required: true
  },
  category: {
    type: String,
    enum: ['salary', 'business', 'investments', 'rental', 'freelance', 'other'],
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
    default: null // null para ingresos recurrentes sin fin
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
    default: 0 // Calculado automáticamente según frecuencia
  },
  taxInfo: {
    isTaxable: {
      type: Boolean,
      default: true
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    retentionAmount: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'api'],
      default: 'manual'
    },
    externalId: {
      type: String,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para mejor rendimiento
incomeSchema.index({ userId: 1, isActive: 1 });
incomeSchema.index({ userId: 1, type: 1 });
incomeSchema.index({ userId: 1, frequency: 1 });
incomeSchema.index({ userId: 1, nextPaymentDate: 1 });

// Virtuals para cálculos automáticos
incomeSchema.virtual('netAmount').get(function() {
  return this.amount - this.taxInfo.retentionAmount;
});

incomeSchema.virtual('annualAmount').get(function() {
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

incomeSchema.virtual('isOverdue').get(function() {
  if (!this.nextPaymentDate || !this.isActive) return false;
  return new Date() > this.nextPaymentDate;
});

// Middleware para calcular automáticamente el promedio mensual
incomeSchema.pre('save', function() {
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

// Método para calcular próxima fecha de pago
incomeSchema.methods.calculateNextPayment = function() {
  if (!this.isActive) return null;
  
  const now = new Date();
  const lastPayment = this.nextPaymentDate || this.startDate;
  
  const frequencyIntervals = {
    'daily': 1,
    'weekly': 7,
    'biweekly': 14,
    'monthly': 1,
    'quarterly': 3,
    'yearly': 12
  };
  
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
    case 'one-time':
      return null; // No hay próxima fecha para pagos únicos
  }
  
  return nextDate;
};

// Método para actualizar estado activo basado en fechas
incomeSchema.methods.updateActiveStatus = function() {
  if (this.endDate && new Date() > this.endDate) {
    this.isActive = false;
  }
  return this.save();
};

// Método estático para obtener ingresos activos por usuario
incomeSchema.statics.getActiveIncomes = function(userId) {
  return this.find({ 
    userId, 
    isActive: true,
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  }).sort({ nextPaymentDate: 1 });
};

// Método estático para calcular ingreso mensual total
incomeSchema.statics.getMonthlyIncome = function(userId) {
  return this.aggregate([
    { $match: { userId, isActive: true } },
    { $group: { 
      _id: null, 
      totalMonthly: { $sum: '$averageMonthlyAmount' },
      totalAnnual: { $sum: '$annualAmount' },
      incomesCount: { $sum: 1 }
    }}
  ]);
};

export default mongoose.model('Income', incomeSchema);
