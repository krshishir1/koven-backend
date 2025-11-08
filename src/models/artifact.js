import mongoose from 'mongoose';

const DeploymentSchema = new mongoose.Schema({
  address: { type: String, required: true },
  network: { type: String, required: true }, 
  txHash: { type: String, required: true, index: true },
  deployedAt: { type: Date, default: Date.now }
}, { _id: false }); 

const FileSchema = new mongoose.Schema({
  path: { type: String, required: true },
  content: { type: String, required: true },
  sha256: String,

  isSolidity: {
    type: Boolean,
    default: false
  },
  
  compilation: {
    status: {
      type: String,
      enum: ["idle", "pending", "success", "failed"], 
      default: "idle"
    },
    compiledAt: { type: Date, default: Date.now },
    error: String 
  },
  deployedContracts: [DeploymentSchema]
  
}, { _id: false });

const ArtifactSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: String,
  prompt: String,
  files: [FileSchema],
  metadata: Object,
  status: {
    analysis: { type: String, default: 'idle' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

export default mongoose.models.Artifact || mongoose.model('Artifact', ArtifactSchema);