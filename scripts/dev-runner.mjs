import { spawn } from "node:child_process";

const workspace = process.cwd();
const children = [];
let isShuttingDown = false;

const startWorkspaceDev = (name) => {
  const child = spawn("npm", ["run", "dev", "-w", name], {
    cwd: workspace,
    shell: true,
    stdio: "inherit",
    detached: process.platform !== "win32"
  });

  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    const exitCode = typeof code === "number" ? code : signal ? 1 : 0;
    shutdown(exitCode);
  });

  children.push(child);
  return child;
};

const killProcessTree = (child) =>
  new Promise((resolve) => {
    if (!child.pid || child.killed || child.exitCode !== null) {
      resolve();
      return;
    }

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }

    try {
      process.kill(-child.pid, "SIGTERM");
      setTimeout(() => {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // Ignore if already exited.
        }
        resolve();
      }, 1200);
    } catch {
      resolve();
    }
  });

const shutdown = async (exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  await Promise.all(children.map((child) => killProcessTree(child)));
  process.exit(exitCode);
};

process.on("SIGINT", () => {
  shutdown(130);
});

process.on("SIGTERM", () => {
  shutdown(143);
});

process.on("uncaughtException", (error) => {
  console.error(error);
  shutdown(1);
});

startWorkspaceDev("backend");
startWorkspaceDev("frontend");
