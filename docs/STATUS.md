# Trạng thái triển khai — 0.2.0 development

Ngày: 26/10/2026. Đã hoàn thành thêm lát cắt đổi tên/đổi mã và đối soát. Chưa phải toàn bộ P0/P1 trong PLAN.md.

## Đã có

- Next.js static export + Tauri 2/Rust; frontend không có server Node khi chạy desktop. Build đóng gói dùng feature `custom-protocol` để nhúng tài nguyên local.
- Setup bốn bước, chọn thư mục bằng dialog native, cấu hình độ dài mã theo cấp, danh mục loại/nhãn có thể rỗng, copy cấu hình từ dự án cũ.
- Nhiều dự án và tabs; nhớ tab/path/query, cây thư mục, breadcrumb, copy path, tìm theo tên/path/mã không dấu, sort tên/ngày và filter loại đã gán.
- List được virtualize, grid, Ctrl/Shift/Ctrl+A và điều hướng bằng bàn phím, context menu riêng, mở tệp bằng double click/Enter qua ứng dụng mặc định.
- Tạo thư mục thật: preview backend, bỏ dấu tiếng Việt, `_`, cấp mã theo cha, bộ đếm không tái sử dụng số đã cấp; SQLite unique index cho mã số dùng chung tệp/thư mục.
- SQLite ngoài project root, lưu UUID, cấu hình, baseline, counter và journal tạo thư mục. Không tự đổi tên cây hiện có khi setup.
- Scan khi mở/đổi tab, focus lại cửa sổ và F5. Phát hiện thiếu mã, sai cha/width/tên, mã trùng, mục mới/mất và nội dung đổi qua size/mtime. Badge ở cha, banner mở danh sách lỗi, chặn tạo thư mục khi chưa đối soát.
- Xác nhận hàng loạt các mục có tên/mã đã hợp lệ; không cho xác nhận bỏ qua lỗi mã. Tên chưa chuẩn dùng dialog chuẩn hóa/đổi tên ở mốc 0.2.0.
- Tệp ẩn vẫn tham gia kiểm tra; loại trừ có giới hạn cho `.git`, desktop.ini, Thumbs.db và metadata hệ thống. Không theo reparse/symlink. Tên không đuôi được giữ không đuôi; không tự đọc nội dung hay suy diễn PDF/Word.
- UI tiếng Việt, English, theme sáng/tối lưu cục bộ; font hệ thống và asset local, không cần tải font ngoài.


## Bổ sung ở 0.2.0

- Chuột phải → **Giữ tên và chuẩn hóa** hoặc **Đổi tên / mã…**, phím F2 cho mục đã chọn; dùng được cả mục hợp lệ và mục cần đối soát.
- Dialog cho sửa mô tả, nhập segment cuối tùy chọn, giữ metadata riêng từng mục hoặc áp dụng loại/nhãn cho các mục đã chọn. Phần mở rộng giữ nguyên; tên nhập không chứa phần mở rộng.
- Bảng preview hiển thị toàn bộ đường dẫn cũ/mới và metadata, gồm hậu duệ khi chọn thư mục. Preview chưa đổi tệp hay giữ chỗ mã.
- Cấp mã cho tên chưa chuẩn, sửa mã trùng được chọn, giữ số hợp lệ khi có thể, đổi mã cha cập nhật hậu duệ; UUID giữ nguyên.
- Apply kiểm tra lại snapshot và filesystem identity; từ chối preview cũ, mã trùng, target đã có. Windows MoveFileExW không bật replace-existing.
- Rename theo thứ tự con trước cha, journal ghi inflight/progress trước/sau từng bước; case-only rename đi qua tên tạm. Registry và bộ đếm cập nhật trong một SQL transaction.
- Khi lỗi, tự thử rollback rename; nếu gián đoạn hoặc có xung đột, UI khóa ghi và có nút phục hồi. Không tự quét/nhận baseline mới trong lúc journal đang running.
- SQLite schema v2 nâng cấp additive từ v1; giữ dữ liệu cũ, bật foreign keys khi mở, từ chối DB thuộc phiên bản tương lai.
- Tối đa 500 mục bị ảnh hưởng mỗi preview, toàn cây vẫn giới hạn scan 20.000 mục. Chọn thư mục đồng nghĩa chuẩn hóa cả cây con; metadata hàng loạt chỉ gán cho các mục được chọn rõ ràng, hậu duệ giữ metadata hiện có.

## Chưa hoàn thành

- Thay đổi cấu hình độ dài/định dạng mã sau setup, hoán đổi tên đích đang bị chiếm và undo cho thao tác đã hoàn tất. Recovery gián đoạn đã có cho rename/normalize; chưa bao phủ create/import/move.
- Thêm/sửa danh mục sau setup, nhóm/phân loại tùy biến đầy đủ, mẫu kéo thả và kế thừa metadata. Bản đầu chỉ có loại và nhãn trong setup/tạo thư mục.
- Import/copy/cut/move, kéo thả và quét chọn vùng, clipboard hệ thống, download URL.
- Wizard đối soát mục đã mất/di chuyển ngoài app, chính sách loại trừ tùy chỉnh, nhấp thông báo nhảy tới và chọn chính xác mục; hiện banner mở danh sách lỗi.
- Watcher thời gian thực/background scan, hash nội dung, tìm toàn văn, search/sort theo toàn bộ taxonomy, virtualize grid, kiểm chứng giới hạn lớn.
- Installer phát hành, signed updater hoạt động, Explorer menu và external-open routing. Plugin single-instance hiện chỉ focus cửa sổ; updater chưa có endpoint/khóa công khai.
- AI/OCR theo giai đoạn sau; không có kết nối AI hay dịch vụ ngoài.

## Styling

Đã chuyển sang Tailwind CSS v4 + PostCSS, theme tokens sáng/tối và Prettier class sorting. Shared styles dùng @apply, layout TSX dùng utility; CSS đặc thù còn lại theo layer để bảo toàn giao diện. Quy ước ở [STYLING.md](STYLING.md).

## Kiểm chứng

- `pnpm typecheck`: đạt.
- `pnpm test`: 4 unit tests đạt (selection, Vietnamese search, badge propagation).
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`: 17 tests đạt; tạo/nested naming, SQLite mở lại thật, mã dùng chung, external change khóa ghi, technical exclusion, extensionless và numeric identity.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: đạt.
- Playwright: 4 luồng UI đạt với IPC contract double; không thay thế test Tauri IPC native.
- Next static build và executable Windows đã build. Kết quả native smoke test và review UI ghi riêng ở UI_REVIEW.md.

## Giới hạn cần giữ rõ

Scan tối đa 20.000 mục/64 cấp, hiện chạy trong tác vụ IPC tuần tự dưới mutex. Không có benchmark cho cây lớn. Size/mtime không phát hiện mọi sửa đổi có chủ ý giữ metadata. Path guard hạn chế traversal/reparse nhưng chưa giải quyết toàn bộ race filesystem do tiến trình khác; di chuyển/import chưa được bật. Rename hỗ trợ cây con và journal, nhưng chưa có bảo đảm chống mọi thay đổi đồng thời do tiến trình khác. Nếu tạo thư mục thành công nhưng lưu DB lỗi, mục có thể cần đối soát; journal chưa có UI recovery.

Chỉ thử với thư mục tổng hợp hoặc bản sao cho đến khi bộ rename/move/recovery và filesystem matrix đầy đủ đạt nghiệm thu. Các fixture ẩn/shortcut/ACL/UNC/long path/network lock chưa được chứng minh toàn diện.
