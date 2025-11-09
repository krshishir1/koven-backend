import express from "express";
import Artifact from "../models/artifact.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { artifactId, fileName, deployedContracts } = req.body;

    if (!artifactId) {
      return res.status(400).json({ error: "Artifact ID is required" });
    }

    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({ error: "fileName is required" });
    }

    if (!Array.isArray(deployedContracts) || deployedContracts.length === 0) {
      return res.status(400).json({
        error:
          "deployedContracts must be a non-empty array of { address, network, txHash, deployedAt } objects",
      });
    }

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found" });
    }

    const file = artifact.files.find(
      (f) => f.isSolidity && f.path.toLowerCase().includes(fileName.toLowerCase())
    );

    if (!file) {
      return res.status(404).json({ error: `Solidity file '${fileName}' not found in artifact` });
    }

    file.deployedContracts = deployedContracts.map((dc) => ({
      address: dc.address,
      network: dc.network,
      txHash: dc.txHash,
      deployedAt: dc.deployedAt || new Date(),
    }));

    artifact.updatedAt = new Date();
    await artifact.save();

    return res.json({
      message: `Deployment info updated for '${fileName}'`,
      file: file.path,
      deployedContracts: file.deployedContracts,
    });
  } catch (err) {
    console.error("Deploy update error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

export default router;
