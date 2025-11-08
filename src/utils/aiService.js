import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai'; // if your SDK differs, adapt accordingly
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function buildGeneratePrompt(userPrompt, opts = {}) {
  const solVersion = opts.solVersion || '0.8.20';
  const testFramework = opts.testFramework || 'foundry'; // used in metadata but optional
  const style = opts.style || 'gas-efficient';

  return `
You are an expert Solidity engineer, senior smart-contract auditor, and code author who writes production-grade, secure, modular Solidity projects.

USER REQUEST:
${userPrompt}

INSTRUCTIONS (VERY IMPORTANT — follow exactly):
1) **RETURN ONLY valid JSON** and nothing else. The top-level object MUST be a single JSON object matching this schema (fields may be present or omitted except those marked "required"):

{
  "files": [
    { "filename": "<path/filename>", "content": "<file contents>", "type": "<contract|script|test|config|other>" }
    // ... any number of files
  ],
  "metadata": {
    "solidity_version": "0.8.x",
    "license": "MIT",
    "test_framework": "foundry|hardhat",
    "main_contracts": ["..."],
    "vulnerabilities_to_check": ["reentrancy","access-control","unchecked-call"],
    "recommended_compile_cmds": ["npm install", "npx hardhat compile", "npx hardhat test"],
    "dependencies": {
      "solidity": ["@openzeppelin/contracts@>=5.0.0", "forge-std"],
      "javascript": ["hardhat", "ethers", "chai"]
    },
    "notes": "Short explanation (≤60 words)"
  }
}

2) Dynamic files: do NOT hardcode a fixed file list. The AI may produce any files needed 
(contracts/, libraries/, scripts/, configs/). 
**However, your output MUST include:**
   - at least one deployment script in "scripts/" (e.g., scripts/deploy.js)
   - at least one test file named or located under "test" (e.g., test.js, test/<name>.t.sol, or tests/<name>.js)
   Each test file should include 2–3 sample test cases that compile and run, demonstrating:
      a) happy path usage (successful execution)
      b) at least one failure case (revert, unauthorized access, etc.)
      c) a small descriptive comment above each test.

3) Solidity files requirements:
   - Each .sol file MUST start with an SPDX license line and an exact pragma solidity statement that matches metadata.solidity_version.
   - Use NatSpec comments for public/external functions (brief @notice and @dev where needed).
   - Prefer one contract per file for clarity. Libraries or interfaces may be in contracts/lib/ or contracts/interfaces/.
   - If using third-party code (OpenZeppelin), import the explicit package path (e.g., import "@openzeppelin/contracts/token/ERC20/ERC20.sol";) and mention the minimum OpenZeppelin version in metadata.

4) Tests & commands:
   - Provide commands in metadata.recommended_compile_cmds to compile and run tests (e.g., npm install && npx hardhat compile && npx hardhat test or forge test).
   - Tests must include a happy-path test and at least one adversarial/edge-case test (e.g., transfer revert, unauthorized mint attempt, reentrancy attempt).

5) Security & static analysis:
   - Add a short metadata.vulnerabilities_to_check array.
   - Include an explicit short checklist string in metadata (e.g., "Run slither; run forge test; verify access control on X; check for unchecked external calls in Y").

6) Code quality:
   - Keep functions small, gas-aware, and well-documented.
   - Avoid using tx.origin. Avoid unbounded loops and external calls without checks.
   - Use require/revert messages for important validation.
   - Use immutable/constant where appropriate.

7) Formatting & limits:
   - Each file content should be valid text (no binary, do not base64).
   - Keep each file reasonably sized (if a file is very large, place it into multiple files and explain in metadata).

8) Failure mode:
   - If you cannot produce a valid project, return EXACTLY: { "error": "<short explanation>" } and nothing else.

9) Output expectations:
   - The "files" array should include objects with keys: filename (path string), content (string), and optional type.
   - Example (this is only an example schema; do not restrict file choices to only these):
     {
       "files": [
         { "filename": "scripts/deploy.js", "content": "...", "type":"script" },
         { "filename": "contracts/MyToken.sol", "content": "...", "type":"contract" },
         { "filename": "test/MyToken.t.sol", "content":"...", "type":"test" }
       ],
       "metadata": {
         "solidity_version": "${solVersion}",
         "test_framework": "${testFramework}",
         "license": "MIT",
         "dependencies": {
           "solidity": ["@openzeppelin/contracts@>=5.0.0"],
           "javascript": ["hardhat", "ethers"]
         },
         "vulnerabilities_to_check": ["reentrancy","access-control"]
       }
     }

OUTPUT JSON NOW, and ensure it parses as valid JSON with no extra text or commentary.
`;
}

