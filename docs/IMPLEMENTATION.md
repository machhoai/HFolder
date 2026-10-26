# Lộ trình implement và cổng nghiệm thu

**Đã bắt đầu implement theo yêu cầu ngày 26/10/2026.** Bản 0.1.0 hoàn thành lát cắt setup/tạo thư mục; 0.2.0 bổ sung đổi tên/mã theo cây con, đối soát chuẩn hóa hàng loạt, preview và recovery. Xem [STATUS.md](STATUS.md) để phân biệt chức năng đã có và phần còn lại. Bảng giai đoạn bên dưới vẫn là lộ trình đầy đủ, không phải bảng đã hoàn thành.

## Mốc đầu tiên sau khi nhận quy định

1. Đọc hướng dẫn áp dụng; chốt cách tổ chức repo, package manager, thư viện UI/i18n và version tương thích.
2. Scaffold Tauri 2 + Next.js static export + TypeScript, chạy một bản cài/build thực trên Windows.
3. Lập fixture tách dữ liệu công việc, kiểm chứng quy tắc filesystem đặc biệt.
4. Hoàn thành một luồng: setup → xác nhận cấu hình (danh mục trống hợp lệ) → tạo thư mục có mã mặc định → lưu DB → mở lại giữ dữ liệu.
5. Kiểm tra mã duy nhất trong backend; không coi mock UI là đã hoàn thành nghiệp vụ.

## Các giai đoạn

| Mốc | Sản phẩm kiểm chứng được |
|---|---|
| 0 | Chốt đặc tả kỹ thuật theo hướng dẫn; Windows build, filesystem, i18n, nhận diện phạm vi và migration plan khả thi |
| 1 | Khung nhiều dự án/tab, cây/list, breadcrumb, session và external-open routing |
| 2 | Setup tùy biến/copy cấu hình, naming/numbering, registry, đổi mã dây chuyền, danh mục tùy chọn và kế thừa |
| 3 | Chọn/drag, menu riêng, open file, import/move, tìm/lọc/nhóm, đối soát tên + metadata, badges, journal/undo |
| 4 | Beta Windows, installer/updater có chữ ký, legacy Explorer menu, migration/recovery, kiểm thử end-to-end |
| 5 | Nâng cấp đã chốt: downloader URL ưu tiên, view cột, mẫu hồ sơ, clipboard Explorer, export/import cấu hình hoàn chỉnh, Windows 11 menu hiện đại |
| 6 | AI/OCR sau khi P0/P1 hoàn thành và ổn định; đánh giá tài liệu thật trước chọn model/provider |

Mốc 1–4 là phạm vi bản đầu; không chờ AI để phát hành. Chi tiết thứ tự và điều kiện tại [PLAN.md](PLAN.md), mục 9–10.

## Cần chốt đúng thời điểm

- Trước scaffold: skill/quy định, cấu trúc repo, dependency phù hợp static export, UI/i18n.
- Trước bản phát hành: license, bundle identifier ổn định, repository/host update, chính sách key ký/CI secrets và installer.
- Trước dữ liệu công việc: filesystem fixtures, xung đột/mã trùng, fault injection move/rename, backup/restore, đối soát ngoài app đạt.
- Trước AI: đánh giá local/LAN/cloud, quyền gửi dữ liệu, model/license và chất lượng tiếng Việt trên máy văn phòng.

Các mục chưa chốt không được tự suy thành người dùng yêu cầu thêm cloud, tài khoản bắt buộc hoặc dịch vụ AI có phí.
