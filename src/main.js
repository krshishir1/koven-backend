import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo'; // Stores sessions in MongoDB
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import { ensureAuth } from './middleware/auth.js'; // A new middleware we'll use

// Load env vars
dotenv.config();

// Passport config (We will create this file next)
import './config/passport.js'; 

// Connect to Mongo
connectDB().catch(err => {
  console.error('Failed to connect to DB', err);
  process.exit(1);
});

const app = express();

// --- Core Middleware ---
app.use(helmet());
app.use(express.json({ limit: '200kb' }));
app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend
    credentials: true,
  })
);

// --- Session Middleware (Required for Passport) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Must be a strong random string
    resave: false,
    saveUninitialized: false, // Don't create a session until user logs in
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Your DB connection string
      collectionName: 'sessions',
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Send cookie over HTTPS only in prod
      httpOnly: true, // Prevents client-side JS from accessing
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// --- Passport Middleware ---
app.use(passport.initialize());
app.use(passport.session()); // Allows Passport to use the express-session

// --- Routes ---
app.use('/auth', authRoutes); // All Google login/logout routes
app.use('/api/ai', ensureAuth, aiRoutes); // Protect your AI routes

// Example protected route
app.get('/', ensureAuth, (req, res) => {
  // req.user is populated by Passport's deserializeUser
  return res.json({ ok: true, user: req.user });
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));