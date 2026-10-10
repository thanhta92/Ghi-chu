# HƯỚNG DẪN KÍCH HOẠT WEB PUSH SERVER CHO IPHONE (APPLE APNs) & ANDROID

Hệ thống Web Push Server này giúp **iPhone (iOS 16.4+)** và các thiết bị di động nhận được thông báo reo chuông báo thức **kể cả khi ứng dụng bị tắt hoàn toàn hoặc điện thoại đang khóa màn hình**.

---

## 1. Cách Chạy Thử Trên Máy Tính (Local Server)

1. Mở cửa sổ dòng lệnh tại thư mục `server`:
   ```bash
   cd server
   npm install
   npm start
   ```
2. Máy chủ sẽ chạy tại `http://localhost:3000`.
3. Mở ứng dụng NOTES trên trình duyệt, vào menu **"Đồng bộ Apple Push (APNs)"** để bật thông báo và bấm nút **"Gửi Thử Thông Báo Đẩy"**.

---

## 2. Triển Khai Lên Cloud Miễn Phí 24/7 (Khuyên Dùng Cho iPhone)

> 💡 **Tại sao nên đưa lên Cloud?**  
> Khi đưa lên Cloud (như Render, Vercel hoặc Glitch), máy chủ sẽ hoạt động online 24/7. Bạn có thể **tắt máy tính đi ngủ**, iPhone của bạn vẫn sẽ nhận được thông báo đẩy báo thức chính xác từng phút từ Apple APNs!

### Cách 1: Triển khai miễn phí lên Render.com (Khuyên Dùng - Có Cron Chạy Ngầm 24/7)
1. Đăng ký tài khoản miễn phí tại [render.com](https://render.com).
2. Tạo mới một **Web Service**.
3. Kết nối với kho mã nguồn GitHub của bạn (thư mục `server`).
4. Cấu hình:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Render sẽ cấp cho bạn một đường dẫn HTTPS (ví dụ: `https://my-notes-push.onrender.com`).
6. Dán đường dẫn này vào mục **"Cấu hình Server Push"** trong ứng dụng NOTES trên iPhone là xong!

### Cách 2: Triển khai lên Vercel
1. Cài đặt Vercel CLI hoặc đẩy lên GitHub rồi import vào [vercel.com](https://vercel.com).
2. Tệp `vercel.json` đã được chuẩn bị sẵn, Vercel sẽ tự động cấu hình API endpoints.

---

## 3. Cách Cài Đặt Trên iPhone (iOS 16.4 Trở Lên)

1. Mở Safari trên iPhone, truy cập vào đường link website của bạn (phải có `https://`).
2. Bấm vào nút **Chia sẻ (Share)** ở thanh công cụ Safari (hình ô vuông có mũi tên chỉ lên).
3. Cuộn xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Mở ứng dụng NOTES từ Màn hình chính (lúc này nó hoạt động như 1 App độc lập).
5. Bấm vào nút **"Bật Thông Báo Đẩy iPhone"** và chọn **Cho phép (Allow)**.
6. Lên lịch hẹn bất kỳ có báo thức. Thử khóa màn hình iPhone lại để tận hưởng thông báo đẩy đánh thức tự động!
