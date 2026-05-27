"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, FileText, RefreshCw, AlertTriangle, X } from "lucide-react";
import { BrandKey, getBrandConfig } from "@/lib/brands";
import {
  NO_IMAGE_EVIDENCE,
  PENDING_VERDICT_SUMMARY_FALLBACK,
} from "@/lib/validation/evidence";
import {
  extractPartialStreamState,
  parseFinalStreamResult,
  type StreamEvaluationResponse,
} from "@/lib/validation/stream-response";
import BrandSwitcher from "@/components/BrandSwitcher";
import CustomSelect from "@/components/CustomSelect";
import ImageUploader, { ImageFile } from "@/components/ImageUploader";
import ResultPanel from "@/components/ResultPanel";

const STREAM_TIMEOUT_MS = 120_000;

function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Stream timeout — AI không phản hồi."));
    }, timeoutMs);

    reader.read().then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

// Visual premium themes mapped by active brand
const BRAND_THEMES = {
  bonario: {
    key: "bonario" as const,
    primaryColor:
      "from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650",
    accentText: "text-amber-400",
    bgGradient: "from-amber-950/20 via-transparent to-transparent",
    glowColor: "bg-amber-500/10",
    borderActive: "border-amber-500/40",
    shadowColor: "shadow-amber-500/10",
    brandBadge:
      "bg-amber-950/40 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
    btnSwitch:
      "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20",
    circleGlow: "bg-amber-500/5",
    logoGradient: "from-amber-100 via-amber-300 to-yellow-500",
    ringFocus: "focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10",
    scoreStroke: "text-amber-500",
    cardHover: "hover:border-amber-500/20 hover:bg-slate-900/60",
    panelStyle: "glass-panel-brand",
    hoverStyle: "premium-hover",
  },
  ordinaire: {
    key: "ordinaire" as const,
    primaryColor:
      "from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650",
    accentText: "text-indigo-400",
    bgGradient: "from-indigo-950/20 via-transparent to-transparent",
    glowColor: "bg-indigo-500/10",
    borderActive: "border-indigo-500/40",
    shadowColor: "shadow-indigo-500/10",
    brandBadge:
      "bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.08)]",
    btnSwitch:
      "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20",
    circleGlow: "bg-indigo-500/5",
    logoGradient: "from-indigo-200 via-indigo-300 to-purple-400",
    ringFocus:
      "focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10",
    scoreStroke: "text-indigo-500",
    cardHover: "hover:border-indigo-500/20 hover:bg-slate-900/60",
    panelStyle: "glass-panel-brand",
    hoverStyle: "premium-hover",
  },
};

