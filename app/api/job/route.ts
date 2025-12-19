import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/services/crawler/extractContent";
import { generateSeoArticle } from "@/services/ai/generateSeoArticle";
import { publishPost } from "@/services/wp/publishPost";
import { logger } from "@/lib/logger";

type JobStatus = "RECEIVED" | "CRAWLED" | "GENERATED" | "PUBLISHED" | "FAILED";

interface JobLog {
  jobId: string;
  step: string;
  status: JobStatus;
  message: string;
  timestamp: string;
  details?: any;
}

function logJob(log: JobLog) {
  logger.info("Job Status Update", log);
}

function validateUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);

    // 1. Protocol check
    if (!["http:", "https:"].includes(url.protocol)) {
      return "Invalid protocol. Only HTTP/HTTPS allowed.";
    }

    // 2. Localhost / Private IP check
    const hostname = url.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return "Localhost not allowed.";
    }
    // Simple private IP regex (10.x, 192.168.x, 172.16-31.x)
    const privateIpRegex = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/;
    if (privateIpRegex.test(hostname)) {
      return "Private network IPs not allowed.";
    }

    // 3. Extension check
    const path = url.pathname.toLowerCase();
    const invalidExtensions = [
      ".pdf",
      ".zip",
      ".exe",
      ".dmg",
      ".iso",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".mp4",
      ".mp3",
    ];
    if (invalidExtensions.some((ext) => path.endsWith(ext))) {
      return "Non-HTML endpoint detected (file extension).";
    }

    return null; // Valid
  } catch (e) {
    return "Invalid URL format.";
  }
}

export async function POST(req: NextRequest) {
  const jobId = crypto.randomUUID();
  const startTime = Date.now();
  let currentStep = "INIT";

  const log = (status: JobStatus, message: string, details?: any) => {
    logJob({
      jobId,
      step: currentStep,
      status,
      message,
      timestamp: new Date().toISOString(),
      details,
    });
  };

  try {
    const body = await req.json();
    const { url } = body;

    currentStep = "VALIDATION";
    log("RECEIVED", `Job started for URL: ${url}`);

    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    const validationError = validateUrl(url);
    if (validationError) {
      throw new Error(`URL Validation Failed: ${validationError}`);
    }

    // 1. Crawl
    currentStep = "CRAWLING";
    log("RECEIVED", "Starting crawl...");

    let crawledData;
    try {
      crawledData = await extractContent(url);
    } catch (error: any) {
      throw new Error(`Crawling failed: ${error.message}`);
    }

    if (!crawledData.content || crawledData.content.length < 100) {
      throw new Error("Content too short or empty after crawling");
    }
    log("CRAWLED", "Crawling completed successfully", {
      length: crawledData.content.length,
    });

    // 2. AI Generation
    currentStep = "GENERATION";
    log("CRAWLED", "Starting AI generation...");

    let generatedArticle;
    try {
      generatedArticle = await generateSeoArticle(crawledData);
    } catch (error: any) {
      throw new Error(`AI Generation failed: ${error.message}`);
    }
    log("GENERATED", "Article generated successfully", {
      title: generatedArticle.title,
    });

    // 3. Publish to WP
    currentStep = "PUBLISHING";
    log("GENERATED", "Publishing to WordPress...");

    // let wpPostId;
    // try {
    //   wpPostId = await publishPost(generatedArticle);
    // } catch (error: any) {
    //   throw new Error(`WordPress Publishing failed: ${error.message}`);
    // }
    // log("PUBLISHED", "Job completed successfully", { wpPostId });

    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      status: "ok",
      jobId,
      // wpPostId,
      message: "Job completed successfully",
      duration,
    });
  } catch (error: any) {
    log("FAILED", error.message || "Unknown error");

    return NextResponse.json(
      {
        status: "error",
        jobId,
        step: currentStep,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
