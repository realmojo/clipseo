import OpenAI from "openai";
import { CrawledData, GeneratedArticle } from "@/types/article";
import { logger } from "@/lib/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSeoArticle(data: CrawledData): Promise<GeneratedArticle> {
  try {
    logger.info("Starting AI generation for title: " + data.title);

    const prompt = `
    You are an expert SEO content waiter. Your task is to take the provided source content and rewrite it into a completely new, high-quality, SEO-optimized article.
    
    SOURCE TITLE: ${data.title}
    SOURCE HEADINGS: ${data.headings.join(", ")}
    SOURCE CONTENT:
    ${data.content.slice(0, 15000)} // Truncate to avoid token limits if necessary

    INSTRUCTIONS:
    1. REWRITE the content completely. Do NOT summarize. Expand where possible to add value.
    2. Tone: Human-like, engaging, professional yet accessible. AdSense-safe (family friendly, no prohibited topics).
    3. Structure:
       - Use proper <H2> and <H3> tags for hierarchy.
       - Include a "Summary" box at the beginning (styled with a simple CSS class like 'summary-box').
       - detailed body paragraphs.
       - Include an "FAQ" section at the end with at least 3 questions and answers.
    4. Format: Return valid HTML for the body content.
    
    OUTPUT JSON FORMAT:
    {
      "title": "New SEO optimized title",
      "slug": "seo-optimized-url-slug",
      "metaDescription": "Compelling meta description (150-160 chars)",
      "html": "The full HTML article body..."
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional SEO article writer. You output strictly JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const result = JSON.parse(content) as GeneratedArticle;

    logger.info("AI generation completed successfully");
    return result;

  } catch (error) {
    logger.error("Error in AI service:", error);
    throw error;
  }
}
