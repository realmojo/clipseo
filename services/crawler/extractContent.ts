import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { CrawledData } from "@/types/article";
import { logger } from "@/lib/logger";

export async function extractContent(url: string): Promise<CrawledData> {
  try {
    logger.info(`Starting crawl for: ${url}`);
    
    // 1. Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Parse HTML with JSDOM
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // 3. Clean up generic unwanted elements before Readability (optional but safer)
    const unwanted = doc.querySelectorAll('script, style, iframe, nav, footer, aside, .ad, .ads, .advertisement');
    unwanted.forEach(el => el.remove());

    // 4. Use Readability to extract main content
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      throw new Error("Readability failed to parse article content");
    }

    // 5. Extract headings from the *extracted* content HTML
    // We create a temporary DOM from the cleaned article HTML to find relevant headings
    const articleDom = new JSDOM(article.content);
    const headingsNodeList = articleDom.window.document.querySelectorAll("h1, h2, h3");
    const headings = Array.from(headingsNodeList).map(h => h.textContent?.trim() || "").filter(Boolean);

    // 6. Return structured data
    return {
      title: article.title,
      headings: headings,
      content: article.textContent.trim(), // Plain text as requested
    };

  } catch (error) {
    logger.error("Error in crawler service:", error);
    throw error;
  }
}
