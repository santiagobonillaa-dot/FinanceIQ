import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say'
    },
    nationality: {
      type: String,
      maxlength: 100
    },
    taxId: {
      type: String,
      maxlength: 50
    },
    phone: {
      type: String,
      maxlength: 20
    },
    address: {
      street: {
        type: String,
        maxlength: 200
      },
      city: {
        type: String,
        maxlength: 100
      },
      state: {
        type: String,
        maxlength: 100
      },
      country: {
        type: String,
        maxlength: 100,
        default: 'Colombia'
      },
      postalCode: {
        type: String,
        maxlength: 20
      }
    }
  },
  financialProfile: {
    employmentStatus: {
      type: String,
      enum: ['employed', 'self-employed', 'unemployed', 'student', 'retired', 'other'],
      required: true
    },
    occupation: {
      type: String,
      maxlength: 100
    },
    employer: {
      type: String,
      maxlength: 100
    },
    industry: {
      type: String,
      maxlength: 100
    },
    annualIncome: {
      type: Number,
      required: true,
      min: 0
    },
    incomeCurrency: {
      type: String,
      enum: ['COP', 'USD', 'EUR'],
      default: 'COP'
    },
    incomeFrequency: {
      type: String,
      enum: ['monthly', 'biweekly', 'weekly', 'yearly'],
      default: 'monthly'
    },
    netWorth: {
      type: Number,
      default: 0,
      min: 0
    },
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive', 'very-aggressive'],
      default: 'moderate'
    },
    investmentExperience: {
      type: String,
      enum: ['none', 'beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    financialGoals: [{
      type: String,
      enum: ['retirement', 'home-purchase', 'education', 'emergency-fund', 'debt-payoff', 'investment-growth', 'other']
    }],
    timeHorizon: {
      type: String,
      enum: ['short-term', 'medium-term', 'long-term'],
      default: 'medium-term'
    }
  },
  preferences: {
    currency: {
      base: {
        type: String,
        enum: ['COP', 'USD', 'EUR'],
        default: 'COP'
      },
      reference: {
        type: String,
        enum: ['COP', 'USD', 'EUR'],
        default: 'USD'
      },
      autoConvert: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'America/Bogota'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    numberFormat: {
      type: String,
      enum: ['1,234.56', '1.234,56', '1 234.56'],
      default: '1.234,56'
    },
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        frequency: {
          type: String,
          enum: ['immediate', 'daily', 'weekly', 'monthly'],
          default: 'daily'
        },
        types: [{
          type: String,
          enum: ['alerts', 'reports', 'recommendations', 'market-updates', 'system']
        }]
      },
      push: {
        enabled: {
          type: Boolean,
          default: true
        },
        types: [{
          type: String,
          enum: ['alerts', 'reports', 'recommendations', 'market-updates', 'system']
        }]
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false
        },
        types: [{
          type: String,
          enum: ['critical-alerts', 'security', 'system']
        }]
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['private', 'friends', 'public'],
        default: 'private'
      },
      dataSharing: {
        analytics: {
          type: Boolean,
          default: true
        },
        marketing: {
          type: Boolean,
          default: false
        },
        research: {
          type: Boolean,
          default: false
        }
      }
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['default', 'compact', 'detailed'],
        default: 'default'
      },
      widgets: [{
        type: {
          type: String,
          enum: ['net-worth', 'cash-flow', 'investments', 'debts', 'savings', 'budget', 'market-overview'],
          required: true
        },
        position: {
          row: { type: Number, required: true },
          col: { type: Number, required: true }
        },
        size: {
          rows: { type: Number, default: 1 },
          cols: { type: Number, default: 1 }
        },
        isVisible: {
          type: Boolean,
          default: true
        },
        config: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      }],
      refreshInterval: {
        type: Number,
        default: 300, // 5 minutes
        min: 60,
        max: 3600
      }
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    trustedDevices: [{
      deviceId: {
        type: String,
        required: true
      },
      deviceName: {
        type: String,
        required: true
      },
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        required: true
      },
      userAgent: {
        type: String,
        maxlength: 500
      },
      ipAddress: {
        type: String,
        maxlength: 45
      },
      lastUsed: {
        type: Date,
        default: Date.now
      },
      isTrusted: {
        type: Boolean,
        default: true
      }
    }],
    securityQuestions: [{
      question: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      }
    }]
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    features: [{
      name: {
        type: String,
        required: true
      },
      isEnabled: {
        type: Boolean,
        default: true
      },
      usageLimit: {
        type: Number,
        default: null
      },
      currentUsage: {
        type: Number,
        default: 0
      }
    }]
  },
  onboarding: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    completedSteps: [{
      step: {
        type: Number,
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number, // en segundos
        default: 0
      }
    }],
    skippedSteps: [{
      step: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
        maxlength: 200
      }
    }],
    preferences: {
      showTips: {
        type: Boolean,
        default: true
      },
      guidedMode: {
        type: Boolean,
        default: true
      }
    }
  },
  analytics: {
    firstLogin: {
      type: Date,
      default: Date.now
    },
    totalLogins: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    sessionDuration: {
      average: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    },
    featuresUsed: [{
      feature: {
        type: String,
        required: true
      },
      usageCount: {
        type: Number,
        default: 0
      },
      lastUsed: {
        type: Date,
        default: Date.now
      }
    }],
    goals: {
      accountsCreated: {
        type: Number,
        default: 0
      },
      goalsSet: {
        type: Number,
        default: 0
      },
      goalsCompleted: {
        type: Number,
        default: 0
      }
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['registration', 'import', 'admin', 'api'],
      default: 'registration'
    },
    referralSource: {
      type: String,
      maxlength: 100
    },
    campaign: {
      type: String,
      maxlength: 100
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      default: '1.0.0'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'personalInfo.email': 1 });
userProfileSchema.index({ 'financialProfile.annualIncome': 1 });
userProfileSchema.index({ 'subscription.plan': 1 });
userProfileSchema.index({ 'onboarding.isCompleted': 1 });

