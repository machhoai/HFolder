import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const fixture = join(project, ".local-test", `css-recovery-${process.pid}`);
const app = join(fixture, "src", "app");
const styles = join(fixture, "src", "styles");
await mkdir(app, { recursive: true });
await mkdir(styles, { recursive: true });
await writeFile(join(fixture, "package.json"), JSON.stringify({ name: "hfolder-css-recovery", private: true, type: "module" }));
await writeFile(join(fixture, "next.config.mjs"), `export default {devIndicators:false,turbopack:{root:${JSON.stringify(project)}}};\n`);
await copyFile(join(project, "postcss.config.mjs"), join(fixture, "postcss.config.mjs"));
for (const name of ["globals.css", "base.css", "components.css", "tokens.css", "tailwind-theme.css"]) {
  await copyFile(join(project, "src", "styles", name), join(styles, name));
}
await writeFile(join(app, "layout.jsx"), `import '../styles/globals.css';import '../styles/base.css';import '../styles/components.css';export default function Layout({children}){return <html><body>{children}</body></html>}`);
await writeFile(join(app, "page.jsx"), `export default function Page(){return <main className="css-recovery-probe">CSS recovery fixture</main>}`);
const componentsPath = join(styles, "components.css");
const original = await readFile(componentsPath, "utf8");
const valid = original + "\n@layer components { .css-recovery-probe { @apply bg-primary; } }\n";
await writeFile(componentsPath, valid);
const allocator = createServer();
await new Promise((resolve, reject) => { allocator.once("error", reject); allocator.listen(0, "127.0.0.1", resolve); });
const port = allocator.address().port;
await new Promise(resolve => allocator.close(resolve));
const url = `http://127.0.0.1:${port}`;
let server;
let log = "";
function start() {
  server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {cwd: fixture, windowsHide: true, stdio: ["ignore", "pipe", "pipe"]});
  server.on("error", error => { log += String(error); });
  for (const stream of [server.stdout, server.stderr]) stream.on("data", data => { log = (log + data).slice(-16000); });
}
function stop() {
  if (!server || server.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {windowsHide: true, stdio: "ignore"});
  else server.kill("SIGTERM");
}
async function waitFor(status) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(10000)});
      const body = await response.text();
      if (response.status === status) {
        if (status === 200) assert.ok(body.includes("CSS recovery fixture"));
        else assert.ok(body.includes("bg-"));
        return;
      }
    } catch { /* Server startup/recompile may briefly reset the connection. */ }
    if (server.exitCode !== null) throw new Error(`Fixture server exited: ${log}`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Expected HTTP ${status}. Server log:\n${log}`);
}
try {
  start();
  await waitFor(200);console.log("PASS: valid imported CSS compiles");
  await writeFile(componentsPath, valid.replace(".css-recovery-probe { @apply bg-primary; }", ".css-recovery-probe { @apply bg-; }"));
  await waitFor(500);console.log("PASS: invalid @apply is reported");
  await writeFile(componentsPath, valid);
  await waitFor(200);console.log("PASS: fixing only the imported CSS recovers without a restart");
  stop();
  await new Promise(resolve => setTimeout(resolve, 750));
  start();
  await waitFor(200);console.log("PASS: restarting with the same dev cache stays healthy");
} finally {
  await writeFile(componentsPath, valid);
  stop();
}
