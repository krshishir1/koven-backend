import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  sub: { type: String, required: true, index: true, unique: true }, // Auth0 user id
  email: { type: String, index: true },
  name: String,
  given_name: String,
  family_name: String,
  picture: String,
  locale: String,
  updatedAt: Date,
  createdAt: Date,
  lastLogin: Date,
  provider: String,
  raw: { type: Object } // full profile from Auth0 for audit/debug
}, { strict: false, minimize: false });

export default mongoose.models.User || mongoose.model('User', UserSchema);