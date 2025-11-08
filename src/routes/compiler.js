import express from "express"
import { loadCompiler, makeImportResolver } from "../utils/compiler/index.js";

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { version, sources, settings } = req.body;
    console.log("Body requested: ", req.body);

    if (!sources || typeof sources !== 'object') {
      return res.status(400).json({ error: 'Provide sources map: { "A.sol": "..." }' });
    }

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

    console.log("Input: ", input)

    const compiler = await loadCompiler(version);

    console.log("compiler", compiler)

    // create import resolver
    const importResolver = await makeImportResolver(sources);

    console.log("import resolver", compiler)


    // solc.compileStandardWrapper expects a JSON string and an import callback
    const inputJSON = JSON.stringify(input);
    const outputStr = compiler.compile(inputJSON);

    // console.log("output str: ", outputStr);

    const output = JSON.parse(outputStr);

    // Return the full standard output (errors, contracts)
    res.json(output);
  } catch (err) {
    console.error('Compile error:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
