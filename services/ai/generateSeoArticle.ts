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
  const prompt = `
You are a senior SEO strategist and professional content writer.

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
   (e.g. "why women consider 100 million won salary low")

2) The PRIMARY SEARCH INTENT:
   - Informational
   - Opinion / explanation
   - Problem-solving
   - Social trend analysis

3) The TARGET AUDIENCE:
   - Who is searching this?
   - What confusion, curiosity, or concern do they have?

You must base the entire article on THIS interpretation,
not on the structure or wording of the source.

-----------------------------------
STEP 2: CONTENT STRATEGY (INTERNAL REASONING)
-----------------------------------

Plan the article as if you are publishing on a trusted blog:

- What context does the reader need first?
- What misconceptions should be clarified?
- What social, economic, or psychological factors are involved?
- What makes this explanation more useful than YouTube comments?

-----------------------------------
STEP 3: WRITING REQUIREMENTS
-----------------------------------

1) Length
- Minimum 1,200 words
- Depth over verbosity
- No filler or repetition

2) Structure (STRICT)
- One clear H1 (SEO-optimized, click-worthy but honest)
- 5–7 H2 sections
- H3 subsections where helpful
- Natural progression from background → analysis → insights

3) Required Sections
- Introduction: why this topic is being searched now
- Core analysis sections (causes, context, perspectives)
- Practical insights or examples
- FAQ section (minimum 3 real search questions)
- Summary / Key Takeaways box

-----------------------------------
WRITING STYLE & TONE
-----------------------------------

- Written for Korean readers
- Natural, conversational but authoritative
- Explain concepts clearly, assume intelligent readers
- Avoid YouTube-style language or clickbait tone
- No AI disclaimers
- No phrases like:
  "In this article, we will..."

-----------------------------------
SEO OPTIMIZATION (CONTROLLED)
-----------------------------------

- Identify:
  - 1 primary keyword
  - 3–5 secondary keywords
- Use keywords naturally
- Include semantic and contextual variations
- Do NOT stuff keywords

Generate:
- SEO title (≤ 60 characters)
- URL slug
- Meta description (≤ 155 characters)

-----------------------------------
ADSENSE & CONTENT SAFETY
-----------------------------------

The article must:
- Be informational and opinion-based, not defamatory
- Avoid exaggerated or absolute claims
- Avoid targeting or attacking specific individuals
- Provide value beyond commentary or gossip

-----------------------------------
OUTPUT FORMAT (STRICT JSON)
-----------------------------------

Return ONLY valid JSON:

{
  "title": "...",
  "slug": "...",
  "metaDescription": "...",
  "html": "<article>...</article>",
}

HTML rules:
- Use only: h2, h3, p, ul, li, strong, table, figure
- No scripts, no styles
- Do NOT include html/head/body tags

-----------------------------------
FINAL QUALITY CHECK
-----------------------------------

Before returning:
- Does this read like a real expert-written blog post?
- Would a user bookmark or share this?
- Could this rank even if the YouTube video did not exist?
`;

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
