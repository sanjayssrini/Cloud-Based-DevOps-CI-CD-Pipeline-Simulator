"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "@/lib/socket";
import { useAppStore } from "@/store/app-store";

interface CliCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
}

export function CLIWindow({
  projectId,
  repository
}: {
  projectId: string;
  repository: string | null;
}) {
  const [commands, setCommands] = useState<CliCommand[]>([
    {
      id: "welcome",
      command: "",
      output: "Welcome to CI/CD Pipeline Simulator CLI\nType commands to execute them\n",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [executing, setExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [commands]);

  const sampleCommands: Record<string, string> = {
    "npm install": "npm WARN deprecated some-package@1.0.0: Package is deprecated\nadded 142 packages in 2.5s",
    "npm test": "PASS  __tests__/App.test.ts\n  App\n    ✓ renders correctly (45ms)\n    ✓ handles user input (32ms)\n\nTest Suites: 1 passed, 1 total\nTests: 2 passed, 2 total\nTime: 1.234s",
    "npm run build": "Compiling TypeScript...\nGenerating optimized bundle...\nbuild/ 234KB\nBuild complete in 3.2s",
    "git status": "On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean",
    "git log -n 3": "commit abc123... - Implement CI/CD pipeline (2 hours ago)\ncommit def456... - Fix deployment issue (1 day ago)\ncommit ghi789... - Initial project setup (1 week ago)",
    "docker build": "Building image myapp:latest\nStep 1/5 : FROM node:18\nStep 2/5 : WORKDIR /app\nSuccessfully built abc123def456",
    "clear": ""
  };

  const handleExecuteCommand = (cmd: string) => {
    if (!cmd.trim()) return;

    setExecuting(true);
    const newCommand: CliCommand = {
      id: Date.now().toString(),
      command: cmd,
      output: sampleCommands[cmd] || `Command not found: ${cmd}\nAvailable commands: ${Object.keys(sampleCommands).join(", ")}`,
      timestamp: new Date().toLocaleTimeString()
    };

    setTimeout(() => {
      if (cmd.toLowerCase() === "clear") {
        setCommands([]);
      } else {
        setCommands((prev) => [...prev, newCommand]);
      }
      setCurrentCommand("");
      setExecuting(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* CLI Terminal */}
      <div className="rounded-xl border border-slate-200 bg-[#0b1220] shadow-sm overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-slate-300 font-mono">
              {repository ? `${repository} -` : ""} Terminal
            </span>
          </div>
          <button
            onClick={() => setCommands([])}
            className="text-xs px-2 py-1 rounded hover:bg-slate-800 text-slate-400"
          >
            Clear All
          </button>
        </div>

        <div className="p-4 font-mono text-sm leading-6 text-slate-100 h-96 overflow-y-auto bg-[#020817]">
          {commands.length === 0 ? (
            <div className="text-slate-500">
              Welcome to CLI Simulator. Type a command below.
            </div>
          ) : (
            <>
              {commands.map((cmd) => (
                <div key={cmd.id} className="mb-4">
                  {cmd.command && (
                    <div className="text-green-400">
                      $ {cmd.command}
                    </div>
                  )}
                  <div className="text-slate-300 mt-1 whitespace-pre-wrap break-words">
                    {cmd.output}
                  </div>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono">$</span>
            <input
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleExecuteCommand(currentCommand);
                }
              }}
              placeholder="Enter command (npm install, npm test, npm run build, git status, docker build, clear)"
              disabled={executing}
              className="flex-1 bg-transparent text-slate-100 outline-none text-sm placeholder-slate-500"
              autoFocus
            />
            <button
              onClick={() => handleExecuteCommand(currentCommand)}
              disabled={executing || !currentCommand.trim()}
              className="px-3 py-1 text-xs font-semibold rounded bg-brand-ocean text-white hover:bg-brand-ocean/90 disabled:opacity-50"
            >
              {executing ? "⏳" : "▶"}
            </button>
          </div>
        </div>
      </div>

      {/* Command Reference */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 mb-3">📚 Available Commands</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.keys(sampleCommands).map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleExecuteCommand(cmd)}
              className="text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <span className="font-mono text-xs font-semibold text-brand-ocean">{cmd}</span>
              <p className="text-xs text-slate-500 mt-0.5">
                {cmd === "npm install"
                  ? "Install dependencies"
                  : cmd === "npm test"
                  ? "Run test suite"
                  : cmd === "npm run build"
                  ? "Build application"
                  : cmd === "git status"
                  ? "Show git status"
                  : cmd === "git log -n 3"
                  ? "View recent commits"
                  : cmd === "docker build"
                  ? "Build Docker image"
                  : "Clear terminal"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Snippets */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 mb-3">🔧 Quick Snippets</h3>
        <div className="space-y-2">
          {[
            {
              name: "Full Setup",
              commands: ["npm install", "npm test", "npm run build"]
            },
            {
              name: "Test & Build",
              commands: ["npm test", "npm run build"]
            },
            {
              name: "Git Workflow",
              commands: ["git status", "git log -n 3"]
            }
          ].map((snippet) => (
            <button
              key={snippet.name}
              onClick={() => {
                snippet.commands.forEach((cmd) => {
                  setTimeout(() => handleExecuteCommand(cmd), 200);
                });
              }}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <p className="font-semibold text-sm text-slate-900">{snippet.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {snippet.commands.join(" → ")}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
