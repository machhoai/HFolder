# HFolder

Ứng dụng desktop quản lý cây thư mục và tệp theo dự án: chuẩn hóa tên, mã phân cấp duy nhất, phân loại tùy biến và đối soát thay đổi ngoài ứng dụng.

**Trạng thái: bản phát triển 0.2.0, đã bắt đầu implement.** Đã có giao diện desktop, tạo thư mục, đối soát chuẩn hóa hàng loạt và đổi tên/mã theo cây con qua Rust/SQLite, kèm preview và recovery. Chưa phải bản hoàn chỉnh để quản lý dữ liệu công việc. Xem [tiến độ thực tế](docs/STATUS.md); các mục trong kế hoạch không đồng nghĩa đã được implement.

## Chạy dự án trên Windows

Yêu cầu Node.js 22, pnpm 11, Rust stable, MSVC Build Tools và WebView2. Phiên bản cụ thể được khóa trong `pnpm-lock.yaml` và `src-tauri/Cargo.lock`.

```powershell
pnpm install --frozen-lockfile
pnpm desktop
```

`pnpm desktop` chạy app ở chế độ phát triển: sửa/lưu React, CSS hoặc bản dịch sẽ cập nhật UI qua Next.js Fast Refresh; sửa Rust sẽ tự biên dịch và khởi động lại app. Đóng bản executable đang chạy trước để plugin single-instance không chuyển sang cửa sổ bản build cũ. Giữ terminal mở; nhấn Ctrl+C để dừng.

`pnpm dev` chạy UI trình duyệt tại `http://127.0.0.1:1420`, không có quyền làm việc với filesystem. Cổng 1420 dành riêng cho HFolder; CSP phát triển cho phép kết nối WebSocket phục vụ hot reload. `pnpm desktop:build` build ứng dụng Windows không tạo installer; executable ở `src-tauri/target/release/hfolder.exe` dùng tài nguyên đã build và không tự cập nhật khi sửa source.

```powershell
pnpm typecheck
pnpm test
pnpm test:e2e
cargo test --manifest-path src-tauri/Cargo.toml --lib
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Kiểm thử Playwright dùng cổng riêng 3427 và IPC giả lập để kiểm tra UI; kiểm thử Rust dùng filesystem và SQLite thật trong thư mục tạm. Không xem test trình duyệt là bằng chứng về IPC native.

## Stack đã chốt

- Tauri 2 + Rust.
- Next.js + React + TypeScript, static export cho desktop.
- SQLite cục bộ.
- Tauri updater với artifact ký xác thực.
- Tiếng Việt mặc định; kiến trúc i18n để thêm ngôn ngữ sau.

Dependency đã được khóa. UI dùng Tailwind CSS v4 + CSS theme tokens, Phosphor và i18n React tương thích static export. Bundle identifier `app.hfolder.desktop` là giá trị phát triển, cần chốt trước phát hành; chưa chọn giấy phép. Không có remote GitHub; chủ dự án sẽ publish sau.

## Styling bằng Tailwind

Tailwind CSS v4 dùng PostCSS và cấu hình CSS-first. Sửa giao diện bằng utility class trong TSX; màu semantic như `bg-surface`, `text-muted`, `bg-primary` lấy từ cùng bảng màu sáng/tối. Các variant dùng chung (button, dialog, menu...) dùng `@apply` trong layer components. Xem [quy ước styling](docs/STYLING.md).

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [Kế hoạch đầy đủ](docs/PLAN.md) | Nguồn kế hoạch chính thức, phiên bản 2.9 |
| [Cấu trúc dự án](docs/STRUCTURE.md) | Cây thư mục, trách nhiệm và hướng phụ thuộc giữa các tầng |
| [Quyết định đã chốt](docs/DECISIONS.md) | Các yêu cầu quan trọng và thay đổi thay thế quy tắc cũ |
| [Lộ trình triển khai](docs/IMPLEMENTATION.md) | Mốc nghiệm thu và nguyên mẫu đầu tiên sau khi nhận quy định |
| [Chính sách filesystem](docs/FILESYSTEM_POLICY.md) | Tệp không đuôi, tệp ẩn, metadata kỹ thuật, shortcut và liên kết |
| [i18n](docs/I18N.md) | Nguyên tắc bản địa hóa và tiếng Việt mặc định |
| [Bàn giao](docs/HANDOFF.md) | Đã tạo gì, chưa thực hiện gì, việc tiếp theo |
| [Skill đã cài](docs/SKILLS.md) | UI/UX Pro Max project-local qua uipro |

## Quy tắc sản phẩm cốt lõi

- Một tab làm việc với một cây dự án; mỗi dự án có cấu hình riêng.
- Mã hiển thị mặc định `03.01.001`, số chữ số và cách hiển thị tùy chỉnh trong setup.
- Mã hoàn chỉnh duy nhất trong phạm vi mục được quản lý của một dự án, dùng chung tệp/thư mục.
- Đổi mã cha tính lại mã hậu duệ bằng kế hoạch có preview/journal.
- Loại, nhóm và nhãn được để trống; thêm sau trong Cài đặt. Setup vẫn cần xác nhận cấu hình hợp lệ.
- Mục kỹ thuật có ngoại lệ hiển thị rõ; không tự đổi tên mọi tệp trên ổ đĩa.
- Thay đổi ngoài app phải đối soát; việc sửa tên và metadata hàng loạt dùng một bảng chung.
- AI là giai đoạn sau khi sản phẩm chính hoàn thành và ổn định, không phải điều kiện dùng app.

Tên Joyworld và các cây trong tài liệu là ví dụ tùy chọn, không phải danh mục nghiệp vụ bắt buộc.

## Dữ liệu trong repository

Repository chứa source, lockfiles, kiểm thử và tài liệu phát triển HFolder. Tài liệu/tệp công việc, nhật ký di chuyển, CSV đường dẫn và script hoàn tác cho Joyworld không thuộc source code HFolder. Khi phát triển sẽ dùng fixture tổng hợp trong thư mục thử nghiệm; không thử thao tác ghi trực tiếp lên dữ liệu công việc.

Không có LICENSE được chọn ở bước này. Trước khi publish cần chủ dự án quyết định giấy phép phù hợp.
