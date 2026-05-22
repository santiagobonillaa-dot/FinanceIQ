import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
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
  creditor: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: ['bank', 'credit-card', 'person', 'financial-institution', 'government', 'other'],
      required: true
    },
    contact: {
      phone: String,
      email: String,
      website: String
    }
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
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
  interestRate: {
    annual: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    type: {
      type: String,
      enum: ['fixed', 'variable', 'mixed'],
      required: true
    },
    compoundingFrequency: {
      type: String,
      enum: ['daily', 'monthly', 'quarterly', 'annually'],
      default: 'monthly'
    }
  },
  paymentSchedule: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'],
      required: true
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: 1
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 0
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    nextPaymentDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  loanDetails: {
    type: {
      type: String,
      enum: ['mortgage', 'auto', 'personal', 'credit-card', 'student', 'business', 'other'],
      required: true
    },
    term: {
      type: Number, // en meses
      required: true,
      min: 1
    },
    purpose: {
      type: String,
      maxlength: 500,
      trim: true
    },
    collateral: {
      type: String,
      maxlength: 200,
      trim: true
    }
  },
  amortizationType: {
    type: String,
    enum: ['linear', 'french', 'american', 'interest-only', 'custom'],
    default: 'french'
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'defaulted', 'restructured', 'paused'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  insurance: {
    hasInsurance: {
      type: Boolean,
      default: false
    },
    monthlyPremium: {
      type: Number,
      default: 0,
      min: 0
    },
    coverageAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  fees: {
    originationFee: {
      type: Number,
      default: 0,
      min: 0
    },
    prepaymentPenalty: {
      type: Number,
      default: 0,
      min: 0
    },
    latePaymentFee: {
      type: Number,
      default: 0,
      min: 0
    },
    annualFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  payments: [{
    paymentNumber: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0
    },
    feesAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    balanceAfterPayment: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['scheduled', 'paid', 'late', 'missed'],
      default: 'scheduled'
    },
    paymentMethod: {
      type: String,
      enum: ['automatic', 'manual', 'bank-transfer', 'cash', 'other'],
      default: 'manual'
    }
  }],
  nextPaymentDetails: {
    principalAmount: {
      type: Number,
      default: 0
    },
    interestAmount: {
      type: Number,
      default: 0
    },
    feesAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
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
    documents: [{
      type: String, // URLs a documentos
      description: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, priority: 1 });
debtSchema.index({ userId: 1, 'paymentSchedule.nextPaymentDate': 1 });
debtSchema.index({ userId: 1, 'creditor.type': 1 });

// Virtuals
debtSchema.virtual('totalPaid').get(function() {
  return this.payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
});

debtSchema.virtual('remainingPayments').get(function() {
  if (this.status !== 'active') return 0;
  
  const monthlyRate = this.interestRate.annual / 100 / 12;
  if (monthlyRate === 0) {
    return Math.ceil(this.currentBalance / this.paymentSchedule.paymentAmount);
  }
  
  const payment = this.paymentSchedule.paymentAmount;
  const balance = this.currentBalance;
  const n = Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate);
  return Math.ceil(Math.max(0, n));
});

debtSchema.virtual('totalInterestToPay').get(function() {
  return this.remainingPayments * this.paymentSchedule.paymentAmount - this.currentBalance;
});

debtSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'active') return false;
  return new Date() > this.paymentSchedule.nextPaymentDate;
});

debtSchema.virtual('monthlyPaymentImpact').get(function() {
  return this.paymentSchedule.paymentAmount + 
         (this.insurance.hasInsurance ? this.insurance.monthlyPremium : 0);
});

debtSchema.virtual('debtToIncomeRatio').get(function() {
  // Este virtual se calculará a nivel de servicio con el ingreso del usuario
  return null;
});

// Métodos de instancia
debtSchema.methods.calculateAmortizationSchedule = function() {
  const schedule = [];
  const monthlyRate = this.interestRate.annual / 100 / 12;
  const balance = this.currentBalance;
  const payment = this.paymentSchedule.paymentAmount;
  
  if (monthlyRate === 0) {
    // Interés cero - pago lineal
    let remainingBalance = balance;
    let paymentNum = 1;
    
    while (remainingBalance > 0 && paymentNum <= 1200) { // Límite de seguridad
      const principalAmount = Math.min(payment, remainingBalance);
      schedule.push({
        paymentNumber: paymentNum,
        principalAmount,
        interestAmount: 0,
        totalAmount: principalAmount,
        balanceAfterPayment: remainingBalance - principalAmount
      });
      remainingBalance -= principalAmount;
      paymentNum++;
    }
  } else {
    // Amortización francesa (método estándar)
    let remainingBalance = balance;
    let paymentNum = 1;
    
    while (remainingBalance > 0.01 && paymentNum <= 1200) { // Límite de seguridad
      const interestAmount = remainingBalance * monthlyRate;
      const principalAmount = payment - interestAmount;
      
      if (principalAmount <= 0) break;
      
      const newBalance = Math.max(0, remainingBalance - principalAmount);
      
      schedule.push({
        paymentNumber: paymentNum,
        principalAmount: Math.min(principalAmount, remainingBalance),
        interestAmount,
        totalAmount: payment,
        balanceAfterPayment: newBalance
      });
      
      remainingBalance = newBalance;
      paymentNum++;
    }
  }
  
  return schedule;
};

