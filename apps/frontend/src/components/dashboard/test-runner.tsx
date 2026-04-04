"use client";

import { useState } from "react";

interface TestCase {
  id: string;
  name: string;
  command: string;
  expected?: string;
}

interface TestResult {
  id: string;
  name: string;
  command: string;
  passed: boolean;
  output: string;
  durationMs?: number;
}

export function TestRunner({
  testCases,
  results,
  isRunning,
  error,
  onRun
}: {
  testCases: TestCase[];
  results: TestResult[];
  isRunning: boolean;
  error?: string | null;
  onRun: () => void;
}) {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  const exportResults = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `test-results-${new Date().toISOString().replace(/[.:]/g, "-")}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

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

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Error running tests</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <>
            {results.length !== testCases.length && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-700 text-xs">
                <p className="font-semibold">⚠️ Test Count Mismatch</p>
                <p className="mt-1">Ran {results.length} tests but expected {testCases.length}. Some tests may not have executed.</p>
              </div>
            )}
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
          </>
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
                  role="button"
                  tabIndex={0}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    result.passed
                      ? "border-green-200 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      : "border-red-200 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  }`}
                  onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedResult(expandedResult === result.id ? null : result.id);
                    }
                  }}
                  aria-expanded={expandedResult === result.id}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${result.passed ? "text-green-900" : "text-red-900"}`}>
                        {result.passed ? "✓" : "✗"} {result.name}
                      </p>
                      <p className="mt-1 text-[11px] font-mono text-slate-600">{result.command}</p>
                      {typeof result.durationMs === "number" && (
                        <p className="text-[11px] text-slate-500">{result.durationMs}ms</p>
                      )}
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
          <button
            onClick={exportResults}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            📥 Export Results
          </button>
        )}
      </div>
    </div>
  );
}
