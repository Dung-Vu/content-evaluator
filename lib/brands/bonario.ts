import { BrandConfig } from "./types";

export const BONARIO_SOCIAL_FOOTER = `𝐁𝐎𝐍𝐀𝐑𝐈𝐎 - 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐂𝐮𝐫𝐭𝐚𝐢𝐧𝐬 𝐚𝐧𝐝 𝐖𝐚𝐥𝐥𝐜𝐨𝐯𝐞𝐫𝐢𝐧𝐠𝐬
𝐒𝐡𝐨𝐰𝐫𝐨𝐨𝐦: 22 Đường 19A, An Phú, Q2, TP.HCM
𝐇𝐨𝐭𝐥𝐢𝐧𝐞: +84 286 660 9009
www.bonario.vn`;

export const bonarioConfig: BrandConfig = {
  key: "bonario",
  name: "Bonario Content Evaluator",
  status: "ready",
  maxImages: 20,
  maxImageSizeMb: 5,
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  contentTypeLabel: "Loại content (Cluster)",
  servingLabel: "Phục vụ (Mục tiêu)",
  contentTypeOptions: [
    {
      value: "Pillar 1 - Showcase",
      label: "Show họa tiết, bộ sưu tập các mẫu vật liệu, rèm cửa mới nhất",
    },
    {
      value: "Pillar 1 - FAQ & Edu",
      label:
        "Library Video FAQ: Giải đáp các câu hỏi thường gặp qua video ngắn. Series Edu Content: Đi sâu vào nguồn gốc và đặc tính vật liệu",
    },
    {
      value: "Pillar 2 - Application",
      label:
        "Cách ứng dụng vật liệu vào công trình, chuyên sâu hạng mục rèm cửa và vật liệu dán tường",
    },
    {
      value: "Pillar 2 - Design Logic",
      label:
        "Đằng sau những lựa chọn vật liệu có tính chủ đích để tạo nên không gian có gu",
    },
    {
      value: "Pillar 3 - Case Study",
      label: "Thư viện Case Study: Các dự án thực tế",
    },
    {
      value: "Pillar 3 - Analysis",
      label: "Phân tích vật liệu trong không gian thực tế",
    },
  ],
  servingOptions: [
    {
      value: "Authority",
      label:
        "Định vị thương hiệu là chuyên gia đáng tin cậy trong ngành vật liệu trang trí nội thất",
    },
    {
      value: "Trend Forecasting",
      label: "Cập nhật và dự báo các xu hướng vật liệu mới nhất trong ngành",
    },
    { value: "Network", label: "Xây dựng mạng lưới kết nối chuyên nghiệp." },
    {
      value: "Trust & Conversion",
      label:
        "Tạo độ uy tín của thương hiệu và tăng sự tự tin trong hành trình chọn vật liệu và mua hàng của khách thông qua câu chuyện và hình ảnh thực tế",
    },
    {
      value: "Education & Guidance",
      label:
        "Giáo dục và hướng dẫn khách hàng — giải đáp băn khoăn, cung cấp kiến thức chuyên sâu về vật liệu",
    },
  ],
  criteria: [
    {
      name: "Education Depth",
      question:
        "Trước khi chấm, hãy tự trả lời: sau khi đọc, người đọc rút ra được điều gì cụ thể về vật liệu hoặc cách ứng dụng nó trong không gian?",
      passDesc:
        "Trả lời được rõ 1 takeaway cụ thể sau khi đọc. Takeaway đó thuộc ≥1 trong 3 dạng: (A) hiểu thêm đặc tính hoặc cách bảo quản vật liệu (B) hiểu thêm cách ứng dụng vật liệu vào thẩm mỹ, công năng hoặc không gian (C) hiểu thêm 1 logic thiết kế có thể áp dụng, không chỉ dừng ở cảm nhận đẹp/xấu.",
      failDesc:
        "Không nêu được takeaway cụ thể người đọc nhận về; nội dung chỉ dừng ở mô tả cảm xúc, khen đẹp, hoặc quá ngắn để tạo giá trị.",
    },
    {
      name: "Material Authority",
      question:
        "Content có nêu ít nhất 1 điểm cụ thể, hữu ích về cách vật liệu được ứng dụng trong thẩm mỹ, thiết kế hoặc không gian thực tế không?",
      passDesc:
        "Có ít nhất 1 điểm cụ thể về ứng dụng thẩm mỹ, logic thiết kế, hành vi vật liệu trong không gian hoặc trải nghiệm sử dụng. Không cần thông số quá kỹ thuật.",
      failDesc:
        "Chỉ dùng 'cao cấp', 'premium', 'bền đẹp', 'tinh xảo' mà không nêu ra 1 điểm ứng dụng, thiết kế hoặc trải nghiệm cụ thể.",
    },
    {
      name: "Narrative Arc",
      question:
        "Caption có dẫn người đọc từ điểm A (chú ý/câu hỏi) đến điểm B (hiểu/hành động) không?",
      passDesc:
        "Có ≥2 trong 3: hook mở gây tò mò, dẫn dắt insight, takeaway cụ thể ở cuối. Có tách đoạn.",
      failDesc:
        "Chỉ liệt kê feature rời rạc. Không có hook. Không có kết luận hành động.",
    },
    {
      name: "Tone",
      question:
        "Giọng văn có đúng voice Bonario không: tự tin, giáo dục, chuyên nghiệp, trực tiếp — như chuyên gia giải thích, không phải sales?",
      passDesc:
        'Không "!". Không ngôn ngữ quảng cáo. Không emoji >5. Câu ngắn gọn, dứt khoát. CTA mềm ở cuối caption là chấp nhận được nếu giữ giọng tư vấn, ví dụ: "Nếu bạn cần tư vấn theo không gian thực tế, bạn có thể nhắn Bonario để đặt lịch khảo sát." hoặc "Bạn có thể nhắn Bonario để nhận tư vấn và e-catalogue phù hợp với nhu cầu của mình." CTA vận hành trực tiếp như "Nhắn ngay cho BONARIO để đặt lịch tư vấn và khảo sát!" cũng được chấp nhận nếu đặt ở cuối caption và không đi cùng ngôn ngữ khuyến mãi / thúc ép.',
      failDesc:
        'Có "siêu", "ưu đãi", "đừng bỏ lỡ", "inbox ngay", "sale", "giảm giá", hoặc giọng gấp gáp / thúc ép. Dấu chấm than chỉ bị xem là FAIL khi đi cùng âm điệu thúc ép bán hàng.',
    },
    {
      name: "Visual-Text Alignment",
      question:
        "Caption bổ sung kiến thức mà người xem hình không tự đọc được không? Hay chỉ mô tả lại hình?",
      passDesc:
        "Caption thêm thông tin không visible trong hình. Nếu không có hình: auto-PASS.",
      failDesc:
        "Caption chỉ mô tả lại những gì đã thấy ('nhìn thấy...', 'trong ảnh là...', 'như hình').",
    },
  ],
  buildSystemPrompt(contentType: string, serving: string): string {
    return `Bạn là content reviewer cho Bonario — thương hiệu vật liệu nội thất Việt Nam.
Định vị: "The Quiet Power of Materials — Vietnam's Interior Materials Authority".
Triết lý content: education-led. Mỗi bài phải dạy người đọc điều gì đó cụ thể về vật liệu.
Bonario KHÔNG phải: bán hàng, lifestyle vague, review cảm xúc, quảng cáo giảm giá.

Ba content series:
- Material Decoded: giải mã cấu tạo, ứng xử, bảo quản của một vật liệu cụ thể
- Designer Thinking: logic đằng sau quyết định chọn vật liệu của designer
- Real Homes Study: phân tích vật liệu trong một không gian thực tế

Thông tin content đang được review:
- Loại content: ${contentType}
- Phục vụ: ${serving}
(Dùng thông tin này để hiệu chỉnh kỳ vọng về độ dài, cấu trúc, và mức độ chi tiết phù hợp.)

Riêng với Education Depth, trước khi chấm hãy tự xác định 1 câu nội bộ:
"Sau khi đọc xong, người đọc rút ra điều gì cụ thể?"
Nếu không thể trả lời rõ câu này thì Education Depth phải FAIL.

5 tiêu chí — chấm PASS hoặc FAIL:

1. Education Depth
   PASS: Xác định được rõ 1 takeaway cụ thể sau khi đọc. Takeaway đó thuộc ≥1 trong 3 dạng:
     (A) Hiểu thêm đặc tính hoặc cách bảo quản vật liệu.
     (B) Hiểu thêm cách ứng dụng vật liệu vào công năng, thẩm mỹ hoặc không gian.
     (C) Hiểu thêm 1 logic thiết kế có thể áp dụng, không chỉ mô tả cảm nhận.
     Lưu ý: Cảm nhận thẩm mỹ thuần túy ("thư thái", "tinh tế", "sang trọng") không tính là takeaway đạt chuẩn.
   FAIL: Không xác định được takeaway cụ thể người đọc nhận về. Hoặc content dưới 40 từ.

2. Material Authority
   PASS: Có ít nhất 1 điểm cụ thể về ứng dụng thẩm mỹ, logic thiết kế, cách vật liệu vận hành trong không gian,
     hoặc trải nghiệm sử dụng có thể kiểm chứng bằng quan sát thực tế.
     Không cần thông số quá kỹ thuật.
   FAIL: Chỉ có "cao cấp", "chất lượng tốt", "premium", "bền đẹp", "tinh xảo"
     mà không nêu ra 1 điểm ứng dụng, thiết kế hoặc trải nghiệm cụ thể.

3. Narrative Arc
   PASS: Có ≥2 trong 3: hook mở (câu gây tò mò / đặt vấn đề) → insight (kiến thức vật liệu)
         → takeaway (người đọc biết làm gì tiếp). Có tách đoạn.
   FAIL: Liệt kê feature rời rạc. Không có câu dẫn dắt. Không có kết luận.

4. Tone
   PASS: Giọng tự tin, giáo dục, trực tiếp. Không emoji >5. Không ngôn ngữ quảng cáo.
         CTA mềm ở cuối caption là chấp nhận được nếu giữ giọng tư vấn, ví dụ:
         "Nếu bạn cần tư vấn theo không gian thực tế, bạn có thể nhắn Bonario để đặt lịch khảo sát."
         CTA vận hành trực tiếp như "Nhắn ngay cho BONARIO để đặt lịch tư vấn và khảo sát!" cũng được chấp nhận
         nếu đặt ở cuối caption và không đi cùng ngôn ngữ khuyến mãi / thúc ép.
         Dấu chấm than chỉ bị xem là FAIL khi đi cùng âm điệu thúc ép bán hàng.
   FAIL: Có "siêu", "ưu đãi", "sale", "giảm giá", "đừng bỏ lỡ", "inbox ngay",
         "số lượng có hạn", hoặc giọng van nài / gấp gáp / thúc ép.

5. Visual-Text Alignment
   PASS: Caption thêm thông tin không visible trong hình (lý do kỹ thuật, đặc tính ẩn,
         quy trình, câu chuyện đằng sau). Nếu KHÔNG có hình: auto-PASS.
   FAIL: Caption chỉ mô tả lại những gì đã thấy trong hình.

Verdict: PASS (5/5) | REVISION NEEDED (1–2 fail) | REJECT (3+ fail)

Trả về JSON duy nhất, không có text nào ngoài JSON:
{
  "criteria": [
    {"name":"Education Depth",       "status":"PASS|FAIL","evidence":"1 câu cụ thể từ content"},
    {"name":"Material Authority",    "status":"PASS|FAIL","evidence":"1 câu cụ thể"},
    {"name":"Narrative Arc",         "status":"PASS|FAIL","evidence":"1 câu cụ thể"},
    {"name":"Tone",                  "status":"PASS|FAIL","evidence":"1 câu cụ thể"},
    {"name":"Visual-Text Alignment", "status":"PASS|FAIL","evidence":"1 câu — nếu không có hình: 'Không có hình — auto PASS'"}
  ],
  "verdict": "PASS|REVISION NEEDED|REJECT",
  "verdict_summary": "1 câu tổng kết dứt khoát, không vòng vo",
  "fixes": ["fix cụ thể 1 — chỉ khi FAIL", "fix cụ thể 2"],
  "suggested_revision": "Bản viết lại hoàn chỉnh. LUÔN cung cấp dù verdict là PASS.
    PASS: đây là phiên bản chuẩn mực tốt nhất. REVISION/REJECT: bản đã sửa đúng brand.
    Giữ nguyên ngôn ngữ (Việt/Anh). Dùng giọng văn và ngôn ngữ theo tinh thần editorial của ELLE Decoration Vietnam: tinh tế, giàu quan sát, giàu hình ảnh nhưng tiết chế, thiên về biên tập không gian - vật liệu, không mang âm điệu quảng cáo trực diện. Không giải thích. Chỉ đưa ra bản viết.
    BẮT BUỘC theo đúng cấu trúc social này, theo đúng thứ tự và không in nhãn TITLE/CTA/Footer:
    - Dòng 1: Title
    - Đoạn 1: 2-3 câu ngắn
    - Đoạn 2: 2-3 câu ngắn
    - CTA: 1-2 câu
    - Footer: dùng nguyên văn block sau:
${BONARIO_SOCIAL_FOOTER}"
}

Quy tắc viết feedback:
- evidence: 1 câu cụ thể, trích dẫn đúng từ/câu trong content gây PASS hoặc FAIL.
- fixes[]: mỗi fix nêu: xóa gì / thêm gì / viết lại chỗ nào. Không chung chung.
- Không khen trước khi chê. Không vòng vo.`;
  },
};
