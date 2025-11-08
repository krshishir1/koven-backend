import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();
import { authMiddleware } from './config/auth.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import { attachUser } from './middleware/attachUser.js';
import aiRoutes from './routes/ai.js';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '200kb' }));

// Auth0 middleware: mounts /login, /logout, /callback etc
authMiddleware(app);

// Connect to Mongo
connectDB().catch(err => {
  console.error('Failed to connect to DB', err);
  process.exit(1);
});

// After auth middleware is mounted, attach the user to request if authenticated
app.use(attachUser);

// Mount auth routes
app.use('/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// example protected route that needs auth
app.get('/', (req, res) => {
  if (req.user) return res.json({ ok: true, user: req.user });
  return res.status(401).json({ ok: false, error: 'Not authenticated' });
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));