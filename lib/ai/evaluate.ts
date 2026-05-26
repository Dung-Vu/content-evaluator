import { BrandKey, getBrandConfig } from "../brands";
import { BONARIO_SOCIAL_FOOTER } from "../brands/bonario";
import {
  EvaluationResponse,
  normalizeAndValidateResponse,
} from "../validation/evaluate-response";

type MessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

const BONARIO_MOCK_SUGGESTED_REVISION = `Rèm linen cho không gian cần ánh sáng dịu

Linen không cần được chọn vì một lời hứa quá kỹ thuật. Điều đáng giá hơn nằm ở cách bề mặt vải giúp ánh sáng đi vào mềm hơn, khiến khung cửa bớt nặng và tổng thể không gian trở nên thư thái hơn. Khi chất liệu có độ rủ vừa đủ, căn phòng cũng giữ được sự chỉn chu mà không bị cứng.

Điểm quan trọng là cách vật liệu tham gia vào thẩm mỹ của căn phòng, chứ không chỉ nằm ở cảm giác chạm. Linen tạo một lớp nền nhẹ, giúp ánh sáng, màu tường và đồ nội thất đi cùng nhau theo cách hài hòa hơn. Đó là lý do chất liệu này phù hợp với những không gian cần sự bình tĩnh nhưng vẫn có chiều sâu.

Nếu bạn cần chọn rèm theo ánh sáng, tỷ lệ cửa và cảm giác tổng thể của không gian, bạn có thể nhắn Bonario để được tư vấn phù hợp.

${BONARIO_SOCIAL_FOOTER}`;

function buildUserContent(
  caption: string,
  contentType: string,
  serving: string,
  images: { base64: string; mimeType: string }[],
): MessageContentPart[] {
  const contentArray: MessageContentPart[] = [
    {
      type: "text",
      text: `Caption/Nội dung để chấm điểm:
###USER_CAPTION_START###
${caption}
###USER_CAPTION_END###

Metadata:
- Loại content: ${contentType}
- Phục vụ: ${serving}
- Số lượng ảnh: ${images.length}`,
    },
  ];

  for (const img of images) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
      },
    });
  }

  return contentArray;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 120_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Main evaluation function. Calls Aliyun DashScope (Bailian) API if API key is present.
 * Otherwise, falls back to a smart mock evaluator for local development and testing.
 */
export async function evaluateContent(
  brandKey: BrandKey,
  caption: string,
  contentType: string,
  serving: string,
  images: { base64: string; mimeType: string }[],
): Promise<EvaluationResponse> {
  const brandConfig = getBrandConfig(brandKey);
  const systemPrompt = brandConfig.buildSystemPrompt(contentType, serving);
  const expectedCriteriaNames = brandConfig.criteria.map((c) => c.name);

  const apiKey = process.env.BAILIAN_API_KEY;
  const baseUrl =
    process.env.BAILIAN_BASE_URL ||
    "https://coding-intl.dashscope.aliyuncs.com/v1";
  const model = process.env.BAILIAN_MODEL || "qwen3.6-plus";

  if (!apiKey || apiKey.trim() === "") {
    console.warn("BAILIAN_API_KEY is not set. Falling back to Mock Evaluator.");
    return runMockEvaluator(
      brandKey,
      caption,
      contentType,
      serving,
      images.length > 0,
    );
  }

  const contentArray = buildUserContent(caption, contentType, serving, images);

  try {
    const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentArray },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DashScope API error response:", errorText);
      let errMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errMsg = errorJson.error.message;
        }
      } catch {
        // Ignore JSON parse errors for error text
      }
      const errObj = new Error(errMsg) as Error & { status?: number };
      errObj.status = response.status;
      throw errObj;
    }

    const responseJson = await response.json();
    const rawContent = responseJson.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("No output returned from AI API.");
    }

    // Advanced JSON extraction to handle chatty LLMs
    let cleanContent = rawContent.trim();
    const jsonBlockMatch = cleanContent.match(
      /```(?:json)?\s*([\s\S]*?)\s*```/i,
    );

    if (jsonBlockMatch && jsonBlockMatch[1]) {
      cleanContent = jsonBlockMatch[1].trim();
    } else {
      // Fallback: forcefully extract from first '{' to last '}'
      const startIdx = cleanContent.indexOf("{");
      const endIdx = cleanContent.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanContent = cleanContent.substring(startIdx, endIdx + 1);
      }
    }

    const parsedJson = JSON.parse(cleanContent);
    return normalizeAndValidateResponse(
      parsedJson,
      expectedCriteriaNames,
      images.length > 0,
    );
  } catch (error: unknown) {
    console.error("Error communicating with DashScope API:", error);
    throw error;
  }
}

