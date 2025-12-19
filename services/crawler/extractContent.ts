import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { CrawledData } from "@/types/article";
import { logger } from "@/lib/logger";

const TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 15000;

async function fetchWithTimeout(url: string, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL: ${response.status} ${response.statusText}`
      );
    }
    return await response.text();
  } finally {
    clearTimeout(id);
  }
}

async function attemptCrawl(url: string): Promise<CrawledData> {
  // 1. Fetch HTML
  const html = await fetchWithTimeout(url);

  // 2. Parse HTML
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // 3. Clean generic unwanted elements
  const unwantedSelectors = [
    "script",
    "style",
    "iframe",
    "nav",
    "footer",
    "aside",
    ".header",
    ".footer",
    ".cookie-banner",
    ".newsletter",
    "#sidebar",
    ".sidebar",
    ".ad",
    ".ads",
    ".advertisement",
    '[role="alert"]',
    '[role="banner"]',
    '[role="navigation"]',
  ];
  const unwanted = doc.querySelectorAll(unwantedSelectors.join(","));
  unwanted.forEach((el) => el.remove());

  // 4. Readability
  const reader = new Readability(doc);
  const article = reader.parse();

  // 5. Fallback & Extraction
  const title = article?.title || doc.title || "";
  let content = article?.textContent?.trim() || "";

  // Fallback if content is missing
  if (!content) {
    logger.warn("Readability failed, attempting fallback extraction...");
    const metaDesc =
      doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
      "";
    const headings = Array.from(doc.querySelectorAll("h1, h2, h3"))
      .map((h) => h.textContent?.trim())
      .join("\n\n");
    content = `${metaDesc}\n\n${headings}`;
  }

  if (!content || content.length < 50) {
    throw new Error("Unable to extract meaningful content from page.");
  }

  // Truncate if too long (simple char count)
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.slice(0, MAX_CONTENT_LENGTH);
  }

  // Headings for context
  const inputDom = new JSDOM(article?.content || html); // Use article HTML if available, else raw
  const headingsNodeList =
    inputDom.window.document.querySelectorAll("h1, h2, h3");
  const headings = Array.from(headingsNodeList)
    .map((h) => h.textContent?.trim() || "")
    .filter(Boolean);

  // Extract additional metadata
  const metaDescription =
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
    doc
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content") ||
    "";

  const author =
    doc.querySelector('meta[name="author"]')?.getAttribute("content") ||
    doc
      .querySelector('meta[property="article:author"]')
      ?.getAttribute("content") ||
    doc.querySelector('[rel="author"]')?.getAttribute("content") ||
    "";

  const publishedDate =
    doc
      .querySelector('meta[property="article:published_time"]')
      ?.getAttribute("content") ||
    doc.querySelector('meta[name="publishdate"]')?.getAttribute("content") ||
    doc.querySelector("time[datetime]")?.getAttribute("datetime") ||
    "";

  // Extract images
  const ogImage =
    doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
    "";

  // Extract all images from article content
  const articleImages: string[] = [];
  if (article?.content) {
    const articleDoc = new JSDOM(article.content).window.document;
    const imgElements = articleDoc.querySelectorAll("img");
    imgElements.forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src");
      if (src) {
        try {
          // Convert relative URLs to absolute
          const absoluteUrl = new URL(src, url).href;
          articleImages.push(absoluteUrl);
        } catch {
          // Skip invalid URLs
        }
      }
    });
  }

  // Extract first image from main content if no og:image
  const imageUrl =
    ogImage || (articleImages.length > 0 ? articleImages[0] : "");

  const language =
    doc.documentElement.getAttribute("lang") ||
    doc
      .querySelector('meta[http-equiv="content-language"]')
      ?.getAttribute("content") ||
    "";

  const keywordsMeta =
    doc.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
  const keywords = keywordsMeta
    ? keywordsMeta
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const canonicalUrl =
    doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || url;

  const siteName =
    doc
      .querySelector('meta[property="og:site_name"]')
      ?.getAttribute("content") || "";

  // Generate excerpt (first 200 characters of content)
  const excerpt =
    content.slice(0, 200).trim() + (content.length > 200 ? "..." : "");

  return {
    title,
    headings,
    content,
    metaDescription: metaDescription || undefined,
    author: author || undefined,
    publishedDate: publishedDate || undefined,
    imageUrl: imageUrl || undefined,
    images: articleImages.length > 0 ? articleImages : undefined,
    language: language || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    canonicalUrl: canonicalUrl !== url ? canonicalUrl : undefined,
    siteName: siteName || undefined,
    excerpt: excerpt || undefined,
    url,
  };
}

export async function extractContent(url: string): Promise<CrawledData> {
  logger.info(`Starting crawl for: ${url}`);

  // Retry logic: Try 2 times total (Original + 1 Retry)
  let lastError;
  for (let i = 0; i < 2; i++) {
    try {
      if (i > 0) logger.info(`Retrying crawl (attempt ${i + 1})...`);
      return await attemptCrawl(url);
    } catch (error) {
      logger.warn(`Crawl attempt ${i + 1} failed:`, error);
      lastError = error;
    }
  }

  logger.error("All crawl attempts failed.");
  throw lastError;
}
