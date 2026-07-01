"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bot,
  Code2,
  Copy,
  Download,
  FileStack,
  LayoutDashboard,
  Monitor,
  RefreshCcw,
  Send,
  Settings,
  Sparkles,
  Smartphone
} from "lucide-react";

type StyleKey = "modern" | "editorial" | "startup" | "luxury";
type PageType = "landing" | "sales" | "portfolio";
type CodeTab = "html" | "css" | "js";
type Device = "desktop" | "mobile";
type Role = "assistant" | "user";

type Palette = {
  bg: string;
  ink: string;
  muted: string;
  primary: string;
  secondary: string;
  surface: string;
};

type ChatMessage = {
  id: number;
  role: Role;
  content: string;
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

type GeneratedSite = {
  html: string;
  css: string;
  js: string;
  name: string;
  summary: string;
};

const defaultPrompt =
  "Create a modern landing page for a boutique fitness studio called Pulse House. It should feel energetic, premium, and welcoming. Include classes, trainers, pricing, testimonials, and a strong sign-up call to action.";

const palettes: Record<StyleKey, Palette> = {
  modern: {
    bg: "#f7faf9",
    ink: "#13201f",
    muted: "#5d6967",
    primary: "#0f766e",
    secondary: "#c9802e",
    surface: "#ffffff"
  },
  editorial: {
    bg: "#f5f1e8",
    ink: "#201b16",
    muted: "#6d655c",
    primary: "#912f40",
    secondary: "#28666e",
    surface: "#fffdf8"
  },
  startup: {
    bg: "#f4f8ff",
    ink: "#13233a",
    muted: "#5b6778",
    primary: "#2454d6",
    secondary: "#0e9f6e",
    surface: "#ffffff"
  },
  luxury: {
    bg: "#f8f6f1",
    ink: "#1d1b18",
    muted: "#686159",
    primary: "#6f3d16",
    secondary: "#a57939",
    surface: "#fffefa"
  }
};

const colorRequests: Array<[string, Palette, string]> = [
  [
    "dark",
    {
      bg: "#101318",
      ink: "#f7fafc",
      muted: "#a8b3c2",
      primary: "#38bdf8",
      secondary: "#f59e0b",
      surface: "#171d25"
    },
    "dark blue theme"
  ],
  [
    "green",
    {
      bg: "#f3fbf7",
      ink: "#11231c",
      muted: "#587066",
      primary: "#15803d",
      secondary: "#d97706",
      surface: "#ffffff"
    },
    "fresh green theme"
  ],
  [
    "purple",
    {
      bg: "#f8f5ff",
      ink: "#211832",
      muted: "#6d627c",
      primary: "#7c3aed",
      secondary: "#db2777",
      surface: "#ffffff"
    },
    "purple theme"
  ],
  [
    "orange",
    {
      bg: "#fff8f0",
      ink: "#251b12",
      muted: "#76675a",
      primary: "#ea580c",
      secondary: "#0f766e",
      surface: "#ffffff"
    },
    "warm orange theme"
  ],
  [
    "pink",
    {
      bg: "#fff5f8",
      ink: "#2b1720",
      muted: "#755f68",
      primary: "#db2777",
      secondary: "#0d9488",
      surface: "#ffffff"
    },
    "pink theme"
  ],
  [
    "blue",
    {
      bg: "#f4f8ff",
      ink: "#13233a",
      muted: "#5b6778",
      primary: "#2563eb",
      secondary: "#0f766e",
      surface: "#ffffff"
    },
    "blue theme"
  ],
  [
    "yellow",
    {
      bg: "#fffbe8",
      ink: "#211c0c",
      muted: "#746942",
      primary: "#d4a017",
      secondary: "#0f766e",
      surface: "#ffffff"
    },
    "yellow theme"
  ]
];

const initialSpec = createSpec(defaultPrompt, "modern", "landing");
const appChromeTerms = [
  "dashboard",
  "projects",
  "templates",
  "settings",
  "left menu",
  "side menu",
  "sidebar",
  "side bar",
  "left sidebar",
  "left side bar",
  "chat",
  "chatbox",
  "chat box",
  "builder chat",
  "generated code",
  "live preview",
  "siteforge",
  "workspace",
  "build credits",
  "chat history",
  "chat composer"
];

export default function Home() {
  const [draft, setDraft] = useState<SiteSpec>(initialSpec);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Tell me what to build, then keep asking for changes until you are happy with the outcome. I can update the theme, rewrite the site, or move sections such as pricing, testimonials, classes, or services."
    }
  ]);
  const [activeTab, setActiveTab] = useState<CodeTab>("html");
  const [device, setDevice] = useState<Device>("desktop");
  const [status, setStatus] = useState("Ready for your next instruction.");

  const generated = useMemo(() => createSite(draft), [draft]);
  const code = generated[activeTab];

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const instruction = cleanText(chatInput);
    if (!instruction || isSending) return;

    const nextId = messages.length + 1;
    const userMessage: ChatMessage = { id: nextId, role: "user", content: instruction };
    const pendingMessages = [...messages, userMessage];

    setMessages(pendingMessages);
    setChatInput("");
    setIsSending(true);
    setStatus("Updating the current draft...");

    try {
      const result = await requestAiDraft(draft, pendingMessages, instruction);
      const nextDraft = applyDeterministicOverrides(result.draft, instruction, draft);
      setDraft(nextDraft);
      setMessages([...pendingMessages, { id: nextId + 1, role: "assistant", content: result.reply }]);
      setStatus(result.reply);
    } catch (error) {
      const nextDraft = applyInstruction(draft, instruction);
      const diagnostic = error instanceof Error ? error.message : "AI service is unavailable.";
      const reply = `${describeChanges(draft, nextDraft, instruction)} AI edit failed: ${diagnostic}`;
      setDraft(nextDraft);
      setMessages([...pendingMessages, { id: nextId + 1, role: "assistant", content: reply }]);
      setStatus(reply);
    } finally {
      setIsSending(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(generated.html);
    setStatus("Copied full HTML to clipboard.");
  }

  function downloadHtml() {
    const blob = new Blob([generated.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${generated.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "website"}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded single-file website.");
  }

  function resetDraft() {
    setDraft(initialSpec);
    setChatInput("");
    setMessages([
      {
        id: 1,
        role: "assistant",
        content:
          "Reset complete. Tell me what to build or what to change, and I will update the current draft."
      }
    ]);
    setStatus("Reset to the starter site.");
  }

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Workspace">
        <a className="brand" href="#" aria-label="SiteForge home">
          <span className="brandMark">S</span>
          <span>
            <strong>SiteForge</strong>
            <small>Builder</small>
          </span>
        </a>

        <nav className="navList" aria-label="Primary">
          <a className="navItem active" href="#">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a className="navItem" href="#">
            <FileStack size={18} /> Projects
          </a>
          <a className="navItem" href="#">
            <Sparkles size={18} /> Templates
          </a>
          <a className="navItem" href="#">
            <Settings size={18} /> Settings
          </a>
        </nav>

        <div className="usagePanel">
          <span className="usageLabel">Build credits</span>
          <strong>82%</strong>
          <div className="meter" aria-hidden="true">
            <span />
          </div>
          <p>Enough for 16 more website drafts this month.</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI website studio</p>
            <h1>Chat with the builder until the website feels right.</h1>
          </div>
          <div className="topbarActions">
            <button className="iconButton" onClick={resetDraft} type="button" aria-label="Reset draft" title="Reset draft">
              <RefreshCcw size={18} />
            </button>
            <button className="primaryAction" onClick={downloadHtml} type="button">
              <Download size={17} /> Download HTML
            </button>
          </div>
        </header>

        <section className="builderGrid">
          <div className="promptPanel">
            <div className="panelHeading">
              <div>
                <h2>Builder Chat</h2>
                <p>Ask for a new site, then keep refining the current draft until you are happy.</p>
              </div>
              <span>{messages.length} messages</span>
            </div>

            <div className="chatHistory" aria-label="Chat history">
              {messages.map((message) => (
                <div className={`chatMessage ${message.role}`} key={message.id}>
                  <span className="messageIcon">{message.role === "assistant" ? <Bot size={15} /> : "You"}</span>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>

            <form className="chatComposer" onSubmit={sendMessage}>
              <label className="srOnly" htmlFor="builderMessage">
                Message the AI builder
              </label>
              <textarea
                id="builderMessage"
                maxLength={500}
                placeholder="Try: change the colour theme to purple, move pricing before testimonials, make it a SaaS website called ClarityOps..."
                spellCheck
                value={chatInput}
                disabled={isSending}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <div className="composerFooter">
                <span>{chatInput.length} / 500</span>
                <button className="primaryAction" disabled={isSending} type="submit">
                  <Send size={17} /> {isSending ? "Updating" : "Send"}
                </button>
              </div>
            </form>

            <div className="quickActions" aria-label="Example instructions">
              {[
                "Change the colour theme to purple",
                "Move pricing before coaches",
                "Make it a SaaS website called ClarityOps"
              ].map((example) => (
                <button key={example} onClick={() => setChatInput(example)} type="button">
                  {example}
                </button>
              ))}
            </div>

            <div className="statusStrip" aria-live="polite">
              <span className="pulseDot" />
              <span>{status}</span>
            </div>
          </div>

          <div className="previewPanel">
            <div className="panelHeading compact">
              <div>
                <h2>Live Preview</h2>
                <p>
                  {generated.name} · {generated.summary}
                </p>
              </div>
              <div className="deviceToggle" aria-label="Preview size">
                <button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} type="button">
                  <Monitor size={16} /> Desktop
                </button>
                <button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} type="button">
                  <Smartphone size={16} /> Mobile
                </button>
              </div>
            </div>
            <iframe
              className={device === "mobile" ? "mobile" : ""}
              sandbox="allow-scripts"
              srcDoc={generated.html}
              title="Generated website preview"
            />
          </div>
        </section>

        <section className="codePanel" aria-label="Generated code">
          <div className="panelHeading compact">
            <div>
              <h2>Generated Code</h2>
              <p>Review the single-file output before exporting.</p>
            </div>
            <div className="tabs" role="tablist" aria-label="Code views">
              {(["html", "css", "js"] as CodeTab[]).map((tab) => (
                <button
                  className={activeTab === tab ? "active" : ""}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  type="button"
                >
                  {tab === "html" ? <Code2 size={16} /> : null}
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <pre>
            <code>{code}</code>
          </pre>
        </section>
      </main>
    </div>
  );
}

function createSpec(prompt: string, style: StyleKey, pageType: PageType): SiteSpec {
  const cleanedPrompt = cleanText(prompt) || defaultPrompt;
  const name = inferName(cleanedPrompt);
  const industry = inferIndustry(cleanedPrompt);
  const tone = inferTone(cleanedPrompt, style);

  return {
    prompt: cleanedPrompt,
    style,
    pageType,
    palette: palettes[style],
    name,
    industry,
    tone,
    sections: getSections(pageType, industry),
    headline: `${name} turns attention into action.`,
    summaryPrefix: "auto"
  };
}

async function requestAiDraft(draft: SiteSpec, messages: ChatMessage[], instruction: string) {
  const response = await fetch("/api/build", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ draft, messages, instruction })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      detail?: string;
    } | null;
    throw new Error(payload?.detail || payload?.error || "AI draft request failed.");
  }

  return (await response.json()) as { draft: SiteSpec; reply: string };
}

function applyInstruction(current: SiteSpec, instruction: string): SiteSpec {
  const source = instruction.toLowerCase();
  const isNewBuild = isNewBuildInstruction(instruction);
  let next = isNewBuild
    ? createSpec(instruction, inferStyle(instruction, current.style), inferPageType(instruction, current.pageType))
    : { ...current, sections: [...current.sections], palette: { ...current.palette } };

  const matchedPalette = colorRequests.find(([keyword]) => source.includes(keyword));
  if (matchedPalette) {
    next = { ...next, palette: matchedPalette[1], style: inferStyle(instruction, next.style) };
  } else {
    const requestedStyle = inferStyle(instruction, next.style);
    if (requestedStyle !== next.style) {
      next = { ...next, style: requestedStyle, palette: palettes[requestedStyle] };
    }
  }

  const newName = inferExplicitName(instruction);
  if (newName) {
    next = {
      ...next,
      name: newName,
      headline: `${newName} turns attention into action.`
    };
  }

  const newIndustry = inferInstructionIndustry(instruction);
  if (newIndustry) {
    const pageType = inferPageType(instruction, next.pageType);
    next = {
      ...next,
      pageType,
      industry: newIndustry,
      sections: getSections(pageType, newIndustry)
    };
  }

  const newTone = inferInstructionTone(instruction);
  if (newTone) {
    next = { ...next, tone: newTone };
  }

  if (asksForArticlelessSummary(instruction)) {
    next = { ...next, summaryPrefix: "none" };
  }

  next = applySectionMove(next, instruction);

  return next;
}

function applyDeterministicOverrides(spec: SiteSpec, instruction: string, previous: SiteSpec): SiteSpec {
  const source = instruction.toLowerCase();
  let next = sanitizeDraft(spec, previous);
  const matchedPalette = colorRequests.find(([keyword]) => source.includes(keyword));

  if (!isNewBuildInstruction(instruction)) {
    next = { ...next, prompt: previous.prompt };
  }

  if (matchedPalette) {
    next = { ...next, palette: matchedPalette[1] };
  }

  if (asksForArticlelessSummary(instruction)) {
    next = { ...next, summaryPrefix: "none" };
  }

  return next;
}

function sanitizeDraft(spec: SiteSpec, previous: SiteSpec): SiteSpec {
  const sections = spec.sections
    .filter((section) => section && !containsAppChrome(section))
    .slice(0, 6);

  return {
    ...spec,
    prompt: containsAppChrome(spec.prompt) ? previous.prompt : spec.prompt,
    name: containsAppChrome(spec.name) ? previous.name : spec.name,
    industry: containsAppChrome(spec.industry) ? previous.industry : spec.industry,
    tone: containsAppChrome(spec.tone) ? previous.tone : spec.tone,
    headline: containsAppChrome(spec.headline) ? previous.headline : spec.headline,
    palette: { ...spec.palette },
    sections: sections.length >= 3 ? sections : [...previous.sections]
  };
}

function containsAppChrome(value: string) {
  const normalized = value.toLowerCase();
  return appChromeTerms.some((term) => normalized.includes(term));
}

function sanitizeSpecForPreview(spec: SiteSpec): SiteSpec {
  const fallbackSections = getSections(spec.pageType, spec.industry);
  const sections = spec.sections
    .filter((section) => section && !containsAppChrome(section))
    .slice(0, 6);

  return {
    ...spec,
    prompt: containsAppChrome(spec.prompt) ? defaultPrompt : spec.prompt,
    name: containsAppChrome(spec.name) ? inferName(defaultPrompt) : spec.name,
    industry: containsAppChrome(spec.industry) ? inferIndustry(defaultPrompt) : spec.industry,
    tone: containsAppChrome(spec.tone) ? inferTone(defaultPrompt, spec.style) : spec.tone,
    headline: containsAppChrome(spec.headline) ? `${inferName(defaultPrompt)} turns attention into action.` : spec.headline,
    sections: sections.length >= 3 ? sections : fallbackSections
  };
}

function isNewBuildInstruction(instruction: string) {
  const source = instruction.toLowerCase();
  return (
    /\b(create|build|make|generate|design)\b/.test(source) &&
    /\b(site|website|landing|page|portfolio|sales|homepage)\b/.test(source)
  );
}

function describeChanges(previous: SiteSpec, next: SiteSpec, instruction: string) {
  const changes: string[] = [];
  if (previous.name !== next.name) changes.push(`renamed the site to ${next.name}`);
  if (previous.industry !== next.industry) changes.push(`rebuilt it for a ${next.industry}`);
  if (previous.tone !== next.tone) changes.push(`shifted the tone to ${next.tone}`);
  if (previous.style !== next.style || previous.palette.primary !== next.palette.primary) changes.push("updated the colour theme");
  if (previous.summaryPrefix !== next.summaryPrefix) changes.push("updated the summary wording");
  if (previous.sections.join("|") !== next.sections.join("|")) {
    changes.push(`reordered sections to ${next.sections.join(", ")}`);
  }

  if (changes.length === 0) {
    return `I applied that instruction to the current draft and kept the structure intact: "${instruction}".`;
  }

  return `Done. I ${changes.join(", ")}.`;
}

function applySectionMove(spec: SiteSpec, instruction: string): SiteSpec {
  const source = instruction.toLowerCase();
  const sections = [...spec.sections];
  const relationMatch = source.match(/\b(before|after|above|below)\b/);
  const movingSource = relationMatch ? source.slice(0, relationMatch.index) : source;
  const targetSource = relationMatch ? source.slice((relationMatch.index || 0) + relationMatch[0].length) : source;
  const moving = findMentionedSection(movingSource, sections);
  if (!moving) return spec;

  const withoutMoving = sections.filter((section) => section !== moving);
  const target = findMentionedSection(targetSource, withoutMoving);

  if (source.includes("first") || source.includes("top") || source.includes("above all")) {
    return { ...spec, sections: [moving, ...withoutMoving] };
  }

  if (source.includes("last") || source.includes("bottom")) {
    return { ...spec, sections: [...withoutMoving, moving] };
  }

  if (target && (source.includes("before") || source.includes("above"))) {
    const targetIndex = withoutMoving.indexOf(target);
    withoutMoving.splice(Math.max(targetIndex, 0), 0, moving);
    return { ...spec, sections: withoutMoving };
  }

  if (target && (source.includes("after") || source.includes("below"))) {
    const targetIndex = withoutMoving.indexOf(target);
    withoutMoving.splice(Math.max(targetIndex + 1, 0), 0, moving);
    return { ...spec, sections: withoutMoving };
  }

  return spec;
}

function findMentionedSection(source: string, sections: string[]) {
  const direct = sections.find((section) => source.includes(section.toLowerCase()));
  if (direct) return direct;

  const aliases: Record<string, string[]> = {
    Memberships: ["pricing", "plans", "packages", "membership"],
    Pricing: ["plans", "packages", "membership", "memberships"],
    "Member Stories": ["testimonials", "customer proof", "reviews", "stories"],
    Testimonials: ["customer proof", "reviews", "member stories", "stories"],
    "Customer Proof": ["testimonials", "reviews", "member stories", "stories"],
    Coaches: ["trainers", "team", "instructors"],
    Classes: ["sessions", "workouts", "programs"],
    Services: ["offerings", "features"],
    Features: ["services", "capabilities"],
    "Selected Work": ["work", "projects", "portfolio"],
    Capabilities: ["services", "skills"]
  };

  return (
    sections.find((section) => aliases[section]?.some((alias) => source.includes(alias))) || null
  );
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function titleCase(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function inferExplicitName(prompt: string) {
  const quoted = prompt.match(/[""']([^""']{2,45})[""']/);
  if (quoted) return titleCase(quoted[1]);

  const called = prompt.match(/(?:called|named)\s+([A-Z][A-Za-z0-9& ]{2,42})(?:\.|,| that| with| should|$)/);
  return called ? titleCase(called[1]) : null;
}

function asksForArticlelessSummary(instruction: string) {
  const source = instruction.toLowerCase();
  return (
    source.includes("an elevated landing") &&
    source.includes("elevated landing") &&
    (source.includes("change") || source.includes("replace") || source.includes("to:"))
  );
}

function inferName(prompt: string) {
  const explicitName = inferExplicitName(prompt);
  if (explicitName) return explicitName;

  const firstSentence = cleanText(prompt).split(/[.!?]/)[0] || "New Venture";
  const afterFor = firstSentence.match(/for (?:a |an |the )?([^,.]{3,46})/i);
  return titleCase(afterFor ? afterFor[1] : "New Venture");
}

function inferInstructionIndustry(prompt: string) {
  const source = prompt.toLowerCase();
  const options: Array<[string, string]> = [
    ["fitness", "fitness studio"],
    ["restaurant", "restaurant"],
    ["coffee", "coffee shop"],
    ["saas", "software platform"],
    ["software", "software platform"],
    ["analytics", "software platform"],
    ["agency", "creative agency"],
    ["portfolio", "portfolio"],
    ["real estate", "real estate service"],
    ["clinic", "health clinic"],
    ["law", "legal practice"],
    ["travel", "travel company"]
  ];
  return options.find(([key]) => source.includes(key))?.[1] || null;
}

function inferIndustry(prompt: string) {
  return inferInstructionIndustry(prompt) || "brand";
}

function inferInstructionTone(prompt: string) {
  const source = prompt.toLowerCase();
  if (source.includes("premium")) return "premium";
  if (source.includes("playful")) return "playful";
  if (source.includes("professional")) return "professional";
  if (source.includes("minimal")) return "minimal";
  if (source.includes("energetic")) return "energetic";
  if (source.includes("bold")) return "bold";
  return null;
}

function inferTone(prompt: string, style: StyleKey) {
  return inferInstructionTone(prompt) || (style === "luxury" ? "premium" : style);
}

function inferStyle(prompt: string, fallback: StyleKey) {
  const source = prompt.toLowerCase();
  if (source.includes("editorial")) return "editorial";
  if (source.includes("startup") || source.includes("saas") || source.includes("software")) return "startup";
  if (source.includes("luxury") || source.includes("premium")) return "luxury";
  if (source.includes("modern")) return "modern";
  return fallback;
}

function inferPageType(prompt: string, fallback: PageType) {
  const source = prompt.toLowerCase();
  if (source.includes("portfolio")) return "portfolio";
  if (source.includes("sales")) return "sales";
  if (source.includes("landing")) return "landing";
  return fallback;
}

function getSections(pageType: PageType, industry: string) {
  if (pageType === "portfolio") return ["Selected Work", "Capabilities", "Process", "Client Notes"];
  if (pageType === "sales") return ["Outcomes", "How It Works", "Plans", "Customer Proof"];
  if (industry.includes("fitness")) return ["Classes", "Coaches", "Memberships", "Member Stories"];
  if (industry.includes("software")) return ["Outcomes", "Features", "Pricing", "Customer Proof"];
  return ["Services", "Highlights", "Pricing", "Testimonials"];
}

function createSite(spec: SiteSpec): GeneratedSite {
  const safeSpecForPreview = sanitizeSpecForPreview(spec);
  const adjective =
    safeSpecForPreview.tone === "premium"
      ? "elevated"
      : safeSpecForPreview.tone === "energetic"
        ? "high-energy"
        : safeSpecForPreview.tone;
  const article = /^[aeiou]/i.test(adjective) ? "An" : "A";
  const prefix = safeSpecForPreview.summaryPrefix === "none" ? "" : `${article} `;
  const summaryText = `${adjective} ${safeSpecForPreview.pageType.replace("-", " ")} for a ${safeSpecForPreview.industry}.`;
  const summary =
    safeSpecForPreview.summaryPrefix === "none"
      ? summaryText.charAt(0).toUpperCase() + summaryText.slice(1)
      : `${prefix}${summaryText}`;
  const css = createGeneratedCss(safeSpecForPreview.palette);
  const safeName = escapeHtml(safeSpecForPreview.name);
  const safeIndustry = escapeHtml(safeSpecForPreview.industry);
  const safeTone = escapeHtml(safeSpecForPreview.tone);
  const safeHeadline = escapeHtml(safeSpecForPreview.headline);
  const safePrompt = escapeHtml(safeSpecForPreview.prompt);
  const safeSummary = escapeHtml(summary);
  const safeSections = safeSpecForPreview.sections.map((section) => escapeHtml(section));
  const js = `document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;

  event.preventDefault();
  const targetId = link.getAttribute("href").slice(1);
  if (!targetId) return;

  document.getElementById(targetId)?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <header class="site-header">
      <span class="logo">${safeName}</span>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="kicker">${safeSummary}</p>
          <h1>${safeHeadline}</h1>
          <p class="lede">${safePrompt}</p>
          <div class="hero-actions">
            <a class="button primary" href="#contact">Book a Consultation</a>
            <a class="button ghost" href="#${safeSections[0].toLowerCase().replace(/\s+/g, "-")}">Explore ${safeSections[0]}</a>
          </div>
        </div>
        <div class="hero-visual" aria-label="${safeName} visual preview">
          <div class="image-card main-card">
            <span>${safeIndustry}</span>
            <strong>${safeTone}</strong>
          </div>
          <div class="stat-card">
            <strong>4.9</strong>
            <span>Customer rating</span>
          </div>
        </div>
      </section>

      <section class="section-grid" id="${safeSections[0].toLowerCase().replace(/\s+/g, "-")}">
        ${safeSections
          .map(
            (section, index) => `
        <article>
          <span>0${index + 1}</span>
          <h2>${section}</h2>
          <p>${createSectionCopy(section, spec.industry, spec.tone)}</p>
        </article>`
          )
          .join("")}
      </section>

      <section class="feature-band">
        <div>
          <p class="kicker">Built for momentum</p>
          <h2>A clear path from first impression to sign-up.</h2>
        </div>
        <ul>
          <li>Conversion-focused copy blocks</li>
          <li>Responsive sections for every device</li>
          <li>Reusable visual system and calls to action</li>
        </ul>
      </section>
    </main>

    <footer id="contact">
      <div>
        <strong>${safeName}</strong>
        <p>Ready to launch the next version of your ${safeIndustry}?</p>
      </div>
      <a class="button primary" href="mailto:hello@example.com">hello@example.com</a>
    </footer>
    <script>
${js}
    </script>
  </body>
</html>`;

  return { html, css, js, name: safeSpecForPreview.name, summary };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createSectionCopy(section: string, industry: string, tone: string) {
  const copy: Record<string, string> = {
    Classes: `Curated sessions that make a ${tone} ${industry} feel approachable from day one.`,
    Coaches: "Profiles, credentials, and human details build trust before the first visit.",
    Memberships: "Simple packages help visitors compare options and choose confidently.",
    "Member Stories": "Short proof points show the transformation customers can expect.",
    Services: `Focused service cards explain what this ${industry} delivers and why it matters.`,
    Highlights: "Sharp benefit statements make the offer easy to scan and remember.",
    Pricing: "Transparent tiers reduce friction and move qualified leads toward contact.",
    Testimonials: "Social proof reassures visitors at the exact moment they are deciding.",
    Outcomes: "Lead with measurable results instead of vague promises.",
    Features: "Product capabilities are grouped into clear, scannable benefits.",
    "How It Works": "A simple sequence helps buyers understand the next step.",
    Plans: "Package the offer so the buying decision feels obvious.",
    "Customer Proof": "Use quotes and metrics to make the claim credible.",
    "Selected Work": "Show the strongest projects with concise context and outcomes.",
    Capabilities: "Make your specialties scannable without burying the lead.",
    Process: "Set expectations with a confident, low-friction workflow.",
    "Client Notes": "Add short testimonials that prove quality and reliability."
  };
  return copy[section] || "A polished section tailored to the prompt and audience.";
}

function createGeneratedCss(palette: Palette) {
  return `      :root {
        --bg: ${palette.bg};
        --ink: ${palette.ink};
        --muted: ${palette.muted};
        --primary: ${palette.primary};
        --secondary: ${palette.secondary};
        --surface: ${palette.surface};
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      a { color: inherit; }
      .site-header,
      .hero,
      .section-grid,
      .feature-band,
      footer {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
      }
      .site-header {
        min-height: 76px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .logo {
        display: inline-flex;
        font-size: 1.15rem;
        font-weight: 900;
        text-decoration: none;
      }
      .button {
        text-decoration: none;
      }
      .button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        padding: 0 18px;
        font-weight: 900;
      }
      .primary {
        background: var(--primary);
        color: white;
      }
      .ghost {
        border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
        color: var(--primary);
      }
      .hero {
        min-height: 610px;
        display: grid;
        grid-template-columns: minmax(0, 1.02fr) minmax(320px, 0.98fr);
        align-items: center;
        gap: 42px;
      }
      .kicker {
        color: var(--primary);
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 0.78rem;
      }
      h1 {
        margin: 0;
        max-width: 760px;
        font-size: clamp(3.1rem, 9vw, 6.7rem);
        line-height: 0.9;
        letter-spacing: 0;
      }
      .lede {
        margin: 24px 0;
        max-width: 680px;
        color: var(--muted);
        font-size: 1.16rem;
        line-height: 1.65;
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .hero-visual {
        min-height: 430px;
        position: relative;
        display: grid;
        place-items: center;
      }
      .image-card {
        width: min(420px, 100%);
        aspect-ratio: 4 / 5;
        border-radius: 8px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        background:
          linear-gradient(135deg, color-mix(in srgb, var(--primary) 86%, white), color-mix(in srgb, var(--secondary) 76%, white)),
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), transparent 28%);
        color: white;
        box-shadow: 0 24px 70px rgba(20, 28, 36, 0.22);
      }
      .image-card span {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 900;
      }
      .image-card strong {
        font-size: 4.5rem;
        line-height: 0.92;
      }
      .stat-card {
        position: absolute;
        right: 0;
        bottom: 36px;
        width: 190px;
        border-radius: 8px;
        background: var(--surface);
        padding: 18px;
        box-shadow: 0 18px 45px rgba(20, 28, 36, 0.16);
      }
      .stat-card strong {
        display: block;
        font-size: 2.4rem;
      }
      .stat-card span {
        color: var(--muted);
        font-weight: 700;
      }
      .section-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        padding: 36px 0;
      }
      article {
        min-height: 230px;
        border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
        border-radius: 8px;
        padding: 22px;
        background: var(--surface);
      }
      article span {
        color: var(--secondary);
        font-weight: 900;
      }
      article h2 {
        margin: 54px 0 12px;
        font-size: 1.35rem;
      }
      article p,
      footer p {
        color: var(--muted);
        line-height: 1.55;
      }
      .feature-band {
        margin-top: 34px;
        margin-bottom: 34px;
        padding: 36px;
        border-radius: 8px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        background: var(--ink);
        color: white;
      }
      .feature-band h2 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 4rem);
        line-height: 0.96;
      }
      .feature-band ul {
        margin: 0;
        padding-left: 20px;
        color: rgba(255,255,255,0.78);
        line-height: 2;
        font-weight: 700;
      }
      footer {
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border-top: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
      }
      footer strong {
        font-size: 1.4rem;
      }
      @media (max-width: 820px) {
        .site-header {
          padding: 18px 0;
        }
        .hero,
        .section-grid,
        .feature-band,
        footer {
          grid-template-columns: 1fr;
        }
        .hero {
          min-height: auto;
          padding: 42px 0;
        }
        .section-grid {
          grid-template-columns: 1fr;
        }
        .image-card strong {
          font-size: 3.4rem;
        }
        .stat-card {
          left: 14px;
          right: auto;
        }
        footer {
          align-items: flex-start;
          flex-direction: column;
          padding: 28px 0;
        }
      }`;
}
