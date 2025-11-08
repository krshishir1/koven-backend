import express from 'express';
import passport from 'passport';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'] // What info you want from Google
}));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login`, // Redirect to frontend login on fail
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend app.
    // The session cookie is now set.
    res.redirect(`${FRONTEND_URL}/app`); // Your main app page
  }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.redirect(FRONTEND_URL); // Redirect to frontend home
    });
  });
});

// @desc    Get current logged-in user (for frontend to check auth state)
// @route   GET /auth/me
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ ok: true, user: req.user });
  } else {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
  }
});

export default router;