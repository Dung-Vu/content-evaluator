import { readFileSync } from "fs";
import { resolve } from "path";

const API_KEY = process.env.BAILIAN_API_KEY;
const BASE_URL = process.env.BAILIAN_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
const MODEL = process.env.BAILIAN_MODEL || "qwen3.6-plus";

const imagePath = resolve(process.cwd(), "public", "sakura_background.png");
const imageBuffer = readFileSync(imagePath);
const base64Image = imageBuffer.toString("base64");

const testCaption = `Rèm cửa linen cao cấp với hoa văn hoa anh đào Nhật Bản — chất liệu linen tự nhiên 100%, 
thoáng khí vượt trội, phù hợp cho phòng ngủ và phòng khách. 
Với mật độ sợi 180 GSM, rèm có khả năng cản sáng 70% và cách nhiệt hiệu quả. 
Bảo quản dễ dàng: giặt khô hoặc giặt tay nhẹ nhàng ở 30°C.`;

const systemPrompt = `Bạn là content reviewer cho Bonario.
Trả về JSON duy nhất, không text ngoài JSON:
{
  "criteria": [
    {"name":"Education Depth","status":"PASS|FAIL","evidence":"trích dẫn"},
    {"name":"Material Authority","status":"PASS|FAIL","evidence":"trích dẫn"},
    {"name":"Narrative Arc","status":"PASS|FAIL","evidence":"trích dẫn"},
    {"name":"Tone","status":"PASS|FAIL","evidence":"trích dẫn"},
    {"name":"Visual-Text Alignment","status":"PASS|FAIL","evidence":"PHẢI mô tả CHI TIẾT những gì bạn THẤY trong ảnh"}
  ],
  "verdict": "PASS|REVISION NEEDED|REJECT",
  "verdict_summary": "tổng kết",
  "fixes": [],
  "suggested_revision": "bản viết lại"
}`;

async function testVision() {
  if (!API_KEY) {
    throw new Error("BAILIAN_API_KEY is required to run .bin/test-vision.mjs");
  }

  console.log("=== TEST: AI Vision Image Analysis ===\n");
  console.log(`Model: ${MODEL}`);
  console.log(`Image: sakura_background.png (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
  console.log(`Caption: ${testCaption.slice(0, 80)}...\n`);
  console.log("--- Sending to API (stream mode) ---\n");

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Caption: ${testCaption}\nLoại content: Pillar 1 - Showcase\nPhục vụ: Authority\nSố lượng ảnh: 1` },
            { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } },
          ],
        },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("API Error:", response.status, errText);
    return;
  }

  console.log("--- Streaming Response ---\n");
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || !cleanLine.startsWith("data: ")) continue;
      const dataStr = cleanLine.slice(6);
      if (dataStr === "[DONE]") break;
      
      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed.choices?.[0]?.delta?.content || "";
        if (content) {
          accumulatedContent += content;
        }
      } catch {}
    }
  }

  console.log("--- Final Accumulated Response ---\n");
  
  try {
    const clean = accumulatedContent.trim();
    const startIdx = clean.indexOf("{");
    const endIdx = clean.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonStr = clean.substring(startIdx, endIdx + 1);
      const result = JSON.parse(jsonStr);
      
      console.log("Verdict:", result.verdict);
      console.log("Summary:", result.verdict_summary, "\n");
      
      for (const crit of result.criteria) {
        console.log(`  [${crit.status}] ${crit.name}`);
        console.log(`         Evidence: "${crit.evidence}"`);
        console.log();
      }
      
      // Check if AI actually analyzed the image
      const visualCrit = result.criteria.find(c => c.name === "Visual-Text Alignment");
      if (visualCrit) {
        console.log("=========== IMAGE ANALYSIS CHECK ===========");
        console.log("Visual-Text Alignment evidence:", visualCrit.evidence);
        console.log("Status:", visualCrit.status);
        
        const mentionsImage = /sakura|hoa anh đào|cherry blossom|màu hồng|pink|floral|hoa|cánh hoa|petal|nhánh|branch|nền|xanh|blue|mây|cloud|rèm|curtain/i.test(visualCrit.evidence.toLowerCase());
        if (mentionsImage) {
          console.log("\n✓ AI THỰC SỰ ĐÃ ĐỌC VÀ PHÂN TÍCH ẢNH!");
          console.log("  Evidence có nhắc đến nội dung cụ thể trong ảnh.");
        } else {
          console.log("\n✗ AI có thể KHÔNG phân tích ảnh thực tế.");
          console.log("  Evidence chỉ là text-based heuristic.");
        }
      }
      
      console.log("\nFixes:", result.fixes?.length || 0);
      console.log("Revision length:", result.suggested_revision?.length || 0);
    }
  } catch (err) {
    console.error("Failed to parse final JSON:", err.message);
    console.log("\nRaw accumulated content (first 2000 chars):");
    console.log(accumulatedContent.slice(0, 2000));
  }
}

testVision().catch(console.error);
