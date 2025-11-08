import Artifact from '../models/Artifact.js';
import crypto from 'crypto';

export async function saveNewArtifact(ownerId, prompt, aiPayload) {
  const files = aiPayload.files.map(f => ({
    path: f.filename,
    content: f.content,
    sha256: crypto.createHash('sha256').update(f.content || '').digest('hex')
  }));

  const doc = await Artifact.create({
    ownerId,
    title: aiPayload.metadata?.title || (prompt.slice(0, 60)),
    prompt,
    files,
    metadata: aiPayload.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: { compiled: 'idle', analysis: 'idle' }
  });
  return doc;
}

export async function updateArtifactFiles(artifactId, filesFromAI) {
  const art = await Artifact.findById(artifactId);
  if (!art) throw new Error('Artifact not found');
  for (const f of filesFromAI) {
    const path = f.filename;
    const existing = art.files.find(x => x.path === path);
    if (existing) {
      existing.content = f.content;
      existing.sha256 = crypto.createHash('sha256').update(f.content || '').digest('hex');
    } else {
      art.files.push({ path, content: f.content, sha256: crypto.createHash('sha256').update(f.content || '').digest('hex') });
    }
  }
  art.updatedAt = new Date();
  await art.save();
  return art;
}