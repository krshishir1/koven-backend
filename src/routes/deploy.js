import express from "express";
import Artifact from "../models/artifact.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { artifactId, deployedContracts } = req.body;

    if (!artifactId) {
      return res.status(400).json({ error: "Artifact ID is required" });
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

    // Update deployedContracts only for Solidity files
    let updatedCount = 0;
    artifact.files.forEach((file) => {
      if (file.isSolidity) {
        file.deployedContracts = deployedContracts.map((dc) => ({
          address: dc.address,
          network: dc.network,
          txHash: dc.txHash,
          deployedAt: dc.deployedAt || new Date(),
        }));
        updatedCount++;
      }
    });

    artifact.updatedAt = new Date();
    await artifact.save();

    return res.json({
      message: `Updated deployed contracts for ${updatedCount} Solidity file(s).`,
      deployedContracts,
    });
  } catch (err) {
    console.error("Deploy update error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

export default router;