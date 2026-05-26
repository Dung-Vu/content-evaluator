import { describe, it, expect, beforeEach } from "vitest";
import { getBrandConfig, BrandKey } from "@/lib/brands";
import { BONARIO_SOCIAL_FOOTER } from "@/lib/brands/bonario";
import { evaluateContent } from "@/lib/ai/evaluate";
import {
  RequestValidationSchema,
  calculateVerdict,
  normalizeAndValidateResponse,
} from "@/lib/validation/evaluate-response";
import {
  findLastCompleteJsonObject,
  parseFinalStreamResult,
} from "@/lib/validation/stream-response";
import { memoryRateLimiter } from "@/lib/rate-limit/memory-rate-limiter";

describe("Brand Configuration", () => {
  it("should retrieve correct config based on brand key", () => {
    const bonario = getBrandConfig("bonario");
    expect(bonario.key).toBe("bonario");
    expect(bonario.name).toBe("Bonario Content Evaluator");
    expect(bonario.criteria.length).toBe(5);
    expect(bonario.criteria[0].name).toBe("Education Depth");

    const ordinaire = getBrandConfig("ordinaire");
    expect(ordinaire.key).toBe("ordinaire");
    expect(ordinaire.name).toBe("Ordinaire Content Evaluator");
    expect(ordinaire.criteria.length).toBe(5);
  });

  it("should throw error for unknown brand", () => {
    expect(() => getBrandConfig("unknown" as BrandKey)).toThrow();
  });

  it("should have synchronized Bonario feedback updates for prompt and criteria", () => {
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

    // Check descriptions updated from the May 26 feedback
    const eduDepth = bonario.criteria.find((c) => c.name === "Education Depth");
    const materialAuthority = bonario.criteria.find(
      (c) => c.name === "Material Authority",
    );
    const prompt = bonario.buildSystemPrompt(
      "Pillar 2 - Application",
      "Education & Guidance",
    );

    expect(eduDepth?.question).toContain("rút ra được điều gì cụ thể");
    expect(eduDepth?.passDesc).toContain("takeaway cụ thể");
    expect(materialAuthority?.passDesc).toContain("ứng dụng thẩm mỹ");
    expect(materialAuthority?.passDesc).toContain("Không cần thông số");
    expect(prompt).toContain("Sau khi đọc xong, người đọc rút ra điều gì cụ thể");
    expect(prompt).toContain(BONARIO_SOCIAL_FOOTER);
    expect(prompt).not.toContain("GSM");
    expect(prompt).not.toContain("Mohs");
  });

  it("should let Bonario mock evaluation pass material authority without technical metrics and enforce the social footer", async () => {
    const previousApiKey = process.env.BAILIAN_API_KEY;
    delete process.env.BAILIAN_API_KEY;

    try {
      const caption = `Rèm linen không cần được chọn vì một lời hứa quá kỹ thuật. Điều đáng giá hơn nằm ở cách bề mặt vải giúp ánh sáng đi vào mềm hơn, khiến khung cửa bớt nặng và tổng thể phòng ngủ trở nên thư thái hơn. Khi chất liệu có độ rủ vừa đủ, căn phòng cũng giữ được sự chỉn chu mà không bị cứng.\n\nTừ đó, người đọc có thể rút ra rằng linen phù hợp với những không gian cần cảm giác nhẹ, dịu và có chiều sâu. Bạn nên ưu tiên chất liệu này khi muốn cân bằng ánh sáng, cảm giác riêng tư và vẻ mềm của toàn bộ căn phòng.`;

      const result = await evaluateContent(
        "bonario",
        caption,
        "Pillar 2 - Application",
        "Education & Guidance",
        [],
      );

      expect(
        result.criteria.find((criterion) => criterion.name === "Material Authority")
          ?.status,
      ).toBe("PASS");
      expect(result.suggested_revision).toContain(BONARIO_SOCIAL_FOOTER);
      expect(result.suggested_revision).toContain("Rèm linen cho không gian cần ánh sáng dịu");
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.BAILIAN_API_KEY;
      } else {
        process.env.BAILIAN_API_KEY = previousApiKey;
      }
    }
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

  it("should enforce auto-PASS for Visual-Text Alignment when no images are provided (5 criteria)", () => {
    const mockClaudeOutput = {
      criteria: [
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

    // Verdict must be recalculated to PASS because now all 5 are PASS
    expect(normalized.verdict).toBe("PASS");
    expect(normalized.criteria.length).toBe(5);
    expect(normalized.fixes.length).toBe(0); // Fixes should be cleared when verdict is PASS
  });

  it("should keep FAIL status for Visual-Text Alignment when images are provided (5 criteria)", () => {
    const mockClaudeOutput = {
      criteria: [
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
      verdict: "PASS",
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
    expect(normalized.criteria.length).toBe(5);

    // Verdict should be corrected to REVISION NEEDED (1 fail)
    expect(normalized.verdict).toBe("REVISION NEEDED");
  });

  it("should handle completely malformed AI outputs and fallback gracefully (5 criteria)", () => {
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

    expect(normalized.criteria.length).toBe(5);

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

    const visualCrit2 = normalized.criteria.find(
      (c) => c.name === "Visual-Text Alignment",
    );
    expect(visualCrit2?.status).toBe("PASS");
    expect(visualCrit2?.evidence).toBe("Không có hình — auto PASS");

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

  it("should allow requests up to the limit and block afterwards", () => {
    const ip = "192.168.1.50";

    for (let i = 0; i < 20; i++) {
      const res = memoryRateLimiter.check(ip);
      expect(res.allowed).toBe(true);
    }

    const blockedRes = memoryRateLimiter.check(ip);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.retryAfterSeconds).toBeDefined();
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should track separate IPs independently", () => {
    const ip1 = "192.168.1.100";
    const ip2 = "192.168.1.200";

    for (let i = 0; i < 20; i++) {
      memoryRateLimiter.check(ip1);
    }
    const check1 = memoryRateLimiter.check(ip1);
    expect(check1.allowed).toBe(false);

    const check2 = memoryRateLimiter.check(ip2);
    expect(check2.allowed).toBe(true);
  });

  it("should prune stale IP keys on cleanup", () => {
    const ip = "192.168.1.250";
    memoryRateLimiter.check(ip);
    expect(memoryRateLimiter.getActiveIpCount()).toBe(1);

    // Clear all entries to simulate all timestamps expiring
    memoryRateLimiter.clear();
    memoryRateLimiter.cleanup();
    expect(memoryRateLimiter.getActiveIpCount()).toBe(0);
  });
});

describe("Streaming Response Parsing", () => {
  it("should return the last complete JSON object when multiple JSON payloads are concatenated", () => {
    const firstPayload = JSON.stringify({ verdict: "PENDING" });
    const secondPayload = JSON.stringify({ verdict: "PASS", suggested_revision: "Final" });

    expect(findLastCompleteJsonObject(`${firstPayload}${secondPayload}`)).toBe(
      secondPayload,
    );
  });

  it("should parse the validated trailing payload instead of the earlier partial payload", () => {
    const criteriaNames = [
      "Education Depth",
      "Material Authority",
      "Narrative Arc",
      "Tone",
      "Visual-Text Alignment",
    ];

    const partialPayload = JSON.stringify({
      criteria: [
        {
          name: "Education Depth",
          status: "PASS",
          evidence: "Bản nháp đầu tiên.",
        },
      ],
      verdict: "PENDING",
      verdict_summary: "Dang stream",
      fixes: [],
      suggested_revision: "Ban dau",
    });

    const validatedPayload = JSON.stringify({
      criteria: [
        {
          name: "Education Depth",
          status: "PASS",
          evidence: "Có giải thích kỹ thuật rõ ràng.",
        },
        {
          name: "Material Authority",
          status: "PASS",
          evidence: "Có thông số GSM cụ thể.",
        },
        {
          name: "Narrative Arc",
          status: "PASS",
          evidence: "Có mở bài và takeaway.",
        },
        {
          name: "Tone",
          status: "PASS",
          evidence: "Giọng chuyên gia, không thúc ép.",
        },
        {
          name: "Visual-Text Alignment",
          status: "PASS",
          evidence: "Không có hình — auto PASS",
        },
      ],
      verdict: "PASS",
      verdict_summary: "Nội dung đạt chuẩn.",
      fixes: [],
      suggested_revision: "Ban viet lai cuoi cung.",
    });

    const parsed = parseFinalStreamResult(
      `${partialPayload}${validatedPayload}`,
      criteriaNames,
      false,
    );

    expect(parsed.verdict).toBe("PASS");
    expect(parsed.verdict_summary).toBe("Nội dung đạt chuẩn.");
    expect(parsed.suggested_revision).toBe("Ban viet lai cuoi cung.");
    expect(parsed.criteria.find((criterion) => criterion.name === "Material Authority")?.status).toBe("PASS");
  });
});
