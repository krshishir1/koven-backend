import express from 'express';
import passport from 'passport';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'] 
}));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/app`); 
  }
);

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect(FRONTEND_URL);
    });
  });
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ ok: true, user: req.user });
  } else {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
  }
});

export default router;