function extractJsonFromModelOutput(rawText) {
  if (typeof rawText !== 'string') throw new Error('Model output not a string');

  // Find first '{' that looks like JSON start
  const start = rawText.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in model output');

  // Walk forward to find matching closing '}' while respecting quoted strings and escapes.
  let inString = false;
  let escape = false;
  let depth = 0;
  let end = -1;

  for (let i = start; i < rawText.length; i++) {
    const ch = rawText[i];

    if (inString) {
      if (escape) {
        // escaped char inside string - skip special handling for this character
        escape = false;
      } else if (ch === '\\') {
        // start of an escape sequence
        escape = true;
      } else if (ch === '"') {
        // end of string
        inString = false;
      }
      continue;
    }

    // not in string
    if (ch === '"') {
      inString = true;
      escape = false;
      continue;
    }

    if (ch === '{') {
      depth++;
      continue;
    }

    if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    // couldn't find balanced closing brace; return helpful debug info
    const preview = rawText.slice(start, Math.min(rawText.length, start + 2000));
    throw new Error('Could not locate the end of the JSON object. Preview:\n' + preview);
  }

  const candidate = rawText.slice(start, end + 1);

  try {
    return JSON.parse(candidate);
  } catch (err) {
    // Provide actionable debug info (first 2000 chars of the candidate)
    const preview = candidate.slice(0, 2000);
    const errMsg = [
      'Failed to parse JSON extracted from model output.',
      'JSON.parse error: ' + err.message,
      'Candidate preview (first 2000 chars):',
      preview
    ].join('\n\n');
    throw new SyntaxError(errMsg);
  }
}

export async function generateProjectFromPrompt(userPrompt, opts = {}) {
  const prompt = buildGeneratePrompt(userPrompt, opts);

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    temperature: 0,
    maxOutputTokens: 3000
  });

  const raw = resp?.text ?? resp?.output ?? JSON.stringify(resp);
  const parsed = extractJsonFromModelOutput(raw);

  if (parsed.error) throw new Error('AI error: ' + parsed.error);
  if (!Array.isArray(parsed.files)) throw new Error('AI response missing files array');

  // ✅ Flexible validation + fallback files
  const filenames = parsed.files.map(f => f.filename.toLowerCase());

  const hasDeploy = filenames.some(f => f.includes('scripts/deploy'));
  const hasTest = filenames.some(
    f =>
      f.includes('test.js') ||
      f.includes('tests/') ||
      f.includes('test/') ||
      f.endsWith('.t.sol')
  );

  if (!hasDeploy) {
    parsed.files.push({
      filename: 'scripts/deploy.js',
      content: `// Auto-generated placeholder deploy script
// Add your Hardhat or Foundry deployment logic here.
console.log("Placeholder deploy script - please replace with actual deployment code.");`
    });
  }

  if (!hasTest) {
    parsed.files.push({
      filename: 'test.js',
      content: `// Auto-generated placeholder test
// This project lacked an explicit test.js. Add real tests here.
console.log("Placeholder test: project generated successfully.");`
    });
  }

  return parsed;
}
