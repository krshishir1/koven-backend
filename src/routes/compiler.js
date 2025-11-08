import express from "express";
import { loadCompiler, makeImportResolver } from "../utils/compiler/index.js";
import Artifact from "../models/artifact.js"; 

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { version, sources, settings, artifactId } = req.body;
    console.log("Body requested: ", req.body);

    if (!sources || typeof sources !== 'object') {
      return res.status(400).json({ error: 'Provide sources map: { "A.sol": "..." }' });
    }

    if (!artifactId) {
      return res.status(400).json({ error: 'Artifact ID is required' });
    }

    // Fetch the artifact document
    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // --- Mark compilation as pending for Solidity files ---
    artifact.files.forEach(file => {
      if (file.isSolidity) {
        file.compilation.status = "pending";
      }
    });
    await artifact.save();

    // Build standard input
    const input = {
      language: 'Solidity',
      sources: {},
      settings: settings || {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata', 'evm.methodIdentifiers', 'devdoc', 'userdoc'],
            '': ['ast']
          }
        }
      }
    };

    // fill sources
    for (const [filename, content] of Object.entries(sources)) {
      input.sources[filename] = { content };
    }

    console.log("Input: ", input);

    const compiler = await loadCompiler(version);
    const importResolver = await makeImportResolver(sources);

    const inputJSON = JSON.stringify(input);
    const outputStr = compiler.compile(inputJSON);
    const output = JSON.parse(outputStr);

    // --- Update compilation result ---
    artifact.files.forEach(file => {
      if (file.isSolidity) {
        const hasError = output.errors && output.errors.some(err => err.severity === "error");
        file.compilation.status = hasError ? "failed" : "success";
        file.compilation.compiledAt = new Date();
        file.compilation.error = hasError
          ? output.errors.map(err => err.formattedMessage).join("\n")
          : null;
      }
    });

    artifact.updatedAt = new Date();
    await artifact.save();

    // Return the full standard output (errors, contracts)
    res.json(output);

  } catch (err) {
    console.error('Compile error:', err);

    // If artifactId exists, mark compilation failed
    if (req.body.artifactId) {
      try {
        const artifact = await Artifact.findById(req.body.artifactId);
        if (artifact) {
          artifact.files.forEach(file => {
            if (file.isSolidity) {
              file.compilation.status = "failed";
              file.compilation.compiledAt = new Date();
              file.compilation.error = err.message || String(err);
            }
          });
          artifact.updatedAt = new Date();
          await artifact.save();
        }
      } catch (saveErr) {
        console.error("Error updating artifact after failure:", saveErr);
      }
    }

    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
