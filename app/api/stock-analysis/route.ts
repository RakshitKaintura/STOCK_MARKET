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
  const metricMap = Object.fromEntries(
    stockDataText
      .split("\n")
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map(([label, ...value]) => [
        label.trim().toLowerCase(),
        value.join(":").trim(),
      ])
  );

  const changeLine = metricMap["change"];
  const pctMatch = changeLine?.match(/([+-]?\d+(?:\.\d+)?)%/);
  const changePercent = pctMatch ? Number(pctMatch[1]) : 0;

  const trend =
    changePercent > 0 ? "Bullish bias" : changePercent < 0 ? "Bearish bias" : "Sideways";
  const confidence =
    Math.abs(changePercent) > 2 ? "High" : Math.abs(changePercent) > 0.7 ? "Medium" : "Low";
  const pe = metricMap["p/e ratio"] || "—";
  const roe = metricMap["roe"] || "—";
  const debtToEquity = metricMap["debt to equity"] || "—";
  const rsi = metricMap["rsi (14)"] || "—";
  const volatility = metricMap["annualized volatility"] || "—";
  const sector = metricMap["sector"] || "—";
  const industry = metricMap["industry"] || "—";

  const riskNote =
    riskProfile === "conservative"
      ? "Prefer staggered entries, tighter stops, and avoid high-beta names."
      : riskProfile === "aggressive"
      ? "Higher volatility may be acceptable, but position sizing and exit rules are essential."
      : "Use balanced allocation with predefined stop-loss and review milestones.";

  const horizonPlan =
    timeframe === "short"
      ? "Focus on momentum, RSI regime shifts, and strict invalidation levels."
      : timeframe === "long"
      ? "Prioritize business quality, valuation discipline, and earnings consistency over price noise."
      : "Blend technical trend confirmation with valuation and financial quality checks.";

  return [
    "1) Executive Summary",
    `Current market tone is ${trend} (${changePercent.toFixed(2)}%). The stock sits in ${sector} / ${industry} with ${confidence.toLowerCase()} conviction based on available data.`,
    "",
    "2) Fundamental Analysis",
    `Valuation signal: P/E ${pe}; profitability signal: ROE ${roe}; leverage check: Debt-to-Equity ${debtToEquity}.`,
    "Use these metrics together before deciding position size.",
    "",
    "3) Technical Analysis",
    `Momentum check: RSI(14) ${rsi}; volatility profile: ${volatility}.`,
    "Track support and resistance behavior before fresh entries.",
    "",
    "4) Industry and Peer Context",
    "Compare valuation and growth against direct sector peers before finalizing conviction.",
    "",
    "5) Risk Assessment",
    riskNote,
    "",
    "6) Action Plan",
    horizonPlan,
    "",
    "7) Monitoring Checklist",
    "Review revenue/EPS trend, margin direction, debt trajectory, shareholding trend, and major company news each quarter.",
    "",
    "8) Confidence (Low/Medium/High)",
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
        `Sector: ${fallbackData.sector}`,
        `Industry: ${fallbackData.industry}`,
        `Current Price: ${fallbackData.priceFormatted}`,
        `Change: ${fallbackData.changeFormatted}`,
        `52W Range: ${fallbackData.fiftyTwoWeekLow} - ${fallbackData.fiftyTwoWeekHigh}`,
        `50D Avg: ${fallbackData.fiftyDayAverage}`,
        `200D Avg: ${fallbackData.twoHundredDayAverage}`,
        `RSI (14): ${fallbackData.technical?.rsi14 ?? "—"}`,
        `SMA 20: ${fallbackData.technical?.sma20 ?? "—"}`,
        `SMA 50: ${fallbackData.technical?.sma50 ?? "—"}`,
        `Annualized Volatility: ${fallbackData.technical?.annualizedVolatility ?? "—"}`,
        `P/E Ratio: ${fallbackData.peRatio}`,
        `P/B Ratio: ${fallbackData.pbRatio}`,
        `ROE: ${fallbackData.roe}`,
        `Debt to Equity: ${fallbackData.debtToEquity}`,
        `Net Margin: ${fallbackData.netMargin}`,
        `Operating Margin: ${fallbackData.operatingMargin}`,
        `Revenue Growth: ${fallbackData.revenueGrowth}`,
        `Earnings Growth: ${fallbackData.earningsGrowth}`,
        `EPS (TTM): ${fallbackData.epsTrailing}`,
        `EPS (Forward): ${fallbackData.epsForward}`,
        `Current Ratio: ${fallbackData.currentRatio}`,
        `Quick Ratio: ${fallbackData.quickRatio}`,
        `Dividend Yield: ${fallbackData.dividendYield}`,
        `Beta: ${fallbackData.beta}`,
        `Free Cash Flow: ${fallbackData.freeCashflow}`,
        `Operating Cash Flow: ${fallbackData.operatingCashflow}`,
        `Analyst Target Price: ${fallbackData.targetMeanPrice}`,
        `Analyst Recommendation: ${fallbackData.recommendationKey}`,
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
        "Do not fabricate missing values; explicitly call out unavailable data.",
        `Investor risk profile: ${state.riskProfile}`,
        `Time horizon: ${state.timeframe}`,
        "Create practical output in markdown with exactly these numbered sections:",
        "1) Executive Summary",
        "2) Fundamental Analysis",
        "3) Technical Analysis",
        "4) Industry and Peer Context",
        "5) Risk Assessment",
        "6) Action Plan",
        "7) Monitoring Checklist",
        "8) Confidence (Low/Medium/High)",
        "Fundamental Analysis must include valuation, profitability, growth, leverage, and cash flow quality observations from the provided data.",
        "Technical Analysis must include trend/momentum context using RSI/SMA and volatility from provided data.",
        "Risk Assessment must mention business, valuation, and macro/policy risks.",
        "Action Plan must be specific to the selected timeframe and risk profile.",
        "Keep each section concise but useful, ideally 2 to 5 bullets.",
        "Do not guarantee returns and include exactly one caution line at the end.",
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
