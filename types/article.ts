export interface CrawledData {
  title: string;
  headings: string[];
  content: string;
  metaDescription?: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
  images?: string[];
  language?: string;
  keywords?: string[];
  canonicalUrl?: string;
  siteName?: string;
  excerpt?: string;
  url: string;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  metaDescription: string;
  html: string;
  featuredImage: string;
  featuredImageId: number;
}

export interface JobResponse {
  status: "ok" | "error";
  jobId: string;
  wpPostId?: number;
  message?: string;
  error?: string;
}
