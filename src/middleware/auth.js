export function requireAuth(req, res, next) {
  try {
    const isAuth = req.oidc && req.oidc.isAuthenticated && req.oidc.isAuthenticated();
    if (isAuth) return next();

    return res.status(401).json({ error: 'Authentication required', loginUrl: '/auth/login' });
  } catch (err) {
    console.error('requireAuth error checking auth', err);
    return res.status(500).json({ error: 'internal' });
  }
}