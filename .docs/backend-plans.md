# Backend Plans & Progress

## Mục tiêu
- Cung cấp API dữ liệu mặt nạ Tuồng (danh sách, chi tiết).
- Quản lý database SQLite (`masks.db`).

## Tiến độ
- **Ngày 27/04/2026**:
  - Đã khởi tạo cấu trúc FastAPI cơ bản (`main.py`).
  - Đã setup script tạo database và seed dữ liệu mẫu (`init_db.py`) gồm 11 mặt nạ thật (thêm mặt nạ "Ác Ba") và 1 mặt nạ placeholder (tổng cộng 12 mặt nạ).
  - Phục vụ API tại `/api/masks` trả về danh sách `id`, `name`, `category`, `image_url`.
  - Phục vụ ảnh tĩnh tại `/static/images/`.

## Việc cần làm (To-Do)
- [ ] Cập nhật API để trả về thêm trường `description` và `stats` (hiện tại frontend đang mock dữ liệu này).
- [ ] Xử lý ảnh thật thay thế cho placeholder.png.
