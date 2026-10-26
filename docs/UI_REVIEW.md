# UI/UX review — mốc nền tảng

Đã áp dụng skill project-local `ui-ux-pro-max` theo yêu cầu người dùng, và đối chiếu React Best Practices. Review ngày 26/10/2026.

## Quyết định giao diện

- Explorer desktop: tabs → breadcrumb/search → toolbar → cây, danh sách và panel chi tiết; bề mặt trung tính, xanh cho hành động, vàng folder, màu cảnh báo kèm icon/nội dung.
- Font hệ thống offline, Phosphor nhất quán, CSS semantic tokens cho cả sáng/tối. Không có font/API bên ngoài khi khởi động.
- Setup chia 4 bước và có màn xác nhận; loại/nhãn optional; copy cấu hình cũ thay nhập lại. Preview tên thật do backend trả về.
- Focus-visible, skip link, label/aria cho input và icon button, dialog native có Escape/focus containment, context menu có mũi tên/Escape; reduced motion.
- List virtualize, đường dẫn dài có ellipsis/title và panel chi tiết. Loading/disabled và lỗi IPC hiện trong UI. Chưa có kiểm định screen reader đầy đủ hoặc chứng nhận WCAG.

## Đã xem và thử

- Screenshots sáng/tối 1380×900 từ Playwright dùng IPC double. Không đưa fixture đó vào UI production.
- Kiểm tra 900×640: không tràn ngang toàn trang, toolbar chính còn hiển thị; panel chi tiết thu gọn theo breakpoint.
- Playwright kiểm tra setup, optional catalogs, tên chuẩn hóa, selection/menu Escape, đổi locale/theme và persistence.
- Native release chạy với `http://tauri.localhost/`, giao diện nhúng; không phụ thuộc Next dev server.
- Native smoke: chọn root `.local-test/native-workspace` qua dialog Windows → danh mục rỗng → xác nhận → nhập `Hồ sơ thanh toán` → preview và tạo `01 Ho_so_thanh_toan` → filesystem và SQLite cùng xác nhận; journal `create/completed`.
- Đóng app, thêm tệp tổng hợp ngoài app trong thư mục vừa tạo, mở lại: project/tab tự phục hồi, badge root/cha = 1, tab có cảnh báo, nút Mới bị khóa. Bấm banner mở được danh sách chứa tệp cần xử lý. Không thay đổi cây Joyworld.

## Sửa sau review

Đã dịch tên lỗi đối soát, bỏ role row ngoài grid, tránh reset phiên khi đổi ngôn ngữ, quét lại khi đổi tab, bổ sung path guard ở root reparse, tách cổng Playwright và bật feature custom-protocol rõ ràng cho build desktop.

## Việc còn lại

Thông báo nhảy tới và chọn đúng tệp, focus quay lại sau context menu, screen reader active descendant trong list ảo, taxonomy settings và drag/drop/rectangle selection cần hoàn thiện cùng nghiệp vụ. Grid chưa virtualize. Chưa chạy đầy đủ Windows scaling, high contrast, shortcut/ACL/network/long path matrix. Updater chưa hoạt động; không có nút kiểm tra giả hoặc endpoint giả.

## Review 0.2.0

Dùng ui-ux-pro-max domain UX “error summary validation”: lỗi được announce, summary focus sau lỗi submit, không chỉ dựa màu hoặc toast. Dialog chuẩn hóa chia chỉnh sửa → review rõ ràng; nút apply chỉ xuất hiện sau preview. Bảng đường dẫn wrap để đọc toàn bộ, có tổng số mục và metadata, hỗ trợ 900×640, giữ light/dark tokens hiện có. Playwright xác nhận stale error nhận focus, quay lại tạo preview mới, chọn nhiều và gán metadata; recovery khóa Mới và có hành động cụ thể. Screenshot HFolder-repair-preview.png dùng IPC fixture, không phải dữ liệu công việc.

Native smoke 0.2.0 trên `.local-test/native-workspace`: mở tệp tổng hợp `hoa don thu.txt`, chuẩn hóa thành `01.01 hoa_don_thu.txt`, kiểm tra nội dung không đổi; tiếp tục đổi mã cha 01→03, preview gồm folder và file, apply tạo `03 Ho_so_thanh_toan/03.01 hoa_don_thu.txt`. SQLite ghi đúng mã và cả hai journal completed, badge được gỡ. Phát hiện lỗi focus F2 sau click trong native, đã sửa focus listbox và bổ sung kiểm thử F2 trên mục hợp lệ (Playwright đạt).

Bản Windows cuối đã build và khởi động lại thành công, phục hồi tab cùng folder mã 03 sau migration. Kiểm tra F2 có bằng chứng Playwright; chưa xác nhận lại F2 trên native sau bản sửa cuối do helper phát hiện người dùng đang thao tác trong cửa sổ, nên dừng automation để tránh can thiệp.

## Migration Tailwind CSS v4

Đã dùng ui-ux-pro-max stack html-tailwind “theme tokens custom styles” và checklist focus, contrast, keyboard, reduced motion. Chuyển semantic colors sang @theme inline, utility trực tiếp và shared variants @apply. Giữ reset hiện tại, không thêm Preflight làm lệch giao diện. So sánh ba ảnh trước/sau bằng pixel diff: workspace sáng, workspace tối, preview đối soát đều giống hệt baseline. Các kiểm thử selection, F2, modal, i18n, theme, stale preview và recovery vẫn đạt; không coi ba ảnh này là kiểm chứng mọi trạng thái ứng dụng.
