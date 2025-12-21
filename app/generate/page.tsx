"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  ArrowLeft,
  Globe,
  Upload,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrawledData, GeneratedArticle } from "@/types/article";
import { generateMockup } from "../api/job/generate/generateMockup";

interface GenerateResponse {
  status: "ok" | "error";
  data?: GeneratedArticle;
  message?: string;
  duration?: number;
}

interface PublishResponse {
  status: "ok" | "error";
  postId?: number;
  postUrl?: string;
  message?: string;
  duration?: number;
}

function GeneratePageContent() {
  const router = useRouter();
  const [crawledData, setCrawledData] = useState<CrawledData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] =
    useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(
    null
  );
  const [publishError, setPublishError] = useState<string | null>(null);
  const hasGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    // 중복 실행 방지 (React Strict Mode 대응)
    if (hasGeneratedRef.current) return;
    
    // localStorage에서 크롤링된 데이터 가져오기
    try {
      const stored = localStorage.getItem("crawledData");
      if (stored) {
        const data = JSON.parse(stored) as CrawledData;
        setCrawledData(data);
        // 데이터를 가져온 후 자동으로 생성 시작
        hasGeneratedRef.current = true;
        handleGenerate(data);
      } else {
        setError("크롤링된 데이터가 없습니다. 먼저 URL을 크롤링해주세요.");
      }
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    }
  }, []);

  const handleGenerate = async (data: CrawledData) => {
    // 이미 실행 중이면 중복 실행 방지
    if (isGeneratingRef.current) return;
    
    isGeneratingRef.current = true;
    setGenerating(true);
    setError(null);
    setGeneratedArticle(null);

    try {
      const response = await fetch("/api/job/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ crawledData: data }),
      });

      const result: GenerateResponse = await response.json();

      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // const result = generateMockup as GenerateResponse;

      setGeneratedArticle(result);

      if (result.status === "error") {
        setError(result.message || "SEO 글 생성 중 오류가 발생했습니다.");
      } else {
        // 성공 시 localStorage에서 데이터 제거 (선택사항)
        localStorage.removeItem("crawledData");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setGeneratedArticle({
        status: "error",
        message: "네트워크 오류가 발생했습니다.",
      });
    } finally {
      setGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const handlePublish = async () => {
    if (!generatedArticle?.data || generatedArticle.status !== "ok") {
      setPublishError("게시할 글이 없습니다.");
      return;
    }

    setPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      const response = await fetch("/api/job/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ article: generatedArticle.data }),
      });

      const result: PublishResponse = await response.json();
      setPublishResult(result);

      if (result.status === "error") {
        setPublishError(
          result.message || "WordPress 게시 중 오류가 발생했습니다."
        );
      }
    } catch (err) {
      setPublishError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setPublishResult({
        status: "error",
        message: "네트워크 오류가 발생했습니다.",
      });
    } finally {
      setPublishing(false);
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
          <a href="/create" className="hover:text-foreground transition-colors">
            Create
          </a>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col p-4 z-10 pb-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        {/* Page Title */}
        <div className="w-full mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            SEO 글 생성
          </h1>
          <p className="text-lg text-muted-foreground">
            AI가 SEO 최적화된 글을 생성하고 있습니다
          </p>
        </div>

        {/* Loading State */}
        {generating && (
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  SEO 글 생성 중...
                </p>
                <p className="text-sm text-muted-foreground">
                  AI가 최적화된 콘텐츠를 작성하고 있습니다. 잠시만 기다려주세요.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
              <Button
                onClick={() => router.push("/create")}
                className="mt-4"
                variant="outline"
              >
                크롤링 페이지로 돌아가기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated Article */}
        {generatedArticle &&
          generatedArticle.status === "ok" &&
          generatedArticle.data && (
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <CardTitle>생성된 SEO 글</CardTitle>
                </div>
                <CardDescription>
                  AI가 생성한 SEO 최적화된 글입니다
                  {generatedArticle.duration && (
                    <span className="ml-2">
                      (소요 시간: {generatedArticle.duration.toFixed(2)}초)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    제목
                  </h3>
                  <h2 className="text-xl font-bold text-foreground">
                    {generatedArticle.data.title}
                  </h2>
                </div>

                {/* Slug */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    URL Slug
                  </h3>
                  <code className="text-sm text-foreground bg-muted/30 px-2 py-1 rounded">
                    {generatedArticle.data.slug}
                  </code>
                </div>

                {/* Meta Description */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    메타 설명
                  </h3>
                  <p className="text-sm text-foreground">
                    {generatedArticle.data.metaDescription}
                  </p>
                </div>

                {/* Generated HTML Content */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                    생성된 콘텐츠
                  </h3>
                  <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                    <div className="bg-muted/20 px-6 py-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          SEO 최적화된 글
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {generatedArticle.data.html
                            .replace(/<[^>]*>/g, "")
                            .length.toLocaleString()}
                          자
                        </span>
                      </div>
                    </div>
                    <div className="p-6 max-h-[800px] overflow-y-auto">
                      <article
                        className="article-content"
                        dangerouslySetInnerHTML={{
                          __html: generatedArticle.data.html,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* WordPress 게시 버튼 */}
                <div className="pt-6 border-t border-border">
                  <Button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full"
                    size="lg"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        WordPress에 게시 중...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        WordPress에 게시
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Publish Error */}
        {publishError && (
          <Card className="w-full border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">게시 오류</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {publishError}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Publish Result */}
        {publishResult && publishResult.status === "ok" && (
          <Card className="w-full border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="font-medium text-green-500">게시 완료</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {publishResult.message ||
                      "WordPress에 성공적으로 게시되었습니다."}
                  </p>
                </div>
              </div>
              {publishResult.postUrl && (
                <div className="mt-4">
                  <a
                    href={publishResult.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    게시된 글 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {publishResult.duration && (
                <p className="text-xs text-muted-foreground mt-2">
                  소요 시간: {publishResult.duration.toFixed(2)}초
                </p>
              )}
            </CardContent>
          </Card>
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

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
