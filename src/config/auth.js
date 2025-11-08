import { auth } from 'express-openid-connect';
import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();

const {
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_ISSUER_BASE_URL,
  BASE_URL,
  SESSION_SECRET
} = process.env;

assert(
  AUTH0_CLIENT_ID && AUTH0_CLIENT_SECRET && AUTH0_ISSUER_BASE_URL && BASE_URL && SESSION_SECRET,
  'Missing one or more Auth0 env vars'
);

export const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: SESSION_SECRET,
  baseURL: BASE_URL,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_ISSUER_BASE_URL,

  // ✅ NEW: Automatically redirect to frontend after login
  afterCallback: (req, res, session) => {
    // Optional: You can inspect session.user here if needed
    res.redirect('http://localhost:3000/app');
    return session;
  },

  // Optional: to keep route naming explicit
  routes: {
    callback: '/callback',
  },
};

export function authMiddleware(app) {
  app.use(auth(authConfig));
}