debtSchema.methods.getNextPaymentDetails = function() {
  const monthlyRate = this.interestRate.annual / 100 / 12;
  const balance = this.currentBalance;
  const payment = this.paymentSchedule.paymentAmount;
  
  let interestAmount = 0;
  let principalAmount = payment;
  
  if (monthlyRate > 0 && balance > 0) {
    interestAmount = balance * monthlyRate;
    principalAmount = Math.min(payment - interestAmount, balance);
  }
  
  const feesAmount = this.fees.annualFee / 12;
  
  return {
    principalAmount,
    interestAmount,
    feesAmount,
    totalAmount: principalAmount + interestAmount + feesAmount
  };
};

debtSchema.methods.makePayment = function(amount, paymentDate = new Date()) {
  const nextPayment = this.getNextPaymentDetails();
  
  if (amount < nextPayment.totalAmount) {
    throw new Error('Payment amount is less than required minimum');
  }
  
  const payment = {
    paymentNumber: this.payments.length + 1,
    paymentDate,
    amount,
    principalAmount: nextPayment.principalAmount,
    interestAmount: nextPayment.interestAmount,
    feesAmount: nextPayment.feesAmount,
    balanceAfterPayment: Math.max(0, this.currentBalance - nextPayment.principalAmount),
    status: 'paid'
  };
  
  this.payments.push(payment);
  this.currentBalance = payment.balanceAfterPayment;
  
  // Actualizar siguiente fecha de pago
  if (this.currentBalance <= 0) {
    this.status = 'paid';
    this.currentBalance = 0;
  } else {
    this.paymentSchedule.nextPaymentDate = this.calculateNextPaymentDate();
  }
  
  // Actualizar detalles del próximo pago
  this.nextPaymentDetails = this.getNextPaymentDetails();
  
  return this.save();
};

debtSchema.methods.calculateNextPaymentDate = function() {
  const lastDate = this.paymentSchedule.nextPaymentDate;
  let nextDate = new Date(lastDate);
  
  switch (this.paymentSchedule.frequency) {
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
    case 'semiannual':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annual':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

debtSchema.methods.prepaymentImpact = function(extraAmount) {
  const monthlyRate = this.interestRate.annual / 100 / 12;
  const currentBalance = this.currentBalance;
  const regularPayment = this.paymentSchedule.paymentAmount;
  
  if (monthlyRate === 0) {
    const newPaymentsCount = Math.ceil((currentBalance - extraAmount) / regularPayment);
    const currentPaymentsCount = Math.ceil(currentBalance / regularPayment);
    return {
      paymentsSaved: currentPaymentsCount - newPaymentsCount,
      interestSaved: 0,
      newEndDate: new Date(Date.now() + (newPaymentsCount * 30 * 24 * 60 * 60 * 1000))
    };
  }
  
  // Cálculo con interés
  const currentN = Math.log(1 - (currentBalance * monthlyRate) / regularPayment) / Math.log(1 + monthlyRate);
  const newBalance = Math.max(0, currentBalance - extraAmount);
  const newN = newBalance > 0 ? 
    Math.log(1 - (newBalance * monthlyRate) / regularPayment) / Math.log(1 + monthlyRate) : 0;
  
  const paymentsSaved = Math.ceil(currentN - newN);
  const interestSaved = paymentsSaved * regularPayment - extraAmount;
  
  return {
    paymentsSaved,
    interestSaved,
    newEndDate: new Date(Date.now() + (newN * 30 * 24 * 60 * 60 * 1000))
  };
};

// Métodos estáticos
debtSchema.statics.getActiveDebts = function(userId) {
  return this.find({ userId, status: 'active' })
    .sort({ priority: -1, 'paymentSchedule.nextPaymentDate': 1 });
};

debtSchema.statics.getMonthlyDebtPayments = function(userId) {
  return this.aggregate([
    { $match: { userId, status: 'active' } },
    { $group: { 
      _id: null, 
      totalMonthlyPayments: { $sum: '$paymentSchedule.paymentAmount' },
      totalInsurance: { $sum: '$insurance.monthlyPremium' },
      totalImpact: { 
        $sum: { 
          $add: [
            '$paymentSchedule.paymentAmount',
            '$insurance.monthlyPremium'
          ]
        } 
      },
      debtsCount: { $sum: 1 },
      totalBalance: { $sum: '$currentBalance' },
      totalInterestRate: { $avg: '$interestRate.annual' }
    }}
  ]);
};

debtSchema.statics.getOverdueDebts = function(userId) {
  return this.find({
    userId,
    status: 'active',
    'paymentSchedule.nextPaymentDate': { $lt: new Date() }
  }).sort({ 'paymentSchedule.nextPaymentDate': 1 });
};

debtSchema.statics.getDebtSummary = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    { $group: {
      _id: '$status',
      totalBalance: { $sum: '$currentBalance' },
      totalOriginal: { $sum: '$originalAmount' },
      count: { $sum: 1 },
      avgInterestRate: { $avg: '$interestRate.annual' },
      totalMonthlyPayments: { $sum: '$paymentSchedule.paymentAmount' }
    }},
    { $sort: { totalBalance: -1 } }
  ]);
};

export default mongoose.model('Debt', debtSchema);
