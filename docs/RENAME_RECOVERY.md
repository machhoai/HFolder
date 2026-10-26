# Đổi tên, mã và phục hồi — 0.2.0

## Luồng người dùng

Chọn một hoặc nhiều mục → chuột phải Giữ tên và chuẩn hóa / Đổi tên, hoặc F2 → chỉnh mô tả và segment cuối nếu cần → gán loại/nhãn tùy chọn → xem toàn bộ preview → áp dụng. Mọi tệp/thư mục dùng chung không gian mã trong dự án. Chọn folder đưa các hậu duệ được quản lý vào preview; mục kỹ thuật đi theo folder, không bị đổi basename hoặc cấp mã.

Giữ tên nghĩa là giữ mô tả làm đầu vào chuẩn hóa, không có nghĩa giữ nguyên tên sai chuẩn trên đĩa. Mô tả không chứa đuôi; backend giữ đuôi thật, kể cả shortcut .lnk/.url. Không mở nội dung hoặc sửa target shortcut.

## Các biên kiểm soát

- Preview lưu plan phía Rust, UI chỉ apply bằng opaque id; sửa payload phía UI không thay plan đã duyệt. Kiểm tra selected IDs thuộc project, taxonomy IDs và phạm vi path.
- Tính mã/path theo thứ tự cha trước con; các step I/O chạy con trước cha. Tối đa 500 mục mỗi plan. Có thể đổi case bằng hai bước qua tên tạm UUID.
- Từ chối mã đích đã được mục khác giữ và tên đích đang tồn tại; chưa hỗ trợ swap hai tên đang chiếm chỗ. Không tự tăng width khi tràn mã.
- Apply so sánh snapshot đã duyệt với scan mới và kiểm tra Windows volume/file index. Đây không phải hash nội dung; chỉnh sửa giữ nguyên metadata trên cùng file object có thể không bị nhận ra.
- MoveFileExW không dùng REPLACE_EXISTING. Không dùng fs::rename có khả năng overwrite cho operation production.
- Ghi journal running/inflight trước I/O; sau I/O lưu progress. Sau toàn bộ I/O, cập nhật registry, unique code, counters và completed trong cùng SQL transaction. UUID không thay đổi.

## Khi bị gián đoạn

Running journal khiến scan thường và thao tác ghi bị khóa; tránh tạo UUID mới cho các đường dẫn tạm. UI có nút phục hồi về trạng thái trước thao tác. Phục hồi kiểm tra identity và đảo thứ tự steps, có thể tiếp tục nếu lần phục hồi trước cũng bị gián đoạn. Nếu source bị tệp ngoài chiếm, destination mất hoặc identity khác, trả RECOVERY_CONFLICT và giữ nguyên các tệp để người dùng kiểm tra. Không tự xóa hoặc ghi đè để ép phục hồi.

Đây là rollback operation chưa hoàn tất; **chưa phải Undo cho operation đã completed**. File hệ thống hoặc DB có lỗi I/O kéo dài có thể cần can thiệp thủ công. Root/network file identity, ACL, long path, lock/antivirus và external race cần được mở rộng kiểm thử trước beta.

## Kiểm thử

Rust dùng thư mục tạm và SQLite thật: normalize cây, giữ nội dung/ext/metadata kỹ thuật, code cascade/UUID qua reopen, stale preview, mã trùng, no-overwrite, case-only, dừng sau một bước rồi reopen/recover, crash window trước ghi progress, xung đột source và SQL failure sau I/O. UI Playwright dùng IPC double cho multi-select, metadata, preview, stale/error focus và recovery gate. Native smoke ghi trong UI_REVIEW.md.
