import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { getStocksDetails } from "@/lib/actions/finnhub.actions";

export const runtime = "nodejs";

type AnalysisRequest = {
  symbol: string;
  timeframe?: "short" | "medium" | "long";
  riskProfile?: "conservative" | "balanced" | "aggressive";
};

const parseModelText = (response: unknown): string => {
  const maybeMessage = response as {
    content?: unknown;
    text?: string | (() => string);
  };

  if (typeof maybeMessage?.text === "function") {
    const value = maybeMessage.text();
    if (value?.trim()) return value;
  }

  if (typeof maybeMessage?.text === "string" && maybeMessage.text.trim()) {
    return maybeMessage.text;
  }

  const content = maybeMessage?.content;
  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          const textValue = (item as { text?: unknown }).text;
          return typeof textValue === "string" ? textValue : "";
        }
        return "";
      })
      .join("\n")
      .trim();

    if (merged) return merged;
  }

  return "";
};

const buildFallbackAnalysis = (
  stockDataText: string,
  timeframe: string,
  riskProfile: string,
  reason?: string
) => {
  const changeLine = stockDataText
    .split("\n")
    .find((line) => line.toLowerCase().startsWith("change:"));

  const pctMatch = changeLine?.match(/([+-]?\d+(?:\.\d+)?)%/);
  const changePercent = pctMatch ? Number(pctMatch[1]) : 0;

  const trend = changePercent > 0 ? "Bullish bias" : changePercent < 0 ? "Bearish bias" : "Sideways";
  const confidence = Math.abs(changePercent) > 2 ? "High" : Math.abs(changePercent) > 0.7 ? "Medium" : "Low";

  const riskNote =
    riskProfile === "conservative"
      ? "Prefer staggered entry and tight downside control."
      : riskProfile === "aggressive"
      ? "Higher volatility acceptable, but position sizing is critical."
      : "Use balanced allocation with predefined stop-loss levels.";

  const horizonPlan =
    timeframe === "short"
      ? "Track momentum and volume each session; avoid oversized intraday exposure."
      : timeframe === "long"
      ? "Focus on business quality and valuation discipline over price noise."
      : "Blend trend follow-through with valuation checks before adding quantity.";

  return [
    "1) Snapshot",
    `Market tone from latest move: ${trend} (${changePercent.toFixed(2)}%).`,
    "",
    "2) Technical View",
    "Price action suggests monitoring support/resistance from recent swing levels before fresh entries.",
    "",
    "3) Risk Notes",
    riskNote,
    "",
    "4) Action Plan",
    horizonPlan,
    "",
    `5) Confidence (Low/Medium/High)`,
    confidence,
    "",
    "Caution: This is informational analysis, not guaranteed investment advice.",
    reason ? `Note: AI model fallback used (${reason}).` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const normalizeSymbol = (raw: string) => {
  const input = raw.trim().toUpperCase().replace(/\s+/g, "");

  if (input.includes(".")) {
    return input;
  }

  return `${input}.NS`;
};

const AnalysisState = Annotation.Root({
  symbol: Annotation<string>,
  timeframe: Annotation<string>,
  riskProfile: Annotation<string>,
  stockDataText: Annotation<string>,
  analysis: Annotation<string>,
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalysisRequest;

    if (!body?.symbol || !body.symbol.trim()) {
      return NextResponse.json(
        { error: "Stock symbol is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const llm = apiKey
      ? new ChatGoogleGenerativeAI({
          model: "gemini-1.5-flash",
          apiKey,
          temperature: 0.2,
        })
      : null;

    const fetchStockNode = async (state: typeof AnalysisState.State) => {
      const normalized = normalizeSymbol(state.symbol);
      const primaryData = await getStocksDetails(normalized);
      const fallbackData = primaryData ?? (await getStocksDetails(state.symbol));

      if (!fallbackData) {
        return {
          stockDataText:
            "No live stock details found for the requested symbol.",
        };
      }

      const details = [
        `Symbol: ${fallbackData.symbol}`,
        `Company: ${fallbackData.company}`,
        `Current Price: ${fallbackData.priceFormatted}`,
        `Change: ${fallbackData.changeFormatted}`,
        `P/E Ratio: ${fallbackData.peRatio}`,
        `Market Cap: ${fallbackData.marketCapFormatted}`,
      ].join("\n");

      return { stockDataText: details };
    };

    const analyzeNode = async (state: typeof AnalysisState.State) => {
      if (!llm) {
        return {
          analysis: buildFallbackAnalysis(
            state.stockDataText,
            state.timeframe,
            state.riskProfile,
            "GEMINI_API_KEY missing"
          ),
        };
      }

      const prompt = [
        "You are an Indian stock market analysis assistant.",
        "Use only the provided stock snapshot.",
        `Investor risk profile: ${state.riskProfile}`,
        `Time horizon: ${state.timeframe}`,
        "Create concise output in markdown with exactly these sections:",
        "1) Snapshot",
        "2) Technical View",
        "3) Risk Notes",
        "4) Action Plan",
        "5) Confidence (Low/Medium/High)",
        "Do not guarantee returns and include one caution line.",
        "",
        "Stock snapshot:",
        state.stockDataText,
      ].join("\n");

      try {
        const result = await llm.invoke(prompt);
        const analysisText = parseModelText(result);

        if (!analysisText) {
          return {
            analysis: buildFallbackAnalysis(
              state.stockDataText,
              state.timeframe,
              state.riskProfile,
              "Empty model response"
            ),
          };
        }

        return { analysis: analysisText };
      } catch (error) {
        console.error("LLM analysis failed, falling back:", error);
        return {
          analysis: buildFallbackAnalysis(
            state.stockDataText,
            state.timeframe,
            state.riskProfile,
            "Provider error"
          ),
        };
      }
    };

    const graph = new StateGraph(AnalysisState)
      .addNode("fetch_stock", fetchStockNode)
      .addNode("analyze", analyzeNode)
      .addEdge(START, "fetch_stock")
      .addEdge("fetch_stock", "analyze")
      .addEdge("analyze", END)
      .compile();

    const result = await graph.invoke({
      symbol: body.symbol,
      timeframe: body.timeframe ?? "medium",
      riskProfile: body.riskProfile ?? "balanced",
      stockDataText: "",
      analysis: "",
    });

    return NextResponse.json({
      symbol: normalizeSymbol(body.symbol),
      timeframe: body.timeframe ?? "medium",
      riskProfile: body.riskProfile ?? "balanced",
      stockData: result.stockDataText,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("Stock analysis route error:", error);
    return NextResponse.json(
      { error: "Unable to generate stock analysis" },
      { status: 500 }
    );
  }
}
