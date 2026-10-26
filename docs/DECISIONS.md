# Quyết định sản phẩm HFolder

Cập nhật 26/10/2026, theo kế hoạch 2.9. Đây là bản tóm tắt; chi tiết tại [PLAN.md](PLAN.md).

## Nền tảng và phạm vi

1. Tên HFolder, repository cục bộ `D:\Github\HFolder`; chủ dự án tự publish lên GitHub sau.
2. Windows trước, offline, Tauri 2/Rust + Next.js/React/TypeScript export tĩnh + SQLite.
3. Updater có chữ ký, không cài giữa thao tác filesystem; giữ dữ liệu, draft và phiên làm việc.
4. Một app instance, nhiều tab dự án; root trùng chuyển tab đã có, không tạo dự án ghi có root lồng nhau.
5. UI tiếng Việt mặc định, i18n từ đầu; thêm ngôn ngữ không phải sửa nghiệp vụ.

## Setup và danh mục

6. Người dùng thiết kế cấu trúc, kéo mẫu tùy chọn hoặc tiếp nhận cây có sẵn.
7. Setup phải xác nhận root, cấu trúc, quy tắc mã/tên, phạm vi và preview trước sử dụng.
8. **Loại/nhóm/nhãn được để trống và bổ sung sau.** Quyết định này thay thế yêu cầu cũ tối thiểu một giá trị mỗi danh mục; không chặn dự án vì danh mục trống.
9. Cho sao chép cấu hình dự án đã tạo, bản sao độc lập; không sao chép file, UUID, lịch sử, path tuyệt đối hoặc counter của dữ liệu nguồn.
10. Kéo thả, điền sẵn, kế thừa và hàng loạt giảm nhập thủ công; vẫn có thao tác bàn phím tương đương.

## Mã và tên

11. Mặc định dấu chấm giữa segment, ví dụ `03.01.001`. Width từng cấp và kiểu hiển thị có thể đổi trong setup.
12. Mã hoàn chỉnh duy nhất cho một tệp HOẶC thư mục được quản lý trong một dự án; phần segment cuối có thể lặp dưới cha khác vì mã đầy đủ khác nhau.
13. Định danh UUID tách khỏi mã và path. Đổi mã cha cập nhật mọi hậu duệ; đổi width là migration có preview.
14. Không tự đánh lại số do sort/xóa; có thao tác chủ động đổi số với kiểm tra xung đột.
15. Chuẩn hóa phần mô tả, có bỏ dấu và `_`; bảo toàn đuôi tệp, không đổi định dạng bằng đổi đuôi.

## Tương tác

16. Tabs; breadcrumb/copy path và tìm kiếm; toolbar; cây trái và danh sách con bên phải.
17. Double click mở thư mục hoặc tệp bằng ứng dụng liên kết; context menu riêng bên trong HFolder.
18. Ctrl/Shift/Ctrl+Shift/Ctrl+A/chọn vùng; drag move/copy với đích và modifier rõ; vùng gán metadata không phải vùng move.
19. New: tạo hồ sơ/thư mục, nhập path cục bộ mặc định move, tải URL sau khi chốt tên/metadata/đích. Downloader là nâng cấp ưu tiên sau luồng cốt lõi.
20. Explorer có Open in HFolder, routing qua instance hiện tại; root mới vẫn setup, file ngoài dự án mở preview import. Menu Windows 11 hiện đại cần tích hợp riêng.

## Đối soát và an toàn dữ liệu

21. Đối soát khi mở dự án, khi watcher phát hiện thay đổi hoặc mất sự kiện; khóa ghi thông thường đến khi sửa đạt.
22. Badge tại mục và ancestor đếm mục duy nhất; thông báo dẫn đúng mục hoặc danh sách lỗi.
23. Bảng chung: giữ tên/đổi tên/chuẩn hóa và phân loại; áp dụng phần hợp lệ độc lập, tôn trọng dependency cha/con và mã trùng.
24. Mục kỹ thuật được loại trừ giữ tên cố định, không có mã và không báo thiếu mã; hidden không đồng nghĩa loại trừ. [Chính sách chi tiết](FILESYSTEM_POLICY.md).
25. Không ghi đè, merge hoặc xóa nguồn âm thầm. Move khác volume xác minh đích trước xóa nguồn; undo có điều kiện, mọi thay đổi có journal.

## AI và trạng thái triển khai

26. AI đề xuất tên và phân loại theo danh mục có sẵn; model không cấp mã hoặc tự ý ghi dữ liệu.
27. AI chỉ triển khai sau khi HFolder hoàn thành và ổn định P0/P1; local/LAN/cloud và model quyết định bằng đánh giá thực tế sau.
28. **Hiện đã khởi tạo repository, tài liệu và cây thư mục.** Chờ skill/quy định; chưa scaffold, cài dependency, tạo workflow build, đăng ký Explorer hoặc triển khai tính năng.
29. Single repository: Next.js ở gốc, frontend theo feature, backend Rust phân tầng trong src-tauri. Chi tiết [STRUCTURE.md](STRUCTURE.md); các thư mục đang có placeholder, không phải mã chạy.
