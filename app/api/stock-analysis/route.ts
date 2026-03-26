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
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY on server" },
        { status: 500 }
      );
    }

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey,
      temperature: 0.2,
    });

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

      const result = await llm.invoke(prompt);
      return { analysis: result.text };
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
