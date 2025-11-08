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

assert(AUTH0_CLIENT_ID && AUTH0_CLIENT_SECRET && AUTH0_ISSUER_BASE_URL && BASE_URL && SESSION_SECRET,
  'Missing one or more Auth0 env vars');

export const authConfig = {
  authRequired: false, // not every route requires auth
  auth0Logout: true,
  secret: SESSION_SECRET,
  baseURL: BASE_URL,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_ISSUER_BASE_URL,
  // optional: session cookie properties
  // routes: { callback: '/callback' } // default behavior is fine
};

export function authMiddleware(app) {
  app.use(auth(authConfig));
}