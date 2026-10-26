# Skill đã cài cho HFolder

## UI/UX Pro Max

- Ngày cài: 26/10/2026.
- Theo yêu cầu người dùng: `uipro init --ai codex`.
- CLI đang có trên máy: `ui-ux-pro-max-cli` 2.15.0; không cài thêm CLI toàn cục trong bước này.
- Phạm vi: project-local trong `.agents/skills/`, không cài vào thư mục skill toàn cục.
- Skill UI chính: [ui-ux-pro-max](../.agents/skills/ui-ux-pro-max/SKILL.md).
- Nguồn upstream: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

Lệnh cài tạo bộ skill đi kèm: ui-ux-pro-max, ui-styling, design-system, design, brand, banner-design và slides. Các file do CLI cung cấp được giữ trong repo để mang theo khi publish. Chỉ áp dụng skill đúng phạm vi công việc; cài gói không đồng nghĩa phải dùng các skill banner/slides trong app.

Khi thiết kế, xây dựng hoặc review UI HFolder, đọc skill UI chính và các hướng dẫn dự án được người dùng cung cấp. Yêu cầu sản phẩm HFolder và chỉ dẫn người dùng ưu tiên hơn ví dụ mặc định cho website/landing page trong bộ skill. Stack vẫn là Tauri + Next.js, tiếng Việt/i18n, desktop explorer và bảng đối soát; không tự chuyển sản phẩm thành trang web marketing.

## Kiểm tra đã thực hiện

- `uipro init --ai codex` kết thúc thành công.
- Có SKILL.md và data/scripts của skill UI chính tại đường dẫn project-local.
- `python -B .agents/skills/ui-ux-pro-max/scripts/search.py --help` chạy được; dùng `python` trên Windows.
- Chưa tạo design system, chưa sửa giao diện, chưa scaffold hoặc cài dependency ứng dụng trong lượt cài skill.

Skill mới có thể được nhận diện từ lượt làm việc tiếp theo trong dự án. Nếu chưa thấy, mở lại chat/phiên Codex gắn với HFolder để nạp danh mục skill.

## Áp dụng trong lượt implement đầu

Đã đọc ui-ux-pro-max và dùng search.py cho design system, data-dense desktop style, keyboard/focus UX và Next.js stack. Chọn bố cục explorer trung tính, xanh dương cho hành động, vàng cho folder, Segoe UI/system font offline. Không dùng kết quả marketing mặc định làm bố cục app. Checklist review ở [UI_REVIEW.md](UI_REVIEW.md).

Next.js 16 tự sinh AGENTS.md khi `next dev`; đây là hướng dẫn do dependency tạo, không phải quy tắc nghiệp vụ tự đặt. Đã đọc hướng dẫn static exports và server/client components đi kèm bản Next được cài.
