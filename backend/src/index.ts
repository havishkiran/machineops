import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth';
import machinesRoutes from './routes/machines';
import ticketsRoutes from './routes/tickets';
import partsRoutes from './routes/parts';
import pmTasksRoutes from './routes/pm-tasks';
import workOrdersRoutes from './routes/work-orders';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import customFieldsRoutes from './routes/custom-fields';
import unitsRoutes from './routes/units';
import usersRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'machineops-dev-secret';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(s => s.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Auth middleware (applied to all /api/* except /api/auth)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/pm-tasks', pmTasksRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/custom-fields', customFieldsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`MachineOps API running on http://localhost:${PORT}`);
});
