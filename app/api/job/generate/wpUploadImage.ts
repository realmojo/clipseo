// axios 버전
import path from "path";
import sharp from "sharp";
// @ts-expect-error - wpapi 타입 정의가 없음
import WPAPI from "wpapi";

export const uploadToWordPress = async (
  originalPath: string,
  title: string
) => {
  // WPAPI 클라이언트 설정
  const wp = new WPAPI({
    endpoint: "https://devupbox.com/wp-json",
  });
  const wpToken = process.env.WP_TOKEN;

  if (!wpToken) {
    throw new Error("WP_TOKEN is not set");
  }

  try {
    let uploadPath = originalPath;

    // PNG → WebP 변환
    if (path.extname(originalPath).toLowerCase() === ".png") {
      const webpPath = originalPath.replace(/\.png$/i, ".webp");
      await sharp(originalPath).webp({ quality: 85 }).toFile(webpPath);
      console.log("✅ PNG → WebP 변환 성공:", webpPath);
      uploadPath = webpPath;
    }

    const response = await wp
      .media()
      .file(uploadPath) // 파일 경로 직접 지정
      .setHeaders({ Authorization: `Bearer ${wpToken}` }) // JWT 인증
      .create({
        title: title || "",
        alt_text: title || "",
        caption: title || "",
        description: title || "",
      });

    console.log("✅ 이미지 업로드 성공:", response);
    return response;
  } catch (err) {
    console.error("❌ 이미지 업로드 실패:", err.message || err);
    throw err;
  }
};
