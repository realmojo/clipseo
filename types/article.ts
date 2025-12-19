export interface CrawledData {
  title: string;
  headings: string[];
  content: string;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  metaDescription: string;
  html: string;
}

export interface JobResponse {
  status: "ok" | "error";
  jobId: string;
  wpPostId?: number;
  message?: string;
  error?: string;
}
