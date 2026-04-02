"use client";

import { useState } from "react";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  size?: number;
  modified?: string;
}

const sampleRepository: FileTreeNode = {
  name: "my-app",
  path: "/",
  type: "folder",
  children: [
    {
      name: "src",
      path: "/src",
      type: "folder",
      children: [
        {
          name: "components",
          path: "/src/components",
          type: "folder",
          children: [
            { name: "Button.tsx", path: "/src/components/Button.tsx", type: "file", size: 1240 },
            { name: "Card.tsx", path: "/src/components/Card.tsx", type: "file", size: 2150 }
          ]
        },
        { name: "App.tsx", path: "/src/App.tsx", type: "file", size: 3200 },
        { name: "index.ts", path: "/src/index.ts", type: "file", size: 450 }
      ]
    },
    {
      name: "tests",
      path: "/tests",
      type: "folder",
      children: [
        { name: "App.test.ts", path: "/tests/App.test.ts", type: "file", size: 1800 },
        { name: "Button.test.ts", path: "/tests/Button.test.ts", type: "file", size: 2300 }
      ]
    },
    { name: "package.json", path: "/package.json", type: "file", size: 650 },
    { name: "README.md", path: "/README.md", type: "file", size: 3400 },
    { name: ".gitignore", path: "/.gitignore", type: "file", size: 180 }
  ]
};

interface FileNodeProps {
  node: FileTreeNode;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
}

function TreeNode({ node, level, onSelect, selectedPath }: FileNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  const isFolder = node.type === "folder";
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        onClick={() => {
          if (isFolder) setExpanded(!expanded);
          onSelect(node.path);
        }}
        className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
          isSelected ? "bg-brand-ocean/10 text-brand-ocean" : "hover:bg-slate-100"
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {isFolder && (
          <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>›</span>
        )}
        {!isFolder && <span className="w-3" />}
        {isFolder ? <span className="text-amber-500">📁</span> : <span className="text-slate-400">📄</span>}
        <span className="flex-1 font-medium">{node.name}</span>
        {!isFolder && node.size && <span className="text-xs text-slate-500">{(node.size / 1024).toFixed(1)}KB</span>}
      </div>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RepositoryExplorer({
  projectId,
  onRepositorySelected,
  selectedRepository
}: {
  projectId: string;
  onRepositorySelected: (path: string | null) => void;
  selectedRepository: string | null;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
    onRepositorySelected(path);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* File Tree */}
      <div className="lg:col-span-1">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Repository Structure</h3>
            <p className="mt-1 text-xs text-slate-500">Select files to view details</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
            <TreeNode
              node={sampleRepository}
              level={0}
              onSelect={handleFileSelect}
              selectedPath={selectedFile}
            />
          </div>
        </div>
      </div>

      {/* File Preview & Info */}
      <div className="lg:col-span-2 space-y-4">
        {/* File Details */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <h3 className="font-semibold text-slate-900">File Details</h3>
          {selectedFile ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Path</p>
                  <p className="font-mono font-semibold text-slate-900">{selectedFile}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-semibold text-slate-900">
                    {selectedFile.includes(".") ? selectedFile.split(".").pop()?.toUpperCase() : "Folder"}
                  </p>
                </div>
              </div>

              {/* File Content Preview */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Preview</p>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-6">
                  <div className="text-slate-600">
                    {selectedFile.endsWith(".tsx") && (
                      <>
                        <div className="text-blue-600">export default function</div>
                        <div>Component() {"{"}</div>
                        <div className="ml-4">
                          <div className="text-green-600">return</div>
                          <div className="ml-4">{"<div>..."}</div>
                        </div>
                        <div>{"}"}</div>
                      </>
                    )}
                    {selectedFile.endsWith(".ts") && (
                      <>
                        <div className="text-blue-600">import</div>
                        <div>{"{"} type, interface, function {"}"}</div>
                      </>
                    )}
                    {selectedFile.endsWith(".json") && (
                      <div className="text-slate-600">
                        {"{"}
                        <div className="ml-4">"name": "my-app",</div>
                        <div className="ml-4">"version": "1.0.0"</div>
                        {"}"}
                      </div>
                    )}
                    {selectedFile.endsWith(".md") && (
                      <>
                        <div className="text-orange-600"># Project Documentation</div>
                        <div>Get started with our project...</div>
                      </>
                    )}
                    {!selectedFile.endsWith(".tsx") &&
                      !selectedFile.endsWith(".ts") &&
                      !selectedFile.endsWith(".json") &&
                      !selectedFile.endsWith(".md") && (
                        <div className="text-slate-400">[Binary file content]</div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">Select a file to view details and preview content</p>
            </div>
          )}
        </div>

        {/* Repository Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Files", value: "12" },
            { label: "Folders", value: "4" },
            { label: "Total Size", value: "234KB" },
            { label: "Last Modified", value: "2 hours ago" }
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <p className="text-xs text-slate-500 uppercase font-semibold">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg bg-brand-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ocean/90">
              📥 Import Repository
            </button>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              📂 Browse Local
            </button>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
