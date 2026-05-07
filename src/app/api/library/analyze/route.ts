import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType, topicContext } = (await request.json()) as {
      imageBase64: string;
      mediaType: string;
      topicContext?: string;
    };

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 },
      );
    }

    const contextLine = topicContext
      ? `You are analyzing an image from a ${topicContext} collection.`
      : "You are analyzing an image.";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `${contextLine}\nList 3-8 descriptive keyword tags for this image.\nFocus on: setting/environment, notable features, mood/lighting, scale.\nReturn ONLY a JSON array of lowercase strings. No other text.`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === "string");
      }
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          tags = JSON.parse(match[0]);
        } catch {
          /* fallback: no tags */
        }
      }
    }

    return NextResponse.json({ tags });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
