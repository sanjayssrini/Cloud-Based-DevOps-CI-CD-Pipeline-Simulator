"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface BuildScriptEditorProps {
  projectId: string;
  onScriptSaved?: (script: BuildScript) => void;
}

interface BuildScript {
  id?: string;
  name: string;
  language: "dockerfile" | "bash" | "yaml";
  script: string;
  commands?: string[];
}

const templates = {
  dockerfile: `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Build the application
RUN npm run build || true

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]`,

  bash: `#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build || echo "No build script found, skipping..."

echo "✅ Build complete!"
echo "📊 Project size:"
du -sh . | grep -oP '^\S+'`,

  yaml: `stages:
  - install
  - build
  - test

variables:
  NODE_ENV: production

install_dependencies:
  stage: install
  script:
    - npm install
  artifacts:
    paths:
      - node_modules/

build_project:
  stage: build
  script:
    - npm run build || echo "No build script"
  artifacts:
    paths:
      - dist/
      - build/

test_project:
  stage: test
  script:
    - npm test || echo "No tests configured"
  allow_failure: true`
};

export function BuildScriptEditor({ projectId, onScriptSaved }: BuildScriptEditorProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [scriptLanguage, setScriptLanguage] = useState<"dockerfile" | "bash" | "yaml">(
    "bash"
  );
  const [scriptContent, setScriptContent] = useState(templates.bash);
  const [scriptName, setScriptName] = useState("Custom Build Script");

  const saveMutation = useMutation({
    mutationFn: async (script: BuildScript) => {
      const { data } = await api.post(`/projects/${projectId}/scripts`, script);
      return data;
    },
    onSuccess: (data) => {
      setShowEditor(false);
      onScriptSaved?.({
        ...data,
        language: scriptLanguage
      });
    }
  });

  const handleLanguageChange = (lang: "dockerfile" | "bash" | "yaml") => {
    setScriptLanguage(lang);
    setScriptContent(templates[lang]);
  };

  const handleSave = () => {
    saveMutation.mutate({
      name: scriptName,
      language: scriptLanguage,
      script: scriptContent
    });
  };

  if (!showEditor) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Build Configuration</h3>
            <p className="text-sm text-slate-600">Optionally customize your build with a script (auto-detected build will run otherwise)</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90"
          >
            Create Custom Script
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-900">Build Script Editor</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Script Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Script Name
          </label>
          <input
            type="text"
            value={scriptName}
            onChange={(e) => setScriptName(e.target.value)}
            placeholder="e.g., Production Build"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-brand-ocean focus:outline-none"
          />
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Build Script Language
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["dockerfile", "bash", "yaml"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`rounded-lg px-4 py-3 font-semibold transition-colors ${
                  scriptLanguage === lang
                    ? "bg-brand-ocean text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {lang === "dockerfile"
                  ? "🐳 Docker"
                  : lang === "bash"
                    ? "🔧 Bash"
                    : "⚙️ YAML"}
              </button>
            ))}
          </div>
        </div>

        {/* Script Editor */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Script Content
          </label>
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            className="h-80 w-full rounded-lg border border-slate-300 bg-white font-mono text-sm text-slate-900 p-4 focus:border-brand-ocean focus:outline-none focus:bg-white"
          />
        </div>

        {/* Quick reference */}
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</p>
          <ul className="text-sm text-blue-800 space-y-1">
            {scriptLanguage === "dockerfile" && (
              <>
                <li>• FROM: Set base image</li>
                <li>• RUN: Execute build commands</li>
                <li>• COPY: Include files in image</li>
                <li>• EXPOSE: Declare ports</li>
              </>
            )}
            {scriptLanguage === "bash" && (
              <>
                <li>• Use set -e to exit on any error</li>
                <li>• Each line is executed sequentially</li>
                <li>• Standard bash variables and pipes work</li>
              </>
            )}
            {scriptLanguage === "yaml" && (
              <>
                <li>• Stages execute in order</li>
                <li>• Each stage can have multiple scripts</li>
                <li>• Artifacts are preserved between stages</li>
              </>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => setShowEditor(false)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !scriptContent.trim()}
            className="flex-1 rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
