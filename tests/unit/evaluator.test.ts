import { describe, it, expect, beforeEach, vi } from "vitest";
import { getBrandConfig, BrandKey } from "@/lib/brands";
import {
  RequestValidationSchema,
  calculateVerdict,
  normalizeAndValidateResponse,
} from "@/lib/validation/evaluate-response";
import { memoryRateLimiter } from "@/lib/rate-limit/memory-rate-limiter";

describe("Brand Configuration", () => {
  it("should retrieve correct config based on brand key", () => {
    const bonario = getBrandConfig("bonario");
    expect(bonario.key).toBe("bonario");
    expect(bonario.name).toBe("Bonario Content Evaluator");
    expect(bonario.criteria.length).toBe(6);
    expect(bonario.criteria[0].name).toBe("Pillar Fit");

    const ordinaire = getBrandConfig("ordinaire");
    expect(ordinaire.key).toBe("ordinaire");
    expect(ordinaire.name).toBe("Ordinaire Content Evaluator");
    expect(ordinaire.criteria.length).toBe(5);
  });

  it("should throw error for unknown brand", () => {
    expect(() => getBrandConfig("unknown" as BrandKey)).toThrow();
  });

  it("should have synchronized v4 spec option labels and descriptions", () => {
    const bonario = getBrandConfig("bonario");

    // Check key labels
    const faqOpt = bonario.contentTypeOptions.find(
      (o) => o.value === "Pillar 1 - FAQ & Edu",
    );
    expect(faqOpt?.label).toContain("Library Video FAQ: Giải đáp các câu hỏi");

    const trustOpt = bonario.servingOptions.find(
      (o) => o.value === "Trust & Conversion",
    );
    expect(trustOpt?.label).toContain(
      "thông qua câu chuyện và hình ảnh thực tế",
    );

    // Check descriptions
    const eduDepth = bonario.criteria.find((c) => c.name === "Education Depth");
    expect(eduDepth?.passDesc).toContain(
      "(A) Đặc tính kỹ thuật & Bảo quản — cấu tạo",
    );
  });
});

describe("Request Validation", () => {
  it("should validate a correct request", () => {
    const payload = {
      brand: "bonario",
      caption: "Some content about linen.",
      contentType: "Pillar 1 - FAQ",
      serving: "Authority",
    };
    const check = RequestValidationSchema.safeParse(payload);
    expect(check.success).toBe(true);
  });

  it("should reject request with missing fields", () => {
    const payload = {
      brand: "bonario",
      caption: "",
      contentType: "Pillar 1 - FAQ",
      serving: "",
    };
    const check = RequestValidationSchema.safeParse(payload);
    expect(check.success).toBe(false);
  });
});

