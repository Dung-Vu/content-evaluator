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

import {
  getVerdictSummaryFallback,
  MISSING_EVIDENCE_FALLBACK,
  MISSING_FIX_FALLBACK,
  MISSING_SUGGESTED_REVISION_FALLBACK,
  NO_IMAGE_EVIDENCE,
  PENDING_EVIDENCE_FALLBACK,
  PENDING_VERDICT_SUMMARY_FALLBACK,
  normalizeModelText,
  normalizeModelTextList,
  normalizeEvidenceText,
} from "@/lib/validation/evidence";
import { normalizeAndValidateResponse } from "@/lib/validation/evaluate-response";

function mapParsedEvaluation(
  parsed: unknown,
  brandCriteriaNames: string[],
  hasImages: boolean,
): StreamEvaluationResponse {
  return normalizeAndValidateResponse(parsed, brandCriteriaNames, hasImages);
}

export function findLastCompleteJsonObject(streamText: string): string | null {
  let inString = false;
  let isEscaped = false;
  let depth = 0;
  let objectStart = -1;
  let lastValidObject: string | null = null;

  for (let index = 0; index < streamText.length; index += 1) {
    const char = streamText[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        objectStart = index;
      }
      depth += 1;
      continue;
    }

    if (char !== "}" || depth === 0) {
      continue;
    }

    depth -= 1;

    if (depth !== 0 || objectStart === -1) {
      continue;
    }

    const candidate = streamText.slice(objectStart, index + 1).trim();

    try {
      JSON.parse(candidate);
      lastValidObject = candidate;
    } catch {
      // Ignore incomplete or malformed candidates and keep scanning.
    }
  }

  return lastValidObject;
}

export function parseFinalStreamResult(
  streamText: string,
  brandCriteriaNames: string[],
  hasImages: boolean,
): StreamEvaluationResponse {
  const lastCompleteJson = findLastCompleteJsonObject(streamText);

  if (lastCompleteJson) {
    try {
      return mapParsedEvaluation(
        JSON.parse(lastCompleteJson),
        brandCriteriaNames,
        hasImages,
      );
    } catch {
      // Fall through to partial extraction.
    }
  }

  return extractPartialStreamState(streamText, brandCriteriaNames, hasImages);
}

export function extractPartialStreamState(
  streamText: string,
  brandCriteriaNames: string[],
  hasImages: boolean,
): StreamEvaluationResponse {
  const state: StreamEvaluationResponse = {
    criteria: brandCriteriaNames.map((name) => ({
      name,
      status: "evaluating",
      evidence: "",
    })),
    verdict: "PENDING",
    verdict_summary: PENDING_VERDICT_SUMMARY_FALLBACK,
    fixes: [],
    suggested_revision: "",
  };

  const cleanQuote = (value: string) => {
    let clean = value.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1);
    }
    return clean.trim();
  };

  for (const criterion of state.criteria) {
    if (
      (criterion.name === "Visual-Text Alignment" ||
        criterion.name === "Visual Standard") &&
      !hasImages
    ) {
      criterion.status = "PASS";
      criterion.evidence = NO_IMAGE_EVIDENCE;
      continue;
    }

    const escapedName = criterion.name.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      "\\$&",
    );
    const statusRegex = new RegExp(
      `"${escapedName}"[^}]*?"status"\\s*:\\s*"([^"]*)"`,
      "i",
    );
    const statusMatch = streamText.match(statusRegex);
    if (statusMatch?.[1]) {
      const parsedStatus = statusMatch[1].toUpperCase();
      if (parsedStatus === "PASS" || parsedStatus === "FAIL") {
        criterion.status = parsedStatus;
      }
    }

    const evidenceRegex = new RegExp(
      `"${escapedName}"[^}]*?"evidence"\\s*:\\s*"([^"]*?)(?:"|$)`,
      "i",
    );
    const evidenceMatch = streamText.match(evidenceRegex);
    if (evidenceMatch?.[1]) {
      criterion.evidence = normalizeEvidenceText(cleanQuote(evidenceMatch[1]));
    }

    if (
      !criterion.evidence &&
      (criterion.status === "PASS" || criterion.status === "FAIL")
    ) {
      criterion.evidence = MISSING_EVIDENCE_FALLBACK;
    } else if (!criterion.evidence && criterion.status === "evaluating") {
      criterion.evidence = PENDING_EVIDENCE_FALLBACK;
    }
  }

  const verdictMatch = streamText.match(/"verdict"\s*:\s*"([^"]*?)(?:"|$)/i);
  if (verdictMatch?.[1]) {
    const parsedVerdict = verdictMatch[1].toUpperCase();
    if (
      parsedVerdict === "PASS" ||
      parsedVerdict === "REVISION NEEDED" ||
      parsedVerdict === "REJECT"
    ) {
      state.verdict = parsedVerdict;
    }
  }

  const summaryMatch = streamText.match(
    /"verdict_summary"\s*:\s*"([^"]*?)(?:"|$)/i,
  );
  if (summaryMatch?.[1]) {
    state.verdict_summary =
      normalizeModelText(cleanQuote(summaryMatch[1])) ||
      PENDING_VERDICT_SUMMARY_FALLBACK;
  }

  const fixesMatch = streamText.match(/"fixes"\s*:\s*\[([\s\S]*?)(?:\]|$)/i);
  if (fixesMatch?.[1]) {
    state.fixes = normalizeModelTextList(
      [...fixesMatch[1].matchAll(/"([^"]*?)"/g)].map((match) => match[1]),
    );
  }

  const suggestedMatch = streamText.match(
    /"suggested_revision"\s*:\s*"([\s\S]*?)(?:"|$)(?:\s*}|,\s*"|\s*$)/i,
  );
  if (suggestedMatch?.[1]) {
    state.suggested_revision = normalizeModelText(
      suggestedMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\t/g, "\t"),
    );
  }

  const allEvaluated = state.criteria.every(
    (criterion) => criterion.status === "PASS" || criterion.status === "FAIL",
  );
  if (allEvaluated) {
    const failCount = state.criteria.filter(
      (criterion) => criterion.status === "FAIL",
    ).length;
    state.verdict =
      failCount === 0 ? "PASS" : failCount <= 2 ? "REVISION NEEDED" : "REJECT";

    const normalizedSummary = normalizeModelText(state.verdict_summary);
    state.verdict_summary =
      normalizedSummary && normalizedSummary !== PENDING_VERDICT_SUMMARY_FALLBACK
        ? normalizedSummary
        : getVerdictSummaryFallback(state.verdict);
    state.fixes =
      state.verdict === "PASS"
        ? []
        : state.fixes.length > 0
          ? state.fixes
          : [MISSING_FIX_FALLBACK];
    state.suggested_revision =
      normalizeModelText(state.suggested_revision) ||
      MISSING_SUGGESTED_REVISION_FALLBACK;
  } else {
    state.verdict = "PENDING";
  }

  return state;
}