"use client";
import { useState, Suspense } from "react";
import {
  ArrowRight,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Image as ImageIcon,
  Tag,
  Link as LinkIcon,
  Languages,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CrawledData, GeneratedArticle } from "@/types/article";
import { useSearchParams, useRouter } from "next/navigation";
import { generateMockup } from "../api/job/generate/generateMockup";

interface CrawlResponse {
  status: "ok" | "error";
  data?: CrawledData;
  message?: string;
  duration?: number;
}

interface GenerateResponse {
  status: "ok" | "error";
  data?: GeneratedArticle;
  message?: string;
  duration?: number;
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url");
  const [url, setUrl] = useState(
    initialUrl || "https://www.youtube.com/watch?v=uzMbYTXYqAQ"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/job/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: CrawlResponse = await response.json();
      setResult(data);

      if (data.status === "error") {
        setError(data.message || "크롤링 중 오류가 발생했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setResult({
        status: "error",
        message: "네트워크 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!result?.data || result.status !== "ok") {
      setError("크롤링 데이터가 없습니다.");
      return;
    }

    // 크롤링된 데이터를 localStorage에 저장하고 generate 페이지로 이동
    try {
      localStorage.setItem("crawledData", JSON.stringify(result.data));
      router.push("/generate");
    } catch (err) {
      setError("데이터 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-[100%] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-30" />

      {/* Navbar */}
      <header className="w-full p-6 z-50 flex justify-between items-center max-w-7xl mx-auto">
        <a
          href="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          ClipSEO
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">
            Home
          </a>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center p-4 z-10 pb-20">
        {/* Page Title */}
        <div className="w-full mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            Create SEO Content
          </h1>
          <p className="text-lg text-muted-foreground">
            URL을 입력하면 SEO 최적화된 콘텐츠를 생성합니다
          </p>
        </div>

        {/* Input Form */}
        <Card className="w-full mb-8">
          <CardHeader>
            <CardTitle>URL 입력</CardTitle>
            <CardDescription>
              분석할 웹페이지의 URL을 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 px-3 h-10 rounded-md border border-border bg-input/20">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    disabled={loading}
                    className="border-0 bg-transparent h-auto px-0"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      실행 <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="w-full mb-8 border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">오류 발생</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <div className="w-full space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {result.status === "ok" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <CardTitle>
                    {result.status === "ok" ? "크롤링 완료" : "크롤링 실패"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {result.status === "ok"
                    ? "웹페이지 크롤링이 완료되었습니다"
                    : "크롤링 중 오류가 발생했습니다"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.duration !== undefined && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                        소요 시간:
                      </span>
                      <span className="text-sm text-foreground">
                        {result.duration.toFixed(2)}초
                      </span>
                    </div>
                  )}
                  {result.message && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                        메시지:
                      </span>
                      <span className="text-sm text-foreground">
                        {result.message}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Crawled Data */}
            {result.status === "ok" && result.data && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle>크롤링된 데이터</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      제목
                    </h3>
                    <p className="text-base font-medium text-foreground">
                      {result.data.title || "(제목 없음)"}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  {(result.data.metaDescription ||
                    result.data.author ||
                    result.data.publishedDate ||
                    result.data.language ||
                    result.data.siteName ||
                    result.data.canonicalUrl) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.data.metaDescription && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                            메타 설명
                          </h3>
                          <p className="text-sm text-foreground">
                            {result.data.metaDescription}
                          </p>
                        </div>
                      )}
                      {result.data.author && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            작성자
                          </h3>
                          <p className="text-sm text-foreground">
                            {result.data.author}
                          </p>
                        </div>
                      )}
                      {result.data.publishedDate && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            발행일
                          </h3>
                          <p className="text-sm text-foreground">
                            {new Date(
                              result.data.publishedDate
                            ).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                      {result.data.language && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            언어
                          </h3>
                          <p className="text-sm text-foreground">
                            {result.data.language}
                          </p>
                        </div>
                      )}
                      {result.data.siteName && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                            사이트명
                          </h3>
                          <p className="text-sm text-foreground">
                            {result.data.siteName}
                          </p>
                        </div>
                      )}
                      {result.data.canonicalUrl && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            정규화 URL
                          </h3>
                          <a
                            href={result.data.canonicalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {result.data.canonicalUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Keywords */}
                  {result.data.keywords && result.data.keywords.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        키워드 ({result.data.keywords.length}개)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.data.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {result.data.imageUrl && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        대표 이미지
                      </h3>
                      <div className="space-y-2">
                        <img
                          src={result.data.imageUrl}
                          alt={result.data.title}
                          className="max-w-full h-auto rounded-md border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <a
                          href={result.data.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block break-all"
                        >
                          {result.data.imageUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {result.data.images && result.data.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        이미지 ({result.data.images.length}개)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {result.data.images.slice(0, 6).map((imgUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={imgUrl}
                              alt={`Image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md border border-border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {result.data.images.length > 6 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          + {result.data.images.length - 6}개 더...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Excerpt */}
                  {result.data.excerpt && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        요약
                      </h3>
                      <p className="text-sm text-foreground italic">
                        {result.data.excerpt}
                      </p>
                    </div>
                  )}

                  {/* Headings */}
                  {result.data.headings && result.data.headings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        헤딩 ({result.data.headings.length}개)
                      </h3>
                      <div className="space-y-1">
                        {result.data.headings.map((heading, index) => (
                          <div
                            key={index}
                            className="text-sm text-foreground bg-muted/30 px-3 py-2 rounded-md"
                          >
                            {heading}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      콘텐츠 ({result.data.content.length.toLocaleString()}자)
                    </h3>
                    <div className="bg-muted/30 rounded-md p-4 max-h-[500px] overflow-y-auto">
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                        {result.data.content}
                      </pre>
                    </div>
                  </div>

                  {/* SEO 글 생성 버튼 */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleGenerate}
                      className="w-full"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      SEO 글 생성
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <footer className="w-full py-8 border-t border-border/40 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2024 ClipSEO Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
