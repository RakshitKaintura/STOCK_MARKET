"use client";

import { FormEvent, useState } from "react";

type AnalysisResponse = {
  symbol: string;
  timeframe: string;
  riskProfile: string;
  stockData: string;
  analysis: string;
  error?: string;
};

const defaultResult: AnalysisResponse | null = null;

const parseSnapshot = (snapshot: string) => {
  return snapshot
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes(":"))
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return {
        label: label.trim(),
        value: rest.join(":").trim() || "-",
      };
    });
};

const formatAnalysisBlocks = (analysis: string) => {
  return analysis
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const getValueColorClass = (value: string) => {
  if (/(^|\s)\+\d|\+\d|\+\s*\d/.test(value) || /\bup\b/i.test(value)) {
    return "text-[#0FEDBE]";
  }

  if (/(^|\s)-\d|-\d/.test(value) || /\bdown\b/i.test(value)) {
    return "text-[#FF495B]";
  }

  return "text-white";
};

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState("ASIANPAINT");
  const [timeframe, setTimeframe] = useState("medium");
  const [riskProfile, setRiskProfile] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(defaultResult);
  const [error, setError] = useState("");

  const snapshotRows = result?.stockData ? parseSnapshot(result.stockData) : [];
  const analysisRows = result?.analysis ? formatAnalysisBlocks(result.analysis) : [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stock-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol, timeframe, riskProfile }),
      });

      const data = (await response.json()) as AnalysisResponse;

      if (!response.ok) {
        setResult(null);
        setError(data.error || "Failed to generate analysis");
        return;
      }

      setResult(data);
    } catch {
      setResult(null);
      setError("Unable to contact analysis server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e2e4e9] font-sans">
      <div className="max-w-350 mx-auto px-4 lg:px-8 py-7">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Stock Analysis</h1>
          <p className="text-[#7a7f8e] text-xs mt-1">
            LangGraph-powered insights for Indian stocks based on live snapshot data.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <aside className="bg-[#161922] border border-[#1e2128] rounded-xl p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4a017]">
                Analysis Inputs
              </h2>
              <span className="text-[11px] px-2 py-1 rounded bg-[#d4a017]/10 text-[#d4a017]">
                AI Ready
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7a7f8e]">
                  Stock Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  placeholder="ASIANPAINT"
                  className="w-full rounded-lg border border-[#2a2e39] bg-[#0f1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d4a017]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7a7f8e]">
                  Timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  className="w-full rounded-lg border border-[#2a2e39] bg-[#0f1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d4a017]"
                >
                  <option value="short">Short Term</option>
                  <option value="medium">Medium Term</option>
                  <option value="long">Long Term</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7a7f8e]">
                  Risk Profile
                </label>
                <select
                  value={riskProfile}
                  onChange={(event) => setRiskProfile(event.target.value)}
                  className="w-full rounded-lg border border-[#2a2e39] bg-[#0f1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#d4a017]"
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#d4a017] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e2b63b] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Run Analysis"}
              </button>
            </form>

            <div className="mt-4 text-[11px] text-[#7a7f8e] leading-relaxed border-t border-[#232730] pt-3">
              Tip: Use NSE style symbols for best results, like ASIANPAINT, INFY, or SBIN.
            </div>
          </aside>

          <section className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <div className="rounded-xl border border-[#1e2128] bg-[#161922] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#232730] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Snapshot Data</h3>
                <span className="text-xs text-[#7a7f8e]">
                  {result?.symbol || `${symbol.toUpperCase()} (pending)`}
                </span>
              </div>
              <div className="p-5">
                {snapshotRows.length > 0 ? (
                  <div className="watchlist-table">
                    <table className="w-full text-sm">
                      <colgroup>
                        <col className="w-[38%]" />
                        <col className="w-[62%]" />
                      </colgroup>
                      <thead>
                        <tr className="table-header-row">
                          <th className="table-header text-left px-4 py-3">Metric</th>
                          <th className="table-header text-left px-4 py-3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshotRows.map((row) => (
                          <tr key={row.label} className="table-row">
                            <td className="table-cell px-4 py-3 text-[#c7cad2]">{row.label}</td>
                            <td className={`table-cell px-4 py-3 ${getValueColorClass(row.value)}`}>
                              {row.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[#7a7f8e] min-h-30 flex items-center">
                    Run analysis to load the latest stock snapshot.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#1e2128] bg-[#161922] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#232730]">
                <h3 className="text-sm font-semibold text-white">LangGraph Analysis</h3>
              </div>
              <div className="p-5">
                {analysisRows.length > 0 ? (
                  <div className="space-y-2 min-h-60">
                    {analysisRows.map((line, index) => {
                      const isHeading = /^\d\)|^\d\.|^#+/.test(line);
                      return (
                        <p
                          key={`${line}-${index}`}
                          className={isHeading ? "text-[#d4a017] font-semibold text-sm" : "text-[#d6d8df] text-sm leading-relaxed"}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[#7a7f8e] min-h-60 flex items-center">
                    Your AI-generated analysis will appear here after submitting the form.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
