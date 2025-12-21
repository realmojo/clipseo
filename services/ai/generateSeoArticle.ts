import OpenAI from "openai";
import { CrawledData, GeneratedArticle } from "@/types/article";
import { logger } from "@/lib/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function validateAndclean(data: CrawledData) {
  if (!data.content || data.content.length < 100) {
    throw new Error(
      "Insufficient source content (< 100 chars). Aborting generation."
    );
  }
}

async function attemptGeneration(data: CrawledData): Promise<GeneratedArticle> {
  const prompt = `You are a senior SEO strategist and professional content writer.

This task is NOT summarization.
This task is to PLAN and WRITE a brand-new SEO article
that can realistically rank on Google.

The source content may come from YouTube, forums, or blogs
and may be incomplete, promotional, or unstructured.

-----------------------------------
SOURCE INFORMATION (REFERENCE ONLY)
-----------------------------------

SOURCE TYPE: YouTube video description
SOURCE TITLE: ${data.title}
SOURCE LANGUAGE: ${data.language || "unknown"}
SOURCE CONTENT (cleaned reference):
${data.content.slice(0, 15000)}

IMPORTANT:
- The source is NOT a full article
- The source may contain ads, links, or creator promotions
- Treat it only as topical signals, NOT content to rewrite

-----------------------------------
STEP 1: TOPIC & SEARCH QUERY DEFINITION (MANDATORY)
-----------------------------------

Before writing, you MUST internally determine:

1) The most likely PRIMARY SEARCH QUERY a user would type into Google

2) The PRIMARY SEARCH INTENT:
   - Informational
   - Opinion / explanation
   - Problem-solving
   - Social trend analysis

3) The TARGET AUDIENCE:
   - Who is searching this?
   - What confusion, curiosity, or concern do they have?

Base the article entirely on this interpretation.

-----------------------------------
STEP 2: CONTENT STRATEGY (INTERNAL REASONING)
-----------------------------------

Plan the article as if publishing on a trusted blog:

- Required background context
- Common misconceptions
- Social, economic, or psychological factors
- Why this article is more useful than comments or short videos

-----------------------------------
STEP 3: WRITING REQUIREMENTS
-----------------------------------

1) Length
- Minimum 1,200 words
- Depth over verbosity
- No filler or repetition

2) Structure (STRICT)
- DO NOT use <h1> tag
- Start content directly with introduction paragraphs
- 5–7 H2 sections
- H3 subsections where helpful
- Natural flow: background → analysis → insight

3) Required Sections
- Introduction: why this topic is being searched now
- Core analysis sections
- Practical insights or examples
- FAQ section (minimum 3 real user questions)
- Summary / Key Takeaways section

-----------------------------------
INTERACTIVE CTA BUTTONS (MANDATORY)
-----------------------------------

You MUST include exactly THREE (3) clickable CTA buttons
using <a> tags (NOT <button>).

Rules:
- Use semantic, natural anchor text
- Do NOT use promotional or exaggerated language
- Buttons must feel helpful, not salesy
- Use placeholder links (#)

Placement:
1) One CTA immediately after the introduction
2) One CTA after a major analysis section (middle of article)
3) One CTA near the end, before the summary

Example format:

<a href="#" class="cta-button">관련 주제 더 알아보기</a>

-----------------------------------
WRITING STYLE & TONE
-----------------------------------

- Written for Korean readers
- Conversational but authoritative
- No YouTube-style clickbait tone
- No AI disclaimers
- Avoid phrases like:
  "In this article, we will..."

-----------------------------------
SEO OPTIMIZATION (CONTROLLED)
-----------------------------------

Identify:
- 1 primary keyword
- 3–5 secondary keywords

Use naturally with semantic variations.

Generate:
- SEO title (≤ 60 chars)
- URL slug
- Meta description (≤ 155 chars)

-----------------------------------
ADSENSE & CONTENT SAFETY
-----------------------------------

The article must:
- Be informational and opinion-based
- Avoid defamatory or targeting language
- Avoid absolute claims
- Provide value beyond gossip or commentary

-----------------------------------
OUTPUT FORMAT (STRICT JSON)
-----------------------------------

Return ONLY valid JSON:

{
  "title": "...",
  "slug": "...",
  "metaDescription": "...",
  "html": "<article>...</article>"
}

HTML rules:
- Use only: h2, h3, p, ul, li, strong, table, figure, a
- DO NOT use <h1>
- No scripts or styles
- No html/head/body tags

-----------------------------------
FINAL QUALITY CHECK
-----------------------------------

Before returning:
- Does this feel like a real expert blog?
- Would users bookmark or share it?
- Could it rank even without the original video?`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content:
          "You are a professional SEO article writer. You output strictly JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    // increased tokens to allow for long form
    max_tokens: 4000,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  const result = JSON.parse(content) as GeneratedArticle;

  // Internal Checks
  if (result.html.length < 2000) {
    // Rough char count proxy for word count
    logger.warn("Generated content seems short, but proceeding.");
  }
  if (!result.html.includes("<h2>")) {
    logger.warn("Generated content missing H2 tags.");
  }
  if (!result.html.toLowerCase().includes("faq")) {
    logger.warn("Generated content missing FAQ section.");
  }

  // Logging consumption (estimate)
  const tokens = completion.usage?.total_tokens;
  logger.info(`AI Generation used approx ${tokens} tokens.`);

  return result;
}

export async function generateSeoArticle(
  data: CrawledData
): Promise<GeneratedArticle> {
  await validateAndclean(data);

  logger.info("Starting AI generation for title: " + data.title);

  let lastError;
  for (let i = 0; i < 2; i++) {
    try {
      if (i > 0) logger.info(`Retrying AI generation (attempt ${i + 1})...`);
      return await attemptGeneration(data);
    } catch (error) {
      logger.warn(`AI generation attempt ${i + 1} failed:`, error);
      lastError = error;
    }
  }

  throw lastError;
}
