import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  path: { type: String, required: true },
  content: { type: String, required: true },
  sha256: String
}, { _id: false });

const ArtifactSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: String,
  prompt: String,
  files: [FileSchema],
  metadata: Object,
  status: {
    compiled: { type: String, default: 'idle' },
    analysis: { type: String, default: 'idle' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

export default mongoose.models.Artifact || mongoose.model('Artifact', ArtifactSchema);