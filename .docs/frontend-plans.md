# Frontend Plans & Progress

## Mục tiêu
- Xây dựng SPA (Single Page Application) bằng React (Vite) + Tailwind CSS 4 + Framer Motion.
- Hiển thị danh sách mặt nạ dưới dạng Grid và List với trải nghiệm tương tác cao cấp (Awwwards-winning level).

## Tiến độ
- **Ngày 27/04/2026**: Hoàn thiện UI cốt lõi & Tái cấu trúc codebase.
  - Xây dựng thành công hệ thống View (Grid/List) và Stats Modal với đầy đủ Framer Motion animations.
  - Tích hợp mock data để giả lập thông tin chi tiết (`description`, `stats`).
  - **Custom Cursor**: Phát triển hiệu ứng con trỏ chuột dạng "Tracking Point" (hồng tâm camera) với Framer Motion `spring` physics.
  - **UI/UX Tweaks**: Phóng to ảnh (1.5x) ở Grid, List và Modal để làm nổi bật mặt nạ. Lược bỏ các chi tiết thừa (như vòng tròn nền trong Modal, tech labels rườm rà) để UI Clean hơn.
  - **Refactor**: Cấu trúc lại toàn bộ `App.jsx`, tách thành các component độc lập (`layout/` và `gallery/`) giúp dễ dàng bảo trì.

## Việc cần làm (To-Do)
- [ ] Kết nối API backend khi backend đã sẵn sàng các trường dữ liệu `description` và `stats`.
- [ ] Tối ưu hóa responsive cho mobile và tablet (đặc biệt là List View và Modal).
- [ ] Xử lý lỗi load ảnh (hiện tại fallback về placeholder).
