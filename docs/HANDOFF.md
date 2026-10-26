# Bàn giao phát triển HFolder

Đã được người dùng cho phép bắt đầu implement ngày 26/10/2026, sử dụng skill UI/UX Pro Max để thiết kế và review giao diện. Không tiếp tục áp dụng trạng thái “chờ skill trước scaffold” của lần khởi tạo trước.

Đã có source Next.js static export, Tauri 2/Rust, SQLite, lockfiles, kiểm thử và ứng dụng Windows. [STATUS.md](STATUS.md) ghi phạm vi thật và kiểm chứng; [PLAN.md](PLAN.md) giữ yêu cầu tổng thể.

Chưa publish, push, tạo commit/remote hoặc đăng ký menu Explorer. Chưa chọn license. Không có dữ liệu công việc/secret trong source; filesystem tests dùng dữ liệu tổng hợp. Không thử lên cây Joyworld.

Đã có rename/đổi mã cha, preview, journal/recovery và đối soát chuẩn hóa hàng loạt ở 0.2.0. Công việc tiếp theo: cấu hình danh mục bổ sung sau setup, đối soát mục mất/di chuyển ngoài app, import/move và watcher; mở rộng undo/recovery và fault injection theo từng loại operation. Không bật thao tác destructive chỉ vì UI đã hoàn thành.

Updater có dependency/plugin, cấu hình rỗng để chạy được khi chưa phát hành. Chưa có endpoint, khóa xác minh, CI ký artifact hoặc chức năng cập nhật hoạt động. Bundle identifier phát triển cần chốt trước release. Single-instance hiện focus cửa sổ, chưa hoàn thành external-open routing.

Tệp `.gitkeep` còn lại chỉ là chỗ dành cho giai đoạn tiếp theo. Không mô tả thư mục rỗng là module đã implement.
