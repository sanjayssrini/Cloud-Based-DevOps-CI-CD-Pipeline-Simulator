"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

interface RepositoryDetails {
  name: string;
  type: string;
  root: string;
  files: {
    [key: string]: boolean;
  };
  structure?: {
    [key: string]: any;
  };
}

interface RepositoryDetailsProps {
  projectId: string;
}

export function RepositoryDetails({ projectId }: RepositoryDetailsProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const detailsQuery = useQuery({
    queryKey: ["repository-details", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/workspace`);
      return data as RepositoryDetails;
    },
    enabled: !!projectId
  });

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedFolders(newSet);
  };

  if (detailsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8">
        <div className="text-center">
          <div className="mb-3 text-3xl">📂</div>
          <p>Loading repository structure...</p>
        </div>
      </div>
    );
  }

  const repo = detailsQuery.data;

  if (!repo) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Failed to load repository details</p>
      </div>
    );
  }

  // Tree view renderer
  const renderFileTree = (items: any, depth = 0) => {
    if (!items || typeof items !== "object") return null;

    return (
      <ul className="space-y-1">
        {Object.entries(items).map(([key, value]) => {
          const isFolder = typeof value === "object" && value !== null;
          const path = key;
          const isExpanded = expandedFolders.has(path);

          return (
            <li key={key} style={{ marginLeft: `${depth * 20}px` }}>
              {isFolder ? (
                <div>
                  <button
                    onClick={() => toggleFolder(path)}
                    className="flex items-center gap-2 py-1 text-slate-700 hover:text-slate-900 font-medium"
                  >
                    <span className="w-5 text-center">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span>📁 {key}</span>
                  </button>
                  {isExpanded && renderFileTree(value, depth + 1)}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1 text-slate-600 text-sm">
                  <span className="w-5 text-center">📄</span>
                  <span>{key}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {/* Repository Info */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Repository Information</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Repository Type</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{repo.type}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Project Name</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{repo.name}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">Root Path</p>
            <p className="mt-2 font-mono text-sm text-slate-900 break-words">
              {repo.root}
            </p>
          </div>
        </div>
      </div>

      {/* File Structure */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Project Structure</h3>
        <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-50 p-4 font-mono text-sm text-slate-700">
          {repo.structure ? (
            renderFileTree(repo.structure)
          ) : (
            <p className="text-slate-600">No structure data available</p>
          )}
        </div>
      </div>

      {/* Key Files */}
      {Object.keys(repo.files).length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Key Files Detected</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(repo.files).map(([file, exists]) => (
              <div
                key={file}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  exists ? "bg-green-50" : "bg-slate-50"
                }`}
              >
                <span className={exists ? "text-green-600" : "text-slate-400"}>
                  {exists ? "✓" : "✗"}
                </span>
                <code className="text-sm font-mono text-slate-700">{file}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
