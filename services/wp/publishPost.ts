import { GeneratedArticle } from "@/types/article";
import { logger } from "@/lib/logger";

function sanitizeHtml(html: string): string {
  // 1. Remove scripts
  let clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  // 2. Remove iframes
  clean = clean.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");
  // 3. Remove inline event handlers (onclick, onload, etc.)
  clean = clean.replace(/\son\w+="[^"]*"/g, "");
  return clean;
}

async function attemptPublish(article: GeneratedArticle, baseUrl: string, auth: string): Promise<number> {
    const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;

    const payload = {
        title: article.title,
        content: sanitizeHtml(article.html), // Sanitized
        status: "draft", // Enforced
        slug: article.slug,
        excerpt: article.metaDescription,
    };
  
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        // Stop immediately on Auth errors
        if (response.status === 401 || response.status === 403) {
             throw new Error(`WordPress Auth Error: ${response.status} - Stopping immediately.`);
        }
        
        // For 5xx or others, we might want to retry, so just throw
        const errorText = await response.text();
        throw new Error(`WordPress API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.id as number;
}

export async function publishPost(article: GeneratedArticle): Promise<number> {
  const baseUrl = process.env.WP_BASE_URL?.replace(/\/$/, "");
  const username = process.env.WP_USERNAME;
  const password = process.env.WP_APP_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error("WordPress configuration missing (WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD)");
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  
  logger.info(`Publishing to WordPress (Slug: ${article.slug})`);

  let lastError;
  for (let i = 0; i < 2; i++) {
      try {
          if (i > 0) logger.info(`Retrying WP publish (attempt ${i + 1})...`);
          const id = await attemptPublish(article, baseUrl, auth);
          logger.info(`Successfully created WP Draft. ID: ${id}`);
          return id;
      } catch (error: any) {
          logger.warn(`WP publish attempt ${i + 1} failed:`, error);
          
          // If it was the critical Auth error, rethrow immediately, don't retry.
          if (error.message.includes("WordPress Auth Error")) {
              throw error;
          }
          lastError = error;
      }
  }

  logger.error("All WordPress publish attempts failed.");
  throw lastError;
}
