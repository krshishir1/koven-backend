import user from "../models/user.js";

export async function attachUser(req, res, next) {
  // If auth middleware present and user authenticated, ensure DB record exists
  if (req.oidc && req.oidc.isAuthenticated && req.oidc.isAuthenticated()) {
    const profile = req.oidc.user || {}; // Auth0 profile object
    try {
      const now = new Date();
      const update = {
        email: profile.email,
        name: profile.name,
        given_name: profile.given_name,
        family_name: profile.family_name,
        picture: profile.picture,
        locale: profile.locale,
        provider: 'auth0',
        lastLogin: now,
        updatedAt: now,
        raw: profile
      };

      const userDoc = await user.findOneAndUpdate(
        { sub: profile.sub },
        { $set: update, $setOnInsert: { createdAt: now, sub: profile.sub } },
        { upsert: true, new: true }
      );

      req.user = userDoc; // attach DB user to request
      console.log(`attachUser: user ${userDoc} attached to request`);
    } catch (err) {
      console.error('attachUser error', err);
      // we don't block the request on DB error; downstream can still handle
    }
  }
  return next();
}