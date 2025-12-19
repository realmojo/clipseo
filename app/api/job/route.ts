import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/services/crawler/extractContent";
import { generateSeoArticle } from "@/services/ai/generateSeoArticle";
import { publishPost } from "@/services/wp/publishPost";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const jobId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { status: "error", message: "Invalid URL provided" },
        { status: 400 }
      );
    }

    logger.info(`[Job ${jobId}] Received request for URL: ${url}`);

    // 1. Crawl
    logger.info(`[Job ${jobId}] Step 1: Crawling...`);
    const crawledData = await extractContent(url);
    
    if (!crawledData.content || crawledData.content.length < 100) {
      throw new Error("Content too short or empty after crawling");
    }

    // 2. AI Generation
    logger.info(`[Job ${jobId}] Step 2: Generating Article...`);
    const generatedArticle = await generateSeoArticle(crawledData);

    // 3. Publish to WP
    logger.info(`[Job ${jobId}] Step 3: Publishing to WordPress...`);
    const wpPostId = await publishPost(generatedArticle);

    const duration = (Date.now() - startTime) / 1000;
    logger.info(`[Job ${jobId}] Completed in ${duration}s. WP ID: ${wpPostId}`);

    return NextResponse.json({
      status: "ok",
      jobId,
      wpPostId,
      message: "Job completed successfully"
    });

  } catch (error: any) {
    logger.error(`[Job ${jobId}] Failed:`, error);
    
    return NextResponse.json(
      { 
        status: "error", 
        jobId, 
        message: error instanceof Error ? error.message : "Internal Server Error" 
      },
      { status: 500 }
    );
  }
}
