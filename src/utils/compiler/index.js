import solc from "solc";
import fetch from "node-fetch";

const compilerCache = new Map();

async function loadCompileMap(version) {
    return `v0.8.20+commit.a1b79de6`;
}

export async function loadCompiler(version) {
  if (!version) return solc; // default built-in
  if (compilerCache.has(version)) return compilerCache.get(version);

  // solc.loadRemoteVersion expects a string like 'v0.8.20'
  let semver = version.startsWith('v') ? version : `v${version}`;
  semver = await loadCompileMap(semver);

  console.log(version, semver)

  const loaded = await new Promise((res, rej) => {
    solc.loadRemoteVersion(semver, (err, compiler) => {
      if (err) return rej(err);
      return res(compiler);
    });
  });

  compilerCache.set(version, loaded);

//   console.log("Load compiler: ", loaded)
  return loaded;
}


export async function makeImportResolver(sourcesMap = {}) {
  return function importResolver(dependency) {
    console.log("Dependency", dependency)
    // dependency may be relative path or url or node module path
    // 1) if present in provided sources
    if (sourcesMap[dependency]) {
      return { contents: sourcesMap[dependency] };
    }

    // 2) try reading local file (if allowed)
    const diskPath = path.resolve(process.cwd(), dependency);
    return fs.readFile(diskPath, 'utf8')
      .then(content => ({ contents: content }))
      .catch(async () => {
        // 3) try GitHub raw (basic heuristic)
        if (dependency.startsWith('https://') || dependency.startsWith('http://')) {
          try {
            const r = await fetch(dependency);
            if (!r.ok) throw new Error('Not found');
            const text = await r.text();
            return { contents: text };
          } catch (e) {
            return { error: `Unable to fetch ${dependency}: ${e.message}` };
          }
        }
        // not found
        return { error: `File not found: ${dependency}` };
      });
  };
}