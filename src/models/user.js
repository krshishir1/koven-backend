import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: { type: String },
  given_name: { type: String },
  family_name: { type: String },
  picture: { type: String },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  // Automatically handles createdAt and updatedAt
  timestamps: true 
});

export default mongoose.models.User || mongoose.model('User', UserSchema);