// Virtuals
userProfileSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

userProfileSchema.virtual('age').get(function() {
  if (!this.personalInfo.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

userProfileSchema.virtual('isPremium').get(function() {
  return ['premium', 'enterprise'].includes(this.subscription.plan);
});

userProfileSchema.virtual('isActiveUser').get(function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.analytics.lastActivity > thirtyDaysAgo;
});

userProfileSchema.virtual('completionRate').get(function() {
  const totalSteps = 10; // Total de pasos en onboarding
  return (this.onboarding.completedSteps.length / totalSteps) * 100;
});

// Métodos de instancia
userProfileSchema.methods.updateLastActivity = function() {
  this.analytics.lastActivity = new Date();
  this.analytics.totalLogins += 1;
  return this.save();
};

userProfileSchema.methods.addFeatureUsage = function(featureName) {
  const feature = this.analytics.featuresUsed.find(f => f.feature === featureName);
  
  if (feature) {
    feature.usageCount += 1;
    feature.lastUsed = new Date();
  } else {
    this.analytics.featuresUsed.push({
      feature: featureName,
      usageCount: 1,
      lastUsed: new Date()
    });
  }
  
  return this.save();
};

userProfileSchema.methods.completeOnboardingStep = function(step, timeSpent = 0) {
  const existingStep = this.onboarding.completedSteps.find(s => s.step === step);
  
  if (!existingStep) {
    this.onboarding.completedSteps.push({
      step,
      timeSpent
    });
    this.onboarding.currentStep = Math.max(this.onboarding.currentStep, step + 1);
    
    // Verificar si completó el onboarding
    if (this.onboarding.completedSteps.length >= 10) {
      this.onboarding.isCompleted = true;
    }
  }
  
  return this.save();
};

userProfileSchema.methods.skipOnboardingStep = function(step, reason = '') {
  const existingStep = this.onboarding.skippedSteps.find(s => s.step === step);
  
  if (!existingStep) {
    this.onboarding.skippedSteps.push({
      step,
      reason
    });
    this.onboarding.currentStep = Math.max(this.onboarding.currentStep, step + 1);
  }
  
  return this.save();
};

userProfileSchema.methods.addTrustedDevice = function(deviceInfo) {
  const existingDevice = this.security.trustedDevices.find(
    d => d.deviceId === deviceInfo.deviceId
  );
  
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
    existingDevice.userAgent = deviceInfo.userAgent;
    existingDevice.ipAddress = deviceInfo.ipAddress;
  } else {
    this.security.trustedDevices.push({
      ...deviceInfo,
      lastUsed: new Date()
    });
  }
  
  return this.save();
};

userProfileSchema.methods.removeTrustedDevice = function(deviceId) {
  this.security.trustedDevices = this.security.trustedDevices.filter(
    d => d.deviceId !== deviceId
  );
  return this.save();
};

userProfileSchema.methods.updateSubscription = function(plan, features = []) {
  this.subscription.plan = plan;
  this.subscription.features = features.map(feature => ({
    name: feature,
    isEnabled: true,
    usageLimit: null,
    currentUsage: 0
  }));
  
  if (plan !== 'free') {
    this.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
  } else {
    this.subscription.endDate = null;
  }
  
  return this.save();
};

userProfileSchema.methods.getDashboardLayout = function() {
  const defaultWidgets = [
    { type: 'net-worth', position: { row: 0, col: 0 }, size: { rows: 2, cols: 2 } },
    { type: 'cash-flow', position: { row: 0, col: 2 }, size: { rows: 1, cols: 2 } },
    { type: 'investments', position: { row: 1, col: 2 }, size: { rows: 1, cols: 2 } },
    { type: 'debts', position: { row: 2, col: 0 }, size: { rows: 1, cols: 2 } },
    { type: 'savings', position: { row: 2, col: 2 }, size: { rows: 1, cols: 2 } }
  ];
  
  return this.preferences.dashboard.widgets.length > 0 ? 
    this.preferences.dashboard.widgets : 
    defaultWidgets;
};

// Métodos estáticos
userProfileSchema.statics.findByEmail = function(email) {
  return this.findOne({ 'personalInfo.email': email });
};

userProfileSchema.statics.getUsersByPlan = function(plan) {
  return this.find({ 'subscription.plan': plan });
};

userProfileSchema.statics.getActiveUsers = function(days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({ 'analytics.lastActivity': { $gte: cutoffDate } });
};

userProfileSchema.statics.getUsersByIncomeRange = function(minIncome, maxIncome) {
  return this.find({
    'financialProfile.annualIncome': { $gte: minIncome, $lte: maxIncome }
  });
};

userProfileSchema.statics.getOnboardingStats = function() {
  return this.aggregate([
    { $group: {
      _id: null,
      totalUsers: { $sum: 1 },
      completedOnboarding: {
        $sum: { $cond: ['$onboarding.isCompleted', 1, 0] }
      },
      averageCompletionRate: { $avg: '$completionRate' },
      currentStepAverage: { $avg: '$onboarding.currentStep' }
    }}
  ]);
};

userProfileSchema.statics.getSubscriptionStats = function() {
  return this.aggregate([
    { $group: {
      _id: '$subscription.plan',
      count: { $sum: 1 },
      avgIncome: { $avg: '$financialProfile.annualIncome' }
    }},
    { $sort: { count: -1 } }
  ]);
};

export default mongoose.model('UserProfile', userProfileSchema);