describe("Verdict Calculation", () => {
  it("should return PASS when 0 criteria fail (supports 5 or 6 criteria)", () => {
    const criteria5 = [
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
    ];
    const criteria6 = [
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
    ];
    expect(calculateVerdict(criteria5)).toBe("PASS");
    expect(calculateVerdict(criteria6)).toBe("PASS");
  });

  it("should return REVISION NEEDED when 1 or 2 criteria fail", () => {
    const criteria1 = [
      { status: "FAIL" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
    ];
    const criteria2 = [
      { status: "FAIL" as const },
      { status: "FAIL" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
    ];
    expect(calculateVerdict(criteria1)).toBe("REVISION NEEDED");
    expect(calculateVerdict(criteria2)).toBe("REVISION NEEDED");
  });

  it("should return REJECT when 3 or more criteria fail", () => {
    const criteria = [
      { status: "FAIL" as const },
      { status: "FAIL" as const },
      { status: "FAIL" as const },
      { status: "PASS" as const },
      { status: "PASS" as const },
    ];
    expect(calculateVerdict(criteria)).toBe("REJECT");
  });
});

describe("Response Normalization & Auto-Pass Logic", () => {
  const expectedCriteriaBonario = [
    "Pillar Fit",
    "Education Depth",
    "Material Authority",
    "Narrative Arc",
    "Tone",
    "Visual-Text Alignment",
  ];
  const expectedCriteriaOrdinaire = [
    "5 Rules Compliance",
    "Tone Check",
    "Visual Standard",
    "CTA Consistency",
    "Strategic Fit",
  ];

  it("should enforce auto-PASS for Visual-Text Alignment when no images are provided (6 criteria)", () => {
    const mockClaudeOutput = {
      criteria: [
        {
          name: "Pillar Fit",
          status: "PASS",
          evidence: "content matches pillar",
        },
        {
          name: "Education Depth",
          status: "PASS",
          evidence: "technical depth info",
        },
        { name: "Material Authority", status: "PASS", evidence: "mohs info" },
        { name: "Narrative Arc", status: "PASS", evidence: "good intro/outro" },
        { name: "Tone", status: "PASS", evidence: "professional tone" },
        // Claude initially flagged it as FAIL, or omitted it
        {
          name: "Visual-Text Alignment",
          status: "FAIL",
          evidence: "no matching details in image",
        },
      ],
      verdict: "REVISION NEEDED",
      verdict_summary: "Needs image fix.",
      fixes: ["Fix visual alignment."],
      suggested_revision: "Linen is nice.",
    };

    // Run normalization with hasImages = false
    const normalized = normalizeAndValidateResponse(
      mockClaudeOutput,
      expectedCriteriaBonario,
      false,
    );

    // Verify Visual-Text Alignment is forced to PASS
    const visualCrit = normalized.criteria.find(
      (c) => c.name === "Visual-Text Alignment",
    );
    expect(visualCrit?.status).toBe("PASS");
    expect(visualCrit?.evidence).toBe("Không có hình — auto PASS");

    // Verdict must be recalculated to PASS because now all 6 are PASS
    expect(normalized.verdict).toBe("PASS");
    expect(normalized.criteria.length).toBe(6);
    expect(normalized.fixes.length).toBe(0); // Fixes should be cleared when verdict is PASS
  });

  it("should keep FAIL status for Visual-Text Alignment when images are provided (6 criteria)", () => {
    const mockClaudeOutput = {
      criteria: [
        {
          name: "Pillar Fit",
          status: "PASS",
          evidence: "content matches pillar",
        },
        {
          name: "Education Depth",
          status: "PASS",
          evidence: "technical depth info",
        },
        { name: "Material Authority", status: "PASS", evidence: "mohs info" },
        { name: "Narrative Arc", status: "PASS", evidence: "good intro/outro" },
        { name: "Tone", status: "PASS", evidence: "professional tone" },
        {
          name: "Visual-Text Alignment",
          status: "FAIL",
          evidence: "image doesn't match description",
        },
      ],
      verdict: "PASS", // Claude wrongly calculated verdict
      verdict_summary: "Wrongly passed by model.",
      fixes: [],
      suggested_revision: "Linen is nice.",
    };

    // Run normalization with hasImages = true
    const normalized = normalizeAndValidateResponse(
      mockClaudeOutput,
      expectedCriteriaBonario,
      true,
    );

    const visualCrit = normalized.criteria.find(
      (c) => c.name === "Visual-Text Alignment",
    );
    expect(visualCrit?.status).toBe("FAIL");
    expect(normalized.criteria.length).toBe(6);

    // Verdict should be corrected to REVISION NEEDED (1 fail)
    expect(normalized.verdict).toBe("REVISION NEEDED");
  });

  it("should handle completely malformed AI outputs and fallback gracefully (6 criteria)", () => {
    const malformedOutput = {
      criteria: [
        {
          name: "Education Depth",
          status: "SOMETHING_ELSE",
          evidence: "deep stuff",
        },
      ],
      verdict_summary: "",
      suggested_revision: "",
    };

    const normalized = normalizeAndValidateResponse(
      malformedOutput,
      expectedCriteriaBonario,
      false,
    );

    expect(normalized.criteria.length).toBe(6);

    const pillarFit = normalized.criteria.find((c) => c.name === "Pillar Fit");
    expect(pillarFit?.status).toBe("PASS"); // Missing = default PASS
    expect(pillarFit?.evidence).toBe(
      "Không tìm thấy thông tin đánh giá từ mô hình.",
    );

    const eduDepth = normalized.criteria.find(
      (c) => c.name === "Education Depth",
    );
    expect(eduDepth?.status).toBe("PASS");
    expect(eduDepth?.evidence).toBe("deep stuff");

    const toneCrit = normalized.criteria.find((c) => c.name === "Tone");
    expect(toneCrit?.status).toBe("PASS");
    expect(toneCrit?.evidence).toBe(
      "Không tìm thấy thông tin đánh giá từ mô hình.",
    );

    expect(normalized.verdict).toBe("PASS");
    expect(normalized.verdict_summary).toBe("Nội dung đạt chuẩn thương hiệu.");
    expect(normalized.fixes.length).toBe(0);
    expect(normalized.suggested_revision).toBe("Không có bản gợi ý viết lại.");
  });

  it("should work correctly with 5 criteria for Ordinaire brand", () => {
    const mockOrdinaireOutput = {
      criteria: [
        {
          name: "5 Rules Compliance",
          status: "PASS",
          evidence: "layout is clean",
        },
        { name: "Tone Check", status: "PASS", evidence: "professional tone" },
        { name: "Visual Standard", status: "FAIL", evidence: "too flashy" },
        { name: "CTA Consistency", status: "PASS", evidence: "subtle CTA" },
        { name: "Strategic Fit", status: "PASS", evidence: "matches target" },
      ],
      verdict: "PASS",
      verdict_summary: "Mostly good.",
      fixes: [],
      suggested_revision: "Elegant content.",
    };

    const normalized = normalizeAndValidateResponse(
      mockOrdinaireOutput,
      expectedCriteriaOrdinaire,
      true,
    );
    expect(normalized.criteria.length).toBe(5);
    expect(normalized.verdict).toBe("REVISION NEEDED"); // 1 fail = REVISION NEEDED
  });
});

describe("Rate Limiting", () => {
  beforeEach(() => {
    memoryRateLimiter.clear();
  });

  it("should allow requests up to the limit and block afterwards", async () => {
    const ip = "192.168.1.50";

    // Simulate 20 successful requests
    for (let i = 0; i < 20; i++) {
      const res = await memoryRateLimiter.check(ip);
      expect(res.allowed).toBe(true);
    }

    // The 21st request should be blocked
    const blockedRes = await memoryRateLimiter.check(ip);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.retryAfterSeconds).toBeDefined();
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should track separate IPs independently", async () => {
    const ip1 = "192.168.1.100";
    const ip2 = "192.168.1.200";

    // Flood ip1
    for (let i = 0; i < 20; i++) {
      await memoryRateLimiter.check(ip1);
    }
    const check1 = await memoryRateLimiter.check(ip1);
    expect(check1.allowed).toBe(false); // ip1 blocked

    // ip2 should still be allowed
    const check2 = await memoryRateLimiter.check(ip2);
    expect(check2.allowed).toBe(true);
  });

  it("should prune stale/expired IP keys to prevent memory leaks", async () => {
    const ip = "192.168.1.250";

    vi.useFakeTimers();

    // Make 1 request
    await memoryRateLimiter.check(ip);
    expect(memoryRateLimiter.getActiveIpCount()).toBe(1);

    // Advance time by 65 seconds (longer than window size of 60 seconds)
    vi.advanceTimersByTime(65000);

    // Run cleanup
    memoryRateLimiter.cleanup();
    expect(memoryRateLimiter.getActiveIpCount()).toBe(0);

    vi.useRealTimers();
  });
});
