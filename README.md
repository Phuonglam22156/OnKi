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

Sau khi trả lời xong một câu trong **Học từng câu**, chọn **AI giải thích & kiểm chứng**. Trợ lý gọi trực tiếp Google Gemini 2.5 Flash-Lite với Google Search để giải thích từng lựa chọn, đối chiếu đáp án đề và nêu khi chưa đủ căn cứ. Ưu tiên tài liệu chính thức, nhưng kết quả tìm kiếm có thể gồm trang khác; giao diện không tuyên bố mọi nguồn đều chính thức. Nguồn chỉ lấy từ metadata thật của provider (có thể là URL chuyển hướng Google), không lấy URL do model tự viết. Search Suggestions do Google trả về được hiển thị bằng DOMPurify trong Shadow DOM để giữ định dạng, ngăn mã nguy hiểm và tránh CSS ảnh hưởng trang học. Kết quả không sửa đáp án, điểm hoặc tiến độ.

**Thiết lập miễn phí:** tạo API key tại https://aistudio.google.com/apikey trong dự án **Free Tier chưa liên kết billing**. Tự lưu key vào biến môi trường Vercel **GEMINI_API_KEY**, loại Sensitive, target Production (và Preview nếu cần), rồi redeploy. Không gửi key vào chat, không đặt vào config trình duyệt hoặc commit. Gói miễn phí có giới hạn và Google có thể dùng dữ liệu để cải thiện sản phẩm; chỉ câu hỏi gốc và các lựa chọn được gửi, không gửi email, user ID hay lịch sử học.

Model được cố định ở `gemini-2.5-flash-lite`: tài liệu Google ngày 14/11/2026 còn ghi hỗ trợ API, Free Tier cho input/output và Google Search tối đa 500 RPD chia sẻ với Flash. Hạn mức thực tế còn tùy tài khoản và Google có thể thay đổi. Không dùng Vercel AI Gateway, Perplexity, key Ollama hay fallback trả phí; không tự retry khi hết quota. Việc API không phát sinh phí phụ thuộc dự án Google giữ ở Free Tier, chưa bật billing. Nếu chủ tài khoản tự bật billing, cùng API key có thể phát sinh phí theo Google. `AI_STUDY_ENABLED=false` tắt AI ở server.

Chạy `supabase/study-agent.sql` một lần (production đã áp dụng). API cần `SUPABASE_SERVICE_ROLE_KEY` hoặc `SUPABASE_SECRET_KEY` **chỉ ở server**, ngoài các biến Supabase. Tích hợp Supabase trên Vercel đã cung cấp các biến này. Chỉ người dùng đã xác nhận email được dùng AI; server kiểm tra phiên với Supabase Auth, không tin user ID do trình duyệt gửi. Câu hỏi được lấy lại từ ngân hàng đề gốc, không tin đáp án client gửi. Hiện chưa hỗ trợ bộ thẻ tự tạo.

Giới hạn atomic trong database: 10 lượt/người/ngày, 20 lượt/ngày và 100 lượt/tháng cho toàn website; tính theo UTC, mỗi người cách nhau ít nhất 15 giây. Đây là giới hạn của Ônki, không thay thế quota của Google. Yêu cầu lỗi sau khi giữ lượt vẫn tính vào giới hạn. Thiếu key hoặc lỗi quota đều dừng trước khi gọi model; Google trả 429 thì báo hết hạn mức/tốc độ và dừng. Không lưu token, câu hỏi hay lời giải AI vào database/localStorage; kết quả chỉ giữ trong bộ nhớ phiên học để hiển thị lại cho người học đó.

Kiểm tra `npm test`: kiểm tra quyền, quota, hiển thị an toàn và adapter Google SDK bằng phản hồi giả lập. Chỉ xác nhận AI trả lời thật sau khi key Free Tier được cấu hình và một yêu cầu live thành công.
