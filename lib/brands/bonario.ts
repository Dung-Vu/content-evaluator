import { BrandConfig } from "./types";

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
      value: "Pillar 1 - Trends",
      label: "Cập nhật và dự báo các xu hướng vật liệu mới nhất trong ngành.",
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
      value: "Pillar 2 - Showroom & Partner",
      label:
        "Showroom Tour, Recap các hoạt động tại showroom, kết nối với các đối tác thiết kế",
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
    { value: "Network", label: "Xây dựng mạng lưới kết nối chuyên nghiệp." },
    {
      value: "Trust & Conversion",
      label:
        "Tạo độ uy tín của thương hiệu và tăng sự tự tin trong hành trình chọn vật liệu và mua hàng của khách thông qua câu chuyện và hình ảnh thực tế",
    },
  ],
  criteria: [
    {
      name: "Pillar Fit",
      question:
        "Content có phù hợp đúng pillar content và mục tiêu của pillar đó hay không?",
      passDesc:
        "Content làm đúng việc của pillar: Giải mã = truyền kiến thức vật liệu cụ thể; Designer Thinking = chia sẻ logic/lý do chọn vật liệu; Real Homes = phân tích vật liệu trong không gian thực.",
      failDesc:
        "Content nói chuyện khác với pillar đã chọn — FAQ nhưng không trả lời câu hỏi cụ thể, Showcase nhưng không có thông tin vật liệu.",
    },
    {
      name: "Education Depth",
      question:
        "Sau khi đọc, người đọc biết thêm được điều gì cụ thể về vật liệu mà có thể ứng dụng hoặc kiểm chứng được?",
      passDesc:
        "Có ≥1 trong 3 dạng dưới đây: (A) Đặc tính kỹ thuật & Bảo quản — cấu tạo, độ bền, phản ứng với môi trường; hoặc hướng dẫn dùng, làm sạch, tuổi thọ (B) Ứng dụng vào không gian — lý do chọn vật liệu theo loại phòng, kích thước, chức năng; cần có lý do, không chỉ gắn nhãn phong cách (C) Nguyên tắc thiết kế & thẩm mỹ — quy tắc hoặc logic về cách vật liệu tương tác thị giác; cần có nguyên tắc có thể áp dụng, không chỉ mô tả cảm nhận",
      failDesc:
        "Không có dạng nào — toàn bộ content chỉ là cảm nhận thẩm mỹ. Hoặc <40 từ",
    },
    {
      name: "Material Authority",
      question:
        "Thông tin về vật liệu có chính xác, cụ thể, có thể kiểm chứng không? Hay chỉ là từ ngữ marketing mơ hồ?",
      passDesc:
        "Có số liệu, tên kỹ thuật, hoặc mô tả hành vi vật liệu có thể kiểm chứng. Không có cụm mơ hồ.",
      failDesc:
        "Dùng 'cao cấp', 'chất lượng tốt', 'premium', 'bền đẹp' không kèm bằng chứng.",
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

6 tiêu chí — chấm PASS hoặc FAIL:

1. Pillar Fit
   PASS: Content làm đúng việc của pillar đó: Giải mã = truyền kiến thức vật liệu cụ thể;
         Designer Thinking = chia sẻ logic/lý do chọn vật liệu; Real Homes = phân tích vật liệu trong không gian thực.
   FAIL: Content nói chuyện khác với pillar đã chọn — FAQ nhưng không trả lời câu hỏi cụ thể,
         Showcase nhưng không có thông tin vật liệu.

2. Education Depth
   PASS: Có ≥1 trong 3 dạng:
         (A) Đặc tính kỹ thuật & Bảo quản — cấu tạo, độ bền, phản ứng với môi trường; hoặc hướng dẫn dùng, làm sạch, tuổi thọ.
         (B) Ứng dụng vào không gian — lý do chọn vật liệu theo loại phòng, kích thước, chức năng; cần có lý do, không chỉ gắn nhãn phong cách.
         (C) Nguyên tắc thiết kế & thẩm mỹ — quy tắc hoặc logic về cách vật liệu tương tác thị giác; cần có nguyên tắc có thể áp dụng, không chỉ mô tả cảm nhận.
         Lưu ý: Cảm nhận thẩm mỹ thuần túy ("thư thái", "tinh tế", "sang trọng") không tính vào bất kỳ dạng PASS nào. Dạng C chỉ hợp lệ khi có nguyên tắc hoặc lý do.
   FAIL: Không có dạng nào — toàn bộ content chỉ là cảm nhận thẩm mỹ. Hoặc content dưới 40 từ.

3. Material Authority
   PASS: Có ≥1 trong: số liệu (GSM, độ cứng Mohs, nhiệt độ, năm...), tên kỹ thuật chính xác,
         mô tả hành vi vật liệu có thể kiểm chứng.
   FAIL: Chỉ có "cao cấp", "chất lượng tốt", "premium", "bền đẹp", "tinh xảo"
         mà không có bằng chứng cụ thể nào.

4. Narrative Arc
   PASS: Có ≥2 trong 3: hook mở (câu gây tò mò / đặt vấn đề) → insight (kiến thức vật liệu)
         → takeaway (người đọc biết làm gì tiếp). Có tách đoạn.
   FAIL: Liệt kê feature rời rạc. Không có câu dẫn dắt. Không có kết luận.

5. Tone
   PASS: Giọng tự tin, giáo dục, trực tiếp. Không emoji >5. Không ngôn ngữ quảng cáo.
         CTA mềm ở cuối caption là chấp nhận được nếu giữ giọng tư vấn, ví dụ:
         "Nếu bạn cần tư vấn theo không gian thực tế, bạn có thể nhắn Bonario để đặt lịch khảo sát."
         CTA vận hành trực tiếp như "Nhắn ngay cho BONARIO để đặt lịch tư vấn và khảo sát!" cũng được chấp nhận
         nếu đặt ở cuối caption và không đi cùng ngôn ngữ khuyến mãi / thúc ép.
         Dấu chấm than chỉ bị xem là FAIL khi đi cùng âm điệu thúc ép bán hàng.
   FAIL: Có "siêu", "ưu đãi", "sale", "giảm giá", "đừng bỏ lỡ", "inbox ngay",
         "số lượng có hạn", hoặc giọng van nài / gấp gáp / thúc ép.

6. Visual-Text Alignment
   PASS: Caption thêm thông tin không visible trong hình (lý do kỹ thuật, đặc tính ẩn,
         quy trình, câu chuyện đằng sau). Nếu KHÔNG có hình: auto-PASS.
   FAIL: Caption chỉ mô tả lại những gì đã thấy trong hình.

Verdict: PASS (6/6) | REVISION NEEDED (1–2 fail) | REJECT (3+ fail)

Trả về JSON duy nhất, không có text nào ngoài JSON:
{
  "criteria": [
    {"name":"Pillar Fit",            "status":"PASS|FAIL","evidence":"1 câu cụ thể từ content"},
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
    Giữ nguyên ngôn ngữ (Việt/Anh). Dùng giọng văn và ngôn ngữ theo tinh thần editorial của ELLE Decoration Vietnam: tinh tế, giàu quan sát, giàu hình ảnh nhưng tiết chế, thiên về biên tập không gian - vật liệu, không mang âm điệu quảng cáo trực diện. Không giải thích. Chỉ đưa ra bản viết."
}

Quy tắc viết feedback:
- evidence: 1 câu cụ thể, trích dẫn đúng từ/câu trong content gây PASS hoặc FAIL.
- fixes[]: mỗi fix nêu: xóa gì / thêm gì / viết lại chỗ nào. Không chung chung.
- Không khen trước khi chê. Không vòng vo.`;
  },
};