export default function Home() {
  // Brand selection
  const [brand, setBrand] = useState<BrandKey>("bonario");
  const brandConfig = getBrandConfig(brand);
  const theme = BRAND_THEMES[brand];

  // Form states
  const [caption, setCaption] = useState("");
  const [contentType, setContentType] = useState("");
  const [serving, setServing] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<StreamEvaluationResponse | null>(null);
  const [errorToast, setErrorToast] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync data-brand attribute to <html> so CSS variables cascade globally
  useEffect(() => {
    document.documentElement.dataset.brand = brand;
  }, [brand]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const wordCount = useMemo(
    () => caption.trim().split(/\s+/).filter(Boolean).length,
    [caption],
  );

  // Switch brand and clear dependent states
  const handleBrandChange = (newBrand: BrandKey) => {
    if (newBrand === brand) return;
    abortControllerRef.current?.abort();
    setBrand(newBrand);
    setCaption("");
    setContentType("");
    setServing("");
    setValidationError(null);
    setResult(null);
    setImages([]);
  };

  // Auto-dismiss error toast
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Submit Evaluation Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Clientside validations
    if (!caption.trim()) {
      setValidationError(
        "Vui lòng nhập nội dung bài viết (Caption) cần đánh giá.",
      );
      return;
    }
    if (!contentType) {
      setValidationError(`Vui lòng chọn: ${brandConfig.contentTypeLabel}.`);
      return;
    }
    if (!serving) {
      setValidationError(`Vui lòng chọn: ${brandConfig.servingLabel}.`);
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    // Prepare Multipart Form Data
    const formData = new FormData();
    formData.append("brand", brand);
    formData.append("caption", caption);
    formData.append("contentType", contentType);
    formData.append("serving", serving);

    images.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || `Lỗi API (${response.status})`);
      }

      const contentTypeHeader = response.headers.get("content-type");
      if (
        contentTypeHeader &&
        contentTypeHeader.includes("text/event-stream")
      ) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Không thể khởi tạo bộ đọc stream từ server.");
        }

        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let accumulatedText = "";

        const brandCriteriaNames = brandConfig.criteria.map((c) => c.name);

        // Immediately initialize state so we can display evaluating state for each criterion
        const initialResult: StreamEvaluationResponse = {
          criteria: brandCriteriaNames.map((name) => ({
            name,
            status:
              (name === "Visual-Text Alignment" ||
                name === "Visual Standard") &&
              images.length === 0
                ? "PASS"
                : "evaluating",
            evidence:
              (name === "Visual-Text Alignment" ||
                name === "Visual Standard") &&
              images.length === 0
                ? NO_IMAGE_EVIDENCE
                : "",
          })),
          verdict: "PENDING",
          verdict_summary: PENDING_VERDICT_SUMMARY_FALLBACK,
          fixes: [],
          suggested_revision: "",
        };

        setResult(initialResult);
        setIsStreaming(true);
        setIsSubmitting(false); // Hide full page spinner, let stream show progress!

        try {
          let streamDone = false;
          while (true) {
            const { done, value } = await readWithTimeout(reader, STREAM_TIMEOUT_MS);
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine) continue;
              if (cleanLine.startsWith("data: ")) {
                const dataStr = cleanLine.slice(6);
                if (dataStr === "[DONE]") {
                  streamDone = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  accumulatedText += content;

                  const updatedState = extractPartialStreamState(
                    accumulatedText,
                    brandCriteriaNames,
                    images.length > 0,
                  );
                  setResult(updatedState);
                } catch {
                  if (process.env.NODE_ENV === "development") {
                    console.debug("[SSE] Failed to parse chunk:", dataStr.slice(0, 80));
                  }
                }
              }
            }
            if (streamDone) break;
          }

          // Final parse: use JSON.parse for accurate result (handles escaped quotes in revision)
          if (accumulatedText.trim()) {
            const finalResult = parseFinalStreamResult(
              accumulatedText,
              brandCriteriaNames,
              images.length > 0,
            );
            setResult(finalResult);
          }
        } catch (streamErr: unknown) {
          if (isAbortError(streamErr)) {
            return;
          }
          const msg =
            streamErr instanceof Error
              ? streamErr.message
              : "Lỗi trong quá trình nhận dữ liệu.";
          setErrorToast({ message: msg, code: "STREAM_ERROR" });
        } finally {
          reader.releaseLock();
          abortControllerRef.current = null;
        }
      } else {
        // Fallback for standard JSON response
        const data = await response.json();
        setResult(data);
      }
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return;
      }
      console.error(err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi kết nối hệ thống. Vui lòng thử lại sau.";
      setErrorToast({
        message: errorMessage,
        code: "CONNECTION_ERROR",
      });
    } finally {
      abortControllerRef.current = null;
      setIsSubmitting(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased" data-brand={brand}>
      {/* Decorative Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a33_1px,transparent_1px),linear-gradient(to_bottom,#0f172a33_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-40 animate-grid-drift" />

      {/* Dynamic Background Glows based on Brand Selection */}
      <div
        className={`absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b ${theme.bgGradient} pointer-events-none z-0 transition-all duration-1000`}
      />

      {/* Ambient Moving Mesh Orbs */}
      <div className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none z-0 animate-float-1" />
      <div className="absolute bottom-[25%] right-[10%] w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none z-0 animate-float-2" />

      {/* FIXED TOP ERROR TOAST */}
      {errorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 border border-rose-500/40 backdrop-blur-md rounded-xl p-4 shadow-2xl flex items-start gap-3 shadow-rose-950/20">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-400">
                Đã xảy ra lỗi
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {errorToast.message}
              </p>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 border-b border-slate-900/60 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl bg-gradient-to-br ${theme.primaryColor} flex items-center justify-center shadow-lg transition-all duration-1000`}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-lg font-bold font-sans bg-gradient-to-r ${theme.logoGradient} bg-clip-text text-transparent transition-all duration-1000`}
                >
                  Content Evaluator
                </h1>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[8px] font-semibold text-emerald-400 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Qwen 3.6 Active
                </span>
              </div>
              <p className="text-[9px] text-slate-400 tracking-wider font-semibold uppercase font-sans">
                Brand Consistency Engine
              </p>
            </div>
          </div>

          {/* BRAND SWITCHER */}
          <BrandSwitcher brand={brand} onChange={handleBrandChange} />
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT PANEL: INPUT FORM */}
        <section className="flex-1 lg:w-1/2 flex flex-col gap-6">
          <div
            className={`glass-panel ${theme.panelStyle} ${theme.hoverStyle} rounded-2xl p-6 shadow-xl flex flex-col gap-6`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
              <div>
                <h2 className="text-md font-bold text-slate-100 flex items-center gap-2 font-sans">
                  <FileText
                    className={`w-4.5 h-4.5 ${theme.accentText} transition-colors duration-1000`}
                  />
                  Dữ Liệu Kiểm Định
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập caption và đính kèm layout để đánh giá tính nhất quán
                  thương hiệu.
                </p>
              </div>
              <span
                className={`px-2.5 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider ${theme.brandBadge} transition-all duration-1000`}
              >
                {brandConfig.key} Standard
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* CAPTION TEXTAREA */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="caption"
                    className="text-xs font-bold text-slate-300 tracking-wide"
                  >
                    Caption bài viết
                  </label>
                  <span
                    className={`text-[10px] font-sans font-medium ${wordCount >= 40 ? theme.accentText : "text-slate-500"} transition-colors duration-1000`}
                  >
                    {wordCount} từ
                  </span>
                </div>
                <textarea
                  id="caption"
                  rows={6}
                  placeholder={
                    brand === "bonario"
                      ? "Ví dụ: Rèm linen có cấu trúc sợi mở giúp thoáng khí hơn 40% so với polyester, cực kỳ thích hợp cho rèm phòng ngủ..."
                      : "Ví dụ: Chúng tôi loại bỏ các quyết định phức tạp để định hình gu thẩm mỹ tối giản cho không gian sống của bạn..."
                  }
                  value={caption}
                  onChange={(e) => {
                    setCaption(e.target.value);
                    setValidationError(null);
                  }}
                  className={`w-full glass-input text-sm text-slate-200 rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none ${theme.ringFocus} resize-none`}
                />
                {brand === "bonario" &&
                  caption.trim().length > 0 &&
                  wordCount < 40 && (
                    <span className="text-[10px] text-amber-500/80 font-medium tracking-wide animate-in fade-in duration-200 mt-1">
                      ⚠️ Khuyến nghị viết ≥ 40 từ để đạt chiều sâu vật liệu của
                      Bonario.
                    </span>
                  )}
              </div>

              {/* DROPDOWNS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Content Type */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contentType"
                    className="text-xs font-bold text-slate-300 tracking-wide"
                  >
                    {brandConfig.contentTypeLabel}
                  </label>
                  <CustomSelect
                    id="contentType"
                    value={contentType}
                    onChange={(val) => {
                      setContentType(val);
                      setValidationError(null);
                    }}
                    options={brandConfig.contentTypeOptions}
                    placeholder="-- Chọn phân loại --"
                    brand={brand}
                  />
                </div>

                {/* Serving Goal */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="serving"
                    className="text-xs font-bold text-slate-300 tracking-wide"
                  >
                    {brandConfig.servingLabel}
                  </label>
                  <CustomSelect
                    id="serving"
                    value={serving}
                    onChange={(val) => {
                      setServing(val);
                      setValidationError(null);
                    }}
                    options={brandConfig.servingOptions}
                    placeholder="-- Chọn mục tiêu --"
                    brand={brand}
                  />
                </div>
              </div>

              {/* IMAGE UPLOADER */}
              <ImageUploader
                images={images}
                brandConfig={brandConfig}
                brand={brand}
                onImagesChange={setImages}
                onError={setErrorToast}
              />

              {/* CLIENT-SIDE VALIDATION ERROR */}
              {validationError && (
                <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 rounded-lg p-3 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <X className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting || isStreaming}
                className={`w-full mt-2 bg-gradient-to-r ${theme.primaryColor} disabled:from-slate-800 disabled:to-slate-800 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-lg ${brand === "bonario" ? "hover:shadow-amber-500/10" : "hover:shadow-indigo-500/10"} active:scale-[0.99] transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>ĐANG KHỞI TẠO...</span>
                  </>
                ) : isStreaming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>ĐANG ĐÁNH GIÁ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="tracking-wider uppercase">
                      BẮT ĐẦU KIỂM ĐỊNH
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT PANEL: RESULT DISPLAY */}
        <section className="flex-1 lg:w-1/2 flex flex-col">
          <ResultPanel
            key={`${brand}-${result ? "active" : "empty"}`}
            result={result}
            brand={brand}
            brandConfig={brandConfig}
            theme={theme}
            caption={caption}
            isSubmitting={isSubmitting}
            isStreaming={isStreaming}
          />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-900/60 py-6 text-center bg-slate-950/30">
        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase font-sans">
          Content Evaluator &bull; Powered by Qwen 3.6 &bull; Bonario Group
        </p>
      </footer>
    </div>
  );
}
