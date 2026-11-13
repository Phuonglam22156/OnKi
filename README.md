# Ônki

Website ôn DBS401 bằng tiếng Việt: 9 bộ đề, 429 câu, flashcard, kiểm tra nhiều đáp án, chấm điểm và tiến độ cá nhân. Có 426 câu chấm tự động theo chữ in đậm trong nguồn. Ba câu chưa đánh dấu đáp án được giữ để xem, không chấm tự động.

## Học từng câu

Mở bộ đề để học từng câu với phản hồi ngay khi chọn: đúng hiện xanh, sai hiện đỏ và đáp án chuẩn. Câu nhiều đáp án báo đúng/sai từng lựa chọn, hoàn thành khi chọn đủ hoặc chọn sai. Tiến độ ghi nhớ được cập nhật một lần mỗi câu; buổi học không làm thay đổi lịch sử điểm kiểm tra. Cuối buổi có thể học lại riêng các câu sai.

## Triển khai trên Vercel

1. Import repository này vào Vercel. Chọn Framework: Other. Build command và output directory đã có trong `vercel.json`.
2. Tạo dự án Supabase riêng và chạy `supabase/schema.sql` trong SQL Editor.
3. Trong Vercel → Environment Variables, thêm `SUPABASE_URL` và `SUPABASE_PUBLISHABLE_KEY` (publishable hoặc legacy anon key). Không dùng secret/service_role key.
4. Trong Supabase → Authentication → URL Configuration, đặt Site URL là URL production Vercel và thêm cùng URL này vào Redirect URLs. Bật email/password, xác nhận email và mật khẩu tối thiểu 8 ký tự. Cấu hình SMTP của bạn nếu cần gửi mail cho cả lớp; dịch vụ gửi mail thử nghiệm có giới hạn.
5. Redeploy trên Vercel, tạo hai tài khoản thử và kiểm tra dữ liệu riêng biệt. Cấu hình production và preview ở các Supabase project khác nhau nếu cần tách dữ liệu.

Nếu thiếu biến Supabase, website vẫn cho học ở chế độ khách và thông báo đăng nhập chưa được bật. Đây không phải tài khoản giả. Chế độ khách chỉ lưu trên trình duyệt.

## Chạy máy cá nhân

Node.js 22 trở lên, không cần cài thêm package. Đặt biến môi trường theo `.env.example` rồi chạy `node scripts/serve.cjs`. Script không tự đọc `.env`; có thể chạy `node --env-file=.env scripts/serve.cjs`.

`node scripts/build.cjs` tạo `public/config.js` từ các biến publishable. Supabase JS 2.119.0 được lưu tại `public/vendor/`, có kèm giấy phép MIT. Không có token GitHub/Vercel hay secret database trong nguồn.

## Tài khoản và dữ liệu

Supabase Auth quản lý email, mật khẩu, xác nhận email, phiên đăng nhập và khôi phục mật khẩu. Row Level Security chỉ cho người dùng đọc/ghi hàng của chính họ. Dữ liệu được lưu tách theo user ID trên máy và trong database. Khách không tự động được nhập vào tài khoản. Không tải dữ liệu người trước vào tài khoản người sau trên máy dùng chung.

Ghi đám mây có kiểm tra revision để tránh ghi đè âm thầm khi nhiều thiết bị sửa cùng lúc. Khi có xung đột, bản trên máy được giữ; người dùng có thể tải bản đám mây để tiếp tục. Điểm ôn tập do trình duyệt tính, dùng cho tự học, không phải hệ thống thi có giám sát.

## Đề nguồn

Các DOCX do chủ repository cung cấp nằm trong `public/sources/`. Giữ nguyên nội dung và đáp án được đánh dấu trong đề, chưa thẩm định lại chuyên môn.
