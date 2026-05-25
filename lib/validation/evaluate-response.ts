import { z } from "zod";

// Client input validation schema (for checking basic parameters)
export const RequestValidationSchema = z.object({
  brand: z.enum(["bonario", "ordinaire"]),
  caption: z.string().min(1, "Caption/nội dung không được để trống"),
  contentType: z.string().min(1, "Loại content không được để trống"),
  serving: z.string().min(1, "Mục tiêu phục vụ không được để trống"),
});

export const CriterionSchema = z.object({
  name: z.string(),
  status: z.enum(["PASS", "FAIL"]),
  evidence: z.string().min(1, "Bằng chứng không được để trống"),
});

export const EvaluationResponseSchema = z.object({
  criteria: z.array(CriterionSchema).min(1).max(20),
  verdict: z.enum(["PASS", "REVISION NEEDED", "REJECT"]),
  verdict_summary: z.string().min(1, "Tổng kết kết luận không được để trống"),
  fixes: z.array(z.string()),
  suggested_revision: z.string().min(1, "Bản viết lại không được để trống"),
});

export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;

/**
 * Calculates the correct verdict based on the criteria statuses:
 * - PASS: 0 criteria failed
 * - REVISION NEEDED: 1-2 criteria failed
 * - REJECT: 3 or more criteria failed
 */
export function calculateVerdict(
  criteria: { status: "PASS" | "FAIL" }[],
): "PASS" | "REVISION NEEDED" | "REJECT" {
  const failCount = criteria.filter((c) => c.status === "FAIL").length;
  if (failCount === 0) {
    return "PASS";
  }
  if (failCount <= 2) {
    return "REVISION NEEDED";
  }
  return "REJECT";
}

/**
 * Validates and normalizes Claude's JSON response.
 * Ensure criteria names are exactly matched and the verdict is corrected if Claude miscalculated.
 */
export function normalizeAndValidateResponse(
  rawJson: unknown,
  expectedCriteriaNames: string[],
  hasImages: boolean,
): EvaluationResponse {
  // 1. Ensure rawJson is an object
  const obj =
    typeof rawJson === "object" && rawJson !== null
      ? (rawJson as Record<string, unknown>)
      : {};

  interface RawCriterion {
    name?: string;
    status?: string;
    evidence?: string;
  }

  // 2. Safely parse and normalize criteria array
  const rawCriteria = Array.isArray(obj.criteria)
    ? (obj.criteria as RawCriterion[])
    : [];

  const normalizedCriteria = expectedCriteriaNames.map((name) => {
    // Look for matching criterion in raw list (case-insensitive and whitespace-trimmed matching)
    const matched = rawCriteria.find(
      (c) =>
        c &&
        typeof c.name === "string" &&
        c.name.toLowerCase().trim() === name.toLowerCase().trim(),
    );

    let status: "PASS" | "FAIL" = "PASS";
    let evidence = "";

    if (matched) {
      status = matched.status === "FAIL" ? "FAIL" : "PASS";
      evidence =
        typeof matched.evidence === "string" ? matched.evidence.trim() : "";
    }

    // Force auto-pass logic for visual checks when no images are uploaded
    if (
      (name === "Visual-Text Alignment" || name === "Visual Standard") &&
      !hasImages
    ) {
      return {
        name,
        status: "PASS" as const,
        evidence: "Không có hình — auto PASS",
      };
    }

    // If there is an image but the visual check was missing or lacked evidence, set to FAIL or a standard notice
    if (
      (name === "Visual-Text Alignment" || name === "Visual Standard") &&
      hasImages &&
      !matched
    ) {
      return {
        name,
        status: "FAIL" as const,
        evidence: "Thiếu thông tin đánh giá hình ảnh từ mô hình.",
      };
    }

    return {
      name,
      status,
      evidence: evidence || "Không tìm thấy thông tin đánh giá từ mô hình.",
    };
  });

  // 3. Dynamically calculate the correct verdict
  const correctVerdict = calculateVerdict(normalizedCriteria);

  // 4. Safely parse verdict summary, fixes and suggested revision
  const rawVerdictSummary =
    typeof obj.verdict_summary === "string" ? obj.verdict_summary.trim() : "";
  const verdictSummary =
    rawVerdictSummary ||
    (correctVerdict === "PASS"
      ? "Nội dung đạt chuẩn thương hiệu."
      : "Nội dung cần điều chỉnh lại để phù hợp hơn với thương hiệu.");

  const rawFixes = Array.isArray(obj.fixes) ? (obj.fixes as unknown[]) : [];
  const fixes: string[] = rawFixes
    .map((f) => (typeof f === "string" ? f.trim() : ""))
    .filter((f): f is string => f.length > 0);

  // If verdict is PASS, fixes list must be empty
  const finalFixes =
    correctVerdict === "PASS"
      ? []
      : fixes.length > 0
        ? fixes
        : ["Cần sửa đổi các tiêu chuẩn chưa đạt."];

  const rawSuggested =
    typeof obj.suggested_revision === "string"
      ? obj.suggested_revision.trim()
      : "";
  const suggestedRevision = rawSuggested || "Không có bản gợi ý viết lại.";

  // 5. Final validation using strict Zod schema to ensure shape correctness
  return EvaluationResponseSchema.parse({
    criteria: normalizedCriteria,
    verdict: correctVerdict,
    verdict_summary: verdictSummary,
    fixes: finalFixes,
    suggested_revision: suggestedRevision,
  });
}
