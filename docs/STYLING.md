# Tailwind CSS — quy ước styling HFolder

Đã tích hợp Tailwind CSS 4.3.3, @tailwindcss/postcss 4.3.3 và PostCSS 8.5.31. Dùng CSS-first của v4, không cần tailwind.config.js hoặc CDN. Prettier dùng prettier-plugin-tailwindcss 0.8.1 để tự sắp xếp utility classes.

## Tổ chức

- `postcss.config.mjs`: plugin @tailwindcss/postcss cho Next.js.
- `src/styles/globals.css`: entry, thứ tự layer theme → base → components → utilities; chỉ quét utility trong src, không quét skill pack.
- `src/styles/tokens.css`: màu runtime hiện có; data-theme=dark giữ hành vi cũ.
- `src/styles/tailwind-theme.css`: @theme/@theme inline ánh xạ semantic colors, font, radius và spacing; custom dark variant theo data-theme.
- `src/styles/base.css`: reset/typography/form controls ở layer base. Cố ý không import Preflight trong lần migration này để giữ native controls, heading/list margins và font desktop 14px.
- `src/styles/components.css`: variant dùng chung, @apply, selector tương tác/phần tử con, breakpoint và animation. Utility đặt trong className có ưu tiên cao hơn layer components.

Các file CSS riêng dùng @reference để biết theme khi Next/Turbopack xử lý từng file. @reference chỉ cung cấp thông tin compiler, không chèn lại reset.

## Viết UI

Ưu tiên utility trực tiếp trong className cho bố cục và styling mới; dùng semantic colors thay vì lặp màu hex:

```tsx
<div className="flex items-center gap-3 rounded-panel bg-surface p-4 text-foreground">
  <span className="text-muted">Thông tin mục</span>
  <button className="rounded-control bg-primary px-4 py-2 text-on-primary hover:bg-primary-hover">
    Áp dụng
  </button>
</div>
```

Đây là ví dụ style; trong component sản phẩm, label/aria-label vẫn lấy từ i18n.

- Spacing unit cố định 4px: p-4 = 16px, gap-3 = 12px, không lệ thuộc root font 14px. Giữ kích thước pixel chính xác cho UI desktop khi migrate; không thay bằng text-sm nếu làm đổi typography.
- `bg-surface`, `bg-chrome`, `bg-sidebar`, `text-foreground`, `text-muted`, `border-border`, `text-warning`... tự theo theme. dark: có thể dùng khi cần thay đổi ngoài token.
- Không tạo class bằng nội suy một phần như bg-${color}; dùng map chứa class hoàn chỉnh để Tailwind phát hiện được.
- Giữ class marker có ý nghĩa cho state/selector khi cần. Các variant dùng chung như button.primary vẫn hợp lệ và được viết bằng @apply.
- CSS thuần chỉ giữ cho selector/phép tính/animation hoặc chi tiết đặc thù khi rõ ràng hơn utility. Style tính từ dữ liệu như vị trí virtual row/context menu vẫn dùng inline style.
- Không đổi bảng màu để phục vụ migration. Giữ focus-visible, reduced motion, nhãn icon, bàn phím và breakpoints 900×640.

## Kiểm tra

```powershell
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Nếu đã có live preview chạy trong cùng checkout, có thể dùng nó cho Playwright để tránh Next dev lock:

```powershell
$env:HFOLDER_E2E_URL = 'http://127.0.0.1:1420'
pnpm test:e2e
```

Biến này chỉ dùng khi biết URL thuộc HFolder của checkout đang kiểm tra. Bỏ biến để Playwright tự khởi động cổng 3427 như cũ.

Trong lượt migration đã chuyển 819 declarations sang utility/@apply và đưa utility vào 20 nhóm class TSX. Ba ảnh kiểm tra workspace sáng/tối và preview đối soát giống baseline từng pixel; 4 Playwright, 4 unit test, typecheck và static build đạt. Không thay đổi Rust/filesystem và không rebuild executable desktop trong lượt chuyển styling; dùng pnpm desktop để xem live hoặc pnpm desktop:build để nhúng UI mới vào executable.

Nguồn: [Tailwind + Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [Theme variables](https://tailwindcss.com/docs/theme), [Preflight tùy chọn](https://tailwindcss.com/docs/preflight#disabling-preflight).
