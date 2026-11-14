# Ônki

Website ôn DBS401 bằng tiếng Việt: 9 bộ đề, 429 câu, flashcard, kiểm tra nhiều đáp án, chấm điểm và tiến độ cá nhân. Có 426 câu chấm tự động theo chữ in đậm trong nguồn. Ba câu chưa đánh dấu đáp án được giữ để xem, không chấm tự động.

## Học từng câu

Mở bộ đề để học từng câu với phản hồi ngay khi chọn: đúng hiện xanh, sai hiện đỏ và đáp án chuẩn. Câu nhiều đáp án báo đúng/sai từng lựa chọn, hoàn thành khi chọn đủ hoặc chọn sai. Tiến độ ghi nhớ được cập nhật một lần mỗi câu; buổi học không làm thay đổi lịch sử điểm kiểm tra. Cuối buổi có thể học lại riêng các câu sai.

## Triển khai trên Vercel

1. Import repository này vào Vercel. Chọn Framework: Other. Build command và output directory đã có trong `vercel.json`.
2. Tạo dự án Supabase riêng và chạy `supabase/schema.sql` trong SQL Editor.
3. Trong Vercel → Environment Variables, thêm `SUPABASE_URL` và `SUPABASE_PUBLISHABLE_KEY` (publishable hoặc legacy anon key). Không dùng secret/service_role key cho cấu hình trình duyệt.
4. Trong Supabase → Authentication → URL Configuration, đặt Site URL là URL production Vercel và thêm cùng URL này vào Redirect URLs. Bật email/password, xác nhận email và mật khẩu tối thiểu 8 ký tự. Cấu hình SMTP của bạn nếu cần gửi mail cho cả lớp; dịch vụ gửi mail thử nghiệm có giới hạn.
5. Redeploy trên Vercel, tạo hai tài khoản thử và kiểm tra dữ liệu riêng biệt. Cấu hình production và preview ở các Supabase project khác nhau nếu cần tách dữ liệu.

Nếu thiếu biến Supabase, website vẫn cho học ở chế độ khách và thông báo đăng nhập chưa được bật. Đây không phải tài khoản giả. Chế độ khách chỉ lưu trên trình duyệt.

## Chạy máy cá nhân

Node.js 22 trở lên. Chạy `npm ci`, đặt biến môi trường theo `.env.example` rồi chạy `node scripts/serve.cjs`. Script không tự đọc `.env`; có thể chạy `node --env-file=.env scripts/serve.cjs`. Máy chủ tĩnh này phục vụ giao diện; kiểm tra API AI bằng `vercel dev` với dự án đã liên kết.

`node scripts/build.cjs` tạo `public/config.js` từ các biến publishable. Supabase JS 2.119.0 được lưu tại `public/vendor/`, có kèm giấy phép MIT. Không có token GitHub/Vercel hay secret database trong nguồn.

## Tài khoản và dữ liệu

Supabase Auth quản lý email, mật khẩu, xác nhận email, phiên đăng nhập và khôi phục mật khẩu. Row Level Security chỉ cho người dùng đọc/ghi hàng của chính họ. Dữ liệu được lưu tách theo user ID trên máy và trong database. Khách không tự động được nhập vào tài khoản. Không tải dữ liệu người trước vào tài khoản người sau trên máy dùng chung.

Ghi đám mây có kiểm tra revision để tránh ghi đè âm thầm khi nhiều thiết bị sửa cùng lúc. Khi có xung đột, bản trên máy được giữ; người dùng có thể tải bản đám mây để tiếp tục. Điểm ôn tập do trình duyệt tính, dùng cho tự học, không phải hệ thống thi có giám sát.

## Đề nguồn

Các DOCX do chủ repository cung cấp nằm trong `public/sources/`. Giữ nguyên nội dung và đáp án được đánh dấu trong đề, chưa thẩm định lại chuyên môn.

## Trợ lý AI trong từng câu

Sau khi trả lời xong một câu trong **Học từng câu**, chọn **AI giải thích & kiểm chứng**. Trợ lý dùng Vercel AI SDK với một vòng tra cứu Perplexity qua AI Gateway, sau đó giải thích từng lựa chọn bằng tiếng Việt, so sánh đáp án đánh dấu với tài liệu chính thức và nêu các điểm chưa đủ căn cứ. Nguồn hiển thị lấy trực tiếp từ kết quả công cụ, chỉ chấp nhận HTTPS trên các miền tài liệu Microsoft, Oracle, MySQL, PostgreSQL, MariaDB, IBM, OWASP và NIST. Không tự sửa đáp án, điểm hoặc tiến độ. AI vẫn có thể nhầm; các trích đoạn tìm kiếm không bảo đảm đủ ngữ cảnh.

Chạy `supabase/study-agent.sql` một lần (production đã áp dụng). API cần `SUPABASE_SERVICE_ROLE_KEY` hoặc `SUPABASE_SECRET_KEY` **chỉ ở phía server**, ngoài các biến Supabase ở trên. Tích hợp Supabase trên Vercel đã cung cấp các biến này. Chỉ người dùng đã xác nhận email được gọi AI; server kiểm tra phiên với Supabase Auth, không tin user ID do trình duyệt gửi. Câu hỏi được đọc lại từ ngân hàng đề gốc, không tin đáp án do client gửi. Hiện chưa hỗ trợ bộ thẻ tự tạo.

Vercel xác thực AI Gateway bằng OIDC tự động, không cần đưa API key vào frontend. Có thể đặt `AI_GATEWAY_MODEL` để đổi model; mặc định `google/gemini-3-flash` đã kiểm tra tồn tại trong catalog ngày 14/11/2026. Ngoài Vercel, dùng `AI_GATEWAY_API_KEY` trong biến môi trường riêng. `AI_STUDY_ENABLED=false` tắt AI ở server. Mã nguồn không kích hoạt dịch vụ, mua credit hay bật tự động nạp; cần chủ tài khoản hoàn tất bước credit/xác minh của AI Gateway.

Trước khi gọi model, API kiểm tra số dư và giữ một lượt trong database bằng transaction: tối đa 10 lượt/người/ngày, 20 lượt/ngày và 100 lượt/tháng cho toàn website, ngày/tháng tính theo UTC; cách nhau 15 giây cho mỗi người. Đây là giới hạn số yêu cầu, không phải cam kết chi phí chính xác. Yêu cầu lỗi sau khi giữ lượt vẫn tính vào giới hạn. Thiếu credit, lỗi kiểm tra quota hoặc cấu hình thiếu đều dừng trước khi sinh câu trả lời. Không lưu câu hỏi hay token trong bảng giới hạn. Kết quả AI chỉ giữ trong phiên học hiện tại và không đồng bộ vào hồ sơ học tập.

Kiểm tra: `npm test`. Các kiểm thử provider dùng stub để kiểm tra luồng và quyền truy cập; chỉ xác nhận câu trả lời AI thật sau khi credit được kích hoạt và một yêu cầu live thành công.
