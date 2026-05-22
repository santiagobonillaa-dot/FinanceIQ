import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['stock', 'crypto', 'etf', 'bond', 'mutual-fund', 'real-estate', 'commodity', 'forex', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['equity', 'fixed-income', 'crypto', 'alternative', 'cash', 'mixed'],
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  exchange: {
    type: String,
    enum: ['NYSE', 'NASDAQ', 'BVC', 'BME', 'BMV', 'BVL', 'CRYPTO', 'FOREX', 'OTHER'],
    default: 'OTHER'
  },
  holdings: [{
    date: {
      type: Date,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['COP', 'USD', 'EUR'],
      required: true
    },
    transactionType: {
      type: String,
      enum: ['buy', 'sell', 'transfer-in', 'transfer-out'],
      required: true
    },
    fees: {
      type: Number,
      default: 0,
      min: 0
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true
    },
    exchangeRate: {
      type: Number,
      default: 1,
      min: 0
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  currentData: {
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      enum: ['COP', 'USD', 'EUR'],
      default: 'USD'
    },
    marketCap: {
      type: Number,
      default: 0
    },
    volume24h: {
      type: Number,
      default: 0
    },
    change24h: {
      type: Number,
      default: 0
    },
    changePercent24h: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['manual', 'alpha-vantage', 'yahoo-finance', 'coingecko', 'other'],
      default: 'manual'
    }
  },
  performance: {
    totalInvested: {
      type: Number,
      default: 0,
      min: 0
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalReturn: {
      type: Number,
      default: 0
    },
    totalReturnPercent: {
      type: Number,
      default: 0
    },
    unrealizedGainLoss: {
      type: Number,
      default: 0
    },
    realizedGainLoss: {
      type: Number,
      default: 0
    },
    dividendYield: {
      type: Number,
      default: 0
    },
    annualizedReturn: {
      type: Number,
      default: 0
    },
    sharpeRatio: {
      type: Number,
      default: 0
    },
    maxDrawdown: {
      type: Number,
      default: 0
    },
    volatility: {
      type: Number,
      default: 0
    }
  },
  risk: {
    level: {
      type: String,
      enum: ['very-low', 'low', 'medium', 'high', 'very-high'],
      default: 'medium'
    },
    beta: {
      type: Number,
      default: 1
    },
    alpha: {
      type: Number,
      default: 0
    },
    standardDeviation: {
      type: Number,
      default: 0
    }
  },
  allocation: {
    targetPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    rebalanceThreshold: {
      type: Number,
      default: 5,
      min: 0,
      max: 50
    }
  },
  dividends: [{
    exDate: {
      type: Date,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    amountPerShare: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['COP', 'USD', 'EUR'],
      required: true
    },
    totalAmount: {
      type: Number,
      required: 0
    },
    qualified: {
      type: Boolean,
      default: false
    },
    taxWithheld: {
      type: Number,
      default: 0
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['price-above', 'price-below', 'percent-change', 'volume', 'news', 'rebalance'],
      required: true
    },
    condition: {
      type: String,
      enum: ['greater-than', 'less-than', 'equals', 'percentage-change'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastTriggered: {
      type: Date,
      default: null
    },
    notificationMethod: {
      type: String,
      enum: ['email', 'push', 'sms', 'all'],
      default: 'email'
    }
  }],
  tags: [{
    type: String,
    maxlength: 30,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoUpdate: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['real-time', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    },
    nextUpdate: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'api', 'broker-sync'],
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

// Índices
investmentSchema.index({ userId: 1, isActive: 1 });
investmentSchema.index({ userId: 1, type: 1 });
investmentSchema.index({ userId: 1, category: 1 });
investmentSchema.index({ userId: 1, symbol: 1 });
investmentSchema.index({ symbol: 1, exchange: 1 });

// Virtuals
investmentSchema.virtual('currentQuantity').get(function() {
  return this.holdings.reduce((total, holding) => {
    if (holding.transactionType === 'buy' || holding.transactionType === 'transfer-in') {
      return total + holding.quantity;
    } else if (holding.transactionType === 'sell' || holding.transactionType === 'transfer-out') {
      return total - holding.quantity;
    }
    return total;
  }, 0);
});

investmentSchema.virtual('averageCost').get(function() {
  const buyHoldings = this.holdings.filter(h => 
    h.transactionType === 'buy' || h.transactionType === 'transfer-in'
  );
  
  if (buyHoldings.length === 0) return 0;
  
  const totalCost = buyHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalQuantity = buyHoldings.reduce((sum, h) => sum + h.quantity, 0);
  
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
});

investmentSchema.virtual('currentValue').get(function() {
  return this.currentQuantity * this.currentData.price;
});

investmentSchema.virtual('totalCost').get(function() {
  return this.holdings.reduce((sum, h) => {
    if (h.transactionType === 'buy' || h.transactionType === 'transfer-in') {
      return sum + h.totalCost;
    }
    return sum;
  }, 0);
});

investmentSchema.virtual('unrealizedGainLoss').get(function() {
  return this.currentValue - this.totalCost;
});

investmentSchema.virtual('unrealizedGainLossPercent').get(function() {
  return this.totalCost > 0 ? (this.unrealizedGainLoss / this.totalCost) * 100 : 0;
});

investmentSchema.virtual('dividendIncome').get(function() {
  return this.dividends.reduce((sum, div) => sum + div.totalAmount, 0);
});

investmentSchema.virtual('daysHeld').get(function() {
  if (this.holdings.length === 0) return 0;
  const firstHolding = this.holdings.reduce((earliest, holding) => 
    holding.date < earliest.date ? holding : earliest
  );
  return Math.floor((new Date() - firstHolding.date) / (1000 * 60 * 60 * 24));
});

// Métodos de instancia
investmentSchema.methods.addHolding = function(holdingData) {
  const holding = {
    ...holdingData,
    totalCost: (holdingData.quantity * holdingData.price) + (holdingData.fees || 0) + (holdingData.taxes || 0),
    exchangeRate: holdingData.exchangeRate || 1,
    date: holdingData.date || new Date()
  };
  
  this.holdings.push(holding);
  this.updatePerformance();
  return this.save();
};

investmentSchema.methods.updateCurrentPrice = function(price, currency = 'USD', source = 'manual') {
  this.currentData.price = price;
  this.currentData.currency = currency;
  this.currentData.lastUpdated = new Date();
  this.currentData.source = source;
  
  this.updatePerformance();
  return this.save();
};

investmentSchema.methods.updatePerformance = function() {
  const currentValue = this.currentValue;
  const totalCost = this.totalCost;
  
  this.performance.currentValue = currentValue;
  this.performance.totalInvested = totalCost;
  this.performance.unrealizedGainLoss = currentValue - totalCost;
  this.performance.totalReturnPercent = totalCost > 0 ? 
    ((currentValue - totalCost) / totalCost) * 100 : 0;
  
  // Calcular rendimiento anualizado
  if (this.daysHeld > 0) {
    const years = this.daysHeld / 365.25;
    this.performance.annualizedReturn = years > 0 ? 
      Math.pow(1 + (this.performance.totalReturnPercent / 100), 1 / years) - 1 : 0;
  }
  
  // Actualizar dividendos
  this.performance.dividendYield = this.currentValue > 0 ? 
    (this.dividendIncome / this.currentValue) * 100 : 0;
};

investmentSchema.methods.calculateRebalanceNeed = function() {
  const targetPercentage = this.allocation.targetPercentage;
  const currentPercentage = this.allocation.currentPercentage;
  const threshold = this.allocation.rebalanceThreshold;
  
  const difference = Math.abs(currentPercentage - targetPercentage);
  return difference >= threshold;
};

investmentSchema.methods.getHistoricalData = function(startDate, endDate) {
  // Este método se implementaría con datos históricos de APIs externas
  return []; // Placeholder
};

// Métodos estáticos
investmentSchema.statics.getActiveInvestments = function(userId) {
  return this.find({ userId, isActive: true })
    .sort({ 'performance.currentValue': -1 });
};

investmentSchema.statics.getPortfolioSummary = function(userId) {
  return this.aggregate([
    { $match: { userId, isActive: true } },
    { $group: {
      _id: null,
      totalValue: { $sum: '$performance.currentValue' },
      totalInvested: { $sum: '$performance.totalInvested' },
      totalGainLoss: { $sum: '$performance.unrealizedGainLoss' },
      totalReturnPercent: { 
        $avg: '$performance.totalReturnPercent' 
      },
      investmentsCount: { $sum: 1 },
      dividendIncome: { $sum: '$dividendIncome' },
      byType: {
        $push: {
          type: '$type',
          value: '$performance.currentValue',
          percentage: '$performance.totalReturnPercent'
        }
      },
      byCategory: {
        $push: {
          category: '$category',
          value: '$performance.currentValue',
          percentage: '$performance.totalReturnPercent'
        }
      }
    }},
    { $project: {
      _id: 0,
      totalValue: 1,
      totalInvested: 1,
      totalGainLoss: 1,
      totalReturnPercent: 1,
      investmentsCount: 1,
      dividendIncome: 1,
      diversification: {
        byType: '$byType',
        byCategory: '$byCategory'
      }
    }}
  ]);
};

investmentSchema.statics.getPerformanceByType = function(userId) {
  return this.aggregate([
    { $match: { userId, isActive: true } },
    { $group: {
      _id: '$type',
      totalValue: { $sum: '$performance.currentValue' },
      totalInvested: { $sum: '$performance.totalInvested' },
      totalGainLoss: { $sum: '$performance.unrealizedGainLoss' },
      avgReturnPercent: { $avg: '$performance.totalReturnPercent' },
      count: { $sum: 1 }
    }},
    { $sort: { totalValue: -1 } }
  ]);
};

investmentSchema.statics.getTopPerformers = function(userId, limit = 10) {
  return this.find({ userId, isActive: true })
    .sort({ 'performance.totalReturnPercent': -1 })
    .limit(limit);
};

investmentSchema.statics.getWorstPerformers = function(userId, limit = 10) {
  return this.find({ userId, isActive: true })
    .sort({ 'performance.totalReturnPercent': 1 })
    .limit(limit);
};

investmentSchema.statics.searchInvestments = function(userId, query) {
  return this.find({
    userId,
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { symbol: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  });
};

export default mongoose.model('Investment', investmentSchema);
