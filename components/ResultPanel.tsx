"use client";

import { useState } from "react";
import {
  Award,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Layers,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  FileText,
  Sparkles,
  Copy,
} from "lucide-react";
import { BrandKey, BrandConfig } from "@/lib/brands";

export interface StreamCriterion {
  name: string;
  status: "PASS" | "FAIL" | "evaluating";
  evidence: string;
}

export interface StreamEvaluationResponse {
  criteria: StreamCriterion[];
  verdict: "PASS" | "REVISION NEEDED" | "REJECT" | "PENDING";
  verdict_summary: string;
  fixes: string[];
  suggested_revision: string;
}

interface ResultPanelProps {
  result: StreamEvaluationResponse | null;
  brand: BrandKey;
  brandConfig: BrandConfig;
  theme: {
    key: BrandKey;
    accentText: string;
    scoreStroke: string;
    panelStyle: string;
    hoverStyle: string;
  };
  caption: string;
  isSubmitting: boolean;
  isStreaming: boolean;
}

export default function ResultPanel({
  result,
  brand,
  brandConfig,
  theme,
  caption,
  isSubmitting,
  isStreaming,
}: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "revision">(
    "analysis",
  );
  const [expandedCriterion, setExpandedCriterion] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  // Helper to render verdict metadata
  const getVerdictDetails = (verdict: StreamEvaluationResponse["verdict"]) => {
    switch (verdict) {
      case "PASS":
        return {
          bg: "bg-emerald-950/30 border-emerald-500/25 text-emerald-400",
          badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-400/20",
          icon: <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />,
          title: "ĐẠT CHUẨN ĐỊNH HÌNH THƯƠNG HIỆU",
          desc: "Bài viết xuất sắc đáp ứng toàn bộ các tiêu chuẩn cốt lõi. Sẵn sàng đăng tải.",
        };
      case "REVISION NEEDED":
        return {
          bg: "bg-amber-950/30 border-amber-500/25 text-amber-400",
          badgeBg: "bg-amber-500/20 text-amber-400 border-amber-400/20",
          icon: <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />,
          title: "CẦN ĐIỀU CHỈNH ĐỂ ĐẠT CHUẨN",
          desc: "Đạt phần lớn tiêu chí, cần sửa một số điểm nhỏ trước khi đăng.",
        };
      case "REJECT":
        return {
          bg: "bg-rose-950/30 border-rose-500/25 text-rose-400",
          badgeBg: "bg-rose-500/20 text-rose-400 border-rose-400/20",
          icon: <XCircle className="w-8 h-8 text-rose-400 shrink-0" />,
          title: "KHÔNG ĐẠT TIÊU CHUẨN CỐT LÕI",
          desc: "Vi phạm nghiêm trọng tiếng nói thương hiệu. Hãy viết lại dựa trên bản gợi ý.",
        };
      case "PENDING":
      default:
        return {
          bg: `bg-slate-900/30 border-slate-700/25 text-slate-400 animate-pulse`,
          badgeBg: `bg-slate-800/40 text-slate-400 border-slate-700/20`,
          icon: (
            <RefreshCw
              className={`w-8 h-8 ${brand === "bonario" ? "text-amber-500" : "text-indigo-500"} shrink-0 animate-spin`}
            />
          ),
          title: "HỆ THỐNG ĐANG KIỂM ĐỊNH...",
          desc: "Trình AI đang phân tích và đối chiếu từng tiêu chuẩn thương hiệu.",
        };
    }
  };

  // Copy suggested revision to clipboard
  const handleCopyText = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for insecure LAN connections (HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Move outside of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("Fallback copy command failed");
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Calculate score indicators
  const totalCriteriaCount = result ? result.criteria.length : 0;
  const passedCriteriaCount = result
    ? result.criteria.filter((c) => c.status === "PASS").length
    : 0;
  const scorePercentage =
    totalCriteriaCount > 0
      ? Math.round((passedCriteriaCount / totalCriteriaCount) * 100)
      : 0;

  // Score circle calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (scorePercentage / 100) * circumference;

  return (
    <div className="flex flex-col h-full">
      {/* EMPTY STATE */}
      {!isSubmitting && !result && (
        <div className="flex-1 bg-slate-950/20 border border-slate-900 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
          <div className="h-16 w-16 rounded-2xl bg-slate-900/60 border border-slate-800/40 text-slate-500 flex items-center justify-center shadow-inner">
            <Award className="w-8 h-8 opacity-30" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-300 font-display">
              Hệ thống sẵn sàng kiểm định
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
              Vui lòng nhập nội dung bài viết và đính kèm thiết kế hình ảnh, sau
              đó bấm nút để AI tiến hành quét, đối chiếu và chấm điểm mức độ
              nhất quán thương hiệu.
            </p>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isSubmitting && (
        <div className="flex-1 bg-slate-900/25 border border-slate-800/60 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col gap-6 animate-pulse">
          <div className="flex items-center gap-4 border-b border-slate-800/50 pb-6">
            <div className="h-14 w-14 rounded-xl bg-slate-850" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-slate-850 rounded-md w-1/3" />
              <div className="h-3 bg-slate-850 rounded-md w-2/3" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-24 bg-slate-850 rounded-xl" />
            <div className="h-8 bg-slate-850 rounded-lg" />
            <div className="h-8 bg-slate-850 rounded-lg" />
            <div className="h-8 bg-slate-850 rounded-lg" />
            <div className="h-8 bg-slate-850 rounded-lg" />
          </div>
        </div>
      )}

      {/* SUCCESS RESULT PANEL */}
      {!isSubmitting && result && (
        <div className="flex-1 bg-slate-900/25 border border-slate-800/60 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-400">
          {/* BRAND SCORE HEADER (Visual Circle Progress Gauge) */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 shadow-inner">
            {/* SVG Gauge */}
            <div className="relative w-24 h-24 shrink-0 select-none">
              <svg className="w-full h-full transform -rotate-90 overflow-visible">
                <defs>
                  <linearGradient
                    id="bonario-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient
                    id="ordinaire-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                {/* Technical outer dashed ring */}
                <circle
                  className="text-slate-800/30"
                  strokeWidth="1.5"
                  strokeDasharray="4, 4"
                  stroke="currentColor"
                  fill="transparent"
                  r="38"
                  cx="48"
                  cy="48"
                />
                {/* Inner track circle with glass fill base */}
                <circle
                  className="text-slate-950/80"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="rgba(3, 7, 18, 0.4)"
                  r={radius}
                  cx="48"
                  cy="48"
                />
                {/* Glowing progress ring shadow */}
                <circle
                  className="transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke={`url(#${brand}-gradient)`}
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                  style={{
                    filter: `drop-shadow(0 0 5px ${brand === "bonario" ? "#f59e0b" : "#6366f1"})`,
                    opacity: 0.3,
                  }}
                />
                {/* Main progress ring */}
                <circle
                  className="transition-all duration-1000 ease-out animate-gauge-draw"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke={`url(#${brand}-gradient)`}
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold font-display text-white tracking-tighter">
                  {scorePercentage}%
                </span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-display">
                  Brand Fit
                </span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <span
                  className={`inline-block self-center sm:self-auto px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${getVerdictDetails(result.verdict).badgeBg}`}
                >
                  {result.verdict}
                </span>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide font-display">
                  {getVerdictDetails(result.verdict).title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {result.verdict_summary}
              </p>
              <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  {passedCriteriaCount} Đạt
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  {totalCriteriaCount - passedCriteriaCount} Sửa
                </span>
              </div>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex border-b border-slate-900/80 pb-px">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 text-center ${
                activeTab === "analysis"
                  ? `border-${brand === "bonario" ? "amber" : "indigo"}-500 text-white`
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Kết Quả Đánh Giá Tiêu Chí
            </button>
            <button
              onClick={() => setActiveTab("revision")}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 text-center ${
                activeTab === "revision"
                  ? `border-${brand === "bonario" ? "amber" : "indigo"}-500 text-white`
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              So Sánh Bản Nháp Tối Ưu
            </button>
          </div>

          {/* TAB CONTENT: ANALYSIS */}
          {activeTab === "analysis" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5 text-slate-550 animate-pulse" />
                Kết Quả Đánh Giá Tiêu Chí
              </div>

              <div className="flex flex-col gap-2.5">
                {result.criteria.map((c, idx) => {
                  const match = brandConfig.criteria.find(
                    (conf) => conf.name === c.name,
                  );
                  const isPass = c.status === "PASS";
                  const isFail = c.status === "FAIL";
                  const isEvaluating = !isPass && !isFail;
                  const isExpanded = expandedCriterion === idx;

                  return (
                    <div
                      key={idx}
                      className={`bg-slate-950/20 border ${
                        isExpanded
                          ? `border-${brand === "bonario" ? "amber" : "indigo"}-500/30 bg-slate-950/60 shadow-[0_4px_20px_rgba(var(--color-${brand}-accent-rgb),0.03)]`
                          : "border-slate-800/30"
                      } rounded-xl transition-all duration-300 hover:border-${brand === "bonario" ? "amber" : "indigo"}-500/20`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCriterion(isExpanded ? null : idx)
                        }
                        className="w-full px-4 py-3.5 flex items-center justify-between cursor-pointer select-none text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1 rounded-md border ${
                              isPass
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                : isFail
                                  ? "bg-rose-950/60 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                                  : "bg-slate-950/60 text-slate-500 border-slate-800/60 animate-pulse"
                            }`}
                          >
                            {isPass ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : isFail ? (
                              <X className="w-3.5 h-3.5" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            )}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                              isPass
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : isFail
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-550/20 animate-pulse"
                            }`}
                          >
                            {isEvaluating ? "ĐANG QUÉT..." : c.status}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-950/40 pt-3 flex flex-col gap-2.5 text-xs text-slate-300 animate-in fade-in slide-in-from-top-1 duration-200">
                          {match && (
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Mô tả tiêu chí
                              </span>
                              <p className="text-slate-400 font-medium leading-relaxed">
                                {match.question}{" "}
                                <span className="text-slate-550 italic">
                                  ({isPass ? match.passDesc : match.failDesc})
                                </span>
                              </p>
                            </div>
                          )}

                          <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-900">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Bằng chứng thực tế (Evidence)
                            </span>
                            <p className="text-xs text-slate-200 italic leading-relaxed whitespace-pre-wrap font-serif">
                              {c.evidence
                                ? `"${c.evidence}"`
                                : "Đang phân tích..."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: REVISION */}
          {activeTab === "revision" && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-300">
              {/* Actionable Fixes (Shown only when there are failing criteria) */}
              {result.fixes && result.fixes.length > 0 && (
                <div className="bg-rose-950/10 border border-rose-500/20 rounded-xl p-4 flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-400" />
                    Các Điểm Cần Khắc Phục (Fixes)
                  </h4>
                  <ul className="flex flex-col gap-2 pl-1">
                    {result.fixes.map((fix, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-rose-400 select-none mt-0.5 font-bold">
                          •
                        </span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SIDE BY SIDE COMPARISON */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  So Sánh Bản Nháp Tối Ưu
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Caption Card */}
                  <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                      <FileText className="w-3.5 h-3.5 text-slate-550" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Văn bản nháp gốc
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto font-sans">
                      {caption || "(Chưa có nội dung)"}
                    </p>
                  </div>

                  {/* Suggested Revision Card */}
                  <div
                    className={`bg-slate-950/60 border-2 ${brand === "bonario" ? "border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.06)]" : "border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.06)]"} rounded-xl p-4 flex flex-col gap-2.5 transition-all duration-500`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles
                          className={`w-3.5 h-3.5 ${theme.accentText}`}
                        />
                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">
                          Nháp gợi ý chuẩn thương hiệu
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopyText(result.suggested_revision)
                        }
                        className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer select-none border ${
                          copied
                            ? "bg-emerald-950 border-emerald-500/30 text-emerald-400"
                            : `text-slate-300 hover:text-white bg-slate-900/60 border-slate-800 hover:border-${brand === "bonario" ? "amber-500/30" : "indigo-500/30"}`
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in-50 duration-200" />
                            <span className="font-semibold">Đã copy!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Sao chép nháp gợi ý</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto font-sans">
                      {result.suggested_revision || "Đang tạo bản nháp..."}
                      {isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-300 animate-pulse align-middle" />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
