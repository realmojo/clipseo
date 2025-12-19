import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/services/crawler/extractContent";
import { logger } from "@/lib/logger";

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
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid URL provided",
        },
        { status: 400 }
      );
    }

    const validationError = validateUrl(url);
    if (validationError) {
      return NextResponse.json(
        {
          status: "error",
          message: `URL Validation Failed: ${validationError}`,
        },
        { status: 400 }
      );
    }

    logger.info(`Starting crawl for: ${url}`);

    // Crawl
    let crawledData;
    try {
      crawledData = await extractContent(url);
    } catch (error: any) {
      logger.error(`Crawling failed: ${error.message}`);
      return NextResponse.json(
        {
          status: "error",
          message: `Crawling failed: ${error.message}`,
        },
        { status: 500 }
      );
    }

    if (!crawledData.content || crawledData.content.length < 50) {
      return NextResponse.json(
        {
          status: "error",
          message: "Content too short or empty after crawling",
        },
        { status: 500 }
      );
    }

    const duration = (Date.now() - startTime) / 1000;
    logger.info(`Crawling completed successfully in ${duration.toFixed(2)}s`, {
      title: crawledData.title,
      contentLength: crawledData.content.length,
      headingsCount: crawledData.headings.length,
    });

    return NextResponse.json({
      status: "ok",
      data: crawledData,
      duration,
    });
  } catch (error: any) {
    logger.error(`Unexpected error: ${error.message}`);

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
