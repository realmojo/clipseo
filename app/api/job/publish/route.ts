import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
// @ts-expect-error - wpapi 타입 정의가 없음
import WPAPI from "wpapi";

function sanitizeHtml(html: string): string {
  // 1. Remove scripts
  let clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  // 2. Remove iframes
  clean = clean.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");
  // 3. Remove inline event handlers (onclick, onload, etc.)
  clean = clean.replace(/\son\w+="[^"]*"/g, "");
  return clean;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { article } = body;

    if (!article || typeof article !== "object") {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid article data provided",
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!article.title || !article.html || !article.slug) {
      return NextResponse.json(
        {
          status: "error",
          message: "Article missing required fields (title, html, slug)",
        },
        { status: 400 }
      );
    }

    logger.info(`Publishing to WordPress: ${article.title}`);

    // WPAPI 클라이언트 설정
    const wp = new WPAPI({
      endpoint: "https://devupbox.com/wp-json",
    });
    const wpToken = "";

    try {
      // WordPress에 게시
      const post = await wp
        .posts()
        .setHeaders({ Authorization: `Bearer ${wpToken}` })
        .create({
          title: article.title,
          content: sanitizeHtml(article.html),
          status: "draft", // 초안으로 저장
          slug: article.slug,
          excerpt: article.metaDescription || "",
          // featured_media는 이미지 ID가 필요하므로 나중에 추가 가능
        });

      const duration = (Date.now() - startTime) / 1000;
      logger.info(
        `WordPress publish completed successfully in ${duration.toFixed(2)}s`,
        {
          postId: post.id,
          title: article.title,
        }
      );

      return NextResponse.json({
        status: "ok",
        postId: post.id,
        postUrl: post.link,
        message: "WordPress에 성공적으로 게시되었습니다.",
        duration,
      });
    } catch (error: any) {
      logger.error(`WordPress publish failed: ${error.message}`);

      // 인증 오류인 경우
      if (error.code === "rest_cannot_create" || error.statusCode === 401) {
        return NextResponse.json(
          {
            status: "error",
            message: "WordPress 인증 오류가 발생했습니다.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          message: `WordPress 게시 실패: ${error.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }
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
