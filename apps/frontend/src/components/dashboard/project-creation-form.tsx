"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { githubApi } from "@/lib/github-api";

interface ProjectCreationFormProps {
  onSuccess: (projectId: string) => void;
  onCancel: () => void;
}

interface StageState {
  currentStage: "name" | "method" | "upload" | "github" | "analyzing" | "review";
}

type ImportMethod = "zip" | "github";

export function ProjectCreationForm({ onSuccess, onCancel }: ProjectCreationFormProps) {
  const [stage, setStage] = useState<StageState["currentStage"]>("name");
  const [projectName, setProjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [importMethod, setImportMethod] = useState<ImportMethod>("zip");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [repoValidating, setRepoValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/projects", {
        name,
        description: "CI/CD Pipeline Project"
      });
      return data;
    },
    onSuccess: (data) => {
      setProjectId(data.id);
      setStage("method");
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      setStage("analyzing");
      const { data } = await api.post(`/projects/${projectId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return data;
    },
    onSuccess: () => {
      setStage("review");
    }
  });

  const githubImportMutation = useMutation({
    mutationFn: async () => {
      setStage("analyzing");
      const { data } = await githubApi.importRepository(projectId!, githubUrl, {
        token: githubToken || undefined,
        branch: selectedBranch
      });
      return data;
    },
    onSuccess: () => {
      setStage("review");
    }
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      createProjectMutation.mutate(projectName);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".zip")) {
      setSelectedFile(file);
    } else {
      alert("Please select a valid ZIP file");
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleValidateRepository = async () => {
    if (!githubUrl.trim()) {
      alert("Please enter repository URL");
      return;
    }

    setRepoValidating(true);
    try {
      // Parse owner/repo format from URL or convert if needed
      let repoPath = githubUrl;
      if (githubUrl.includes("github.com/")) {
        const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
        if (match) {
          repoPath = match[1];
        }
      }

      const info = await githubApi.getRepositoryInfo(repoPath, githubToken || undefined);
      if (info) {
        setRepoInfo(info);
      } else {
        alert("Repository not found. Please check the URL and token.");
        setRepoInfo(null);
      }
    } catch (error) {
      alert("Failed to validate repository");
      setRepoInfo(null);
    } finally {
      setRepoValidating(false);
    }
  };

  const handleGithubImport = () => {
    if (!repoInfo) {
      alert("Please validate the repository first");
      return;
    }
    githubImportMutation.mutate();
  };

  const getProgressSteps = () => {
    if (importMethod === "github") {
      return ["name", "method", "github", "analyzing", "review"];
    }
    return ["name", "method", "upload", "analyzing", "review"];
  };

  const steps = getProgressSteps();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-slate-200 bg-white shadow-lg">
        {/* Progress indicator */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    steps.indexOf(stage) >= idx
                      ? "bg-brand-ocean text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-1 w-12 ${
                      steps.indexOf(stage) > idx ? "bg-brand-ocean" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {stage === "name" && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">Create New Project</h2>
              <p className="mb-6 text-slate-600">
                Give your CI/CD project a name. You'll set up your repository in the next step.
              </p>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., My App Pipeline"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-brand-ocean focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!projectName.trim() || createProjectMutation.isPending}
                    className="flex-1 rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90 disabled:opacity-50"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Next"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {stage === "method" && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">Choose Repository Source</h2>
              <p className="mb-6 text-slate-600">
                How would you like to import your repository code?
              </p>

              <div className="grid gap-4">
                <button
                  onClick={() => {
                    setImportMethod("zip");
                    setStage("upload");
                  }}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    importMethod === "zip"
                      ? "border-brand-ocean bg-blue-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="text-2xl mb-2">📦</div>
                  <div className="font-semibold text-slate-900">Upload ZIP File</div>
                  <div className="text-sm text-slate-600">Upload a ZIP archive of your project</div>
                </button>

                <button
                  onClick={() => {
                    setImportMethod("github");
                    setStage("github");
                  }}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    importMethod === "github"
                      ? "border-brand-ocean bg-blue-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="text-2xl mb-2">🐙</div>
                  <div className="font-semibold text-slate-900">Import from GitHub</div>
                  <div className="text-sm text-slate-600">Clone directly from a GitHub repository</div>
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStage("name")}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {stage === "upload" && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">Upload Repository</h2>
              <p className="mb-6 text-slate-600">
                Upload your project as a ZIP file. We'll analyze the structure and auto-generate your pipeline.
              </p>

              <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="mb-4 text-4xl">📦</div>
                <p className="mb-4 font-semibold text-slate-900">
                  {selectedFile ? selectedFile.name : "Choose ZIP file"}
                </p>
                <p className="mb-4 text-sm text-slate-600">
                  {selectedFile
                    ? "Ready to upload"
                    : "Click to select or drag and drop your repository ZIP"}
                </p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90"
                >
                  {selectedFile ? "Change File" : "Select File"}
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStage("method")}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="flex-1 rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90 disabled:opacity-50"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          )}

          {stage === "github" && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">Import from GitHub</h2>
              <p className="mb-6 text-slate-600">
                Enter your GitHub repository URL. You can optionally provide a personal access token for private repositories.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Repository URL</label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="e.g., https://github.com/owner/repo or owner/repo"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-brand-ocean focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    GitHub Token (Optional)
                  </label>
                  <p className="mb-2 text-xs text-slate-500">
                    Required for private repositories. Get your token from{" "}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-ocean hover:underline"
                    >
                      GitHub settings
                    </a>
                  </p>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="github_pat_..."
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-brand-ocean focus:outline-none"
                  />
                </div>

                {repoInfo && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✓</div>
                      <div>
                        <div className="font-semibold text-slate-900">{repoInfo.name}</div>
                        <p className="text-sm text-slate-600">{repoInfo.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-block rounded bg-slate-200 px-2 py-1 text-xs">
                            {repoInfo.defaultBranch}
                          </span>
                          {repoInfo.isPrivate && (
                            <span className="inline-block rounded bg-yellow-200 px-2 py-1 text-xs">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {repoInfo && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Branch</label>
                    <input
                      type="text"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      placeholder="main"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-brand-ocean focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleValidateRepository}
                    disabled={repoValidating || !githubUrl.trim()}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {repoValidating ? "Validating..." : "Validate Repository"}
                  </button>
                  <button
                    onClick={handleGithubImport}
                    disabled={!repoInfo || githubImportMutation.isPending}
                    className="flex-1 rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90 disabled:opacity-50"
                  >
                    {githubImportMutation.isPending ? "Importing..." : "Import"}
                  </button>
                </div>

                <button
                  onClick={() => setStage("method")}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 mt-2"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {stage === "analyzing" && (
            <div className="text-center">
              <h2 className="mb-6 text-xl font-bold text-slate-900">Analyzing Repository</h2>
              <div className="mb-6 inline-block">
                <div className="animate-spin text-4xl">🔄</div>
              </div>
              <p className="text-slate-600">
                We're analyzing your project structure and generating your pipeline...
              </p>
              <p className="mt-3 text-sm text-slate-500">
                This usually takes a few seconds
              </p>
            </div>
          )}

          {stage === "review" && projectId && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">Repository Ready! 🎉</h2>
              <div className="rounded-lg bg-green-50 p-4 mb-6">
                <p className="text-green-800">
                  ✓ Project created and repository analyzed successfully!
                </p>
              </div>

              <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Project ID</label>
                  <p className="font-mono text-slate-900">{projectId}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <p className="text-green-700">Ready for pipeline configuration</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Create Another
                </button>
                <button
                  onClick={() => onSuccess(projectId)}
                  className="flex-1 rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white hover:bg-brand-ocean/90"
                >
                  Open Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
