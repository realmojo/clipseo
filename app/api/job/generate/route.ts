import { NextRequest, NextResponse } from "next/server";
import { generateSeoArticle } from "@/services/ai/generateSeoArticle";
import { CrawledData, GeneratedArticle } from "@/types/article";
import { logger } from "@/lib/logger";
import { generateMockup } from "@/app/api/job/generate/generateMockup";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { finished } from "stream/promises";
import { uploadToWordPress } from "./wpUploadImage";

const googleTranslate = async (text: string) => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=ko|en`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Translation API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.responseData.translatedText;
};

// 이미지 저장 함수
const generateFeaturedImage = async (title: string) => {
  const MAX_RETRIES = 3;

  const translateTitle = await googleTranslate(title);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📝 시도 ${attempt}/${MAX_RETRIES}`);

      const encodedPrompt = translateTitle;
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

      const date = new Date().getTime();
      const cropped_name = `cropped_${date}_attempt${attempt}.png`;

      // images 디렉토리 경로 확인 및 생성
      const imagesDir = path.resolve(process.cwd(), "images");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log("📁 images 디렉토리 생성 완료");
      }

      const filePath = path.resolve(
        imagesDir,
        `result_${date}_attempt${attempt}.png`
      );
      const cropPath = path.resolve(imagesDir, cropped_name);

      // 1. 이미지 다운로드
      console.log("📥 이미지 다운로드 시작...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Response body is not readable");
        }

        // ReadableStream을 Node.js stream으로 변환
        const reader = response.body.getReader();
        const writer = fs.createWriteStream(filePath);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!writer.write(Buffer.from(value))) {
              // 버퍼가 가득 찬 경우 drain 이벤트 대기
              await new Promise<void>((resolve) => {
                writer.once("drain", () => resolve());
              });
            }
          }
          writer.end();
          await finished(writer);
        } finally {
          reader.releaseLock();
        }

        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("Request timeout");
        }
        throw error;
      }

      console.log("✅ 이미지 다운로드 완료:", filePath);

      // 2. 이미지 크롭
      console.log("✂️ 이미지 크롭 시작...");

      // filePath 이미지가 있는지 확인 후 크롭 후 cropPath에 저장
      if (!fs.existsSync(filePath)) {
        throw new Error("이미지 파일이 없습니다.");
      }

      const image = await sharp(filePath);
      const metadata = await image.metadata();
      if (metadata.width && metadata.height) {
        await image
          .extract({ left: 0, top: 0, width: 1024, height: 960 })
          .toFile(cropPath);
        console.log("✅ 워터마크 제거 완료:", cropPath);
      } else {
        throw new Error("이미지 파일 크기를 가져올 수 없습니다.");
      }

      // 3. wp 이미지 업로드
      const wpImageInfo = await uploadToWordPress(cropPath, title);

      console.log("워드프레스 이미지 등록: ", wpImageInfo.source_url);
      console.log("✅ 전체 프로세스 완료!");

      // 4. 임시 파일 정리
      try {
        fs.unlinkSync(filePath);
        fs.unlinkSync(cropPath);
        console.log("🗑️ 임시 파일 정리 완료");
      } catch (cleanupErr: any) {
        console.warn("⚠️ 임시 파일 정리 실패:", cleanupErr.message);
      }

      return wpImageInfo;
    } catch (err: any) {
      console.error(`❌ 시도 ${attempt} 실패:`, err.message);

      if (attempt === MAX_RETRIES) {
        console.error(`💀 모든 재시도 실패. 기본 이미지로 대체 업로드 시도`);

        return null;
      }

      // 재시도 대기
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ ${waitTime / 1000}초 후 재시도...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { crawledData } = body;

    if (!crawledData || typeof crawledData !== "object") {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid crawled data provided",
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!crawledData.title || !crawledData.content) {
      return NextResponse.json(
        {
          status: "error",
          message: "Crawled data missing required fields (title, content)",
        },
        { status: 400 }
      );
    }

    logger.info(`Starting AI generation for: ${crawledData.title}`);

    // Generate SEO article
    let generatedArticle;
    try {
      // generatedArticle = await generateSeoArticle(crawledData as CrawledData);
      generatedArticle = generateMockup.data as GeneratedArticle;

      // cropPath,
      // wpToken,
      // title
      generatedArticle.featuredImage = await generateFeaturedImage(
        generatedArticle.title
      );

      // "featuredImagePrompt": "..."
    } catch (error: any) {
      logger.error(`AI Generation failed: ${error.message}`);
      return NextResponse.json(
        {
          status: "error",
          message: `AI Generation failed: ${error.message}`,
        },
        { status: 500 }
      );
    }

    const duration = (Date.now() - startTime) / 1000;
    logger.info(
      `AI generation completed successfully in ${duration.toFixed(2)}s`,
      {
        title: generatedArticle.title,
        htmlLength: generatedArticle.html.length,
      }
    );

    return NextResponse.json({
      status: "ok",
      data: generatedArticle,
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
