import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { generate, modify, getArtifact } from '../controllers/aiController.js';

const router = express.Router();
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 10)
});

router.post('/generate', limiter, requireAuth, generate);
router.post('/modify', limiter, requireAuth, modify);
router.get('/artifacts/:id', requireAuth, getArtifact);

export default router;