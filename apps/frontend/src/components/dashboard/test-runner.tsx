"use client";

import { useEffect, useState } from "react";

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  output: string;
}

export function TestRunner({
  testCases,
  results,
  isRunning,
  onRun
}: {
  testCases: Array<{ id: string; name: string; command: string }>;
  results: TestResult[];
  isRunning: boolean;
  onRun: () => void;
}) {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-slate-900">▶ Test Runner</h3>
        <p className="mt-1 text-xs text-slate-500">Execute and monitor test results</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Control */}
        <button
          onClick={onRun}
          disabled={testCases.length === 0 || isRunning}
          className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50 hover:bg-green-700"
        >
          {isRunning ? "⏳ Running Tests..." : "▶ Run All Tests"}
        </button>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{results.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xs text-green-700 uppercase font-semibold">Passed</p>
              <p className="mt-1 text-lg font-bold text-green-700">{passedCount}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-xs text-red-700 uppercase font-semibold">Failed</p>
              <p className="mt-1 text-lg font-bold text-red-700">{failedCount}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {results.length > 0 && (
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${(passedCount / results.length) * 100}%` }}
            />
          </div>
        )}

        {/* Results List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 uppercase">Results</p>
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">Run tests to see results</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    result.passed
                      ? "border-green-200 bg-green-50 hover:bg-green-100"
                      : "border-red-200 bg-red-50 hover:bg-red-100"
                  }`}
                  onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${result.passed ? "text-green-900" : "text-red-900"}`}>
                        {result.passed ? "✓" : "✗"} {result.name}
                      </p>
                    </div>
                    <span className="text-xs">{expandedResult === result.id ? "▼" : "▶"}</span>
                  </div>

                  {expandedResult === result.id && (
                    <div className="mt-2 rounded bg-slate-100 p-2 font-mono text-xs text-slate-700">
                      {result.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Results */}
        {results.length > 0 && (
          <button className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            📥 Export Results
          </button>
        )}
      </div>
    </div>
  );
}
