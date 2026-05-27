export const NO_IMAGE_EVIDENCE = "Không có hình — auto PASS";
export const MISSING_EVIDENCE_FALLBACK =
  "Không tìm thấy thông tin đánh giá từ mô hình.";
export const MISSING_VISUAL_EVIDENCE_FALLBACK =
  "Thiếu thông tin đánh giá hình ảnh từ mô hình.";
export const PENDING_EVIDENCE_FALLBACK = "Đang phân tích...";
export const PENDING_VERDICT_SUMMARY_FALLBACK =
  "Đang phân tích các tiêu chí...";
export const MISSING_SUGGESTED_REVISION_FALLBACK =
  "Không có bản gợi ý viết lại.";
export const MISSING_FIX_FALLBACK = "Cần sửa đổi các tiêu chuẩn chưa đạt.";

const PLACEHOLDER_PUNCTUATION_PATTERN = /^[\/\\|"'`.,;:_\-()\[\]{}\u2013\u2014]+$/;
const PLACEHOLDER_TOKEN_PATTERN = /^(?:n(?:[\/\-.\s]?a)?|none|null|nil|tbd)$/i;

export function normalizeModelText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const unwrapped = trimmed.replace(/^['"`]+|['"`]+$/g, "").trim();
  if (!unwrapped) {
    return "";
  }

  const compact = unwrapped.replace(/\s+/g, "");
  if (
    PLACEHOLDER_PUNCTUATION_PATTERN.test(compact) ||
    PLACEHOLDER_TOKEN_PATTERN.test(compact)
  ) {
    return "";
  }

  return unwrapped;
}

export function normalizeEvidenceText(value: unknown): string {
  return normalizeModelText(value);
}

export function normalizeModelTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of value) {
    const text = normalizeModelText(item);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    normalized.push(text);
  }

  return normalized;
}

export function getVerdictSummaryFallback(
  verdict: "PASS" | "REVISION NEEDED" | "REJECT",
): string {
  return verdict === "PASS"
    ? "Nội dung đạt chuẩn thương hiệu."
    : "Nội dung cần điều chỉnh lại để phù hợp hơn với thương hiệu.";
}