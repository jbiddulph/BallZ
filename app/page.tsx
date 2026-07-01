"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Code2,
  Copy,
  Download,
  Edit3,
  FileText,
  FolderKanban,
  FileStack,
  LayoutDashboard,
  Lock,
  LogOut,
  Monitor,
  RefreshCcw,
  Save,
  Send,
  Settings,
  Sparkles,
  Smartphone,
  Trash2,
  Users,
  UserPlus
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../utils/supabase/client";
import { isSupabaseConfigured } from "../utils/supabase/env";
import type { BallzPage, BallzProject, BallzTemplate, BallzUser } from "../utils/supabase/types";

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

type AuthMode = "signin" | "signup";
type ContentView = "builder" | "users" | "projects" | "pages" | "templates";
type ProjectStatus = "draft" | "published" | "archived";
type UserRole = "owner" | "editor" | "viewer";
type PreviewTarget =
  | { type: "project"; id: string; label: string }
  | { type: "page"; id: string; projectId: string; label: string }
  | { type: "template"; id: string; label: string }
  | null;

type UserForm = {
  id: string | null;
  email: string;
  display_name: string;
  company_name: string;
  role: UserRole;
};

type ProjectForm = {
  id: string | null;
  name: string;
  description: string;
  status: ProjectStatus;
};

type PageForm = {
  id: string | null;
  project_id: string;
  title: string;
  slug: string;
  content: string;
  sort_order: number;
};

