# Chính sách filesystem

Nguồn đầy đủ: [PLAN.md, mục 5.9](PLAN.md#59-tệp-không-đuôi-tệp-ẩn-shortcut-và-mục-kỹ-thuật). Nội dung dưới đây là yêu cầu cần implement/test, chưa phải hành vi đã tồn tại.

## Ba trạng thái phạm vi

- **Được quản lý:** tài liệu và thư mục công việc có UUID, mã hoàn chỉnh duy nhất và quy tắc tên.
- **Loại trừ kỹ thuật:** giữ tên gốc/phụ thuộc cần thiết, không cấp mã, không lỗi chỉ vì thiếu mã; có cấu hình/phạm vi/lý do rõ.
- **Chưa xác định:** yêu cầu lựa chọn quản lý hoặc loại trừ, không tự sửa trước khi biết đúng đối tượng.

Root không mang mã của mục con. Metadata HFolder nằm ngoài root. Không hiển thị, không quản lý và không có quyền là ba tình trạng khác nhau.

## Các đối tượng cần nhận diện

| Đối tượng | Yêu cầu |
|---|---|
| Không có đuôi | Không tự thêm đuôi; nhận dạng nội dung chỉ gợi ý; cấp mã nếu là mục công việc |
| Dotfile | Không mặc định loại trừ tất cả; xét tên/vai trò/chính sách cụ thể |
| Hidden | Giữ thuộc tính khi có thể; mục vẫn được đối soát/kiểm tra mã dù đang ẩn trong view |
| System/metadata | Ví dụ desktop.ini, Thumbs.db: không tự chuẩn hóa hoặc rename làm hỏng chức năng |
| .git | Loại trừ cây metadata Git, không tác động cấu trúc/nội dung bên trong |
| .lnk | Quản lý shortcut, giữ đuôi; mở target khi double click, không sửa/move target vì sửa shortcut |
| .url | Mở link bằng handler sau hành động người dùng, không tự tải |
| Symlink/junction/reparse point | Không theo target khi scan/copy đệ quy; không quét ra ngoài root hoặc tạo vòng lặp; hành động ghi chỉ bật sau khi đã kiểm chứng |

Mở liên kết không được tự chạy trong scan, watcher, preview hoặc AI. Thay đổi đích shortcut chỉ cảnh báo các liên kết đã biết, không hứa tìm/sửa mọi shortcut trên máy.

Move một thư mục phải bảo toàn các metadata cần thiết bên trong; không tự bỏ tệp loại trừ khi copy cả thư mục. Không dùng logic xóa đệ quy theo target của một liên kết. Đổi phạm vi cần preview và đối soát registry mã/baseline.

## Thử nghiệm trước khi dùng dữ liệu công việc

- Unicode, không đuôi, nhiều dấu chấm, trailing spaces/dots, reserved names, tên chỉ khác hoa/thường.
- Hidden/system và trạng thái hiển thị so với phạm vi quản lý.
- Shortcut tuyệt đối/tương đối, đích đổi tên/di chuyển, liên kết hỏng.
- Symlink/junction vào root, ra root, vòng lặp, quyền hạn khác nhau.
- Move cùng/khác volume, file đang khóa, đầy đĩa, source thay thế, không có quyền xóa nguồn.
- Không làm thay đổi file đích khi quản lý shortcut/liên kết.

Chỉ dùng fixture tổng hợp trong thư mục thử nghiệm. Chưa thực hiện những thử nghiệm này ở bước tạo repository.
