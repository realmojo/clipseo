import { GeneratedArticle } from "@/types/article";
import { logger } from "@/lib/logger";

export async function publishPost(article: GeneratedArticle): Promise<number> {
  const baseUrl = process.env.WP_BASE_URL?.replace(/\/$/, "");
  const username = process.env.WP_USERNAME;
  const password = process.env.WP_APP_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error("WordPress configuration missing (WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD)");
  }

  const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const payload = {
    title: article.title,
    content: article.html,
    status: "draft",
    slug: article.slug,
    excerpt: article.metaDescription,
    // You could map categories or tags here if needed in the future
  };

  try {
    logger.info(`Publishing to WordPress: ${endpoint} (Slug: ${article.slug})`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    logger.info(`Successfully created WP Draft. ID: ${data.id}`);
    
    return data.id as number;

  } catch (error) {
    logger.error("Error in WordPress service:", error);
    throw error;
  }
}
