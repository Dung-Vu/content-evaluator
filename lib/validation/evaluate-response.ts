import { z } from "zod";
import {
  getVerdictSummaryFallback,
  MISSING_EVIDENCE_FALLBACK,
  MISSING_FIX_FALLBACK,
  MISSING_SUGGESTED_REVISION_FALLBACK,
  MISSING_VISUAL_EVIDENCE_FALLBACK,
  NO_IMAGE_EVIDENCE,
  normalizeModelText,
  normalizeModelTextList,
  normalizeEvidenceText,
} from "@/lib/validation/evidence";

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
      evidence = normalizeEvidenceText(matched.evidence);
    }

    const isVisualCriterion = /visual/i.test(name);

    if (isVisualCriterion && !hasImages) {
      return {
        name,
        status: "PASS" as const,
        evidence: NO_IMAGE_EVIDENCE,
      };
    }

    if (isVisualCriterion && hasImages && !matched) {
      return {
        name,
        status: "FAIL" as const,
        evidence: MISSING_VISUAL_EVIDENCE_FALLBACK,
      };
    }

    return {
      name,
      status,
      evidence: evidence || MISSING_EVIDENCE_FALLBACK,
    };
  });

  // 3. Dynamically calculate the correct verdict
  const correctVerdict = calculateVerdict(normalizedCriteria);

  // 4. Safely parse verdict summary, fixes and suggested revision
  const rawVerdictSummary = normalizeModelText(obj.verdict_summary);
  const verdictSummary =
    rawVerdictSummary || getVerdictSummaryFallback(correctVerdict);

  const fixes = normalizeModelTextList(obj.fixes);

  // If verdict is PASS, fixes list must be empty
  const finalFixes =
    correctVerdict === "PASS"
      ? []
      : fixes.length > 0
        ? fixes
        : [MISSING_FIX_FALLBACK];

  const rawSuggested = normalizeModelText(obj.suggested_revision);
  const suggestedRevision =
    rawSuggested || MISSING_SUGGESTED_REVISION_FALLBACK;

  // 5. Final validation using strict Zod schema to ensure shape correctness
  const result = EvaluationResponseSchema.safeParse({
    criteria: normalizedCriteria,
    verdict: correctVerdict,
    verdict_summary: verdictSummary,
    fixes: finalFixes,
    suggested_revision: suggestedRevision,
  });

  if (result.success) {
    return result.data;
  }

  console.error("Zod validation failed for normalized response:", result.error.issues);
  return {
    criteria: normalizedCriteria,
    verdict: correctVerdict,
    verdict_summary: verdictSummary,
    fixes: finalFixes,
    suggested_revision: suggestedRevision,
  };
}
