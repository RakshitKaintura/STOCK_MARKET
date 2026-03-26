import { NextResponse } from "next/server";

import { getNews } from "@/lib/actions/finnhub.actions";

export const revalidate = 1800;

export async function GET() {
  try {
    const newsItems = await getNews();

    const data = newsItems.map((item) => ({
      title: item.headline,
      description: item.summary,
      source: {
        name: item.source,
        url: item.url,
      },
      url: item.url,
      publishedAt: item.datetime,
    }));

    return NextResponse.json({ articles: data });
  } catch (error) {
    console.error("Failed to fetch market news", error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
