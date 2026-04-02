"use client";

import { useState } from "react";

interface TestCase {
  id: string;
  name: string;
  command: string;
  expected?: string;
}

export function TestCaseBuilder({
  projectId,
  testCases,
  onAddTestCase,
  onRemoveTestCase
}: {
  projectId: string;
  testCases: TestCase[];
  onAddTestCase: (test: TestCase) => void;
  onRemoveTestCase: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [expected, setExpected] = useState("");

  const handleAddTest = () => {
    if (name && command) {
      onAddTestCase({
        id: Date.now().toString(),
        name,
        command,
        expected: expected || undefined
      });
      setName("");
      setCommand("");
      setExpected("");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-slate-900">🧪 Test Case Builder</h3>
        <p className="mt-1 text-xs text-slate-500">Create test cases for your application</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Input Form */}
        <div className="space-y-3 rounded-lg bg-slate-50 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Test Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., User Login Test"
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-ocean focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Command</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., npm test -- --testNamePattern=login"
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-ocean focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase">Expected Output (Optional)</label>
            <textarea
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="e.g., PASS: All tests passed"
              rows={2}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-ocean focus:outline-none"
            />
          </div>

          <button
            onClick={handleAddTest}
            disabled={!name || !command}
            className="w-full rounded-lg bg-brand-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-ocean/90"
          >
            + Add Test Case
          </button>
        </div>

        {/* Test Cases List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 uppercase">Test Cases ({testCases.length})</p>
          {testCases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">No test cases yet. Create your first test case above.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testCases.map((test) => (
                <div key={test.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{test.name}</p>
                    <p className="mt-1 font-mono text-xs text-slate-600">{test.command}</p>
                    {test.expected && (
                      <p className="mt-1 text-xs text-slate-500">Expected: {test.expected}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveTestCase(test.id)}
                    className="ml-2 text-slate-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
