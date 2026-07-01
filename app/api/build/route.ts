import OpenAI from "openai";
import { NextResponse } from "next/server";

type StyleKey = "modern" | "editorial" | "startup" | "luxury";
type PageType = "landing" | "sales" | "portfolio";

type Palette = {
  bg: string;
  ink: string;
  muted: string;
  primary: string;
  secondary: string;
  surface: string;
};

type SiteSpec = {
  prompt: string;
  style: StyleKey;
  pageType: PageType;
  palette: Palette;
  name: string;
  industry: string;
  tone: string;
  sections: string[];
  headline: string;
  summaryPrefix: "auto" | "none";
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const hexPattern = "^#[0-9a-fA-F]{6}$";

const siteUpdateSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: {
      type: "string",
      minLength: 1,
      maxLength: 280
    },
    draft: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string", minLength: 1, maxLength: 1600 },
        style: { type: "string", enum: ["modern", "editorial", "startup", "luxury"] },
        pageType: { type: "string", enum: ["landing", "sales", "portfolio"] },
        palette: {
          type: "object",
          additionalProperties: false,
          properties: {
            bg: { type: "string", pattern: hexPattern },
            ink: { type: "string", pattern: hexPattern },
            muted: { type: "string", pattern: hexPattern },
            primary: { type: "string", pattern: hexPattern },
            secondary: { type: "string", pattern: hexPattern },
            surface: { type: "string", pattern: hexPattern }
          },
          required: ["bg", "ink", "muted", "primary", "secondary", "surface"]
        },
        name: { type: "string", minLength: 1, maxLength: 60 },
        industry: { type: "string", minLength: 1, maxLength: 80 },
        tone: { type: "string", minLength: 1, maxLength: 40 },
        sections: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: { type: "string", minLength: 1, maxLength: 40 }
        },
        headline: { type: "string", minLength: 1, maxLength: 110 },
        summaryPrefix: { type: "string", enum: ["auto", "none"] }
      },
      required: [
        "prompt",
        "style",
        "pageType",
        "palette",
        "name",
        "industry",
        "tone",
        "sections",
        "headline",
        "summaryPrefix"
      ]
    }
  },
  required: ["reply", "draft"]
} as const;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      draft?: SiteSpec;
      messages?: ChatMessage[];
      instruction?: string;
    };

    if (!body.draft || !body.instruction) {
      return NextResponse.json({ error: "Missing draft or instruction." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const recentMessages = (body.messages || []).slice(-8);

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You are the website builder inside SiteForge. Update the current website draft to satisfy the user's latest instruction. Preserve good parts of the current draft unless the user asks for a new direction. If the user asks to change colors, update the palette. If they ask to move sections, reorder the sections array. If they ask for a different business, rewrite the site spec. The prompt field is public hero body copy; do not append edit instructions, API key comments, deployment notes, or chat meta into it. If the user asks to remove the leading article from the short summary, set summaryPrefix to none. Reply concisely with what changed."
        },
        {
          role: "user",
          content: JSON.stringify({
            currentDraft: body.draft,
            recentChat: recentMessages,
            latestInstruction: body.instruction
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "site_update",
          strict: true,
          schema: siteUpdateSchema
        }
      }
    });

    const output = JSON.parse(response.output_text) as { draft: SiteSpec; reply: string };

    return NextResponse.json({
      reply: output.reply,
      draft: normalizeDraft(output.draft, body.draft)
    });
  } catch (error) {
    const detail = getSafeErrorMessage(error);
    return NextResponse.json({ error: "AI draft request failed.", detail }, { status: 502 });
  }
}

function getSafeErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; status?: unknown; code?: unknown };
    const parts = [
      typeof maybeError.status === "number" ? `status ${maybeError.status}` : null,
      typeof maybeError.code === "string" ? maybeError.code : null,
      typeof maybeError.message === "string" ? maybeError.message : null
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(": ");
    }
  }

  return "Unknown server error.";
}

function normalizeDraft(next: SiteSpec, fallback: SiteSpec): SiteSpec {
  return {
    prompt: next.prompt || fallback.prompt,
    style: next.style || fallback.style,
    pageType: next.pageType || fallback.pageType,
    palette: {
      bg: next.palette?.bg || fallback.palette.bg,
      ink: next.palette?.ink || fallback.palette.ink,
      muted: next.palette?.muted || fallback.palette.muted,
      primary: next.palette?.primary || fallback.palette.primary,
      secondary: next.palette?.secondary || fallback.palette.secondary,
      surface: next.palette?.surface || fallback.palette.surface
    },
    name: next.name || fallback.name,
    industry: next.industry || fallback.industry,
    tone: next.tone || fallback.tone,
    sections: next.sections?.length ? next.sections.slice(0, 6) : fallback.sections,
    headline: next.headline || fallback.headline,
    summaryPrefix: next.summaryPrefix || fallback.summaryPrefix
  };
}
