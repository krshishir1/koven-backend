import { generateProjectFromPrompt } from '../utils/aiService.js';
import { saveNewArtifact, updateArtifactFiles } from '../utils/storageService.js';
import Artifact from '../models/Artifact.js';

export async function generate(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { prompt, solVersion } = req.body;
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt required' });

    const aiPayload = await generateProjectFromPrompt(prompt, { solVersion });
    const artifact = await saveNewArtifact(user._id, prompt, aiPayload);
    return res.json({ ok: true, artifactId: artifact._id, files: artifact.files, metadata: artifact.metadata });
  } catch (err) {
    console.error('AI generate error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function modify(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { artifactId, prompt, selectedFile } = req.body;
    if (!artifactId || !prompt)
      return res.status(400).json({ error: 'artifactId and prompt required' });

    const artifact = await Artifact.findById(artifactId);
    if (!artifact)
      return res.status(404).json({ error: 'Artifact not found' });
    if (!artifact.ownerId.equals(user._id))
      return res.status(403).json({ error: 'Not owner' });

    // Optional: include only the selected file context if provided
    let focusedFileContext = '';
    if (selectedFile) {
      const targetFile = artifact.files.find(f => f.filename === selectedFile);
      if (targetFile) {
        focusedFileContext = `
The user is currently editing this file:
=== ${targetFile.filename} ===
${targetFile.content.slice(0, 6000)}
=== End of selected file ===
`;
      }
    }

    // Build summarized project context (safe trimmed preview of all files)
    const fileSummary = artifact.files
      .map(
        f =>
          `FILE: ${f.filename}\n${f.content
            .slice(0, 500)
            .replace(/\n/g, ' ')
            .replace(/"/g, "'")}\n---`
      )
      .join('\n');

    // 🔥 Composite AI prompt with improved structure and clarity
    const compositePrompt = `
You are an expert Solidity engineer and smart-contract assistant.
The user wants to modify an existing project.

PROJECT CONTEXT (short preview of all files):
${fileSummary}

${focusedFileContext ? focusedFileContext : ''}

USER INSTRUCTION:
${prompt}

TASK:
- Apply the requested modification.
- Update only the necessary files.
- Preserve existing functionality in all other files.
- Maintain code style and indentation.
- Include SPDX and pragma lines where needed.

RESPONSE FORMAT:
Return ONLY valid JSON structured as:
{
  "files": [
    { "filename": "<path/filename>", "content": "<updated file content>" },
    ...
  ],
  "metadata": {
    "notes": "Short description of what changed",
    "dependencies": {
      "solidity": ["..."],
      "javascript": ["..."]
    }
  }
}

Do not include commentary, markdown, or explanations outside the JSON.
`;

    // 🔮 Call Gemini to modify the project
    const aiPayload = await generateProjectFromPrompt(compositePrompt, {
      solVersion: artifact.metadata?.solidity_version || '0.8.20'
    });

    // 🧩 Upsert modified files into MongoDB artifact
    const updated = await updateArtifactFiles(artifactId, aiPayload.files);

    // ✅ Return updated artifact
    return res.json({ ok: true, artifact: updated });
  } catch (err) {
    console.error('AI modify error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getArtifact(req, res) {
  try {
    const { id } = req.params;
    const art = await Artifact.findById(id);
    if (!art) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true, artifact: art });
  } catch (err) {
    console.error('getArtifact error', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getAllArtifacts(req, res) {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const artifacts = await Artifact.find({ ownerId: userId })
      .select('_id title prompt createdAt updatedAt') 
      .sort({ updatedAt: -1 }); // Newest first

    return res.json({ ok: true, artifacts });
  } catch (err) {
    console.error('getAllArtifacts error', err);
    return res.status(500).json({ error: err.message });
  }
}