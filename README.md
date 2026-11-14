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

Sau khi trả lời xong một câu trong **Học từng câu**, chọn **AI giải thích & kiểm chứng**. Trợ lý gọi trực tiếp Gemini 3.5 Flash-Lite (Free Tier), tìm tài liệu liên quan trong chỉ mục công khai Microsoft Learn và danh mục tài liệu chính thức Oracle/MySQL/OWASP rồi dùng URL context để đọc tối đa 3 trang. Đây là đối chiếu tài liệu có phạm vi giới hạn, không phải tìm toàn bộ web. Nếu tài liệu chưa liên quan hoặc không đủ chi tiết, AI phải nêu chưa đủ căn cứ và phân biệt phần giải thích kiến thức nền. Không sửa đáp án, điểm hoặc tiến độ.

Chỉ hiển thị nguồn có URL context metadata xác nhận đọc thành công trên tên miền tài liệu chính thức được cho phép; không lấy liên kết do model tự viết. Tất cả lời giải được hiển thị dưới dạng văn bản an toàn. Có thể đọc được trang nhưng trang chưa chứng minh được đáp án: dấu đã đọc tài liệu không có nghĩa toàn bộ lời giải đã được xác minh.

**Thiết lập miễn phí:** tạo API key tại https://aistudio.google.com/apikey trong dự án **Free Tier chưa liên kết billing**. Lưu vào biến môi trường Vercel **GEMINI_API_KEY**, loại Secret/Sensitive, Production, rồi redeploy. Không đặt key vào trình duyệt hoặc commit. Free Tier có hạn mức thay đổi theo tài khoản; Google có thể dùng dữ liệu để cải thiện sản phẩm. Chỉ câu hỏi gốc và lựa chọn được gửi cho Google, không gửi email, user ID hay lịch sử học.

Model được cố định ở `gemini-3.5-flash-lite`, đã gọi thật thành công ngày 14/11/2026 với API key chủ dự án cung cấp. Model 2.5 vẫn xuất hiện trong catalog nhưng kiểm tra thật trả 404 do tài khoản mới không được cấp, nên đã chuyển sang 3.5. Không dùng Google Search grounding (không miễn phí trên model mới), Vercel AI Gateway, Perplexity hoặc fallback trả phí. URL context tính theo input token của model. Việc không phát sinh phí phụ thuộc dự án Google giữ ở Free Tier chưa bật billing; nếu chủ tài khoản bật billing, cùng key có thể bị tính phí theo Google. `AI_STUDY_ENABLED=false` tắt AI ở server.

`supabase/study-agent.sql` đã được áp dụng ở production. API cần `SUPABASE_SERVICE_ROLE_KEY` hoặc `SUPABASE_SECRET_KEY` **chỉ ở server**, ngoài các biến Supabase public. Người dùng phải đăng nhập và xác nhận email; server kiểm tra phiên với Supabase Auth, không tin user ID do trình duyệt gửi. Câu hỏi được lấy lại từ ngân hàng đề gốc. Chưa hỗ trợ bộ thẻ tự tạo.

Giới hạn atomic trong database: 10 lượt/người/ngày, 20 lượt/ngày và 100 lượt/tháng toàn website, tính theo UTC, cách nhau 15 giây/người. Đây là giới hạn Ônki, không thay thế quota Google. Yêu cầu lỗi sau khi giữ lượt vẫn tính vào giới hạn. Thiếu key hoặc lỗi quota dừng trước khi gọi model; Google trả 429 thì dừng và báo thử lại sau. Không lưu token, câu hỏi hay lời giải AI vào database/localStorage. Kết quả chỉ giữ trong bộ nhớ phiên học để hiển thị lại cho người học đó. Runtime log chỉ ghi tên lỗi/mã trạng thái, không ghi key, prompt hay user ID.

Kiểm tra `npm test`: quyền, quota, tách dữ liệu, URL nguồn thực sự đọc được, chống nguồn giả và adapter Google SDK. Ngoài kiểm thử giả lập, đã gọi model thật để xác nhận key, model, lời giải tiếng Việt và URL context hoạt động.
