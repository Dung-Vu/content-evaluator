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

function mapParsedEvaluation(
  parsed: unknown,
  brandCriteriaNames: string[],
  hasImages: boolean,
): StreamEvaluationResponse {
  const safeParsed =
    typeof parsed === "object" && parsed !== null
      ? (parsed as {
          criteria?: Array<{
            name?: string;
            status?: string;
            evidence?: string;
          }>;
          verdict?: string;
          verdict_summary?: string;
          fixes?: unknown;
          suggested_revision?: string;
        })
      : {};

  return {
    criteria: brandCriteriaNames.map((name) => {
      const match = safeParsed.criteria?.find(
        (criterion) =>
          criterion.name?.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      const isVisual = /visual/i.test(name);

      return {
        name,
        status:
          match?.status === "FAIL"
            ? "FAIL"
            : match?.status === "PASS"
              ? "PASS"
              : isVisual && !hasImages
                ? "PASS"
                : "evaluating",
        evidence:
          match?.evidence ||
          (isVisual && !hasImages
            ? "Không có hình — auto PASS"
            : "Đang phân tích..."),
      };
    }),
    verdict:
      safeParsed.verdict === "PASS" ||
      safeParsed.verdict === "REVISION NEEDED" ||
      safeParsed.verdict === "REJECT"
        ? safeParsed.verdict
        : "PENDING",
    verdict_summary:
      typeof safeParsed.verdict_summary === "string"
        ? safeParsed.verdict_summary
        : "",
    fixes: Array.isArray(safeParsed.fixes)
      ? safeParsed.fixes.filter(
          (fix): fix is string => typeof fix === "string" && fix.length > 0,
        )
      : [],
    suggested_revision:
      typeof safeParsed.suggested_revision === "string"
        ? safeParsed.suggested_revision
        : "",
  };
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
    verdict_summary: "Đang phân tích các tiêu chí...",
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
      criterion.evidence = "Không có hình — auto PASS";
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
      criterion.evidence = cleanQuote(evidenceMatch[1]);
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
    state.verdict_summary = cleanQuote(summaryMatch[1]);
  }

  const fixesMatch = streamText.match(/"fixes"\s*:\s*\[([\s\S]*?)(?:\]|$)/i);
  if (fixesMatch?.[1]) {
    state.fixes = [...fixesMatch[1].matchAll(/"([^"]*?)"/g)]
      .map((match) => match[1].trim())
      .filter(Boolean);
  }

  const suggestedMatch = streamText.match(
    /"suggested_revision"\s*:\s*"([\s\S]*?)(?:"|$)(?:\s*}|,\s*"|\s*$)/i,
  );
  if (suggestedMatch?.[1]) {
    state.suggested_revision = suggestedMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, "\t");
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
  } else {
    state.verdict = "PENDING";
  }

  return state;
}