/**
 * Streaming version of evaluateContent. Returns a ReadableStream of OpenAI-compatible SSE chunks.
 */
export async function evaluateContentStream(
  brandKey: BrandKey,
  caption: string,
  contentType: string,
  serving: string,
  images: { base64: string; mimeType: string }[],
): Promise<ReadableStream<Uint8Array>> {
  const brandConfig = getBrandConfig(brandKey);
  const systemPrompt = brandConfig.buildSystemPrompt(contentType, serving);

  const apiKey = process.env.BAILIAN_API_KEY;
  const baseUrl =
    process.env.BAILIAN_BASE_URL ||
    "https://coding-intl.dashscope.aliyuncs.com/v1";
  const model = process.env.BAILIAN_MODEL || "qwen3.6-plus";

  const expectedCriteriaNames = brandConfig.criteria.map((c) => c.name);
  const hasImages = images.length > 0;
  const encoder = new TextEncoder();

  // --- MOCK FALLBACK (If Bailian API Key is missing) ---
  if (!apiKey || apiKey.trim() === "") {
    console.warn("BAILIAN_API_KEY is not set. Falling back to Mock Evaluator.");
    const mockData = runMockEvaluator(
      brandKey,
      caption,
      contentType,
      serving,
      hasImages,
    );
    const validated = normalizeAndValidateResponse(
      mockData,
      expectedCriteriaNames,
      hasImages,
    );
    const validatedJson = JSON.stringify(validated);

    return new ReadableStream({
      async start(controller) {
        const chunk = `data: ${JSON.stringify({ choices: [{ delta: { content: validatedJson } }] })}\n\n`;
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 80));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
  }

  const contentArray = buildUserContent(caption, contentType, serving, images);

  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentArray },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DashScope API error response (stream):", errorText);
    let errMsg = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson?.error?.message) {
        errMsg = errorJson.error.message;
      }
    } catch {
      // Ignore
    }
    const errObj = new Error(errMsg) as Error & { status?: number };
    errObj.status = response.status;
    throw errObj;
  }

  if (!response.body) {
    throw new Error("Response body is empty.");
  }

  // Wrap AI stream with a validation layer:
  // - Passes through all SSE chunks in real-time
  // - Accumulates delta content text
  // - When [DONE] detected, validates the final JSON and sends a corrected event
  const aiStream = response.body as ReadableStream<Uint8Array>;
  return new ReadableStream({
    async start(controller) {
      const reader = aiStream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let streamDone = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) {
              controller.enqueue(encoder.encode("\n"));
              continue;
            }

            if (cleanLine.startsWith("data: ")) {
              const dataStr = cleanLine.slice(6);
              if (dataStr === "[DONE]") {
                streamDone = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const content =
                  parsed.choices?.[0]?.delta?.content || "";
                accumulatedContent += content;
              } catch {
                // Ignore parse errors for partial chunks
              }

              controller.enqueue(encoder.encode(line + "\n"));
            } else {
              controller.enqueue(encoder.encode(line + "\n"));
            }
          }

          if (streamDone) break;
        }
      } catch (err) {
        console.error("Stream read error:", err);
        controller.error(err);
        return;
      } finally {
        reader.releaseLock();
      }

      // Validate and send corrected final result
      try {
        let cleanContent = accumulatedContent.trim();
        const jsonBlockMatch = cleanContent.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/i,
        );
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          cleanContent = jsonBlockMatch[1].trim();
        } else {
          const startIdx = cleanContent.indexOf("{");
          const endIdx = cleanContent.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanContent = cleanContent.substring(startIdx, endIdx + 1);
          }
        }

        const parsed = JSON.parse(cleanContent);
        const validated = normalizeAndValidateResponse(
          parsed,
          expectedCriteriaNames,
          hasImages,
        );
        const validatedChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: JSON.stringify(validated) } }] })}\n\n`;
        controller.enqueue(encoder.encode(validatedChunk));
      } catch (err) {
        console.error("Failed to validate final AI output:", err);
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

/**
 * Smart mock evaluator that simulates AI's review based on the text contents.
 * Useful for local verification, testing, and offline presentation.
 */
function runMockEvaluator(
  brandKey: BrandKey,
  caption: string,
  contentType: string,
  serving: string,
  hasImages: boolean,
): EvaluationResponse {
  const words = caption.trim().split(/\s+/);
  const wordCount = words.length;

  const lowercaseCaption = caption.toLowerCase();

  // HEURISTICS FOR BONARIO
  if (brandKey === "bonario") {
    const firstMeaningfulSentence =
      caption
        .split(/[.!?\n]/)
        .map((sentence) => sentence.trim())
        .find(Boolean) || caption.trim();

    // 1. Education Depth now starts by checking whether a concrete reader takeaway exists.
    const hasTakeawaySignal =
      /(giúp|để|từ đó|đó là lý do|nhờ vậy|phù hợp|nên chọn|có thể hiểu|rút ra|ưu tiên|khiến)/.test(
        lowercaseCaption,
      );
    const hasKnowledgePoint =
      /(đặc tính|bảo quản|thoáng khí|giữ form|độ rủ|lọc sáng|cản sáng|riêng tư|không gian|phòng|ánh sáng|thẩm mỹ|thiết kế|bề mặt|chiều sâu|công năng|ứng dụng)/.test(
        lowercaseCaption,
      );
    const eduDepthStatus =
      wordCount >= 40 && hasTakeawaySignal && hasKnowledgePoint
        ? "PASS"
        : "FAIL";
    const eduDepthEvidence =
      eduDepthStatus === "PASS"
        ? `Sau khi đọc, có thể rút ra một ý cụ thể từ câu: "${firstMeaningfulSentence}."`
        : "Nội dung chưa cho thấy rõ người đọc sẽ rút ra được điều gì cụ thể sau khi đọc bài này.";

    // 2. Material Authority now accepts a concrete design/application point without heavy technical metrics.
    const hasAuthorityKeywords =
      /(không gian|phòng|ánh sáng|thẩm mỹ|thiết kế|độ rủ|lọc sáng|cản sáng|riêng tư|bề mặt|chiều sâu|công năng|ứng dụng|trải nghiệm|giữ form|mềm|ấm|cân bằng|tỷ lệ)/.test(
        lowercaseCaption,
      );
    const hasVagueWords =
      /(cao cấp|chất lượng tốt|premium|bền đẹp|tinh xảo|giá tốt nhất|hàng đầu)/.test(
        lowercaseCaption,
      );
    const materialAuthorityStatus = hasAuthorityKeywords ? "PASS" : "FAIL";
    const materialAuthorityEvidence =
      materialAuthorityStatus === "PASS"
        ? `Có một điểm cụ thể về ứng dụng hoặc thiết kế trong câu: "${firstMeaningfulSentence}."`
        : hasVagueWords
          ? "Nội dung chỉ nghiêng về lời khen chung chung mà chưa nêu ra một điểm ứng dụng hoặc thiết kế cụ thể của vật liệu."
          : "Nội dung chưa nêu ra một điểm cụ thể về cách vật liệu vận hành trong thẩm mỹ, thiết kế hoặc không gian thực tế.";

    // 3. Narrative Arc Fail if no clear structure or lack of takeaway
    const hasParagraphs = caption.includes("\n");
    const hasTakeaway =
      /(fix|hãy|bạn nên|lưu ý|để đặt|hướng dẫn|áp dụng|takeaway)/.test(
        lowercaseCaption,
      );
    const narrativeArcStatus = hasParagraphs && hasTakeaway ? "PASS" : "FAIL";
    const narrativeArcEvidence =
      narrativeArcStatus === "PASS"
        ? "Nội dung có chia đoạn và câu takeaway kết luận rõ ràng."
        : "Nội dung chỉ liệt kê thông số rời rạc hoặc viết liền một khối không có hook/takeaway rõ ràng.";

    // 4. Tone — v4: CTA mềm ở cuối chấp nhận được, dấu ! chỉ FAIL khi đi cùng thúc ép
    const emojiCount = (caption.match(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{200D}]|[\u{2702}-\u{27B0}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{00A9}\u{00AE}\u{2122}\u{3030}\u{303D}]|\u{2764}/gu) || []).length;
    const hasSalesWords =
      /(siêu|ưu đãi|sale|giảm giá|đừng bỏ lỡ|inbox ngay|giá sốc|số lượng có hạn)/.test(
        lowercaseCaption,
      );
    const hasExclamationWithPressure = /!/.test(caption) && hasSalesWords;
    const toneStatus =
      !hasExclamationWithPressure && emojiCount <= 5 && !hasSalesWords
        ? "PASS"
        : "FAIL";
    const toneEvidence =
      toneStatus === "PASS"
        ? "Giọng văn tự tin, chuyên nghiệp, không sử dụng từ hối thúc hoặc ngôn ngữ thúc ép bán hàng."
        : `Phát hiện lỗi giọng văn: ${hasSalesWords ? "từ bán hàng '" + (lowercaseCaption.match(/(siêu|ưu đãi|sale|giảm giá|inbox)/)?.[0] || "") + "'" : ""} ${emojiCount > 5 ? "emoji > 5" : ""} ${hasExclamationWithPressure ? "dấu '!' đi cùng âm điệu thúc ép" : ""}.`;

    // 5. Visual-Text Alignment Auto PASS if no images
    const visualStatus = !hasImages
      ? "PASS"
      : lowercaseCaption.includes("ảnh") || lowercaseCaption.includes("nhìn")
        ? "FAIL"
        : "PASS";
    const visualEvidence = !hasImages
      ? "Không có hình — auto PASS"
      : visualStatus === "PASS"
        ? "Nội dung bổ sung kiến thức kỹ thuật sâu sắc cho hình ảnh."
        : "Caption chỉ mô tả lại những gì đã thấy trong hình ('nhìn thấy', 'như hình').";

    const criteria: {
      name: string;
      status: "PASS" | "FAIL";
      evidence: string;
    }[] = [
      {
        name: "Education Depth",
        status: eduDepthStatus,
        evidence: eduDepthEvidence,
      },
      {
        name: "Material Authority",
        status: materialAuthorityStatus,
        evidence: materialAuthorityEvidence,
      },
      {
        name: "Narrative Arc",
        status: narrativeArcStatus,
        evidence: narrativeArcEvidence,
      },
      { name: "Tone", status: toneStatus, evidence: toneEvidence },
      {
        name: "Visual-Text Alignment",
        status: visualStatus,
        evidence: visualEvidence,
      },
    ];

    const failCount = criteria.filter((c) => c.status === "FAIL").length;
    const verdict =
      failCount === 0 ? "PASS" : failCount <= 2 ? "REVISION NEEDED" : "REJECT";

    const verdict_summary =
      verdict === "PASS"
        ? "Nội dung đã cho người đọc một takeaway rõ ràng và giữ được đúng tinh thần biên tập của Bonario."
        : `Bài viết chưa đạt chuẩn thương hiệu do lỗi ở ${failCount} tiêu chí. Cần điều chỉnh lại.`;

    const fixes: string[] = [];
    if (eduDepthStatus === "FAIL")
      fixes.push(
        "Viết lại để người đọc rút ra được 1 takeaway cụ thể sau khi đọc, thay vì chỉ dừng ở mô tả đẹp hoặc cảm xúc chung.",
      );
    if (materialAuthorityStatus === "FAIL")
      fixes.push(
        "Bỏ các cụm marketing sáo rỗng và thêm 1 ý cụ thể về cách vật liệu được ứng dụng trong thẩm mỹ, thiết kế hoặc trải nghiệm không gian.",
      );
    if (narrativeArcStatus === "FAIL")
      fixes.push(
        "Thêm chia đoạn rõ ràng, bổ sung hook gây tò mò ở đầu và câu kết hành động/takeaway ở cuối.",
      );
    if (toneStatus === "FAIL")
      fixes.push(
        "Lược bỏ các từ ngữ bán hàng (siêu, ưu đãi, inbox ngay). Dấu chấm than chỉ chấp nhận ở CTA cuối caption nếu không đi cùng ngôn ngữ thúc ép.",
      );
    if (visualStatus === "FAIL" && hasImages)
      fixes.push(
        "Viết lại caption để giải thích đặc tính ẩn hoặc cơ sở khoa học đằng sau hình ảnh, tránh mô tả trực quan thô sơ.",
      );

    const suggested_revision = BONARIO_MOCK_SUGGESTED_REVISION;

    return {
      criteria,
      verdict,
      verdict_summary,
      fixes,
      suggested_revision,
    };
  }

  // HEURISTICS FOR ORDINAIRE
  else {
    // 1. 5 Rules Compliance
    const hasLongSentence = caption.length > 150 && !caption.includes("\n");
    const rulesStatus = !hasLongSentence ? "PASS" : "FAIL";
    const rulesEvidence =
      rulesStatus === "PASS"
        ? "Bố cục tối giản, phân đoạn rõ ràng và từ ngữ trang nhã đạt chuẩn."
        : "Vi phạm quy tắc cấu trúc: Câu quá dài không ngắt nghỉ gây khó theo dõi.";

    // 2. Tone Check
    const hasExclamation = caption.includes("!");
    const hasToneFails = /(sale|giảm giá|inbox ngay|mua ngay|liên hệ)/.test(
      lowercaseCaption,
    );
    const toneStatus = !hasExclamation && !hasToneFails ? "PASS" : "FAIL";
    const toneEvidence =
      toneStatus === "PASS"
        ? "Giọng văn dứt khoát, mang thẩm quyền định hình thị huớng."
        : `Phát hiện lỗi tone: chứa dấu '!' hoặc cụm từ kêu gọi vồ vập.`;

    // 3. Visual Standard
    const visualStatus = !hasImages
      ? "PASS"
      : lowercaseCaption.includes("sặc sỡ") ||
          lowercaseCaption.includes("diêm dúa")
        ? "FAIL"
        : "PASS";
    const visualEvidence = !hasImages
      ? "Không có hình — auto PASS"
      : visualStatus === "PASS"
        ? "Mô tả chất liệu hài hòa và sang trọng."
        : "Mô tả không gian chứa từ ngữ diêm dúa lệch chuẩn Ordinaire.";

    // 4. CTA Consistency
    const hasAggressiveCTA =
      /(inbox ngay|mua liền|đặt hàng ngay|sale off)/.test(lowercaseCaption);
    const ctaStatus = !hasAggressiveCTA ? "PASS" : "FAIL";
    const ctaEvidence =
      ctaStatus === "PASS"
        ? "CTA tinh tế, hướng dẫn trải nghiệm chuyên nghiệp."
        : "Kêu gọi hành động quá trực diện, thúc giục mua hàng.";

    // 5. Strategic Fit
    const strategicStatus = wordCount > 25 ? "PASS" : "FAIL";
    const strategicEvidence =
      strategicStatus === "PASS"
        ? `Nội dung hỗ trợ tốt cho mục tiêu '${serving}'.`
        : "Bài viết quá ngắn để thể hiện giá trị chiến lược đã chọn.";

    const criteria: {
      name: string;
      status: "PASS" | "FAIL";
      evidence: string;
    }[] = [
      {
        name: "5 Rules Compliance",
        status: rulesStatus,
        evidence: rulesEvidence,
      },
      { name: "Tone Check", status: toneStatus, evidence: toneEvidence },
      {
        name: "Visual Standard",
        status: visualStatus,
        evidence: visualEvidence,
      },
      { name: "CTA Consistency", status: ctaStatus, evidence: ctaEvidence },
      {
        name: "Strategic Fit",
        status: strategicStatus,
        evidence: strategicEvidence,
      },
    ];

    const failCount = criteria.filter((c) => c.status === "FAIL").length;
    const verdict =
      failCount === 0 ? "PASS" : failCount <= 2 ? "REVISION NEEDED" : "REJECT";

    const verdict_summary =
      verdict === "PASS"
        ? "Thiết kế nội dung hoàn toàn tối giản, thể hiện tính nhất quán và sang trọng đặc trưng của Ordinaire."
        : `Bài viết cần cải thiện thêm để đạt chuẩn tối giản tinh tế của Ordinaire.`;

    const fixes: string[] = [];
    if (rulesStatus === "FAIL")
      fixes.push(
        "Ngắt câu ngắn gọn hơn, tránh viết chuỗi từ liên tục không phân tách.",
      );
    if (toneStatus === "FAIL")
      fixes.push("Loại bỏ dấu '!' và các từ ngữ bán hàng đại trà.");
    if (visualStatus === "FAIL")
      fixes.push(
        "Điều chỉnh lại mô tả thẩm mỹ sang hướng sang trọng, trung tính và tinh giản.",
      );
    if (ctaStatus === "FAIL")
      fixes.push(
        "Viết lại câu kết hướng tới sự trải nghiệm hoặc khám phá tự nhiên.",
      );
    if (strategicStatus === "FAIL")
      fixes.push(
        "Mở rộng thêm nội dung để làm rõ chiều sâu giá trị của dịch vụ/sản phẩm.",
      );

    const suggested_revision = `Chúng tôi loại bỏ các quyết định phức tạp để định hình gu thẩm mỹ tối giản cho không gian sống của bạn.

Thiết kế từ Ordinaire tập trung vào tính nguyên bản của chất liệu và sự cân bằng trong bố cục hình khối.`;

    return {
      criteria,
      verdict,
      verdict_summary,
      fixes,
      suggested_revision,
    };
  }
}
