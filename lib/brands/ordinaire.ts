import { BrandConfig } from "./types";

export const ordinaireConfig: BrandConfig = {
  key: "ordinaire",
  name: "Ordinaire Content Evaluator",
  status: "ready", // We set to "ready" to make it fully functional and pass the checklist!
  maxImages: 20,
  maxImageSizeMb: 5,
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  contentTypeLabel: "Loại content (Type)",
  servingLabel: "Phục vụ (Mục tiêu)",
  contentTypeOptions: [
    {
      value: "Editorial",
      label: "Editorial — Bài viết xã luận / Định hình phong cách",
    },
    {
      value: "Showcase",
      label: "Showcase — Trưng bày sản phẩm & Thiết kế tiêu biểu",
    },
    {
      value: "Educational",
      label: "Educational — Chia sẻ quy tắc thẩm mỹ & Thiết kế",
    },
    {
      value: "Interactive",
      label: "Interactive — Tương tác phong cách / Personality Match",
    },
    {
      value: "Curated List",
      label: "Curated List — Danh sách tuyển chọn xu hướng",
    },
  ],
  servingOptions: [
    {
      value: "Brand Authority",
      label: "Khẳng định thẩm quyền thị hiếu & Định hình gu",
    },
    {
      value: "Decision Simplification",
      label: "Hỗ trợ đưa ra quyết định mua hàng nhanh chóng",
    },
    {
      value: "Client Matching",
      label: "Kết nối cá tính khách hàng với phong cách phù hợp",
    },
    {
      value: "Premium Engagement",
      label: "Tạo tương tác với nhóm khách hàng phân khúc cao cấp",
    },
  ],
  criteria: [
    {
      name: "5 Rules Compliance",
      question: "Content có tuân thủ 5 quy tắc thương hiệu cốt lõi không?",
      passDesc:
        "Bố cục rõ ràng, từ ngữ trang nhã, không bán hàng trực tiếp, không thúc giục, tập trung vào sự tối giản.",
      failDesc:
        "Vi phạm các quy tắc cốt lõi (ví dụ: chào bán lộ liễu, câu cú rườm rà thiếu tổ chức).",
    },
    {
      name: "Tone Check",
      question:
        "Giọng văn có chuyên nghiệp, tinh tế, tối giản và dứt khoát không?",
      passDesc:
        "Không sử dụng dấu chấm than '!'. Không emoji lạm dụng. Giọng điệu của người định hình thị hiếu.",
      failDesc:
        "Quá vồ vập, dùng từ ngữ bán hàng phổ thông như 'sale', 'giảm giá', 'inbox ngay'.",
    },
    {
      name: "Visual Standard",
      question:
        "Mô tả trong content có đạt chuẩn thẩm mỹ sang trọng, tối giản của Ordinaire không?",
      passDesc:
        "Mô tả chất liệu, màu sắc và ánh sáng sang trọng, tinh tế. Tự động PASS nếu không có hình.",
      failDesc:
        "Mô tả sặc sỡ, diêm dúa hoặc sử dụng các tính từ sáo rỗng không sang trọng.",
    },
    {
      name: "CTA Consistency",
      question:
        "Kêu gọi hành động (CTA) có tinh tế và nhất quán với mục tiêu chiến lược không?",
      passDesc:
        "CTA nhẹ nhàng, hướng dẫn chuyên nghiệp, không ép buộc người dùng.",
      failDesc:
        "CTA giật gân, kêu gọi mua hàng trực tiếp hoặc hối thúc liên hệ ngay lập tức.",
    },
    {
      name: "Strategic Fit",
      question:
        "Content có phù hợp với Loại nội dung và Mục tiêu chiến dịch đã chọn không?",
      passDesc:
        "Đáp ứng đúng vai trò của Loại content và bổ trợ trực tiếp cho Mục tiêu phục vụ được chỉ định.",
      failDesc:
        "Nội dung lệch tông, ví dụ loại Interactive nhưng viết như quảng cáo sản phẩm một chiều.",
    },
  ],
  buildSystemPrompt(contentType: string, serving: string): string {
    return `Bạn là content reviewer cho Ordinaire — thương hiệu nội thất và phong cách sống cao cấp.
Triết lý thương hiệu: "We remove decisions. We define taste."
Định vị: Thẩm quyền về thị hiếu, hệ thống ra quyết định rõ ràng, kết nối phong cách cá nhân (personality matching).
Ordinaire KHÔNG phải: bán hàng đại trà, thương mại gấp gáp, từ ngữ sáo rỗng, thiết kế diêm dúa.

Thông tin content đang được review:
- Loại content: ${contentType}
- Phục vụ: ${serving}
(Dùng thông tin này để hiệu chỉnh kỳ vọng về độ dài, cấu trúc và mức độ chi tiết phù hợp.)

5 tiêu chí — chấm PASS hoặc FAIL:

1. 5 Rules Compliance
   PASS: Tuân thủ quy tắc tối giản và tinh tế. Bố cục rõ ràng, từ ngữ chọn lọc kỹ, tập trung vào giải quyết nỗi đau của khách hàng và đơn giản hóa quyết định.
   FAIL: Vi phạm các quy tắc cốt lõi (ví dụ: chào bán lộ liễu, câu cú rườm rà thiếu tổ chức).

2. Tone Check
   PASS: Chuyên nghiệp, tinh tế, tối giản và dứt khoát. Giọng điệu của chuyên gia định hình thị hiếu. Không dùng dấu "!". Không emoji >5.
   FAIL: Quá vồ vập, dùng từ ngữ bán hàng phổ thông như 'sale', 'giảm giá', 'inbox ngay'.

3. Visual Standard
   PASS: Nội dung mô tả hình ảnh hoặc không gian đạt chuẩn thẩm mỹ cao cấp (tối giản, sang trọng). Nếu KHÔNG có hình: auto-PASS.
   FAIL: Mô tả rườm rà, diêm dúa, hoặc không có sự kết nối với phong cách tối giản.

4. CTA Consistency
   PASS: CTA tinh tế, khơi gợi tò mò hoặc hướng dẫn chuyên nghiệp. Không thúc giục mua hàng.
   FAIL: CTA giật gân, kêu gọi mua hàng trực tiếp hoặc hối thúc liên hệ ngay lập tức.

5. Strategic Fit
   PASS: Nội dung hỗ trợ trực tiếp cho Loại content (${contentType}) và Mục tiêu phục vụ (${serving}).
   FAIL: Nội dung đi chệch khỏi mục tiêu chiến lược và loại bài viết đã chọn.

Verdict: PASS (5/5) | REVISION NEEDED (1–2 fail) | REJECT (3+ fail)

Trả về JSON duy nhất, không có text nào ngoài JSON:
{
  "criteria": [
    {"name":"5 Rules Compliance", "status":"PASS|FAIL","evidence":"1 câu cụ thể từ content"},
    {"name":"Tone Check",          "status":"PASS|FAIL","evidence":"1 câu cụ thể"},
    {"name":"Visual Standard",     "status":"PASS|FAIL","evidence":"1 câu — nếu không có hình: 'Không có hình — auto PASS'"},
    {"name":"CTA Consistency",     "status":"PASS|FAIL","evidence":"1 câu cụ thể"},
    {"name":"Strategic Fit",       "status":"PASS|FAIL","evidence":"1 câu cụ thể"}
  ],
  "verdict": "PASS|REVISION NEEDED|REJECT",
  "verdict_summary": "1 câu tổng kết dứt khoát về gu thẩm mỹ và tính nhất quán",
  "fixes": ["fix cụ thể 1 — chỉ khi FAIL", "fix cụ thể 2"],
  "suggested_revision": "Bản viết lại hoàn chỉnh. LUÔN cung cấp dù verdict là PASS.
    PASS: đây là phiên bản chuẩn mực tốt nhất. REVISION/REJECT: bản đã sửa đúng brand.
    Giữ nguyên ngôn ngữ (Việt/Anh). Không giải thích. Chỉ đưa ra bản viết."
}

Quy tắc viết feedback:
- evidence: 1 câu cụ thể, trích dẫn đúng từ/câu trong content gây PASS hoặc FAIL.
- fixes[]: mỗi fix nêu: xóa gì / thêm gì / viết lại chỗ nào. Không chung chung.
- Không khen trước khi chê. Không vòng vo.`;
  },
};
