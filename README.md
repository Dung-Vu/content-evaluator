# Content Evaluator (Brand Consistency Engine)

**Content Evaluator** là ứng dụng hỗ trợ bộ phận Marketing của Bonario Group tự động hóa quy trình đánh giá, chấm điểm và tối ưu hóa tính đồng bộ của nội dung bài viết (Caption) kèm hình ảnh thiết kế dựa trên các tiêu chuẩn cốt lõi của hai thương hiệu: **Bonario** và **Ordinaire**.

Bằng việc kết hợp sức mạnh của mô hình ngôn ngữ lớn đa phương thức hiện đại với bộ khung quy tắc chuẩn hóa thương hiệu, ứng dụng giúp duy trì sự nhất quán tối đa về thông điệp truyền thông, giọng văn và hình ảnh thiết kế trước khi bài viết được phát hành chính thức.

---

## Tính Năng Cốt Lõi

- **Chấm Điểm Tính Nhất Quán (Fit Score):** Phân tích và cho điểm mức độ phù hợp của bài viết dựa trên các tiêu chí cốt lõi (ví dụ: chiều sâu kiến thức vật liệu, thẩm quyền thương hiệu, cấu trúc bài viết, tính chân thực của hình ảnh).
- **Phân Tích Tiêu Chí Chi Tiết:** Trình bày rõ ràng trạng thái Đạt/Không đạt (`PASS`/`FAIL`) của từng tiêu chí kèm theo bằng chứng cụ thể được trích xuất trực tiếp từ bài viết.
- **Đề Xuất Chỉnh Sửa (Actionable Fixes):** Đưa ra các gợi ý điều chỉnh cụ thể để khắc phục các tiêu chuẩn bị vi phạm.
- **Gợi Ý Bản Nháp Viết Lại (Suggested Revision):** Tự động sinh ra bản nháp tối ưu, đạt chuẩn nhận diện thương hiệu để người dùng có thể tham khảo hoặc sao chép sử dụng ngay.
- **Quét Trực Tiếp Thời Gian Thực (Streaming):** Dữ liệu đánh giá được hiển thị dần theo dạng stream (Server-Sent Events) giúp người dùng thấy ngay tiến trình chấm điểm của từng tiêu chí mà không phải chờ đợi lâu.
- **Hỗ Trợ Đa Phương Thức (Multimodal):** Đọc và phân tích trực tiếp hình ảnh thiết kế được tải lên để đối chiếu tính nhất quán giữa nội dung mô tả bằng chữ và thiết kế trực quan.

---

## Ngôn Ngữ Thiết Kế & Giao Diện (UX/UI Premium)

Ứng dụng được định hình theo phong cách **Premium Dark Mode** với thiết kế hiện đại, sang trọng và thu hút người dùng từ cái nhìn đầu tiên:

- **Dynamic Theme (Chủ Đề Động):** Toàn bộ hệ màu sắc chủ đạo, hiệu ứng hào quang (Glow Gradients) vàBadge thương hiệu sẽ tự động thay đổi mượt mà theo thương hiệu được chọn (Tông màu vàng cát ấm áp cho _Bonario_ và tông xanh Indigo tinh tế cho _Ordinaire_).
- **Brand Switcher:** Thanh gạt pill-sliding mượt mà để chuyển đổi nhanh giữa các môi trường đánh giá của từng thương hiệu.
- **Hiệu Ứng Kính Mờ (Glassmorphism):** Sử dụng các bảng điều khiển dạng kính mờ tinh xảo chồng lên lớp lưới nền chuyển động nhẹ, tạo chiều sâu thị giác ấn tượng.
- **Circular Progress Gauge:** Vòng tròn tiến độ điểm số được thiết kế sắc nét với hiệu ứng phát sáng neon và chuyển động vẽ viền mượt mà mô tả trực quan tỷ lệ đạt chuẩn.
- **Khung So Sánh Trực Quan:** Bản gốc của bạn và bản gợi ý chuẩn Brand từ AI được đặt song song để dễ đối chiếu, đi kèm tính năng sao chép nhanh một chạm tiện lợi.
