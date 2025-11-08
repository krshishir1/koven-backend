import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo'; 
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import { ensureAuth } from './middleware/auth.js'; 
import deployRoutes from './routes/deploy.js';


dotenv.config();


import './config/passport.js'; 


connectDB().catch(err => {
  console.error('Failed to connect to DB', err);
  process.exit(1);
});

import compileRoutes from "./routes/compiler.js"

const app = express();


app.use(helmet());
app.use(express.json({ limit: '200kb' }));
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
  })
);


app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false, 
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, 
      collectionName: 'sessions',
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true, 
      maxAge: 1000 * 60 * 60 * 24 * 7, 
    },
  })
);


app.use(passport.initialize());
app.use(passport.session()); 

app.use("/compiler", ensureAuth, compileRoutes);
app.use('/auth', authRoutes); 
app.use('/api/ai', ensureAuth, aiRoutes); 
app.use('/deploy', ensureAuth, deployRoutes); 


app.get('/', ensureAuth, (req, res) => {
  
  return res.json({ ok: true, user: req.user });
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));