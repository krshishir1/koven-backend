import express from 'express';
import rateLimit from 'express-rate-limit';
import { ensureAuth } from '../middleware/auth.js'; // Assuming this is your middleware
import { generate, modify, getArtifact, getAllArtifacts, addFile } from '../controllers/aiController.js';

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), 
  max: Number(process.env.RATE_LIMIT_MAX || 10), 
  message: { ok: false, error: 'Too many requests, please try again later.' },
  
  keyGenerator: (req, res) => {
    return req.user ? req.user.id : req.ip;
  }
});
router.use(ensureAuth);
router.post('/generate', aiLimiter, generate);
router.post('/modify', aiLimiter, modify);
router.get('/artifacts/:id', getArtifact); 
router.get('/artifacts', getAllArtifacts);

router.post("/add-file", addFile);

export default router;