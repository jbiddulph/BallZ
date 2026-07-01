export type BallzUser = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  company_name: string | null;
  role: "owner" | "editor" | "viewer";
  created_at: string;
  updated_at: string;
};

export type BallzProject = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  site_spec: unknown | null;
  generated_html: string | null;
  created_at: string;
  updated_at: string;
};

export type BallzPage = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  slug: string;
  content: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BallzTemplate = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  site_spec: unknown | null;
  created_at: string;
  updated_at: string;
};
