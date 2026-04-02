"use client";

import { useState } from "react";
import { RepositoryDetails } from "./repository-details";
import { BuildScriptEditor } from "./build-script-editor";
import { BuildRunner } from "./build-runner";
import { PipelineSimulator } from "./pipeline-simulator";
import { DeploymentSimulator } from "./deployment-simulator";
import { TestCaseBuilder } from "./test-case-builder";
import { TestRunner } from "./test-runner";
import { useMutation } from "@tanstack/react-query";

type Tab = "overview" | "repository" | "build" | "pipeline" | "tests" | "deployment";

interface BuildScript {
  id?: string;
  name: string;
  language: string;
  script: string;
}

interface TestCase {
  id: string;
  name: string;
  command: string;
  expected?: string;
}

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  output: string;
}

interface ProjectWorkspaceProps {
  projectId: string;
  onBack?: () => void;
}

export function ProjectWorkspace({ projectId, onBack }: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [buildScript, setBuildScript] = useState<BuildScript | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const tabs: Array<{ id: Tab; label: string; icon: string; description: string }> = [
    { id: "overview", label: "Overview", icon: "🏠", description: "Project status and quick actions" },
    { id: "repository", label: "Repository", icon: "📁", description: "Project structure and files" },
    { id: "build", label: "Build", icon: "🔨", description: "Build automation and execution" },
    { id: "pipeline", label: "Pipeline", icon: "⚙️", description: "CI/CD pipeline configuration" },
    { id: "tests", label: "Tests", icon: "🧪", description: "Test cases and execution" },
    { id: "deployment", label: "Deploy", icon: "🚀", description: "Deployment simulation" }
  ];

  const runTests = useMutation({
    mutationFn: async (tests: TestCase[]) => {
      setTestRunning(true);
      const results = await Promise.all(
        tests.map(async (test) => {
          // Simulate test execution
          const passed = Math.random() > 0.3;
          return {
            id: test.id,
            name: test.name,
            passed,
            output: passed
              ? `✓ ${test.name} passed in 245ms`
              : `✗ ${test.name} failed: assertion error on line 42`
          };
        })
      );
      setTestRunning(false);
      return results;
    },
    onSuccess: (results) => {
      setTestResults(results);
    }
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-4 py-4 text-center font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-b-brand-ocean text-brand-ocean bg-blue-50/30"
                    : "border-b-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                <p className="text-xs text-slate-500 mt-1">{tab.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-600">Pipeline Status</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {pipelineId ? "✓ Ready" : "○ Not configured"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-600">Build Script</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {buildScript ? "✓ Created" : "○ Not created"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-600">Tests</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {testCases.length} test{testCases.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Getting Started</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ocean text-white text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Explore Repository</p>
                    <p className="text-sm text-slate-600">Review your project structure and files</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ocean text-white text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Create Build Script</p>
                    <p className="text-sm text-slate-600">Configure your build automation (Dockerfile, Bash, or YAML)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ocean text-white text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Run Build</p>
                    <p className="text-sm text-slate-600">Execute your build script and see live CLI output</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ocean text-white text-xs font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Configure Pipeline</p>
                    <p className="text-sm text-slate-600">Set up your CI/CD pipeline stages</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ocean text-white text-xs font-bold">
                    5
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Add Tests & Deploy</p>
                    <p className="text-sm text-slate-600">Create test cases and configure deployment</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setActiveTab("repository")}
                  className="rounded-lg bg-brand-ocean/10 px-4 py-2 font-semibold text-brand-ocean hover:bg-brand-ocean/20"
                >
                  📁 View Repository
                </button>
                <button
                  onClick={() => setActiveTab("build")}
                  className="rounded-lg bg-brand-ocean/10 px-4 py-2 font-semibold text-brand-ocean hover:bg-brand-ocean/20"
                >
                  🔨 Create Build Script
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "repository" && <RepositoryDetails projectId={projectId} />}

        {activeTab === "build" && (
          <div className="space-y-6">
            <BuildScriptEditor
              projectId={projectId}
              onScriptSaved={(script) => setBuildScript(script)}
            />

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Quick Build</h3>
                <p className="text-sm text-slate-600">Run auto-detected build commands without creating a custom script</p>
              </div>
              <BuildRunner projectId={projectId} scriptId={buildScript?.id} />
            </div>
          </div>
        )}

        {activeTab === "pipeline" && (
          <PipelineSimulator
            projectId={projectId}
            onPipelineReady={setPipelineId}
            pipelineId={pipelineId}
          />
        )}

        {activeTab === "tests" && (
          <div className="grid grid-cols-2 gap-6">
            <TestCaseBuilder
              projectId={projectId}
              testCases={testCases}
              onAddTestCase={(test) => setTestCases([...testCases, test])}
              onRemoveTestCase={(id) => setTestCases(testCases.filter((t) => t.id !== id))}
            />
            <TestRunner
              testCases={testCases}
              results={testResults}
              isRunning={testRunning}
              onRun={() => runTests.mutate(testCases)}
            />
          </div>
        )}

        {activeTab === "deployment" && (
          <DeploymentSimulator projectId={projectId} pipelineId={pipelineId} />
        )}
      </div>
    </div>
  );
}
