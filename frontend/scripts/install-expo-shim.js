#!/usr/bin/env node
/**
 * node_modules is rebuilt in the deploy container, which wipes the `expo` shim
 * the platform relies on to drive this CRA app. Recreate it after every install.
 */
const fs = require("fs");
const path = require("path");

const binDir = path.join(__dirname, "..", "node_modules", ".bin");
const target = path.join(binDir, "expo");
const shim = path.join(__dirname, "expo-shim.sh");

try {
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(target, `#!/usr/bin/env bash\nexec "${shim}" "$@"\n`, { mode: 0o755 });
  fs.chmodSync(shim, 0o755);
  console.log("expo shim installed at node_modules/.bin/expo");
} catch (e) {
  console.warn("could not install expo shim:", e.message);
}
