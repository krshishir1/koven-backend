export function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    // req.isAuthenticated() is a Passport function
    return next();
  } else {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
  }
}