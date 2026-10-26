# Cấu trúc repository HFolder

Ngày chốt: 26/10/2026. Trạng thái: đã có Next.js/Tauri và mã chạy ở mốc nền tảng. Cây dưới đây gồm cả vùng mở rộng dự kiến; thư mục trống chưa phải chức năng. Setup và settings hiện là dialog trong workspace, chưa phải route riêng. File `.gitkeep` giữ các thư mục trống trong Git, có thể bỏ khi thư mục có nội dung thực.

## Kiến trúc

Một repository, một Next.js frontend tại gốc và một Tauri/Rust backend trong `src-tauri`. Frontend tổ chức theo tính năng; Rust dùng các tầng command, application, domain và infrastructure trong một crate ban đầu. Không chia monorepo nhiều package/crate khi chưa có nhu cầu.

```text
HFolder/
├── src/
│   ├── app/
│   │   ├── (workspace)/          # Shell workspace, tabs và explorer
│   │   ├── setup/                # Trang setup dự án
│   │   └── settings/             # Trang cài đặt
│   ├── features/
│   │   ├── projects/             # Dự án, setup, tabs, copy cấu hình
│   │   ├── explorer/             # Tree/list, breadcrumb, selection, sort/view
│   │   ├── classification/       # Loại, nhóm, nhãn, rules, gán hàng loạt
│   │   ├── reconciliation/       # Badge, cảnh báo, bảng đối soát
│   │   ├── transfers/            # Import/move/copy, task center, downloader sau
│   │   ├── settings/             # Cài đặt app và tích hợp Windows
│   │   └── updates/              # UI cập nhật ứng dụng
│   ├── components/
│   │   ├── ui/                   # Button, dialog, menu, input dùng chung
│   │   └── layout/               # Shell và các vùng bố cục dùng chung
│   ├── lib/
│   │   └── tauri/                # Một lớp gọi invoke/event/channel có kiểu
│   ├── contracts/                # DTO, event payload, error code phía frontend
│   ├── i18n/
│   │   └── messages/
│   │       └── vi-VN/            # Catalog tiếng Việt theo namespace
│   └── styles/                   # Theme, token, CSS toàn cục
├── public/
│   ├── images/                   # Asset tĩnh UI
│   └── fonts/                    # Font local nếu dùng, kèm license phù hợp
├── src-tauri/
│   ├── src/
│   │   ├── commands/             # Biên IPC: validate request, gọi application
│   │   ├── application/          # Use cases, điều phối operation và transaction
│   │   ├── domain/
│   │   │   ├── projects/         # Mô hình dự án, setup và trạng thái hợp lệ
│   │   │   ├── naming/           # Chuẩn hóa, segment, width, mã duy nhất
│   │   │   ├── classification/   # Taxonomy, rules, inheritance
│   │   │   └── operations/       # Plan rename/move, dependency và điều kiện undo
│   │   ├── infrastructure/
│   │   │   ├── filesystem/       # I/O, watcher, path guard, tệp đặc biệt
│   │   │   ├── persistence/      # SQLite repositories, registry, journal
│   │   │   ├── windows/          # Opener, Recycle Bin, Explorer, activation
│   │   │   └── updater/          # Adapter updater, kiểm tra điểm cài an toàn
│   │   └── error/                # Error code + parameters, mapping biên IPC
│   ├── migrations/               # Migration SQLite versioned
│   ├── capabilities/             # Quyền Tauri theo window/WebView
│   ├── icons/                    # Icon bundle/installer ứng dụng
│   ├── windows/                  # Installer hooks và tài nguyên đóng gói Windows
│   └── tests/                    # Rust integration tests trên filesystem tạm
├── tests/
│   ├── unit/                     # Unit tests frontend
│   ├── integration/              # Frontend/contract integration tests
│   ├── e2e/                      # Luồng xuyên UI ↔ Tauri ↔ dữ liệu
│   └── fixtures/                 # Chỉ dữ liệu tổng hợp, không tài liệu công việc
├── scripts/                      # Script phát triển/kiểm tra/phát hành khi cần
├── .github/
│   └── workflows/                # CI sau khi chốt skill và quy trình
├── docs/                         # Kế hoạch, quyết định, kiến trúc và bàn giao
├── README.md
├── .editorconfig
├── .gitattributes
└── .gitignore
```

## Quy tắc phụ thuộc

Frontend: `app` lắp ghép các màn hình từ `features`. Tính năng dùng `components`, `contracts`, `i18n` và lớp `lib/tauri`. Không đặt toàn bộ nghiệp vụ vào route hoặc một thư mục components khổng lồ. Chỉ tách thư mục con trong từng feature khi có mã thật, không tạo trước hàng trăm chỗ trống.

Backend: `commands → application → domain`. Application khai báo các port/interface cho filesystem/persistence; infrastructure cung cấp adapter và được wiring ở điểm khởi tạo Tauri. Domain không phụ thuộc UI, Tauri hoặc SQLite, để kiểm thử quy tắc mã/plan riêng. Operation engine là đường duy nhất ghi dữ liệu dự án, kể cả gọi từ drag/drop, menu, đối soát hoặc Explorer.

Mọi command phải kiểm tra project_id, setup/đối soát, scope và plan version tại backend. Capability không thay thế kiểm tra từng dự án. Clipboard, preview hoặc frontend không trực tiếp có quyền ghi path tùy ý.

Contracts ban đầu có thể viết DTO thủ công nhưng phải có kiểm chứng tương thích với Rust; chọn code generation sau khi có quy định/tooling, không duy trì hai bộ schema mâu thuẫn. Một lớp IPC dùng chung giúp thay đổi API ở một chỗ.

## Next.js và i18n

`app/(workspace)` là route group: dấu ngoặc không tạo segment URL. Các route tĩnh dùng cho shell/setup/settings; root dự án, tab và path filesystem là state runtime, không phải một route Next.js cho mỗi thư mục trên ổ đĩa.

Catalog `vi-VN` tổ chức theo namespace, ví dụ common, workspace, setup, naming, classification, reconciliation, operations, updates. Chưa tạo JSON rỗng giả hoặc khóa thư viện i18n trước khi nhận hướng dẫn. Không dịch tên/path/metadata người dùng khi đổi locale.

## Những file sẽ tạo khi scaffold sau

- Gốc: package.json, lockfile, next.config.*, tsconfig.json và cấu hình test/lint đã chọn.
- Frontend: app/layout.tsx, page.tsx của các route, provider và style theo thiết kế.
- Tauri: Cargo.toml/Cargo.lock, build.rs, tauri.conf.json, src/main.rs/src/lib.rs và capability cụ thể.
- CI: workflow build/test/release có chữ ký updater sau khi chốt host và secrets.

Các file này CHƯA được tạo. Tree hiện tại không phải ứng dụng chạy được. Không tự thêm AI engine/model hoặc thư mục node_modules/.next/target vào source; AI chỉ thêm sau P0/P1, build output do tool tạo và đã được ignore.
