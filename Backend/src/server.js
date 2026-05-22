import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import incomesRoutes from './routes/incomes.js';
import expensesRoutes from './routes/expenses.js';
import debtsRoutes from './routes/debts.js';
import investmentsRoutes from './routes/investments.js';
import dashboardRoutes from './routes/dashboard.js';
import marketRoutes from './routes/market.js';
import savingsRoutes from './routes/savings-simple.js';
import alertsRoutes from './routes/alerts-simple.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

// Rutas
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/incomes', incomesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/investments', investmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/alerts', alertsRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
});