type TemplateForm = {
  id: string | null;
  name: string;
  description: string;
  prompt: string;
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
const supabase = createClient();
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
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isDataBusy, setIsDataBusy] = useState(false);
  const [contentView, setContentView] = useState<ContentView>("builder");
  const [userProfiles, setUserProfiles] = useState<BallzUser[]>([]);
  const [projects, setProjects] = useState<BallzProject[]>([]);
  const [pages, setPages] = useState<BallzPage[]>([]);
  const [templates, setTemplates] = useState<BallzTemplate[]>([]);
  const [userForm, setUserForm] = useState<UserForm>({
    id: null,
    email: "",
    display_name: "",
    company_name: "",
    role: "owner"
  });
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    id: null,
    name: "",
    description: "",
    status: "draft"
  });
  const [pageForm, setPageForm] = useState<PageForm>({
    id: null,
    project_id: "",
    title: "",
    slug: "",
    content: "",
    sort_order: 0
  });
  const [templateForm, setTemplateForm] = useState<TemplateForm>({
    id: null,
    name: "",
    description: "",
    prompt: defaultPrompt
  });
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
  const [previewSource, setPreviewSource] = useState("Starter draft");
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>(null);

  const generated = useMemo(() => createSite(draft), [draft]);
  const code = generated[activeTab];
  const selectedProjectName =
    projects.find((project) => project.id === pageForm.project_id)?.name || "No project selected";
  const pagesByProject = useMemo(() => {
    return pages.reduce<Record<string, BallzPage[]>>((groups, page) => {
      groups[page.project_id] = [...(groups[page.project_id] || []), page].sort(
        (first, second) => first.sort_order - second.sort_order
      );
      return groups;
    }, {});
  }, [pages]);

  useEffect(() => {
    if (!supabase) {
      setAuthMessage("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable accounts.");
      return;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfiles([]);
      setProjects([]);
      setPages([]);
      setTemplates([]);
      setUserForm({ id: null, email: "", display_name: "", company_name: "", role: "owner" });
      return;
    }

    setUserForm((current) => ({
      ...current,
      email: current.email || user.email || ""
    }));
    loadContent();
  }, [user]);

  useEffect(() => {
    if (!pageForm.project_id && projects[0]) {
      setPageForm((current) => ({ ...current, project_id: projects[0].id }));
    }
  }, [projects, pageForm.project_id]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isAuthBusy) return;

    setIsAuthBusy(true);
    setAuthMessage(authMode === "signin" ? "Signing in..." : "Creating account...");

    const credentials = { email: authEmail.trim(), password: authPassword };
    const { data, error } =
      authMode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (error) {
      setAuthMessage(error.message);
    } else {
      setUser(data.user ?? null);
      setAuthPassword("");
      setAuthMessage(authMode === "signin" ? "Signed in." : "Account created. Check your email if confirmation is enabled.");
    }

    setIsAuthBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setStatus("Signed out.");
  }

  async function loadContent() {
    if (!supabase || !user) return;

    setIsDataBusy(true);
    const [userResult, projectResult, pageResult, templateResult] = await Promise.all([
      supabase.from("ballz_users").select("*").order("updated_at", { ascending: false }),
      supabase.from("ballz_projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("ballz_pages").select("*").order("sort_order", { ascending: true }),
      supabase.from("ballz_templates").select("*").order("updated_at", { ascending: false })
    ]);

    if (userResult.error || projectResult.error || pageResult.error || templateResult.error) {
      setStatus(
        userResult.error?.message ||
          projectResult.error?.message ||
          pageResult.error?.message ||
          templateResult.error?.message ||
          "Could not load Supabase content."
      );
    } else {
      setUserProfiles((userResult.data || []) as BallzUser[]);
      setProjects((projectResult.data || []) as BallzProject[]);
      setPages((pageResult.data || []) as BallzPage[]);
      setTemplates((templateResult.data || []) as BallzTemplate[]);
      setStatus("Synced users, projects, pages, and templates from Supabase.");
    }

    setIsDataBusy(false);
  }

  async function saveUserProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !userForm.email.trim()) return;

    setIsDataBusy(true);
    const payload = {
      user_id: user.id,
      email: userForm.email.trim(),
      display_name: cleanText(userForm.display_name) || null,
      company_name: cleanText(userForm.company_name) || null,
      role: userForm.role
    };
    const result = userForm.id
      ? await supabase.from("ballz_users").update(payload).eq("id", userForm.id)
      : await supabase.from("ballz_users").insert(payload);

    setStatus(result.error ? result.error.message : `Saved ${payload.email}.`);
    if (!result.error) {
      setUserForm({ id: null, email: user.email || "", display_name: "", company_name: "", role: "owner" });
      await loadContent();
    }
    setIsDataBusy(false);
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !projectForm.name.trim()) return;

    setIsDataBusy(true);
    const payload = {
      user_id: user.id,
      name: projectForm.name.trim(),
      description: cleanText(projectForm.description) || null,
      status: projectForm.status,
      site_spec: draft,
      generated_html: generated.html
    };
    const result = projectForm.id
      ? await supabase.from("ballz_projects").update(payload).eq("id", projectForm.id)
      : await supabase.from("ballz_projects").insert(payload);

    setStatus(result.error ? result.error.message : `Saved ${payload.name}.`);
    if (!result.error) {
      setProjectForm({ id: null, name: "", description: "", status: "draft" });
      await loadContent();
    }
    setIsDataBusy(false);
  }

  async function saveCurrentDraftAsProject() {
    setProjectForm({
      id: null,
      name: generated.name,
      description: generated.summary,
      status: "draft"
    });
    setContentView("projects");
    setStatus("Review the project details, then save the current draft to Supabase.");
  }

  async function savePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !pageForm.project_id || !pageForm.title.trim()) return;

    setIsDataBusy(true);
    const payload = {
      user_id: user.id,
      project_id: pageForm.project_id,
      title: pageForm.title.trim(),
      slug: slugify(pageForm.slug || pageForm.title),
      content: pageForm.content.trim() || null,
      sort_order: Number.isFinite(pageForm.sort_order) ? pageForm.sort_order : 0
    };
    const result = pageForm.id
      ? await supabase.from("ballz_pages").update(payload).eq("id", pageForm.id)
      : await supabase.from("ballz_pages").insert(payload);

    setStatus(result.error ? result.error.message : `Saved ${payload.title}.`);
    if (!result.error) {
      setPageForm({ id: null, project_id: payload.project_id, title: "", slug: "", content: "", sort_order: 0 });
      await loadContent();
    }
    setIsDataBusy(false);
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !templateForm.name.trim() || !templateForm.prompt.trim()) return;

    setIsDataBusy(true);
    const payload = {
      user_id: user.id,
      name: templateForm.name.trim(),
      description: cleanText(templateForm.description) || null,
      prompt: templateForm.prompt.trim(),
      site_spec: draft
    };
    const result = templateForm.id
      ? await supabase.from("ballz_templates").update(payload).eq("id", templateForm.id)
      : await supabase.from("ballz_templates").insert(payload);

    setStatus(result.error ? result.error.message : `Saved ${payload.name}.`);
    if (!result.error) {
      setTemplateForm({ id: null, name: "", description: "", prompt: defaultPrompt });
      await loadContent();
    }
    setIsDataBusy(false);
  }

  async function deleteRow(table: "ballz_users" | "ballz_projects" | "ballz_pages" | "ballz_templates", id: string, label: string) {
    if (!supabase || !confirm(`Delete ${label}?`)) return;

    setIsDataBusy(true);
    const result = await supabase.from(table).delete().eq("id", id);
    setStatus(result.error ? result.error.message : `Deleted ${label}.`);
    if (!result.error) await loadContent();
    setIsDataBusy(false);
  }

  function editUserProfile(profile: BallzUser) {
    setUserForm({
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name || "",
      company_name: profile.company_name || "",
      role: profile.role
    });
    setContentView("users");
  }

  function editProject(project: BallzProject) {
    setProjectForm({
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status
    });
    setContentView("projects");
  }

  function previewProject(project: BallzProject) {
    const nextDraft = createDraftFromProject(project);
    setDraft(nextDraft);
    setProjectForm({
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status
    });
    setPageForm((current) => ({
      ...current,
      project_id: project.id
    }));
    setPreviewSource(`Project: ${project.name}`);
    setPreviewTarget({ type: "project", id: project.id, label: project.name });
    setStatus(`Loaded ${project.name} into the live preview.`);
  }

  function editPage(page: BallzPage) {
    setPageForm({
      id: page.id,
      project_id: page.project_id,
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      sort_order: page.sort_order
    });
    setContentView("pages");
  }

  function previewPage(page: BallzPage) {
    const project = projects.find((item) => item.id === page.project_id);
    const projectPages = pagesByProject[page.project_id] || [page];
    const baseDraft = project ? createDraftFromProject(project) : draft;
    const pageSections = projectPages.map((item) => item.title).filter(Boolean);
    const nextDraft: SiteSpec = {
      ...baseDraft,
      prompt: page.content || baseDraft.prompt,
      name: project?.name || baseDraft.name,
      headline: `${page.title} for ${project?.name || baseDraft.name}.`,
      sections: pageSections.length >= 3 ? pageSections.slice(0, 6) : baseDraft.sections
    };

    setDraft(nextDraft);
    editPage(page);
    setPreviewSource(`Page: ${page.title}`);
    setPreviewTarget({ type: "page", id: page.id, projectId: page.project_id, label: page.title });
    setStatus(`Loaded ${page.title} into the live preview.`);
  }

  function editTemplate(template: BallzTemplate) {
    setTemplateForm({
      id: template.id,
      name: template.name,
      description: template.description || "",
      prompt: template.prompt
    });
    setContentView("templates");
  }

  function useTemplate(template: BallzTemplate) {
    const nextDraft = createDraftFromTemplate(template);
    setDraft(nextDraft);
    setChatInput(template.prompt);
    setContentView("builder");
    setPreviewSource(`Template: ${template.name}`);
    setPreviewTarget({ type: "template", id: template.id, label: template.name });
    setStatus(`Loaded ${template.name} into the live preview.`);
  }

  function createDraftFromProject(project: BallzProject) {
    const fallback = createSpec(
      [project.name, project.description].filter(Boolean).join(". ") || project.name,
      "modern",
      "landing"
    );
    const baseDraft = isSiteSpec(project.site_spec) ? sanitizeDraft(project.site_spec, fallback) : fallback;
    const projectPages = pagesByProject[project.id] || [];
    const pageSections = projectPages.map((page) => page.title).filter(Boolean);

    return {
      ...baseDraft,
      name: project.name,
      prompt: project.description || baseDraft.prompt,
      sections: pageSections.length >= 3 ? pageSections.slice(0, 6) : baseDraft.sections
    };
  }

  function createDraftFromTemplate(template: BallzTemplate) {
    const fallback = createSpec(template.prompt, "modern", "landing");
    return isSiteSpec(template.site_spec) ? sanitizeDraft(template.site_spec, fallback) : fallback;
  }

  async function persistPreviewDraft(nextDraft: SiteSpec) {
    if (!supabase || !user || !previewTarget) return null;

    const nextGenerated = createSite(nextDraft);

    if (previewTarget.type === "project") {
      const { error } = await supabase
        .from("ballz_projects")
        .update({
          name: nextDraft.name,
          description: nextGenerated.summary,
          site_spec: nextDraft,
          generated_html: nextGenerated.html
        })
        .eq("id", previewTarget.id);

      return error ? error.message : `Saved changes to project ${nextDraft.name}.`;
    }

    if (previewTarget.type === "template") {
      const { error } = await supabase
        .from("ballz_templates")
        .update({
          name: previewTarget.label,
          description: nextGenerated.summary,
          prompt: nextDraft.prompt,
          site_spec: nextDraft
        })
        .eq("id", previewTarget.id);

      return error ? error.message : `Saved changes to template ${previewTarget.label}.`;
    }

    const { error: pageError } = await supabase
      .from("ballz_pages")
      .update({
        title: nextDraft.sections[0] || previewTarget.label,
        slug: slugify(nextDraft.sections[0] || previewTarget.label),
        content: nextDraft.prompt
      })
      .eq("id", previewTarget.id);

    if (pageError) return pageError.message;

    const { error: projectError } = await supabase
      .from("ballz_projects")
      .update({
        name: nextDraft.name,
        description: nextGenerated.summary,
        site_spec: nextDraft,
        generated_html: nextGenerated.html
      })
      .eq("id", previewTarget.projectId);

    return projectError ? projectError.message : `Saved changes to page ${previewTarget.label}.`;
  }

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
      const persistence = await persistPreviewDraft(nextDraft);
      setDraft(nextDraft);
      setPreviewSource(previewTarget ? `${titleCase(previewTarget.type)}: ${previewTarget.label}` : "Builder chat");
      setMessages([...pendingMessages, { id: nextId + 1, role: "assistant", content: result.reply }]);
      setStatus([result.reply, persistence].filter(Boolean).join(" "));
      if (persistence) await loadContent();
    } catch (error) {
      const nextDraft = applyInstruction(draft, instruction);
      const diagnostic = error instanceof Error ? error.message : "AI service is unavailable.";
      const reply = `${describeChanges(draft, nextDraft, instruction)} AI edit failed: ${diagnostic}`;
      const persistence = await persistPreviewDraft(nextDraft);
      setDraft(nextDraft);
      setPreviewSource(previewTarget ? `${titleCase(previewTarget.type)}: ${previewTarget.label}` : "Builder chat");
      setMessages([...pendingMessages, { id: nextId + 1, role: "assistant", content: reply }]);
      setStatus([reply, persistence].filter(Boolean).join(" "));
      if (persistence) await loadContent();
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
    setPreviewSource("Starter draft");
    setPreviewTarget(null);
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
          <button className={`navItem ${contentView === "builder" ? "active" : ""}`} onClick={() => setContentView("builder")} type="button">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`navItem ${contentView === "users" ? "active" : ""}`} onClick={() => setContentView("users")} type="button">
            <Users size={18} /> Users
          </button>
          <button className={`navItem ${contentView === "projects" ? "active" : ""}`} onClick={() => setContentView("projects")} type="button">
            <FileStack size={18} /> Projects
          </button>
          <button className={`navItem ${contentView === "templates" ? "active" : ""}`} onClick={() => setContentView("templates")} type="button">
            <Sparkles size={18} /> Templates
          </button>
          <button className={`navItem ${contentView === "pages" ? "active" : ""}`} onClick={() => setContentView("pages")} type="button">
            <Settings size={18} /> Pages
          </button>
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
            <button className="secondaryAction" onClick={saveCurrentDraftAsProject} disabled={!user} type="button">
              <Save size={17} /> Save draft
            </button>
            <button className="primaryAction" onClick={downloadHtml} type="button">
              <Download size={17} /> Download HTML
            </button>
          </div>
        </header>

        <section className="accountPanel">
          {user ? (
            <>
              <div>
                <p className="eyebrow">Signed in</p>
                <h2>{user.email}</h2>
                <p>Users, projects, pages, and templates are stored in Supabase under your account.</p>
              </div>
              <div className="topbarActions">
                <button className="secondaryAction" onClick={loadContent} disabled={isDataBusy} type="button">
                  <RefreshCcw size={17} /> {isDataBusy ? "Syncing" : "Sync"}
                </button>
                <button className="iconButton" onClick={signOut} type="button" aria-label="Sign out" title="Sign out">
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="eyebrow">Account</p>
                <h2>Sign in to save and manage work.</h2>
                <p>Use Supabase Auth to keep each user's profile, projects, pages, and templates private.</p>
              </div>
              <form className="authForm" onSubmit={handleAuth}>
                <div className="authMode" aria-label="Auth mode">
                  <button className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")} type="button">
                    <Lock size={15} /> Sign in
                  </button>
                  <button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")} type="button">
                    <UserPlus size={15} /> Sign up
                  </button>
                </div>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    disabled={!isSupabaseConfigured || isAuthBusy}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={authEmail}
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                    disabled={!isSupabaseConfigured || isAuthBusy}
                    minLength={6}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    type="password"
                    value={authPassword}
                  />
                </label>
                <button className="primaryAction" disabled={!isSupabaseConfigured || isAuthBusy} type="submit">
                  {authMode === "signin" ? "Sign in" : "Create account"}
                </button>
                {authMessage ? <p className="formNote">{authMessage}</p> : null}
              </form>
            </>
          )}
        </section>

        {user ? (
          <section className="contentPanel">
            <div className="panelHeading compact">
              <div>
                <h2>Content Library</h2>
                <p>Manage Supabase-backed users, projects, pages, and reusable templates.</p>
              </div>
              <div className="tabs" role="tablist" aria-label="Content views">
                {(["users", "projects", "pages", "templates"] as ContentView[]).map((view) => (
                  <button
                    className={contentView === view ? "active" : ""}
                    key={view}
                    onClick={() => setContentView(view)}
                    role="tab"
                    type="button"
                  >
                    {view === "users" ? <Users size={16} /> : null}
                    {view === "projects" ? <FolderKanban size={16} /> : null}
                    {view === "pages" ? <FileText size={16} /> : null}
                    {view === "templates" ? <Sparkles size={16} /> : null}
                    {titleCase(view)}
                  </button>
                ))}
              </div>
            </div>

            {contentView === "users" ? (
              <div className="dataGrid">
                <form className="dataForm" onSubmit={saveUserProfile}>
                  <h3>{userForm.id ? "Edit user" : "New user profile"}</h3>
                  <p className="formNote">This manages the `ballz_users` profile row for the signed-in account.</p>
                  <label>
                    Email
                    <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
                  </label>
                  <label>
                    Display name
                    <input value={userForm.display_name} onChange={(event) => setUserForm({ ...userForm, display_name: event.target.value })} />
                  </label>
                  <label>
                    Company
                    <input value={userForm.company_name} onChange={(event) => setUserForm({ ...userForm, company_name: event.target.value })} />
                  </label>
                  <label>
                    Role
                    <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as UserRole })}>
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </label>
                  <div className="buttonRow">
                    <button className="primaryAction" disabled={isDataBusy} type="submit">
                      <Save size={17} /> Save user
                    </button>
                    {userForm.id ? (
                      <button
                        className="secondaryAction"
                        onClick={() => setUserForm({ id: null, email: user?.email || "", display_name: "", company_name: "", role: "owner" })}
                        type="button"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
                <div className="recordList">
                  {userProfiles.map((profile) => (
                    <article className="recordCard" key={profile.id}>
                      <span>{profile.role}</span>
                      <h3>{profile.display_name || profile.email}</h3>
                      <p>{profile.company_name || "No company set."}</p>
                      <p>{profile.email}</p>
                      <div className="recordActions">
                        <button onClick={() => editUserProfile(profile)} type="button">
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => deleteRow("ballz_users", profile.id, profile.email)} type="button">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {userProfiles.length === 0 ? <p className="emptyState">No user profile yet. Create one for this signed-in account.</p> : null}
                </div>
              </div>
            ) : null}

            {contentView === "projects" ? (
              <div className="dataGrid">
                <form className="dataForm" onSubmit={saveProject}>
                  <h3>{projectForm.id ? "Edit project" : "New project"}</h3>
                  <label>
                    Name
                    <input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} />
                  </label>
                  <label>
                    Description
                    <textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} />
                  </label>
                  <label>
                    Status
                    <select value={projectForm.status} onChange={(event) => setProjectForm({ ...projectForm, status: event.target.value as ProjectStatus })}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <div className="buttonRow">
                    <button className="primaryAction" disabled={isDataBusy} type="submit">
                      <Save size={17} /> Save project
                    </button>
                    {projectForm.id ? (
                      <button className="secondaryAction" onClick={() => setProjectForm({ id: null, name: "", description: "", status: "draft" })} type="button">
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
                <div className="recordList">
                  {projects.map((project) => (
                    <article className="recordCard" key={project.id}>
                      <span>{project.status}</span>
                      <h3>{project.name}</h3>
                      <p>{project.description || "No description yet."}</p>
                      <div className="recordActions">
                        <button onClick={() => previewProject(project)} type="button">
                          <Monitor size={15} /> Preview
                        </button>
                        <button onClick={() => editProject(project)} type="button">
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => deleteRow("ballz_projects", project.id, project.name)} type="button">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {projects.length === 0 ? <p className="emptyState">No projects yet. Save the current draft or create one here.</p> : null}
                </div>
              </div>
            ) : null}

            {contentView === "pages" ? (
              <div className="dataGrid">
                <form className="dataForm" onSubmit={savePage}>
                  <h3>{pageForm.id ? "Edit page" : "New page"}</h3>
                  <p className="formNote">Project: {selectedProjectName}</p>
                  <label>
                    Project
                    <select value={pageForm.project_id} onChange={(event) => setPageForm({ ...pageForm, project_id: event.target.value })}>
                      <option value="">Choose a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Title
                    <input value={pageForm.title} onChange={(event) => setPageForm({ ...pageForm, title: event.target.value, slug: pageForm.slug || slugify(event.target.value) })} />
                  </label>
                  <label>
                    Slug
                    <input value={pageForm.slug} onChange={(event) => setPageForm({ ...pageForm, slug: event.target.value })} />
                  </label>
                  <label>
                    Content
                    <textarea value={pageForm.content} onChange={(event) => setPageForm({ ...pageForm, content: event.target.value })} />
                  </label>
                  <label>
                    Sort order
                    <input
                      type="number"
                      value={pageForm.sort_order}
                      onChange={(event) => setPageForm({ ...pageForm, sort_order: Number(event.target.value) })}
                    />
                  </label>
                  <div className="buttonRow">
                    <button className="primaryAction" disabled={isDataBusy || !projects.length} type="submit">
                      <Save size={17} /> Save page
                    </button>
                    {pageForm.id ? (
                      <button className="secondaryAction" onClick={() => setPageForm({ id: null, project_id: pageForm.project_id, title: "", slug: "", content: "", sort_order: 0 })} type="button">
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
                <div className="recordList">
                  {pages.map((page) => (
                    <article className="recordCard" key={page.id}>
                      <span>{projects.find((project) => project.id === page.project_id)?.name || "Project"}</span>
                      <h3>{page.title}</h3>
                      <p>/{page.slug}</p>
                      <div className="recordActions">
                        <button onClick={() => previewPage(page)} type="button">
                          <Monitor size={15} /> Preview
                        </button>
                        <button onClick={() => editPage(page)} type="button">
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => deleteRow("ballz_pages", page.id, page.title)} type="button">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {pages.length === 0 ? <p className="emptyState">No pages yet. Create a project first, then add pages.</p> : null}
                </div>
              </div>
            ) : null}

            {contentView === "templates" ? (
              <div className="dataGrid">
                <form className="dataForm" onSubmit={saveTemplate}>
                  <h3>{templateForm.id ? "Edit template" : "New template"}</h3>
                  <label>
                    Name
                    <input value={templateForm.name} onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })} />
                  </label>
                  <label>
                    Description
                    <textarea value={templateForm.description} onChange={(event) => setTemplateForm({ ...templateForm, description: event.target.value })} />
                  </label>
                  <label>
                    Prompt
                    <textarea value={templateForm.prompt} onChange={(event) => setTemplateForm({ ...templateForm, prompt: event.target.value })} />
                  </label>
                  <div className="buttonRow">
                    <button className="primaryAction" disabled={isDataBusy} type="submit">
                      <Save size={17} /> Save template
                    </button>
                    {templateForm.id ? (
                      <button className="secondaryAction" onClick={() => setTemplateForm({ id: null, name: "", description: "", prompt: defaultPrompt })} type="button">
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
                <div className="recordList">
                  {templates.map((template) => (
                    <article className="recordCard" key={template.id}>
                      <span>Template</span>
                      <h3>{template.name}</h3>
                      <p>{template.description || template.prompt}</p>
                      <div className="recordActions">
                        <button onClick={() => useTemplate(template)} type="button">
                          <Monitor size={15} /> Preview
                        </button>
                        <button onClick={() => editTemplate(template)} type="button">
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => deleteRow("ballz_templates", template.id, template.name)} type="button">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {templates.length === 0 ? <p className="emptyState">No templates yet. Save reusable prompts here.</p> : null}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="builderGrid">
          <div className="promptPanel">
            <div className="panelHeading">
              <div>
                <h2>Builder Chat</h2>
                <p>
                  {previewTarget
                    ? `Editing ${previewTarget.type}: ${previewTarget.label}. Chat changes auto-save to this record.`
                    : "Ask for a new site, then keep refining the current draft until you are happy."}
                </p>
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
                  {previewSource} · {generated.name} · {generated.summary}
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

function isSiteSpec(value: unknown): value is SiteSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SiteSpec>;
  return (
    typeof candidate.prompt === "string" &&
    typeof candidate.style === "string" &&
    typeof candidate.pageType === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.industry === "string" &&
    typeof candidate.tone === "string" &&
    typeof candidate.headline === "string" &&
    Array.isArray(candidate.sections) &&
    Boolean(candidate.palette) &&
    typeof candidate.palette === "object"
  );
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

function slugify(text: string) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
