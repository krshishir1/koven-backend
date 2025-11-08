import express from 'express';
const router = express.Router();

/**
 * Sign-in route
 * This redirects to the Auth0 /login route mounted by express-openid-connect
 */
router.get('/login', (req, res) => {
  // Option A: redirect to middleware-provided login endpoint
  return res.redirect('/login');
});

/**
 * Sign-up route
 * Auth0 supports screen_hint=signup; redirect to the middleware login route with the query param
 */
router.get('/signup', (req, res) => {
  return res.redirect('/login?screen_hint=signup');
});

/**
 * Logout route
 * Redirect to the middleware-provided logout endpoint.
 * Optionally pass returnTo param to redirect back to your app after logout.
 */
router.get('/logout', (req, res) => {
  return res.redirect('/logout');
});

/**
 * Optional: a protected "me" route that returns DB user
 * Frontend can call this to confirm user is logged in and to get stored user info
 */
router.get('/me', (req, res) => {
  if (req.user) {
    return res.json({ ok: true, user: req.user });
  }
  return res.status(401).json({ ok: false, error: 'Not authenticated' });
});

export default router;
