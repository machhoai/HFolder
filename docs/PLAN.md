# HFolder — Kế hoạch ứng dụng Tauri quản lý cấu trúc và đặt tên thư mục

Ngày lập và cập nhật: 26/10/2026. Phiên bản đặc tả: 2.9. Tên ứng dụng: HFolder. Repository cục bộ: D:\Github\HFolder. Đã tạo cây thư mục theo tính năng ở Next.js và phân tầng Rust trong một repository; xem docs/STRUCTURE.md. Chưa scaffold/cài dependency/implement, chờ skill/quy định. Các quyết định tiếng Việt/i18n, mã mặc định 03.01.001, danh mục tùy chọn, filesystem, updater và AI sau P0/P1 giữ nguyên.

## 1. Mục tiêu và phạm vi

Xây dựng ứng dụng desktop giúp người dùng thiết lập, duy trì và sử dụng nhiều cây thư mục công việc. Giá trị chính là tạo đúng nơi, cấp đúng mã và đặt đúng tên với ít thao tác. Joyworld chỉ là mẫu minh họa tùy chọn; không có tên nghiệp vụ, số cấp hoặc tên tệp cố định bắt buộc người dùng tuân theo. Người dùng tự đặt tên, thiết kế cây mới hoặc chọn cây đã có để chuẩn hóa.

Ưu tiên Windows, hoạt động offline, sử dụng thư mục thật trên ổ đĩa. Mỗi dự án có một thư mục gốc và bộ quy tắc riêng; mỗi tab làm việc với một dự án. Tệp vẫn mở được bằng File Explorer và phần mềm mặc định khi không chạy app. Giao diện mặc định tiếng Việt, mọi chuỗi UI đi qua i18n để thêm ngôn ngữ sau; mã hiển thị mặc định dùng các segment có dấu chấm, ví dụ 03.01.001, và người dùng được thay đổi trong setup.

Bản đầu có: thiết lập dự án mới, mở và chuẩn hóa cây đã có, nhiều tab, duyệt cây, cấp mã duy nhất cho tệp/thư mục trong dự án, cấu hình số chữ số mỗi cấp, đổi mã cha cập nhật toàn bộ con cháu, chuẩn hóa tên, đổi tên có xem trước, mở tệp bằng double click, context menu riêng của app, tìm theo tên, copy/cut/paste/move, nhật ký thao tác và hoàn tác có điều kiện. Khi phát hiện thay đổi ngoài app, dự án phải được đối soát và sửa lỗi trước khi tiếp tục ghi dữ liệu.

Bản đầu bổ sung cấu hình loại tài liệu, nhóm phân loại, nhãn và bộ quy tắc gợi ý tên; thư viện mẫu hệ thống tùy chọn, áp dụng mẫu bằng kéo thả, phân loại hàng loạt và lọc/nhóm kết quả theo metadata. Không bắt người dùng nhập lại metadata ở mỗi lần tạo hoặc đưa tệp vào.

Phát triển sau: xem dạng cột, mẫu bộ hồ sơ có nội dung/tệp mẫu, preview tài liệu, chỉ mục nội dung. Chuẩn hóa cây cũ, đánh số hàng loạt và sửa mã dây chuyền là yêu cầu cốt lõi của bản đầu. Đồng bộ đám mây, cộng tác nhiều người, AI/OCR và ứng dụng mobile nằm ngoài phạm vi bản đầu.

AI/OCR được chấp thuận là phần mở rộng có kế hoạch, nhưng chỉ triển khai sau khi các chức năng sản phẩm đã chốt thuộc P0/P1 hoàn thành và được nghiệm thu ổn định. HFolder phải sử dụng đầy đủ được khi không cài model, không có key/tài khoản AI và không có mạng. Không đưa lựa chọn model hay kiến trúc AI thành điều kiện phải giải quyết trước khi xây các chức năng chính.

Chức năng nâng cao đã xác định: New → Tải từ liên kết, dùng cấu hình phân loại và đặt tên trước khi tải. New → Nhập từ đường dẫn máy dùng chung màn hình thông tin nhưng mặc định DI CHUYỂN tệp nguồn vào dự án. Import đường dẫn cục bộ thuộc bản đầu; downloader mạng là phần mở rộng ưu tiên đầu tiên, có thể phát hành cùng bản đầu nếu nguồn lực đáp ứng.

## 2. Khái niệm chính

| Khái niệm | Ý nghĩa |
|---|---|
| Dự án | Thư mục gốc, tên hiển thị, cấu hình đánh số và đặt tên |
| Tab | Trạng thái duyệt của một dự án; đóng tab không xóa dự án hoặc dữ liệu |
| Nhóm | Nhánh phân loại, ví dụ Tài chính hoặc Hồ sơ thanh toán |
| Hồ sơ | Thư mục chứa một công việc/giao dịch cụ thể |
| Mẫu cấu trúc | Bộ nhóm được tạo lại khi thiết lập dự án |
| Mẫu hồ sơ | Các mục con tạo kèm một hồ sơ mới, triển khai sau |
| Mục được quản lý | Tệp hoặc thư mục thuộc cây dự án, được cấp mã và định danh nội bộ |
| Mã nghiệp vụ | Mã theo cấp, người dùng được sửa; duy nhất cho một mục hiện hữu trong toàn dự án |
| Định danh nội bộ | UUID ổn định, không thay đổi khi đổi tên, mã hoặc vị trí |
| Quy tắc mã | Số chữ số mỗi cấp, ký tự tách cấp, điểm bắt đầu và cách hiển thị |
| Loại tài liệu | Thuộc tính chính do dự án định nghĩa, ví dụ Hợp đồng, Hóa đơn; có thể áp dụng cho tệp hoặc loại hồ sơ thư mục được cấu hình |
| Nhóm phân loại | Danh mục/nhóm logic tùy chọn, ví dụ Tài chính hoặc Nhân sự; không đồng nghĩa thư mục vật lý |
| Nhãn | Thuộc tính nhiều giá trị, ví dụ Nhà cung cấp A, Tên miền; không phải tên tệp |
| Trạng thái phân loại | Chưa phân loại, Có gợi ý hoặc Đã xác nhận; trạng thái hệ thống, không bắt người dùng gõ |
| Bộ mẫu phân loại | Các loại/nhóm/nhãn và quy tắc tùy chọn để kéo vào cấu hình dự án |

Mặc định quản lý các tệp/thư mục công việc bên dưới root, sau khi áp dụng chính sách loại trừ kỹ thuật ở mục 5.9. Root không nhận mã của mục con; dữ liệu nội bộ app nằm ngoài cây. Phân biệt Mục được quản lý, Mục kỹ thuật được loại trừ và Mục chưa xác định. Mã hoàn chỉnh duy nhất áp dụng cho các mục được quản lý, không ép đổi tên tệp hệ thống để mang mã. Loại trừ phải hiển thị rõ, lưu cấu hình và phiên bản; không có ngoại lệ âm thầm. Cây đang tiếp nhận có thể tạm thiếu mã nhưng chưa chuyển sang trạng thái sẵn sàng ghi.

Tên có dấu là dữ liệu hiển thị tùy chọn; tên vật lý là tên trên ổ đĩa. Có thể hiển thị “Thanh toán tên miền tháng 10”, đồng thời lưu thư mục “03.01.001 Thanh_toan_ten_mien_thang_10”. Luôn cho xem/copy tên vật lý để tránh nhầm. Thay ngôn ngữ UI không dịch tên tệp, tên danh mục người dùng hoặc thay đổi mã.

## 3. Thiết lập dự án và nhiều tab

### 3.1. Màn hình bắt đầu

Hiển thị dự án gần đây và ba hành động: Tạo cấu trúc mới, Mở thư mục đã có, Nhập mẫu cấu trúc. Không yêu cầu tạo tài khoản.

### 3.2. Tạo cấu trúc mới

1. Chọn thư mục gốc, nhập tên dự án hiển thị. Nếu thư mục đã có dữ liệu, chuyển sang luồng tiếp nhận cây hiện có.
2. Tự thiết kế cây trống hoặc kéo mẫu Joyworld/mẫu đã lưu từ thư viện vào vùng cấu trúc dự án. Mẫu chỉ là điểm bắt đầu, có thể gỡ hoặc sửa mọi tên; không buộc dùng mẫu.
3. Nhập/sửa cây bằng Thêm nhóm, Thêm nhóm con, tự đặt tên và số, đổi thứ tự và xóa mục chưa áp dụng. Không giới hạn vào các phòng ban hoặc nhóm của Joyworld. Có thể dán danh sách nhiều dòng trong giai đoạn sau.
4. Chọn số chữ số mỗi cấp, ký tự tách cấp, điểm bắt đầu; tên không dấu/có dấu, kiểu chữ, ký tự phân cách phần tên. Xem trước mã, tên và đường dẫn thật ngay khi thay đổi.
5. App kiểm tra tên trùng, mã trùng, tên không hợp lệ và đường dẫn; hiển thị danh sách thư mục sẽ tạo.
6. Xem/xác nhận cấu hình loại/nhóm/nhãn, mặc định và chính sách bắt buộc/tùy chọn theo mục 3.5. Được để toàn bộ danh mục trống và bổ sung sau; không ép tạo loại/nhãn tượng trưng. Có thể kéo mẫu hệ thống, tự tạo hoặc sao chép cấu hình. Bước xác nhận setup vẫn bắt buộc nhưng danh mục rỗng không làm nút Hoàn tất bị khóa. Việc nhập danh mục không tự tạo thư mục vật lý.
7. Xem checklist đầy đủ và bản xem trước; bấm Hoàn tất thiết lập để áp dụng cấu trúc, xác minh rồi mới mở vùng làm việc. Nếu tạo một phần rồi lỗi, hiển thị chính xác mục thành công/thất bại, hỗ trợ tiếp tục; chỉ dọn thư mục vừa tạo nếu vẫn trống và người dùng chọn hoàn tác. Dự án chưa hoàn thành vẫn là bản nháp, không mở khóa sử dụng.

### 3.3. Tiếp nhận cây hiện có, bao gồm Joyworld

App quét toàn bộ cây; không đổi dữ liệu ngay khi vừa chọn root. Đọc các mã hiện có nếu giải được theo quy tắc đã chọn; trường hợp mơ hồ phải được người dùng xác nhận cách tách mã. Người dùng có thể giữ mã hợp lệ hoặc yêu cầu cấp lại cho toàn cây/nhánh.

Wizard cho chọn quy tắc mới, tên mới và mã mong muốn; hệ thống lập bảng trước/sau cho cả tệp và thư mục, giữ nguyên phần mở rộng tệp. Cấp lại mã cho cây cũ là một phần của quá trình tiếp nhận, không phải tính năng để sau. Các tên như Tài chính, RAW hoặc FRAME không mang ý nghĩa bắt buộc trong ứng dụng.

Mở cây đã có cũng phải hoàn tất cấu hình ban đầu theo mục 3.5; có thể sao chép cấu hình trước rồi kiểm tra khả năng áp dụng lên cây này. Việc root đã tồn tại không cho phép đi tắt qua bước thiết lập.

Trước khi áp dụng phải phát hiện mã trùng trên toàn dự án, mã sai cha, sai độ dài, tên trùng sau chuẩn hóa, thiếu mã và path không hợp lệ. Chỉ khi bản kế hoạch không còn xung đột người dùng mới bấm Áp dụng chuẩn hóa. Nếu hủy, dữ liệu cũ giữ nguyên và dự án chưa được đánh dấu sẵn sàng. Sau thực hiện phải quét xác minh lại toàn cây.

### 3.4. Hành vi tab

- Hàng tab có tên dự án, nút đóng và nút +. Có thể đổi thứ tự, ghim và mở lại tab đã đóng.
- Mỗi tab nhớ vị trí đang mở, lịch sử Back/Forward, cây đang mở rộng, mục chọn, từ tìm kiếm, sort, view và vị trí cuộn.
- Mở lại đúng thư mục gốc đang có tab sẽ chuyển tới tab đó; không đăng ký hai dự án độc lập cho cùng một root.
- Hai root lồng nhau được phát hiện. Bản đầu không cho đăng ký root lồng nhau thành hai dự án cùng quản lý ghi; đề nghị mở nhánh trong dự án hiện có.
- Khởi động lại khôi phục tab và chạy đối soát bắt buộc từng dự án trước khi bật thao tác ghi. Dự án không còn truy cập được hiển thị trạng thái mất kết nối và nút Chọn lại vị trí, không coi các mục là đã bị xóa.
- Đóng tab không hủy âm thầm tác vụ copy/move đang chạy; tác vụ tiếp tục trong danh sách tiến trình toàn app.

### 3.5. Cổng hoàn tất cấu hình bắt buộc

Dự án mới khởi đầu ở trạng thái Chưa hoàn tất cấu hình. Trước khi sử dụng phải xác nhận tên/root, cây ban đầu, quy tắc tên/mã, chính sách mục kỹ thuật/loại trừ và bản xem trước. Loại, nhóm phân loại và nhãn KHÔNG bắt buộc: cho để trống toàn bộ rồi bổ sung trong Cài đặt bất cứ lúc nào. Không yêu cầu tối thiểu một loại/nhóm/nhãn, không tự thêm giá trị giả. Không bắt màu/icon/mô tả hoặc rule tự động. Đây là quyết định mới thay thế yêu cầu danh mục tối thiểu của các bản trước.

Checklist luôn nêu mục còn thiếu và dẫn đến đúng vùng thiết lập. Nút Hoàn tất chỉ bật khi hợp lệ; backend kiểm tra lại, không chỉ dựa vào trạng thái nút. Không có Bỏ qua/Để sau để mở vùng làm việc. Có Lưu nháp và đóng; lần sau tiếp tục đúng bước cùng dữ liệu đã nhập. Hoàn tất cấu hình là yêu cầu ở cấp dự án, không có nghĩa mọi tệp bắt buộc gắn mọi nhãn; mức bắt buộc trên từng mục do chính sách dự án/nhánh quyết định.

Quy trình: Bản nháp cấu hình → Cấu hình hợp lệ → Áp dụng/chuẩn hóa cây → Đối soát xác minh → Sẵn sàng. Trong các bước đầu chỉ cho thao tác wizard, chỉnh cấu hình và xem trước; API duyệt/làm việc thông thường chưa được mở. Các lệnh thiết lập riêng chỉ được phép thực thi kế hoạch đã xác nhận. Lỗi hoặc hủy không tự đánh dấu hoàn thành; đóng/mở lại không bỏ qua cổng này. Dự án khác đã hoàn tất vẫn sử dụng được.

### 3.6. Sao chép cấu hình dự án đã tạo

Wizard có vùng Dự án đã có bên cạnh Thư viện hệ thống. Kéo thẻ cấu hình của một dự án đã hoàn tất vào dự án đang thiết lập để sao chép; có thao tác tương đương bằng bàn phím. Mặc định lấy toàn bộ cấu hình, cho gỡ các thành phần không cần trước khi xác nhận. Nguồn là phiên bản cấu hình hợp lệ đã lưu, không lấy bản chỉnh sửa dở dang.

Sao chép: cấu hình tên/mã và width; danh mục loại/nhóm/nhãn; bố cục cây mẫu nếu người dùng giữ thành phần này; quy tắc gợi ý; mặc định nhánh và chính sách trường; các mẫu cấu hình đã lưu. Không sao chép nội dung file, cây dữ liệu công việc phát sinh, UUID mục, mã đã cấp/counter thực tế, lịch sử, snapshot, tab state hoặc đường dẫn tuyệt đối của máy/dự án nguồn.

Tạo ID cấu hình mới thuộc dự án đích, ánh xạ lại mọi liên kết loại/nhóm/nhãn/quy tắc. Mặc định nhánh dùng node của mẫu hoặc đường dẫn tương đối để đề xuất ánh xạ; nhánh không tồn tại hoặc không tương thích phải được xử lý trước khi hoàn tất. Với root đã có, tính mốc cấp mã từ dữ liệu đích và bản chuẩn hóa được duyệt, không dùng mốc của nguồn.

Sao chép tạo một bản độc lập, không đồng bộ ngầm: sửa hoặc xóa cấu hình dự án nguồn không làm dự án đích đổi theo. Hiển thị xem trước thành phần được chép, xung đột và mục cần bổ sung. Chép vào bản nháp đã có cấu hình phải cho Hợp nhất/Thay thế/Hủy, không ghi đè âm thầm. Sau sao chép vẫn phải qua checklist và Hoàn tất thiết lập, không coi sao chép thành công là dự án đã sẵn sàng.

## 4. Giao diện và điều hướng

### 4.1. Bố cục đúng bốn vùng

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [Joyworld ×] [Dự án cá nhân ×] [+]                                    │
├──────────────────────────────────────────────────────────────────────┤
│ ← → ↑  Joyworld > 03_TAI_CHINH > 0301 Ho_so... [Copy] | Tìm dự án...  │
├──────────────────────────────────────────────────────────────────────┤
│ [+ Mới ▾] [Đổi tên] [Copy] [Cut] [Paste] [Move] | [Sort ▾] [View ▾] … │
├─────────────────────┬────────────────────────────────────────────────┤
│ CÂY THƯ MỤC         │ Hồ sơ thanh toán                      [+ Hồ sơ] │
│ ☆ Ghim / Gần đây    │ Mã       Tên                     Ngày sửa       │
│ ▾ 03 Tài chính      │ 0301.001 Thanh toán tên miền...   26/10/2026     │
│   ▸ 0301 Hồ sơ...   │ 0301.002 Mua email nhân viên...  26/10/2026     │
│   ▸ 0302 Hóa đơn    │                                                │
├─────────────────────┴────────────────────────────────────────────────┤
│ 2 mục · Đã cập nhật                             Tiến trình / Hoàn tác │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2. Hàng 1 — Tabs

Tên dự án ngắn, đường dẫn đầy đủ trong tooltip. Khi nhiều tab, dùng cuộn ngang và danh sách tab mở; không thu nhỏ đến mức không đọc được. Dấu trạng thái chỉ xuất hiện khi đang có tác vụ, lỗi hoặc mất kết nối.

### 4.3. Hàng 2 — Breadcrumb và tìm kiếm

- Breadcrumb bấm được từng cấp. Nút copy luôn sao chép đường dẫn tuyệt đối của thư mục đang mở; thao tác copy đường dẫn mục được chọn nằm trong menu chuột phải.
- Ctrl+L hoặc bấm vào vùng trống của breadcrumb chuyển sang nhập đường dẫn. Chỉ điều hướng trong root hiện tại; đường dẫn ngoài root được đề nghị mở thành dự án mới.
- Breadcrumb dài rút gọn phần giữa, giữ root và thư mục hiện tại; menu ... chứa các cấp bị ẩn.
- Ô tìm kiếm mặc định trong toàn dự án, có lựa chọn Chỉ thư mục hiện tại. Tìm không phân biệt dấu và hoa/thường; tìm được bằng mã, tên hiển thị hoặc tên vật lý.
- Có bộ lọc Loại, Nhóm phân loại, Nhãn và Trạng thái phân loại, lấy giá trị từ cấu hình dự án. Các điều kiện hiển thị dưới dạng chip có thể gỡ; kết hợp OR trong cùng trường và AND giữa các trường, nhóm nhãn cho chọn Khớp bất kỳ/Khớp tất cả. Lựa chọn Nhóm theo chỉ chia cách hiển thị kết quả; Sort chỉ sắp xếp, không phân loại lại hoặc di chuyển dữ liệu.
- Khi tìm tên một loại đã cấu hình, đề xuất chip rõ ràng như “Loại: Hợp đồng”; người dùng áp dụng bằng click/Enter, không âm thầm đổi ý nghĩa truy vấn văn bản. Khi chip này bật, tệp hd_abc.pdf đã được xác nhận là Hợp đồng vẫn xuất hiện dù tên không có chữ hop_dong.
- Kết quả hiển thị thư mục cha, loại, tên và mã. Thư mục mở trực tiếp; tệp mở bằng ứng dụng mặc định và có lệnh Đi tới thư mục chứa.
- Chỉ mục chưa xong vẫn dùng được app, có nhãn kết quả chưa đầy đủ và tiến trình. Không trộn kết quả giữa các tab.

### 4.4. Hàng 3 — Toolbar

| Công cụ | Hành vi |
|---|---|
| Mới / New | Menu gồm Thư mục/Hồ sơ mới, Tải từ liên kết, Nhập từ đường dẫn máy. Mặc định đích là vị trí ĐANG MỞ, cho đổi trước khi chạy; mọi mục được quản lý được cấp mã, mục kỹ thuật xử lý theo 5.9 |
| Đổi tên | F2 mở ô sửa tên; có thao tác riêng Đổi mã và cấu hình Độ dài mã. Đổi mã cha luôn cập nhật các hậu duệ |
| Copy / Cut / Paste | Hỗ trợ nhiều mục và chuyển giữa tab bằng clipboard nội bộ |
| Move | Mở hộp chọn đích có Gần đây, Ghim, cây đích và tìm kiếm |
| Sort | Mã, tên, loại, ngày sửa, kích thước tệp; chỉ đổi hiển thị |
| Phân loại / Lọc / Nhóm theo | Áp dụng metadata cho mục chọn, lọc hoặc nhóm danh sách theo loại/nhóm/nhãn; không tạo hay di chuyển thư mục |
| View | Danh sách chi tiết mặc định, lưới; dạng cột triển khai sau |
| Menu ... | Mở trong Explorer, copy đường dẫn, làm mới, lịch sử, cài đặt dự án, xóa vào Recycle Bin |

Nút không dùng được chuyển sang trạng thái vô hiệu hóa kèm giải thích. Hỗ trợ bàn phím và tooltip; không chỉ dùng icon không nhãn. Sort tăng/giảm có thể dùng độc lập với lựa chọn Thư mục trước.

### 4.5. Vùng chính — ít thao tác, ít nhầm đích

Mặc định cây bên trái chỉ hiển thị thư mục; danh sách bên phải hiển thị con trực tiếp của thư mục hiện tại. Bấm một dòng thư mục bên trái sẽ điều hướng ngay, bấm mũi tên chỉ mở rộng cây. Bên phải bấm một lần để chọn, Enter/nhấp đúp để mở, tránh xung đột giữa điều hướng và chọn nhiều mục.

Double click một tệp mở bằng ứng dụng mặc định đã liên kết trong Windows; double click thư mục điều hướng vào thư mục đó. Enter và mục Mở trong context menu có cùng hành vi. Nếu không có phần mềm liên kết, thiếu tệp hoặc thiếu quyền, app hiện lỗi dễ hiểu; không thực thi path bằng chuỗi lệnh shell. Lưu tài liệu từ phần mềm bên ngoài sẽ được phát hiện và đưa qua quy trình đối soát tương ứng ở mục 8.

Phân biệt rõ thư mục đang mở, mục đang chọn và vị trí tạo mới. Toolbar Mới luôn tạo ở thư mục đang mở; menu chuột phải Tạo bên trong tạo ở thư mục được nhấp phải và ghi rõ đích. Không âm thầm dùng mục được chọn làm đích.

Khi trống, hiển thị nút Tạo thư mục đầu tiên. Có Ghim và Gần đây ở sidebar; thu gọn sidebar được. Panel chi tiết là tùy chọn, không chiếm diện tích mặc định.

Phím tắt: Ctrl+T mở dự án, Ctrl+W đóng tab, Ctrl+Tab chuyển tab, Alt+Left/Right lùi/tiến, Alt+Up lên cha, Ctrl+L nhập path, Ctrl+F tìm, Ctrl+Shift+N tạo thư mục, F2 đổi tên, Ctrl+C/X/V copy/cut/paste, Ctrl+Z hoàn tác hợp lệ, F5 làm mới. Esc đóng tìm kiếm/dialog.

### 4.6. Context menu riêng của ứng dụng

Menu chuột phải do frontend của app dựng, không dùng menu mặc định của WebView hoặc context menu native của Tauri/Explorer. Chặn contextmenu mặc định trong vùng làm việc để không lộ Reload, Inspect hoặc menu duyệt web. Native dialog chọn thư mục và cơ chế mở tệp của Windows vẫn có thể dùng; yêu cầu này áp dụng cho menu chuột phải.

| Vị trí nhấp phải | Nội dung menu |
|---|---|
| Một tệp | Mở, Đổi tên, Đổi mã, Copy, Cut, Move, Copy đường dẫn, Mở thư mục chứa trong Explorer, Xóa vào Recycle Bin, Chi tiết |
| Một thư mục | Mở, Tạo bên trong, Đổi tên, Đổi mã nhánh, Copy, Cut, Move, Copy đường dẫn, Mở trong Explorer, Ghim, Xóa, Chi tiết |
| Nhiều mục | Copy, Cut, Move, Xóa; chỉ hiển thị hành động áp dụng được cho toàn bộ lựa chọn |
| Vùng trống | Mới, Paste, Sort, View, Làm mới, Cài đặt nhánh |
| Tab | Đóng, Đóng các tab khác, Ghim, Đổi tên hiển thị, Cài đặt dự án |

Nhấp phải mục chưa chọn sẽ chọn đúng mục đó; nhấp phải trong tập đang chọn giữ tập chọn. Menu có trạng thái vô hiệu hóa, phím tắt, điều hướng bàn phím, đóng bằng Esc/nhấp ra ngoài và không tràn khỏi cửa sổ. Ở trạng thái cần đối soát, các mục thay đổi dữ liệu bị khóa và có lối vào Sửa cấu trúc.

Context menu của tệp/thư mục bổ sung Phân loại, Gán nhãn và Áp dụng cấu hình thư mục; với nhiều mục có Phân loại hàng loạt. Những lệnh này dùng các giá trị đã cấu hình, không bắt nhập lại tên loại/nhãn.

Với mục cần đối soát, context menu có Giữ tên và chuẩn hóa…, Đổi tên và chuẩn hóa…, Thiết lập phân loại… và Xem thay đổi. Các lệnh mở cùng bảng đối soát ở mục 8.4 với chế độ khởi đầu khác nhau, không sửa dữ liệu ngay khi nhấp menu. Vẫn chọn nhiều mục và thao tác trong luồng sửa lỗi được dù dự án đang khóa các lệnh ghi thông thường.

### 4.7. UX kéo thả và hạn chế nhập liệu

Nhập bàn phím chủ yếu dành cho tên mới: tên dự án, thư mục/tệp cần đổi, loại, nhóm phân loại, nhãn, mẫu hoặc quy tắc do người dùng tự tạo. Dữ liệu có sẵn chọn/áp dụng bằng kéo thả, chip, nút nhanh và kế thừa; tên tệp import được lấy từ tệp nguồn để chuẩn hóa, không bắt gõ lại.

Trong Cài đặt, bố cục hai vùng: Thư viện mẫu hệ thống bên trái, Cấu hình dự án bên phải. Kéo một bộ mẫu hoặc từng loại/nhãn/nhóm sang vùng dự án để dùng; kéo sắp thứ tự hoặc kéo loại vào nhóm; gỡ mục để không dùng. Kéo mẫu cây vào trình thiết kế cây để áp dụng tại vị trí thả. Đây là thao tác mặc định khi dùng mẫu hệ thống, không phải chuỗi dropdown/checkbox.

Có khay Phân loại thu gọn được trong màn hình làm việc. Người dùng chọn một/nhiều mục, kéo chip loại hoặc nhãn lên tập chọn để gán; hoặc kéo mục lên vùng Gán loại/Gán nhãn. Vùng này ghi rõ “Chỉ phân loại, không di chuyển”. Kéo tệp lên thư mục thật là import/move theo quy tắc khác, có đường dẫn đích hiển thị rõ. Không dùng một điểm thả cho hai ý nghĩa.

Trong wizard tạo mới, tên được focus; mã, loại/nhóm/nhãn đã biết được điền sẵn và hiện bằng chip. Trường bổ sung nằm trong vùng mở rộng thay vì biểu mẫu dài. Với import hàng loạt, hiển thị bảng một lần và cho kéo cấu hình lên nhiều dòng cùng lúc; chỉ những dòng thiếu thông tin bắt buộc hoặc có xung đột mới cần xử lý.

Mỗi vùng thả có trạng thái hover, preview tác động, số mục bị ảnh hưởng và lý do nếu không hợp lệ. Gán thêm nhãn là phép hợp, không tạo nhãn trùng; kéo loại mới thay loại cũ chỉ khi có preview rõ. Có hoàn tác cho thay đổi metadata. Khi kéo vào nhiều mục, không để một số mục thất bại mà hiển thị như toàn bộ đã thành công.

Kéo thả là đường thao tác ưu tiên nhưng có phương án tương đương bằng bàn phím và nút “Thêm vào dự án/Áp dụng” cho người không thể kéo. Không bắt kéo đối với việc chọn root từ hệ điều hành, nhập tên hoặc giải quyết xung đột. Người dùng vẫn có thể click chip nhanh khi thuận tiện.

### 4.8. Chọn mục bằng chuột và bàn phím

| Thao tác | Kết quả |
|---|---|
| Click một mục | Chọn mục đó, bỏ tập chọn trước, đặt điểm neo |
| Ctrl + click | Thêm/bỏ riêng mục đó khỏi tập chọn, giữ các mục khác |
| Shift + click | Chọn dải từ điểm neo đến mục được bấm theo thứ tự danh sách đang hiển thị |
| Ctrl + Shift + click | Thêm dải vào tập chọn hiện có |
| Ctrl + A | Chọn toàn bộ kết quả trong phạm vi đang xem, không chỉ các dòng đang render |
| Kéo từ vùng trống | Vẽ vùng chọn trên danh sách/lưới; mục có vùng hiển thị giao nhau được chọn |
| Ctrl + kéo vùng | Thêm các mục nằm trong vùng vào tập chọn hiện có |
| Click vùng trống / Esc | Bỏ chọn; Esc ưu tiên hủy kéo/menu/dialog đang mở trước |

Kéo bắt đầu trên mục có thể drag là kéo tệp; kéo bắt đầu trên nền trống mới là chọn vùng. Có ngưỡng di chuyển để click không vô tình thành drag và double click không biến thành thao tác di chuyển. Vùng chọn auto-scroll khi chạm cạnh, dùng tọa độ nội dung để hoạt động cùng virtualization. Shift range/Ctrl+A xử lý toàn bộ tập dữ liệu tương ứng với bộ lọc, không chọn ngầm mục bị lọc khỏi danh sách. Khi dữ liệu phân trang chưa nạp đủ, backend phải hỗ trợ selection snapshot hoặc app thể hiện rõ giới hạn trước thao tác hàng loạt.

State gồm focused_id, anchor_id và selected_ids, tách khỏi trạng thái điều hướng. Lọc/đổi thư mục đặt lại phạm vi chọn; sort thay thứ tự và cập nhật điểm neo có kiểm soát, không đổi danh tính mục. Đối soát/refresh làm mục mất đi phải loại mục đó khỏi tập chọn. Kết quả tìm kiếm và bảng đối soát hỗ trợ chọn nhiều như danh sách chính; sidebar cây vẫn ưu tiên điều hướng một nhánh. Hiển thị số mục đã chọn và dùng cùng tập chọn cho context menu/toolbar.

### 4.9. Kéo thả để di chuyển tệp/thư mục

Kéo một mục đang thuộc tập chọn sẽ kéo toàn bộ tập; kéo mục chưa chọn sẽ chọn mục đó trước. Drag ghost hiển thị số mục, chế độ Move/Copy và đích. Đích hợp lệ gồm thư mục trong danh sách, node thư mục trong sidebar và cấp thư mục trong breadcrumb. Rê lên tab dự án khác sau một khoảng chờ ngắn chuyển tab để tiếp tục chọn đích; chỉ đổi tab chưa thực hiện move. Rê lên thư mục có thể mở rộng/đi vào sau khoảng chờ, có đường quay lại và hủy bằng Esc.

Mặc định drag nội bộ là Move, kể cả giữa dự án trong app; giữ Ctrl là Copy, giữ Shift là Move. Nếu nhấn đồng thời Ctrl+Shift thì không tạo shortcut ở bản đầu và hiển thị không hỗ trợ. Đổi modifier phải cập nhật nhãn trước khi thả. Kéo tệp từ ngoài vào mở luồng nhập ở mục 6.4 với nguồn/đích đã điền, không âm thầm xóa nguồn ngay khi thả.

Thả gọi cùng move/copy planner của toolbar, không có đường thực thi filesystem riêng. Có preview mã/tên/metadata bị đổi, xác nhận khi cần theo chính sách; thao tác không xung đột không bắt người dùng nhập lại đích. Chặn tự thả vào chính nó/hậu duệ, nguồn=đích, dự án chưa thiết lập/đang cần đối soát, đích không có quyền và drop zone không hợp lệ. Tập chọn chứa cả cha và con được rút gọn về các gốc cần di chuyển, không thực hiện con hai lần.

Vùng phân loại chỉ hiện “Gán loại/nhãn — không di chuyển”; thư mục thật hiện “Di chuyển đến …” hoặc “Sao chép đến …”. Không dùng modifier hoặc nội dung metadata để suy đoán hai loại thao tác trên cùng vùng thả. Khi đang đối soát, vẫn cho kéo chip để sửa phân loại trong bảng nhưng không cho drag move thông thường; nếu cần đổi vị trí để sửa lỗi thì đi qua kế hoạch đối soát riêng.

## 5. Quy tắc đặt tên và đánh số

### 5.1. Quy tắc do người dùng cấu hình

Mỗi dự án định nghĩa số chữ số của từng cấp, số bắt đầu, dấu tách cấp và dấu tách giữa mã/tên. Ví dụ widths [2, 2, 3] cho các mã 03 → 03.01 → 03.01.001; widths [3, 3, 4] cho 003 → 003.001 → 003.001.0001. Các cấp sâu hơn kế thừa cấu hình dự phòng hoặc được cấu hình rõ; không mặc định bỏ mã.

Khuyến nghị dấu chấm giữa các cấp để dễ đọc và phân tích khi độ dài thay đổi. Có thể chọn cách ghép như 03 → 0301 → 0301.001 nếu khai báo rõ cách hiển thị và width từng cấp; toàn dự án dùng một phiên bản quy tắc nhất quán. Không tự đoán mã ghép mơ hồ từ tên cũ.

Tệp và thư mục dùng cùng hệ thống mã. Ví dụ, cùng một nhánh có 03.01.001 Ho_so_A là thư mục thì không được có 03.01.001 Hoa_don.pdf ở bất kỳ nơi nào trong dự án. Tệp có thể tên 03.01.002 Hoa_don.pdf. Mã hoàn chỉnh gồm toàn bộ các cấp; đoạn cục bộ 001 có thể xuất hiện dưới các cha khác nhau vì mã hoàn chỉnh khác nhau.

Khi thay đổi số chữ số, app lập kế hoạch cập nhật tất cả mã và path bị ảnh hưởng. Thu hẹp width không được làm mất chữ số hoặc cắt mã; nếu có chỉ số không vừa thì yêu cầu chọn width đủ lớn hoặc lập kế hoạch cấp lại số hợp lệ. Không đổi cấu hình trước rồi để tên trên đĩa tiếp tục theo phiên bản cũ.

### 5.2. Chuẩn hóa tên

Ví dụ: “  Thanh toán tên miền / Email tháng 10  ” → “Thanh_toan_ten_mien_Email_thang_10”.

Pipeline: chuẩn hóa Unicode → bỏ dấu tiếng Việt và chuyển đ/Đ thành d/D → trim → thay khoảng trắng và ký tự phân cách không phù hợp thành _ → gộp _ liên tiếp → bỏ _ thừa ở hai đầu → áp kiểu chữ cấu hình. Mặc định giữ hoa/thường người dùng nhập; có tùy chọn lowercase. Mã được sinh riêng, không lấy từ chuỗi người dùng gõ.

Chặn tên rỗng sau chuẩn hóa, tên . hoặc .., tên thiết bị dành riêng, ký tự điều khiển, dấu chấm/khoảng trắng cuối tên và tên trùng theo quy tắc Windows. Không xóa âm thầm toàn bộ nội dung có ký tự ngoài tiếng Việt/Latin: yêu cầu sửa hoặc chọn giữ Unicode. Kiểm tra ngân sách độ dài cả đường dẫn, báo sớm trường hợp có thể không tương thích với ứng dụng khác. Không giả định bật long-path sẽ giải quyết mọi ứng dụng mở tài liệu.

Frontend hiển thị preview tức thời; Rust kiểm tra và tạo tên cuối cùng. Dùng cùng bộ test chuẩn hóa giữa hai lớp để tránh preview khác kết quả ghi.

### 5.3. Mã duy nhất trong toàn dự án

Bất biến bắt buộc: một mã hoàn chỉnh chỉ thuộc về một mục hiện hữu, là tệp HOẶC thư mục, trong một dự án. Không chỉ kiểm tra các mục cùng cha; phải kiểm tra toàn dự án và dùng chung bộ đăng ký mã cho cả hai loại. Dự án khác được có cùng mã.

Mã logic lưu theo các segment số, ví dụ [3, 1, 7]; dạng 03.01.007 chỉ là biểu diễn. code_key chuẩn hóa theo giá trị và ranh giới segment, không dựa vào padding hoặc ký tự phân cách. Nhờ đó đổi 03 sang 003 không tạo hai danh tính cho cùng mã. UUID của mục giữ nguyên khi sửa mã.

- Cấp mới lấy mốc cao nhất từng cấp, dùng chung counter cho tệp/thư mục trong cùng cha; không dùng số lượng mục + 1.
- Không tự lấp số đã xóa, không đánh lại số do sort hoặc xóa. Người dùng vẫn có thể chủ động đổi mã bằng thao tác riêng, nếu mã đích không thuộc mục khác.
- Có UNIQUE(project_id, code_key) trên bộ đăng ký mã đang hoạt động và cơ chế đặt trước mã cho thao tác đang chạy. Giữ lịch sử mã cũ trong bảng lịch sử riêng, không xóa dấu vết của chủ sở hữu trước.
- Trước khi ghi, khóa thao tác ghi theo dự án, xác minh tình trạng đối soát và nguồn/đích thật, đặt trước tập mã trong transaction. Có bước xác minh filesystem sau ghi; không coi UNIQUE trong SQLite là đủ để ngăn File Explorer tạo mã trùng.
- Preview là đề xuất; nếu dữ liệu thay đổi trước khi commit, tạo lại plan và yêu cầu xác nhận khi ảnh hưởng khác bản xem trước. Không ghi đè.
- Khi hết dải mã theo width đã chọn, yêu cầu mở rộng width hoặc thay cấu trúc qua migration; không quay vòng về số đầu.
- Nếu mất metadata, quét toàn cây để dựng lại registry, báo mọi mã trùng/mơ hồ và yêu cầu giải quyết trước khi ghi tiếp. Có thể cần nhập mốc đã cấp nhưng không còn trên đĩa.

App không thể ngăn tiến trình khác sửa trực tiếp filesystem khi đang tắt, hoặc loại bỏ mọi cuộc đua với chương trình ngoài app. Cam kết kỹ thuật là app không phát hành kế hoạch mã trùng, không hoàn tất thao tác của chính nó khi bất biến không đạt và khóa dự án để sửa ngay khi phát hiện vi phạm bên ngoài. Không gọi cơ chế này là khóa tuyệt đối của Windows.

### 5.4. Đổi số cha và cập nhật mã con

Người dùng sửa chỉ số cục bộ của node, ví dụ cha 03 thành 07. Hệ thống giữ chỉ số cục bộ của các con/cháu và tính lại toàn bộ tiền tố:

```text
03 Tai_chinh                         → 07 Tai_chinh
  03.01 Thanh_toan                   →   07.01 Thanh_toan
    03.01.007 Hop_dong.pdf           →     07.01.007 Hop_dong.pdf
```

Đổi mã node, thay width, thay cách hiển thị hoặc chuyển nhánh đều dùng cùng một dịch vụ lập kế hoạch. Kiểm tra mã mới trên toàn dự án, tên/path đích và mọi hậu duệ. Nếu 07 đã thuộc một mục khác, chặn và cho chọn mã khác; hoán đổi mã chỉ thực hiện trong kế hoạch riêng có thể kiểm tra đầy đủ.

Hiển thị số lượng mục, mã cũ/mới và đường dẫn cũ/mới; chỉ thực hiện sau khi người dùng xác nhận. Rename theo thứ tự phụ thuộc và định danh mục, dùng tên tạm khi cần; không giữ danh sách absolute path cũ rồi đổi cha làm hỏng đường dẫn các bước sau. Khóa thao tác xung đột trong dự án, ghi journal từng bước, cập nhật registry/index/tab/breadcrumb/clipboard, xác minh toàn nhánh sau cùng.

SQLite transaction không bao trùm filesystem. Nếu lỗi giữa chừng, dự án chuyển sang trạng thái cần phục hồi, đối soát theo journal và không mở khóa ghi khi cây đang trộn mã cũ/mới. Hoàn tác khi khả thi, không xóa dữ liệu để ép khớp DB.

### 5.5. Luồng tạo hồ sơ

Mở nhánh → Ctrl+Shift+N hoặc + → popover nhỏ có ô Tên đang focus → preview tên và đích → Enter tạo. Nhấn Esc hủy. Tạo xong làm nổi bật thư mục mới; tùy chọn mở ngay hoặc tiếp tục nhập hồ sơ kế tiếp.

Khi tạo, lấy metadata mặc định từ cấu hình nhánh nếu có; người dùng xem chip loại/nhóm/nhãn và chỉ điều chỉnh phần cần khác. Nhánh không cấu hình thông tin bắt buộc thì chỉ cần tên và Enter. Mẫu hồ sơ về sau có thể tạo kèm các thành phần do người dùng đặt tên; từng thành phần được cấp mã riêng theo cấp. Người dùng cấu hình mẫu một lần cho nhánh; không phải chọn lại mỗi lần.

### 5.6. Phân loại tùy biến trong Cài đặt

Ứng dụng không suy ra người dùng bắt buộc phải có Hợp đồng, Hóa đơn hoặc nhóm Tài chính. Cài đặt dự án có các mục: Nhóm phân loại, Loại tài liệu, Nhãn, Mặc định theo thư mục, Quy tắc gợi ý, Thư viện mẫu. Có thể khởi tạo từ bộ hệ thống, tự tạo từ đầu hoặc kết hợp; giá trị không dùng không xuất hiện trong bộ lọc của dự án.

Mô hình đề xuất: mỗi mục có tối đa một loại chính; nhiều nhãn; nhóm phân loại tùy chọn. Một loại có thể được xếp vào nhóm để tổ chức danh mục trong cài đặt. UI không bắt người dùng điền cả nhóm lẫn loại nếu nhóm đã suy ra từ loại. Nếu cần nhiều chiều như Bộ phận, Nhà cung cấp và Trạng thái nghiệp vụ, cấu hình thành nhóm nhãn hoặc trường tùy chọn có giá trị sẵn, không sinh nhiều ô văn bản bắt buộc. “Trạng thái phân loại” là trạng thái hệ thống Chưa phân loại/Có gợi ý/Đã xác nhận; khác với trạng thái công việc như Chờ ký/Đã thanh toán do dự án tự định nghĩa.

Mỗi định nghĩa loại/nhóm/nhãn có ID ổn định, tên hiển thị, mô tả tùy chọn, màu/icon tùy chọn, đối tượng được áp dụng (tệp/thư mục/cả hai), trạng thái hoạt động và thứ tự hiển thị. Tên, màu hay thứ tự đổi không làm mất liên kết đã gán. Loại tài liệu thư mục có thể là Hồ sơ thanh toán; loại tệp bên trong có thể là Hợp đồng hoặc Hóa đơn, không bắt mọi con giống loại cha.

Thư viện hệ thống cung cấp bộ mẫu nhỏ theo tình huống và cho dùng hoặc bỏ hoàn toàn. Sau khi kéo vào dự án, các định nghĩa trở thành cấu hình có thể sửa của dự án. Các bộ mẫu có version và ID nguồn để nhận biết mục đã được nhập; kéo lặp lại không nhân bản ngầm. Tên trùng giữa mục tự tạo và mục mẫu phải preview Hợp nhất, Giữ riêng bằng tên mới hoặc Bỏ qua; không dựa vào tên giống nhau để tự gộp.

Đổi tên/xóa định nghĩa chỉ tác động metadata, không tự đổi tên tệp hay thư mục. Mục đang được dùng được ưu tiên ngừng sử dụng cho gán mới hoặc chuyển liên kết sang mục khác; không xóa âm thầm liên kết cũ. Di chuyển loại sang nhóm khác có preview những bộ lọc/kết quả bị ảnh hưởng. Phân loại và cấu hình có journal/undo riêng với file operations.

### 5.7. Điền sẵn, kế thừa và phân loại hàng loạt

- Cấu hình tại nhánh: loại mặc định cho chính hồ sơ hoặc tệp con theo điều kiện, nhóm/nhãn mặc định, trường bắt buộc/tùy chọn và mẫu tên. Có thể kéo chip từ danh mục vào cấu hình nhánh để thiết lập một lần.
- Nhãn/nhóm cha có thể kế thừa; loại tệp chỉ kế thừa nếu quy tắc nhánh nói rõ đối tượng/phạm vi. Không tự gán tất cả tài liệu trong “Hồ sơ thanh toán” thành Hóa đơn.
- Thứ tự ưu tiên giá trị: người dùng đã xác nhận → cấu hình nhánh gần nhất phù hợp/mẫu người dùng áp dụng → gợi ý theo quy tắc → chưa phân loại. Giá trị đã xác nhận không bị gợi ý ghi đè.
- Hành động kéo thả có chủ đích vào vùng gán loại/nhãn được tính là người dùng xác nhận, không yêu cầu một hộp xác nhận nữa nếu không có xung đột. Thay loại đã có cho nhiều mục phải preview tác động; không tự ghi đè giá trị trái nhau.
- Metadata kế thừa lưu cả nguồn và lựa chọn đã chốt. Khi thay cấu hình cha, app cho preview áp dụng cho các mục đang dùng mặc định cũ; không ghi đè hàng loạt mục đã xác nhận/chỉnh riêng. Move sang cha khác cũng phải preview metadata kế thừa có thể thay đổi.
- Phân loại hàng loạt hỗ trợ giá trị hỗn hợp, giữ giá trị hiện tại, thêm/bỏ nhãn và đặt loại cho các mục chưa phân loại. Không tự biến ô “nhiều giá trị” thành một giá trị mặc định rồi ghi lên mọi tệp.
- Danh mục phân loại được để trống khi setup, bổ sung sau trong Cài đặt. Khi chưa có danh mục hoặc chính sách yêu cầu thì trường tương ứng là tùy chọn; app hiển thị Chưa phân loại và lối vào cấu hình, không chặn sử dụng. Chỉ cho bật trường bắt buộc ở nhánh khi có danh mục đang hoạt động tương thích. Thiếu metadata tùy chọn khác với thiếu mã trên mục được quản lý. Khi bổ sung danh mục/quy tắc, cho preview và phân loại hàng loạt mục cũ, không tự gán hoặc đổi tên toàn bộ.

### 5.8. Gợi ý từ tên, không đồng nhất tên với loại

Loại/nhãn lưu theo UUID của mục, độc lập tên vật lý và mã. Tệp có tên hd_abc.pdf vẫn thuộc Hợp đồng nếu được gán loại đó. Đổi tên hoặc mã trong app giữ phân loại. Copy tạo UUID mới và cho kế thừa metadata theo preview; chuyển dự án phải ánh xạ danh mục dự án nguồn/đích, không sao chép ID danh mục cục bộ mù quáng.

Quy tắc do người dùng cấu hình trong Cài đặt: đối tượng tệp/thư mục, phạm vi nhánh, token/tiền tố/hậu tố hoặc phần mở rộng, loại/nhãn đề xuất, độ ưu tiên và trạng thái bật/tắt. Chuẩn hóa dấu và hoa/thường để so khớp; tránh tìm chuỗi con ngắn không có ranh giới từ.

Ví dụ mẫu có thể gợi ý hop_dong/contract → Hợp đồng, invoice/hoa_don → Hóa đơn. Viết tắt hd là mơ hồ, không tự xác nhận. Người dùng có thể tạo quy tắc hdmb_ → Hợp đồng mua bán trong dự án, và được xem thử các mục sẽ khớp trước khi bật. Khi hai quy tắc mâu thuẫn, giữ trạng thái Có gợi ý và yêu cầu xác nhận thay vì tự đoán.

Phân loại lưu nguồn (thủ công/kéo thả/mặc định nhánh/quy tắc), trạng thái xác nhận và lý do gợi ý. Quy tắc chỉ gợi ý theo mặc định; tùy chọn tự gán chỉ áp dụng khi người dùng chủ động bật cho quy tắc rõ ràng và mục chưa xác nhận. Không tự tạo quy tắc từ một lần người dùng chọn loại.

Đọc nội dung, OCR và AI nằm ở giai đoạn sau. Bản đầu vẫn đáp ứng phân loại nhờ cấu hình, kéo thả, mặc định theo nhánh và quy tắc tên. Nếu nhận diện lại một mục đổi bên ngoài app không chắc cùng danh tính, giữ metadata để đối soát chứ không tự gán sang tệp khác theo tên giống nhau.

### 5.9. Tệp không đuôi, tệp ẩn, shortcut và mục kỹ thuật

| Trường hợp | Chính sách đã chốt |
|---|---|
| Tệp không có phần mở rộng | Mục công việc vẫn được quản lý/cấp mã/đổi mô tả, không tự thêm đuôi. Nhận dạng nội dung chỉ để gợi ý loại/định dạng. Mở bằng hệ điều hành; nếu không có handler thì báo rõ và cho chọn ứng dụng khi hỗ trợ |
| Tệp ẩn thông thường | Có tùy chọn Hiện tệp ẩn. Giữ thuộc tính ẩn khi đổi tên/move khi filesystem hỗ trợ; nếu đích không bảo toàn được phải báo. Ẩn giao diện không làm mất kiểm tra mã, đối soát hoặc số mục cần xử lý |
| Metadata hệ thống | desktop.ini, Thumbs.db và mục kỹ thuật nhận diện theo chính sách được loại trừ khỏi chuẩn hóa/cấp mã. Không đổi tên hoặc di chuyển độc lập những tệp phụ thuộc tên/vị trí cố định |
| Thư mục .git | Loại trừ nguyên cây metadata Git, không quét/đánh số/đổi tên hoặc tác động nội dung Git. Không vì vậy mà loại trừ tất cả tệp bắt đầu bằng dấu chấm |
| Shortcut .lnk | Quản lý bản thân shortcut như một mục có mã, giữ .lnk; đổi tên/move không tự di chuyển/sửa tệp đích. Double click mở liên kết bằng Windows sau hành động người dùng; không tự thực thi khi quét |
| Internet shortcut .url | Quản lý bản thân liên kết; double click mở URL bằng handler mặc định, không tự tải nội dung đích. Muốn tải phải dùng New → Tải từ liên kết |
| Symlink/junction/reparse point | Nhận diện và hiển thị là liên kết, không tự đi xuyên để quét/đánh số cây đích. Không xử lý như thư mục thường. Luồng move/rename liên kết chỉ được bật khi backend đã kiểm thử đúng ngữ nghĩa; bản đầu có thể chỉ xem/loại trừ để bảo toàn đích |
| Không xác định được an toàn | Hiển thị Cần xác định, cho chọn Quản lý/Loại trừ với lý do; không tự đoán định dạng hoặc đổi tên |

Mục được quản lý phải có mã duy nhất trong dự án. Mục kỹ thuật được loại trừ giữ tên gốc, không nhận mã và không phát cảnh báo chỉ vì thiếu mã; vẫn hiện trong báo cáo phạm vi nếu người dùng bật xem. Mục chưa xác định phải được xử lý trong tiếp nhận/đối soát trước khi đánh dấu dự án sẵn sàng. Đổi chính sách loại trừ có preview và kiểm tra lại registry/baseline; không để mã cũ được giải phóng hay gán lại âm thầm khi đổi phạm vi.

Thuộc tính hidden/system hoặc tên có dấu chấm không tự nó đủ để loại trừ. Hợp đồng bị đặt hidden vẫn là tài liệu công việc. Danh sách/pattern loại trừ có version, phạm vi và lý do, hiển thị trong Cài đặt; default dùng tập kỹ thuật cụ thể đã kiểm chứng, không regex quá rộng. Tệp cần tên cố định khác do người dùng xác định có thể bổ sung ngoại lệ với preview, giữ dấu vết lựa chọn.

Đối soát/quét phải phân biệt Không hiển thị với Không quản lý và Không có quyền truy cập. Move một thư mục chứa tệp kỹ thuật không được tự bỏ mất các tệp đó; lập kế hoạch giữ cấu trúc cần thiết hoặc chặn nếu không thể bảo toàn. Với reparse point, không theo target để copy đệ quy; không đưa nội dung đích ngoài root vào dự án. Khi HFolder đổi tên/move đích của shortcut đã biết, cảnh báo shortcut có thể bị ảnh hưởng; chỉ cập nhật liên kết khi có thao tác riêng và đủ quyền, không hứa sửa mọi shortcut ngoài dự án.

Trước implement file operations cần test trên Windows: tệp không đuôi, dotfile, hidden/system, .lnk tuyệt đối/tương đối, .url, junction/symlink vào/ra root, vòng lặp liên kết, liên kết hỏng, thiếu quyền và move khác volume. Dùng thư mục thử nghiệm, không áp dụng trực tiếp lên dữ liệu công việc.

## 6. File operations và tính toàn vẹn dữ liệu

Mọi thay đổi đi qua chu trình chuẩn bị → xem xung đột → thực hiện → xác minh → ghi nhật ký/cập nhật chỉ mục. Các thao tác đơn giản như tạo thư mục hợp lệ không cần thêm hộp xác nhận ngoài Enter; thao tác hàng loạt hoặc ảnh hưởng mã nhánh phải có preview.

Copy/cut nội bộ lưu nguồn dự án, định danh mục, thời điểm và thao tác, không chỉ một chuỗi path có thể đã lỗi thời. Bản đầu đảm bảo clipboard nội bộ giữa tab; tích hợp clipboard file gốc của Windows/Explorer có thể triển khai sau.

Chặn move thư mục vào chính nó/hậu duệ, nguồn và đích trùng nhau, nguồn bị thay đổi sau khi chọn. Bản đầu không gộp thư mục đích đã tồn tại. Mặc định không ghi đè; xung đột cho Bỏ qua, Đổi tên hoặc Hủy. Copy tệp/thư mục tạo UUID và mã đích mới; copy cả nhánh tính lại mã tất cả mục con. Move trong cùng dự án giữ UUID, tính lại mã theo cha mới; chuyển dự án cấp mã theo quy tắc dự án đích, không mang nguyên mã nguồn gây trùng. Mọi thay đổi mã đều có preview; giữ phần mô tả và phần mở rộng tệp nếu không yêu cầu đổi. Import tệp ngoài app cũng phải cấp mã trước khi hoàn tất.

Move cùng volume ưu tiên thao tác rename phù hợp của hệ điều hành, không tuyên bố mọi batch đều nguyên tử. Move khác volume: copy sang vị trí tạm ở đích → xác minh → hoàn tất đích → mới xóa nguồn đã xác minh. Nếu lỗi hoặc hủy, giữ bản nguồn và ghi rõ phần đã hoàn thành. Nếu checksum không đáp ứng thời gian mục tiêu, phải đo thực tế và công bố chế độ xác minh; không bỏ bước bảo vệ nguồn để đạt tốc độ.

Tác vụ lớn chạy nền, có tiến trình, hủy và kết quả theo từng mục. Cắt chưa dán không sửa nguồn. Không hủy ngang một thao tác hệ thống không thể hủy; dừng tại ranh giới bước an toàn.

Undo là hành động bù có điều kiện, không phải khôi phục vô hạn: chỉ thực hiện khi nguồn/đích chưa bị thay đổi và không ghi đè dữ liệu mới. Tạo thư mục chỉ hoàn tác bằng xóa khi vẫn trống. Copy/move cần kiểm tra định danh/metadata/chữ ký phù hợp trước khi xóa hay phục hồi. Đóng app khi đang move ghi đủ trạng thái để lần mở sau đối soát, không tự xóa dữ liệu còn nghi ngờ.

Xóa vào Recycle Bin; bản đầu không có xóa vĩnh viễn. Khôi phục từ Recycle Bin dùng cơ chế Windows; không hứa Ctrl+Z khôi phục mọi trường hợp xóa từ app.

### 6.1. New → Nhận tệp từ liên kết hoặc đường dẫn

Cùng một giao diện nhập tệp có hai nguồn, cho dán URL/path, kéo liên kết/tệp hoặc dùng nút duyệt tệp. App nhận diện nguồn nhưng luôn hiển thị rõ “Tải từ liên kết” hoặc “Di chuyển từ máy”, tránh nhầm thao tác. Đường dẫn chứa khoảng trắng, dấu tiếng Việt, dấu ngoặc và ký tự shell được xử lý như dữ liệu; không ghép thành lệnh shell.

```text
New
├── Thư mục / Hồ sơ mới
├── Tải từ liên kết
└── Nhập từ đường dẫn máy

Nguồn:       [URL hoặc đường dẫn nguồn]
Lưu vào:     [Breadcrumb đích trong dự án]
Loại / Nhóm / Nhãn: [chip điền sẵn, kéo để thay đổi]
Đặt tên:     [Giữ tên nguồn] [Tên mới]
Xem trước:   03.01.008 Hop_dong_dich_vu.pdf
Hành động:   [Tải vào dự án] hoặc [Di chuyển vào dự án]
```

### 6.2. Thông tin phải chốt trước khi thực hiện

Người dùng cung cấp/chốt nguồn, thư mục đích, thông tin phân loại bắt buộc theo cấu hình và lựa chọn Giữ tên nguồn hoặc Tên mới. Mã, loại/nhóm/nhãn mặc định và tên gợi ý lấy từ cấu hình dự án/nhánh; không bắt gõ lại những giá trị đã có. Trường chưa có giá trị thì người dùng kéo chip từ danh mục hoặc nhập tên mới khi được phép.

Giữ tên nguồn nghĩa là giữ PHẦN MÔ TẢ của tên tải về/tên hiện tại, sau đó vẫn chuẩn hóa và cấp mã theo quy tắc; không có nghĩa giữ tên nguyên xi trái chuẩn. Tên mới thay phần mô tả; phần mở rộng được hiển thị riêng, lấy theo tệp và kiểm tra hợp lệ. Đổi tên không chuyển đổi định dạng. Nếu nguồn đã có mã, xử lý phần mã bằng parser theo quy tắc đã nhận diện; không thêm một tiền tố mã mới lên mã cũ một cách mù quáng.

Preview luôn thể hiện tên nguồn, tên cuối, metadata và đường dẫn đích tuyệt đối. Nếu chưa xác định được tên nguồn mà người dùng chọn Giữ tên nguồn, app phải lấy được tên hoặc yêu cầu nhập trước khi bắt đầu tải đầy đủ. Thay đổi cấu hình/cha/mã trong lúc chờ khiến plan hết hiệu lực; phải cập nhật và chốt lại trước khi hoàn tất vào dự án.

### 6.3. Tải tệp từ URL

Luồng: dán link → kiểm tra/phân tích nguồn → nhận thông tin tên/loại/kích thước nếu có → chốt metadata, đích và tên → Tải vào dự án → tải nền vào staging → xác minh → cấp/commit mã và hoàn tất đích → cập nhật metadata/index/journal.

Bước phân tích có thể gửi yêu cầu lấy header hoặc probe giới hạn; phải phân biệt với tải toàn bộ nội dung. Không phụ thuộc HEAD luôn được server hỗ trợ. Ưu tiên tên từ Content-Disposition filename*, rồi filename, rồi phần tên trong URL cuối sau redirect. Tên server gửi là gợi ý, chỉ lấy basename, bỏ mọi đường dẫn nhúng và đưa qua bộ chuẩn hóa. Không lấy query string làm tên, không suy ra phần mở rộng chắc chắn chỉ từ đuôi URL. Nếu tên/định dạng chỉ lộ ra ở phản hồi tải, đọc header rồi dừng trước phần body để cập nhật preview nếu cần; khi vẫn mơ hồ thì yêu cầu người dùng đặt tên/kiểm tra, không lưu nhầm trang lỗi thành PDF.

Phạm vi đầu tiên của downloader là link HTTP(S) thực sự trả nội dung tệp, kể cả redirect hoặc signed URL còn hiệu lực. Trang chia sẻ Google Drive/OneDrive/Dropbox hoặc trang cần đăng nhập có thể trả HTML thay vì tệp; app phải báo nguồn chưa tải trực tiếp được và hướng dẫn lấy link phù hợp. Kết nối dịch vụ/xác thực riêng có thể bổ sung sau, không hứa tải được mọi link và không tự lấy cookie trình duyệt.

Downloader chạy trong Rust, stream xuống đĩa, không nạp toàn bộ tệp lớn vào RAM hoặc đưa qua IPC. Có hàng đợi, tiến trình số byte, tốc độ, thử lại và hủy; khi server không có tổng dung lượng thì hiển thị số byte/tiến trình không xác định, không dựng phần trăm giả. Giới hạn timeout, số redirect, số tác vụ song song và dung lượng theo cấu hình app. Chỉ dùng HTTP(S) cho luồng này; path cục bộ đi qua luồng nhập riêng.

Tệp tải dở ở staging của app ngoài root dự án để không vi phạm quy tắc mọi mục trong cây có mã. Không mở/chạy hoặc tự giải nén tệp sau tải. Lỗi mạng, hết dung lượng, link hết hạn hoặc hủy không để tệp dở xuất hiện như một mục hoàn tất. Kiểm tra phản hồi HTTP, độ dài/hoàn tất luồng nếu có và dấu hiệu định dạng; checksum so với giá trị nguồn nếu nguồn cung cấp đáng tin. Tệp không xác minh được hoặc khác tên/định dạng dự kiến phải dừng ở trạng thái cần xử lý.

Mã preview được giữ chỗ có thời hạn hoặc tính lại khi commit, không khóa ghi toàn dự án suốt thời gian tải mạng. Khi commit vẫn kiểm tra độc nhất toàn dự án và trạng thái dự án Sẵn sàng. Nếu đích bị đổi/xóa hoặc dự án cần đối soát, giữ bản đã tải ở staging và yêu cầu xử lý, không tự tìm một đích khác. URL có token được che trong log/UI lịch sử; nếu cần lưu bí mật để thử lại, dùng nơi lưu phù hợp thay vì metadata xuất khẩu công khai.

Tạm dừng/tiếp tục tải bằng Range là nâng cấp sau; chỉ bật khi nguồn hỗ trợ và có validator phù hợp để không nối nội dung đã thay đổi. Bản đầu có thể thử lại từ đầu và thông báo rõ.

### 6.4. Nhập path cục bộ: di chuyển vào dự án

Luồng: dán path/kéo tệp/chọn tệp → xác minh nguồn tồn tại và đọc được → chọn đích, thông tin và cách đặt tên → preview nguồn/đích → bấm Di chuyển vào dự án → thực hiện bằng file-operation engine ở mục 6 → cập nhật registry/metadata/index.

Nút cuối ghi rõ “Di chuyển”, không chỉ “Thêm”, kèm thông tin nguồn sẽ không còn ở vị trí cũ khi thành công. Mặc định theo yêu cầu là di chuyển, không âm thầm sao chép. Có thể cung cấp lựa chọn Sao chép nâng cao nhưng chỉ dùng khi người dùng chủ động đổi chế độ.

Quyền nguồn được cấp riêng cho đúng tệp/path người dùng chọn; không mở quyền di chuyển mọi path trên máy. Đích luôn là thư mục thuộc dự án đã sẵn sàng. Chặn path thư mục khi đang ở chế độ nhập tệp đơn, nguồn=đích và nguồn không xác minh được. Tệp đã ở trong dự án xử lý như move/rename giữ UUID và metadata; tệp của dự án khác phải kiểm tra trạng thái cả hai dự án, chuyển mã và ánh xạ phân loại theo quy tắc đích. Nguồn ở root của một dự án đã đăng ký nhưng đang đóng vẫn phải đi qua registry và đối soát dự án nguồn, không coi là nguồn ngoài không quản lý.

Cùng volume dùng rename/move phù hợp; khác volume dùng copy → xác minh → hoàn tất đích → xóa nguồn đã xác minh. Recheck identity của nguồn trước khi xóa, không xóa tệp khác được thay thế tại path cũ. Nếu đích đã hoàn thành nhưng xóa nguồn lỗi, báo “Đã có bản đích, chưa xóa được nguồn”, ghi journal và hướng dẫn tiếp tục; không báo move thành công hoàn toàn. Không ghi đè và không đổi nội dung tệp.

### 6.5. Hoàn tác, khôi phục và phân loại

Import và download dùng chung metadata/mã, điều kiện cổng cấu hình và đối soát, task center và operation journal. Tải xong không tạo thêm một mục chưa mã rồi chờ người dùng phân loại về sau nếu nhánh có trường bắt buộc. Watcher nhận biết thao tác app để không coi tệp mới này là thay đổi ngoài chưa rõ nguồn.

Hoàn tác local move theo điều kiện mục 6, đưa về path nguồn nếu còn an toàn. Hoàn tác download chỉ gỡ mục app vừa tạo khi chưa bị thay đổi, không tác động bản trên Internet; xóa dùng chính sách Recycle Bin. Khởi động lại app đối soát tác vụ dở và staging, cho tiếp tục/thử lại/dọn bản dở đã xác định, không tự tải lại vô hạn. Metadata ghi loại nguồn, tên gốc, URL đã loại thông tin nhạy cảm hoặc path gốc theo chính sách, thời điểm nhận và operation_id.

## 7. Kiến trúc đề xuất

Stack đã chốt: Tauri 2 + Rust; Next.js + React + TypeScript cho frontend; SQLite cục bộ cho metadata; plugin updater chính thức của Tauri để nhận phiên bản mới. Next.js thay thế đề xuất Vite trước đây. Chốt và khóa phiên bản cụ thể khi scaffold sau khi kiểm tra tương thích Next.js/Tauri/plugin trên Windows.

Một cửa sổ, một WebView, tabs là trạng thái trong frontend. Không tạo một WebView/process riêng cho mỗi dự án. UI không trực tiếp quyết định quyền ghi lên filesystem.

Branding: productName, tiêu đề app, tên installer, shortcut, trang Giới thiệu và release notes thống nhất HFolder. Nhãn tích hợp Explorer là “Open in HFolder”, tiếng Việt có thể hiển thị “Mở bằng HFolder”. Chốt bundle identifier một lần khi scaffold và giữ ổn định qua updater; không lấy tên dự án người dùng làm app identifier.

```text
Next.js/React UI: Tabs / Breadcrumb / Tree / Explorer / Dialogs / Task center
                         ↓ typed commands
Rust: Project registry → Naming/Numbering → Operation coordinator
                         ↓                    ↓
                  Search/Watcher        Filesystem adapter
                         ↓                    ↓
                SQLite metadata         Thư mục thật
```

Module frontend: projects, tabs, explorer, custom-context-menu, new-import-dialog, download-queue, search-facets, classification-panel, taxonomy-settings, template-library, drag-drop, naming-preview, renumber-preview, reconciliation-center, operations, settings, onboarding.

Frontend bổ sung app-update-center trong Cài đặt → Giới thiệu & Cập nhật và thông báo cập nhật gọn trong app. Updater cài ứng dụng tách khỏi downloader nhận tài liệu vào dự án, không dùng chung URL nhập tự do hay chính sách trust.

Bổ sung selection-controller dùng chung list/grid/search/bảng đối soát; drag-session phân biệt chọn vùng, move/copy và gán metadata; warning-badges/notification-router theo issue_id. Reconciliation draft lưu theo dự án/tập mục, giữ chỉnh sửa khi đi tới Cài đặt; phải revalidate khi dữ liệu bên ngoài hoặc cấu hình thay đổi, không khôi phục một preview cũ như còn hiệu lực.

Explorer integration bổ sung native shell-registration service và external-open-router/activation queue ở Rust; frontend nhận intent mở dự án/đi tới mục/nhập nguồn khi khởi tạo xong. Hàng đợi kiểm tra quyền và deduplicate request, không cấp quyền ghi chỉ vì path đến từ Explorer.

Module Rust: project_service, path_guard, naming_engine, numbering_engine, code_registry, renumber_planner, taxonomy_service, classification_service, rule_engine, metadata_inheritance, template_service, reconciliation_service, source_resolver, download_service, staging_service, app_update_service, directory_service, file_operations, operation_journal, search_index, watcher_service, persistence.

API cấp nghiệp vụ: open_project, list_children, preview_entry_name, create_folder, open_entry_with_default_app, plan_rename, plan_renumber_subtree, plan_numbering_profile_change, scan_project_consistency, plan_reconcile, execute_operation, search_entries, undo_operation, get_operation_status. Mỗi request gắn project_id; backend lấy root đã đăng ký, không tin root tùy ý từ frontend. Thao tác đa dự án mang cả source_project_id và destination_project_id. Mọi command ghi phải kiểm tra trạng thái dự án tại backend; ẩn nút trên giao diện không thay thế kiểm tra này. Kế hoạch có version/snapshot và hết hiệu lực nếu filesystem hoặc quy tắc thay đổi trước khi thực thi.

Dùng invoke cho request/response; event cho thay đổi thư mục và trạng thái; channel cho tiến trình dài khi phù hợp. Mỗi thông điệp kèm project_id và operation_id, frontend loại kết quả tìm kiếm cũ/khác dự án.

API bổ sung: get_project_taxonomy, import_template_bundle, plan_taxonomy_change, apply_classification_batch, preview_classification_rules, plan_inherited_metadata_update và search_entries với bộ lọc metadata. Backend kiểm tra định nghĩa loại/nhãn thuộc đúng dự án, đối tượng cho phép, trạng thái ngừng sử dụng và quy tắc bắt buộc. Kéo thả chỉ là cách UI phát lệnh nghiệp vụ, không tự sửa DB hoặc filesystem ở frontend. Trạng thái Cần đối soát cũng chặn các lệnh sửa metadata/config thông thường; sửa qua kế hoạch đối soát được phép và ghi nhật ký.

API thiết lập: save_setup_draft, validate_project_setup, preview_copy_project_config, copy_project_config và finalize_project_setup. Lưu setup_status, setup_step, config_version đã xác nhận và mapping cấu hình sao chép. Command làm việc thông thường kiểm tra cả cấu hình đã hoàn tất lẫn đối soát đạt; không thể gửi invoke trực tiếp để vượt cổng wizard. Việc chỉnh cấu hình sau khi đã sử dụng là thay đổi có kế hoạch, không ghi cấu hình không hợp lệ đè lên phiên bản đang hoạt động.

API nhập/tải: inspect_import_source, preview_import, start_download, execute_local_import, cancel_transfer, retry_transfer và finalize_staged_download. inspect có giới hạn rõ, start_download chỉ nhận plan đã chốt nguồn/đích/metadata/tên; frontend không gửi path đích tùy ý cho downloader. Rust kiểm tra cả quyền đọc/move nguồn đã được người dùng chọn và quyền đích trong dự án. HTTP client chạy Rust hoặc plugin chính thức với scope thích hợp; custom Rust client phải tự thực thi kiểm tra nguồn và redirect, không giả định scope plugin-fs hoặc plugin-http tự bao phủ mọi custom command.

Tauri capabilities chỉ phân quyền theo window/WebView, không tự cách ly các tab. Phân quyền giữa dự án phải do Rust kiểm tra. Các custom commands không mặc nhiên bị giới hạn bởi scope của plugin-fs. Không cung cấp lệnh frontend kiểu “ghi vào path bất kỳ”.

Chọn root qua dialog gốc của hệ điều hành. Path guard kiểm tra theo thành phần đường dẫn, ancestor đã tồn tại, volume và đích thực; không dùng startsWith đơn giản. Không theo junction/symlink/reparse point ra ngoài root trong bản đầu. Kiểm tra lại tại thời điểm thao tác, xử lý thay đổi đồng thời; nếu cần bảo đảm trước tiến trình bên ngoài có thể thay link, dùng handle-based operations thay vì chỉ canonicalize trước đó.

Bản đầu dùng một instance app, khóa thao tác trên cùng vùng dữ liệu. Khóa trong app không ngăn File Explorer sửa dữ liệu; mọi thao tác phải xử lý tình huống ngoài app thay đổi nguồn/đích.

### 7.1. Next.js trong Tauri: static export

Đóng gói frontend bằng Next.js static export, output: 'export'; Tauri frontendDist trỏ tới ../out. Dev dùng next dev và devUrl của Tauri; build sản phẩm dùng next build rồi tauri build. Không chạy next start hoặc kèm Node.js server trong bản desktop. Tài liệu tích hợp Tauri xác nhận mô hình này; kiểm tra lại API cụ thể theo phiên bản Next.js đã khóa vì ví dụ trong tài liệu có thể viết cho phiên bản cũ hơn.

Dùng App Router cho các route tĩnh của shell như workspace, setup, settings; cây dự án, tab và đường dẫn tệp là state runtime, không biến mỗi thư mục trên ổ đĩa thành dynamic route cần generateStaticParams. Thành phần gọi Tauri, dùng window/document, drag/drop hoặc state tương tác đặt ở Client Components; chỉ gọi API desktop sau khi chạy phía client. Server Components chỉ dùng khi có thể render tại build, không gọi SQLite hay filesystem máy người dùng lúc build.

Không dựa vào SSR runtime, Server Actions, API Routes/Route Handlers cần request-time server, cookies server hoặc image optimizer mặc định của Next.js. Nghiệp vụ local chạy Rust qua invoke; metadata lấy lúc chạy app. Nếu dùng next/image cho asset phù hợp phải cấu hình loader/unoptimized tương thích export; thumbnail local và tệp người dùng đi qua cơ chế Tauri đã kiểm soát phạm vi. Kiểm tra asset, font và điều hướng hoạt động trong bản cài offline; không coi next dev chạy được là bản đóng gói đã đạt.

### 7.2. Updater và trải nghiệm cập nhật

Dùng tauri-plugin-updater chính thức cùng capability/permission cần thiết. Cài đặt → Giới thiệu & Cập nhật hiển thị version hiện tại, nút Kiểm tra cập nhật, thông tin bản mới, release notes, dung lượng nếu có, tiến trình và lựa chọn Tải cập nhật/Cài đặt khi sẵn sàng/Để sau.

Mặc định kiểm tra nền khi khởi động và khi người dùng yêu cầu, có giới hạn tần suất; mất mạng hoặc server lỗi không chặn việc làm offline. Chỉ thông báo khi có bản mới hoặc lỗi người dùng cần xử lý, không tạo thông báo lặp mỗi lần kiểm tra. Mặc định không tự tải/cài không hỏi; có thể thêm tùy chọn tự tải về sau, vẫn không cài giữa thao tác dữ liệu.

Gói cập nhật phải có chữ ký xác thực bằng keypair của updater; private key chỉ ở máy build/CI secret, public key nhúng trong app. Bật bundle.createUpdaterArtifacts và endpoint HTTPS cho manifest/update. Artifact phải đúng platform/architecture/version; URL và signature lấy từ kênh phát hành tin cậy, không lấy từ hộp New → Tải từ liên kết. Phân biệt chữ ký updater với Windows code signing của installer; hai mục đích khác nhau, không tuyên bố chữ ký updater tự xử lý SmartScreen.

Luồng: kiểm tra → hiện bản mới và release notes → tải → xác thực bằng updater → chờ điểm an toàn → lưu state/DB/journal → gọi cài đặt → mở lại và kiểm tra dữ liệu. Trên Windows, API install/downloadAndInstall có thể thoát app khi khởi chạy installer thành công; vì vậy toàn bộ thao tác lưu và kiểm tra an toàn phải hoàn tất TRƯỚC khi gọi install, không đặt sau lệnh đó.

Không cài khi đang rename nhánh, chuẩn hóa cây, move/copy, đối soát đang áp dụng hoặc migration. Thông báo cần chờ hoàn tất/hủy tại điểm an toàn; khóa nhận thêm thao tác mới trong giai đoạn chuẩn bị cài. Tác vụ download tài liệu có thể hoàn tất trước hoặc hủy an toàn và lưu trạng thái; không hứa resume nếu nguồn không hỗ trợ. Lưu tab, wizard draft, bảng đối soát draft, hàng đợi và journal trước khi cập nhật. Dự án còn lỗi chưa xử lý không nhất thiết cấm cập nhật app nếu không có thao tác đang chạy, nhưng phải lưu trạng thái và mở lại vẫn giữ khóa đối soát, không đánh dấu đã sửa.

Đổi version không thay root, tên/mã hoặc phân loại tự động. Backup SQLite nhất quán trước migration bằng API backup/checkpoint thích hợp, không chỉ copy một file .db đang có WAL rồi coi là đầy đủ. Migration schema theo version và có phục hồi được kiểm thử; nếu lỗi, giữ bản backup và mở chế độ phục hồi, không tiếp tục ghi DB nửa migration. Updater không tự bảo đảm rollback DB hoặc downgrade; không cho hạ bản app tùy ý khi schema mới chưa tương thích.

### 7.3. Build và phát hành phiên bản

Đề xuất GitHub Actions + GitHub Releases hoặc host HTTPS tương đương cho installer/artifact/signature và manifest. Nhà phát triển cần chốt repository/host thực tế khi thiết lập CI; kế hoạch này chưa tạo repo hoặc publish. Bản đầu dùng kênh stable; beta tách endpoint/manifest rõ nếu thêm sau.

Pipeline: kiểm tra type/lint/test → next build static export → build Tauri trên Windows target → tạo/ký updater artifact → kiểm tra artifact/version/signature → thử nâng cấp từ bản trước → upload đầy đủ asset/signature → công bố manifest sau cùng. Dùng release draft trước khi phát hành; không trỏ manifest tới asset chưa sẵn sàng. Đồng nhất version của manifest và bundle, lưu lockfiles và build metadata.

Key updater phải được sao lưu bảo mật và có phương án xoay khóa trước khi đổi; mất private key không giải quyết bằng đổi public key trên server khi app cũ vẫn nhúng key cũ. Endpoint static có thể dùng latest.json; URL public manifest không được đòi token bí mật hard-code trong app. CI secrets không xuất vào frontend, artifact cấu hình hay log. Chính sách Windows installer/version/architecture/app identifier phải ổn định để cập nhật không tạo app thứ hai hoặc đổi nơi lưu DB.

### 7.4. Windows File Explorer → Open in HFolder

Đăng ký lệnh Open in HFolder kèm icon ứng dụng trong context menu của Windows File Explorer. Đây là tích hợp bên ngoài app, khác menu chuột phải do frontend tự dựng ở mục 4.6; yêu cầu không dùng menu WebView/Tauri mặc định bên trong app vẫn giữ nguyên.

| Đối tượng nhấp phải | Hành vi khi chọn Open in HFolder |
|---|---|
| Root của dự án đã đăng ký | Mở/focus đúng tab, chạy đối soát rồi hiển thị dự án |
| Thư mục con trong dự án đã đăng ký | Mở/focus tab của root, mở rộng cây và đi tới đúng thư mục con; không tạo root dự án lồng nhau |
| Thư mục ngoài mọi dự án | Mở wizard tiếp nhận với root đã điền; hoàn tất cấu hình/xem trước trước khi được dùng; không tự đánh lại số lúc nhấp menu |
| Vùng trống trong một thư mục Explorer | Xử lý thư mục đang hiển thị theo ba trường hợp trên |
| Tệp nằm trong dự án | Mở đúng dự án và thư mục chứa, chọn/làm nổi bật tệp; không mở tài liệu bằng app mặc định thay cho HFolder |
| Tệp ngoài dự án | Mở New → Nhập từ đường dẫn máy với nguồn đã điền; yêu cầu chọn dự án/đích và xác nhận trước khi move |
| Nhiều tệp | Nhận tập chọn, gộp yêu cầu mở/nhập theo dự án và hiển thị preview hàng loạt; không sinh cửa sổ app cho mỗi tệp |

Nếu root chưa thiết lập hoặc cần đối soát, mở đúng wizard/vùng đối soát, giữ yêu cầu điều hướng chờ; không cho lệnh Explorer vượt các cổng dữ liệu. Nếu chưa có dự án nhận tệp ngoài, cho tạo/thiết lập dự án rồi quay lại luồng nhập với nguồn vẫn giữ nguyên. Path không tồn tại, ổ mạng/USB mất kết nối hoặc đối tượng Explorer ảo không ánh xạ được filesystem phải được báo rõ, không suy đoán một root khác.

Khởi động nguội: exe nhận command-line có intent rõ và danh sách path, lưu hàng đợi trước khi UI sẵn sàng. App đã chạy: dùng single-instance để chuyển yêu cầu vào instance hiện tại, đưa cửa sổ lên trước và xử lý đúng một lần. Không ghép path thành shell command, không dùng eval; xử lý Unicode, khoảng trắng, dấu ngoặc, &, dấu nháy và quy tắc quote Windows đúng. Mở yêu cầu không tự move/delete/rename; hành động thay đổi dữ liệu luôn theo luồng nhập/xem trước đã chốt. Không chạy tác vụ quét hay mạng nặng trong quá trình Explorer dựng menu.

Triển khai ban đầu: NSIS installer hooks đăng ký shell verb cho tệp, thư mục và folder background theo phạm vi cài đặt, ưu tiên per-user. Thêm Cài đặt → Tích hợp Windows → bật/tắt Open in HFolder; việc thay đổi được áp dụng qua native service có kiểm tra. Cài/repair/update phải idempotent, trỏ đúng exe hiện hành, không thêm mục trùng; gỡ app/tắt tích hợp chỉ xóa registration do HFolder sở hữu, không xóa dữ liệu dự án. Không thay app mặc định mở PDF/Word hoặc chiếm thao tác double click của Explorer.

Trên Windows 11, shell verb legacy có thể nằm trong Show more options. Để hiện trong menu mới trực tiếp, bổ sung IExplorerCommand native shell extension và app identity qua packaging/sparse package phù hợp theo tài liệu Microsoft. Đây là hạng mục tích hợp riêng, cần spike installer/updater/COM DLL và architecture; không hứa chỉ thêm registry là xuất hiện trong menu hiện đại. Menu dựng nhanh, chỉ chuyển yêu cầu về HFolder khi Invoke; không tải Next.js hoặc nghiệp vụ file vào tiến trình Explorer.

Phạm vi: menu Explorer legacy và routing single-instance thuộc bản đầu; tích hợp menu hiện đại Windows 11 là bước nâng cấp tiếp theo sau khi xác minh đóng gói. Multi-select phải kiểm tra đúng cơ chế truyền tập chọn của phương pháp đăng ký; không mặc định static verb tự truyền mọi tệp trong một invocation. Nếu Explorer phát nhiều activation, app thu nhận/gộp vào hàng đợi và không mở nhiều instance. Với tập chọn gồm nhiều thư mục ngoài dự án, hiển thị danh sách yêu cầu thiết lập, không âm thầm tạo nhiều dự án.

### 7.5. AI hỗ trợ đặt tên và phân loại — giai đoạn cuối sau sản phẩm chính

**Mục tiêu:** AI đọc tên và nội dung tệp để quyết định nên giữ hay đề xuất đổi phần tên mô tả; gán loại, nhóm và nhãn từ danh mục đã cấu hình của dự án. Đây là tác vụ phân tích có đầu ra giới hạn, không cần xây chatbot, agent điều khiển máy hay cho AI truy cập toàn bộ filesystem.

**Điều kiện bắt đầu:** các chức năng P0/P1 đã chốt được triển khai, chạy end-to-end và nghiệm thu; không còn lỗi dữ liệu nghiêm trọng chưa xử lý; setup, mã duy nhất, đổi mã dây chuyền, phân loại thủ công/quy tắc, đối soát, import/move, updater và Explorer integration đã ổn định. Giai đoạn AI có backlog và ngân sách riêng; không phát triển các engine/model/OCR song song làm chậm sản phẩm chính. Giai đoạn hiện tại chỉ ghi nhận hợp đồng dữ liệu và điểm tích hợp, chưa lựa chọn bắt buộc model hoặc nhà cung cấp.

**Luồng sử dụng:** chọn một/nhiều tệp → AI đề xuất → kiểm tra quyền/phạm vi nội dung → trích xuất/đọc → phân tích nền → đưa kết quả vào bảng tên + phân loại hiện có → người dùng sửa/xác nhận → backend áp dụng và xác minh. Có thể mở từ New/import, context menu hoặc bảng đối soát sau khi tính năng AI được phát hành. Không bắt bật AI để hoàn tất setup hoặc xử lý đối soát.

**Đầu vào:** tên và phần mở rộng hiện tại, nội dung trích xuất cùng vị trí nguồn, quy tắc đặt tên, mô tả ngắn của danh mục loại/nhóm/nhãn hợp lệ, metadata đã xác nhận và đích hiện tại khi cần ngữ cảnh. Không gửi toàn bộ dự án nếu chỉ phân tích một tệp; danh mục lớn được thu hẹp ứng viên nhưng cho trả chưa xác định khi không có mục phù hợp.

**Đầu ra có cấu trúc:** keep_name hoặc suggest_rename hoặc needs_review; proposed_description; type_id; group_id nếu cần; tag_ids; căn cứ ngắn trích theo trang/đoạn và thông tin chưa chắc chắn. Tên hiện tại đúng và đủ mô tả thì giữ; nội dung thiếu/mơ hồ hoặc không đọc được thì Cần kiểm tra. Không bịa ngày, số hóa đơn, tên đối tác hoặc loại tài liệu. Mô hình chỉ chọn ID có sẵn, không tự tạo danh mục/mã/đường dẫn. Nếu cần gợi ý chuyển nhóm thư mục vật lý, thể hiện riêng và để ngoài phạm vi AI ban đầu; gán nhóm phân loại không ngầm di chuyển tệp.

**Áp dụng:** AI chỉ đề xuất phần mô tả và metadata. Naming/numbering engine của HFolder vẫn chuẩn hóa, bảo toàn phần mở rộng, cấp mã duy nhất và kiểm tra xung đột. Không tự ghi đè phân loại đã xác nhận; đánh dấu chênh lệch để người dùng duyệt. Nhãn độ tin cậy tự khai của model không phải xác suất đã được hiệu chỉnh; ưu tiên căn cứ và tiêu chí nghiệm thu. Bản AI đầu tiên không tự động rename/move hàng loạt không qua preview. Không có API AI tùy ý thực thi shell hoặc ghi filesystem.

**Đọc tệp:** PDF có text/Word/Excel dùng extractor phù hợp trước; ảnh/PDF scan dùng OCR riêng rồi phân loại, thử vision khi có lợi. Tài liệu dài đọc theo đoạn và tổng hợp thông tin cần thiết; nếu chỉ đọc một phần phải thể hiện phạm vi, không kết luận đã kiểm tra toàn tệp. Tệp mã hóa, hỏng, không hỗ trợ hoặc OCR không đạt giữ ở Cần kiểm tra. Chất lượng OCR và trích xuất là một phần của đánh giá, không chỉ chất lượng model.

**Ba phương án triển khai cần thử sau:** (1) AI chạy trên máy, HFolder quản lý engine/gói model và hỗ trợ tải một lần; (2) một máy AI dùng chung trong mạng văn phòng, máy trạm chỉ là client có xác thực; (3) dịch vụ cloud HFolder có hạn mức hoặc API key riêng. Chọn sau khi đo tốc độ, chất lượng, tài nguyên, chi phí và yêu cầu dữ liệu. Không bắt người dùng cấu hình provider/model phức tạp trong luồng thông thường; UI ưu tiên Bật AI trên máy hoặc Dùng dịch vụ đã được quản trị viên cấu hình.

**Thử nghiệm model cho máy văn phòng:** ứng viên tham khảo Qwen3.5-2B lượng tử hóa 4-bit; đối chiếu bản 0.8B cho chế độ nhẹ và 4B cho máy mạnh/máy dùng chung. Đây là danh sách thử nghiệm, không cam kết chọn model hay mức RAM tối thiểu. Kiểm tra tương thích engine/GGUF, giấy phép phân phối, tiếng Việt, phần cứng và bản lượng tử hóa tại thời điểm triển khai. Máy ít RAM/CPU cũ có thể dùng máy AI nội bộ thay vì cố chạy mỗi máy; không hứa máy 4 GB chạy tốt cùng Office/trình duyệt. Khởi động model theo nhu cầu, giới hạn context/concurrency và giải phóng tài nguyên khi không dùng.

**Kết nối ChatGPT:** là hướng tùy chọn cần đánh giá điều kiện tích hợp chính thức ở thời điểm làm AI; không thiết kế phụ thuộc vào tài khoản ChatGPT Free. API key cá nhân được bảo vệ ở native credential store, không nhúng shared key vào Next.js/bộ cài; key dịch vụ HFolder chỉ nằm server. Không dùng cookie phiên web hay API nội bộ không chính thức để lấy AI miễn phí. Với cloud, hiển thị nội dung/phạm vi sẽ gửi, xin người dùng bật cho dự án và có thể tắt; AI local không tự fallback sang cloud mà không được phép.

**Độ an toàn và khả năng phục hồi:** nội dung tài liệu là dữ liệu không đáng tin, không được coi là chỉ dẫn thay đổi chính sách hoặc thực thi công cụ. Tác vụ gắn entry UUID, dấu vân tay/version nội dung và config_version; tệp hoặc danh mục thay đổi trong khi chờ làm đề xuất hết hiệu lực và phải phân tích/kiểm tra lại. AI failure/offline/hết hạn mức không khóa chức năng chính, không tự chấp nhận đề xuất dở. Có hủy, tiến trình, journal metadata và cache theo nội dung + cấu hình để tránh phân tích lặp; không lưu toàn nội dung tài liệu/secret vào log chẩn đoán.

**Dữ liệu/module chỉ bổ sung lúc triển khai:** content_extractor, ocr_adapter, ai_provider_adapter, ai_analysis_service; bảng ai_jobs, ai_suggestions, ai_settings với provider/model/version, nguồn căn cứ, dấu vân tay nội dung, config_version và trạng thái duyệt. Kết quả đi qua operation planner hiện có; không tạo một đường ghi dữ liệu thứ hai. Tắt/gỡ AI không làm mất metadata đã được người dùng chấp nhận.

**Cổng nghiệm thu AI:** bộ đánh giá khoảng 100–300 tài liệu thực tế được gán đáp án trước, gồm hóa đơn/hợp đồng/báo cáo/ảnh scan, tiếng Việt có dấu, tên viết tắt, tài liệu dài và trường hợp ngoài danh mục. Tách tập phát triển và tập kiểm tra; so với baseline quy tắc hiện có. Đo độ đúng loại/nhãn, tỷ lệ sửa tên đúng, giữ nguyên tên đúng, tỷ lệ phải sửa thủ công/không xác định, lỗi bịa thông tin, p50/p95 độ trễ, peak RAM/CPU và chất lượng OCR end-to-end. Đặt ngưỡng chấp nhận theo nhóm tài liệu trước khi chạy đánh giá, không tự tuyên bố model nhỏ đã đủ tốt. Chỉ phân phối gói AI sau khi đạt trên máy văn phòng mục tiêu và kiểm thử không ảnh hưởng toàn vẹn mã/dữ liệu.

### 7.6. i18n và tiếng Việt mặc định

HFolder hỗ trợ tiếng Việt từ bản đầu và cấu trúc i18n ngay khi bắt đầu scaffold. Dùng translation key có namespace cho UI, validation, menu riêng, setup, đối soát, updater, thông báo và khả năng truy cập; không rải chuỗi tiếng Việt trực tiếp trong component hoặc backend. Backend trả error_code và parameters ổn định để frontend dịch; dữ liệu/log kỹ thuật giữ mã lỗi, không parse message đã dịch để điều khiển nghiệp vụ.

Chọn thư viện i18n tương thích Next.js static export khi có skill/quy định dự án; chưa khóa package trước đó. Locale là state/cài đặt runtime, không cần Next.js server hoặc route động cho từng đường dẫn filesystem. Mặc định vi-VN, lưu lựa chọn ngôn ngữ; thêm ngôn ngữ bằng catalog mới mà không đổi nghiệp vụ. Quy định fallback về tiếng Việt và test key thiếu; plural, placeholder, ngày/số/dung lượng dùng formatter theo locale, không nối chuỗi cứng.

Tên tệp/thư mục, mã, loại/nhóm/nhãn người dùng tạo và giá trị metadata không tự dịch khi đổi locale. Quy tắc bỏ dấu/đặt tên thuộc cấu hình dự án, không phụ thuộc ngôn ngữ giao diện. Tên mẫu hệ thống có thể được bản địa hóa trong thư viện, nhưng tên sau khi áp dụng là dữ liệu người dùng; đổi locale không đổi path trên đĩa. App name HFolder và ID kỹ thuật luôn ổn định. Tích hợp Explorer dùng nhãn bản địa hóa khi cơ chế đăng ký hỗ trợ và phải refresh registration có kiểm soát, không tác động file association mặc định.

Kiểm thử key/placeholder đầy đủ, font dấu tiếng Việt, đường dẫn Unicode, chuỗi dài, layout không cắt hành động quan trọng và locale switching không mất state. Ngôn ngữ thứ hai có thể bổ sung sau; trong phát triển có pseudo-locale để kiểm tra mở rộng chuỗi, không coi đó là cam kết dịch tiếng Anh ngay bản đầu.

### 7.7. Cấu trúc source trong repository

Chọn single repository, Next.js tại gốc (`src/app`, `src/features`, shared UI/IPC/contracts/i18n) và một Rust crate tại `src-tauri`. UI tổ chức theo feature: projects, explorer, classification, reconciliation, transfers, settings, updates. Rust phân tầng commands, application, domain và infrastructure; domain giữ quy tắc thuần, application điều phối use case/port, infrastructure hiện thực filesystem/SQLite/Windows/updater. Chi tiết và cây đã tạo tại [STRUCTURE.md](STRUCTURE.md).

Thư mục capabilities, migrations, icons, Windows installer, Rust integration tests; frontend unit/integration/E2E và synthetic fixtures có vị trí riêng. Chưa tạo code/config scaffold, dependencies hoặc workflow thực thi; `.gitkeep` chỉ giữ cấu trúc trống trong Git. Kế hoạch cấu trúc có thể tinh chỉnh theo skill/quy định người dùng trước khi implement, không bắt phải chia nhiều package/crate từ đầu.

## 8. Dữ liệu, tìm kiếm và cập nhật từ bên ngoài

Filesystem là nguồn sự thật về sự tồn tại của tệp. SQLite lưu cấu hình, danh mục tìm kiếm và nhật ký, không giữ nội dung tài liệu.

| Nhóm bảng | Dữ liệu chính |
|---|---|
| projects | id, root, tên hiển thị, setup_status, setup_step, trạng thái đối soát, phiên bản cấu hình đã xác nhận |
| app_preferences / project_scope_rules | locale vi-VN mặc định và UI preferences; chính sách mục đặc biệt/loại trừ, phiên bản/phạm vi/lý do, tách khỏi danh mục phân loại |
| setup_drafts / config_copy_history | dữ liệu wizard dở dang, phiên bản nguồn đã sao chép, ánh xạ ID đích; không tạo quan hệ đồng bộ với nguồn |
| naming_profiles / branch_rules | width từng cấp, cách hiển thị, separators, điểm bắt đầu, kiểu chữ, phiên bản quy tắc |
| entries | project, đường dẫn tương đối, parent, loại, tên thật, tên hiển thị, mã, metadata và identity nếu lấy được |
| counters | project + parent + bộ quy tắc, high-water mark |
| code_registry / code_reservations | mã chuẩn hóa dùng chung tệp/thư mục; UNIQUE(project_id, code_key); mã đang được giữ chỗ theo operation |
| code_history | chủ sở hữu và mã trước/sau, lịch sử cấp/đổi/thu hồi |
| project_snapshots / external_changes | baseline, thay đổi chưa xác nhận, mức độ lỗi và trạng thái đối soát |
| reconciliation_issues / reconciliation_drafts | tập mục bị ảnh hưởng, issue_id, trạng thái, vị trí cũ/mới, tên/metadata dự kiến và dependency group; badge là dữ liệu suy ra từ tập mục chưa xử lý |
| templates / template_nodes | cây mẫu, thứ tự và loại node |
| taxonomy_definitions / taxonomy_groups | loại tài liệu, nhóm logic/nhóm nhãn, ID ổn định, tên, đối tượng áp dụng, trạng thái và thứ tự |
| tags / entry_tags / entry_classifications | nhãn và liên kết mục, loại/nhóm, nguồn gán, trạng thái xác nhận, phiên bản |
| branch_metadata_defaults | mặc định theo nhánh, phạm vi kế thừa, trường bắt buộc và nguồn giá trị |
| classification_rules | phạm vi, mẫu so khớp, ưu tiên, hành động gợi ý/tự gán đã được bật rõ |
| template_bundles / template_imports | mẫu hệ thống/tự tạo, version, ánh xạ định nghĩa đã nhập và xử lý xung đột |
| operations / operation_steps | trước/sau, trạng thái, lỗi, điều kiện hoàn tác |
| transfers / import_sources | nguồn URL/path, tên gốc, chế độ tên, metadata/đích dự kiến, tiến trình, staging, validator và trạng thái; che/tách token nhạy cảm |
| app_update_state / schema_migrations | version hiện tại/đích, trạng thái kiểm tra/tải/cài, lần kiểm tra, migration schema và backup; không lưu private signing key |
| sessions / tab_state | tab, vị trí, view, sort, history |

Định danh DB dùng UUID; không dùng path làm ID duy nhất. File identity của hệ điều hành hỗ trợ theo dõi rename, nhưng mất identity/copy khác volume phải đối soát chứ không giả định giữ nguyên.

DB đặt trong thư mục dữ liệu riêng của app. Không tự ghi file cấu hình ẩn vào mọi dự án. Cho xuất/nhập cấu hình dự án, cây mẫu và mốc đánh số để sao lưu/chuyển máy; không xuất đường dẫn máy cũ như đường dẫn hợp lệ của máy mới. Migration DB có version và bản sao trước khi nâng cấp. Backup phải có cả danh mục và liên kết phân loại theo mục; chỉ sao chép cây thư mục sang máy khác không tự mang theo metadata đang lưu trong DB app. Cơ chế phục hồi phải đối soát danh tính mục trước khi gắn lại liên kết; nếu không chắc thì yêu cầu xác nhận.

Hiển thị cây tạm thời ở chế độ chỉ xem khi đang kiểm tra mở dự án; chưa bật thao tác ghi cho đến khi đối soát xong. Chỉ mục tìm kiếm có thể xây nền riêng sau bước kiểm tra toàn vẹn mã. Chỉ mục tên có phiên bản không dấu và không phân biệt hoa/thường; ưu tiên mã chính xác, tên chính xác, tiền tố, rồi chứa chuỗi; fuzzy để sau. Chưa tìm nội dung Word/PDF ở MVP.

Chỉ mục tìm kiếm liên kết ID loại/nhóm/nhãn và trạng thái phân loại; truy vấn kết hợp với tên/mã mà không yêu cầu keyword xuất hiện trong tên. Đổi tên loại cập nhật cách hiển thị và từ khóa tìm, không cần đổi tên tệp. Dữ liệu nhóm theo nhãn nhiều giá trị phải định nghĩa rõ: một mục có thể xuất hiện trong nhiều nhóm, tổng mục duy nhất không bị cộng trùng; tùy chọn Khác/Chưa phân loại luôn rõ ràng. Bộ lọc và nhóm theo được nhớ riêng theo tab và kiểm tra lại khi cấu hình thay đổi.

Watcher cập nhật mục bị ảnh hưởng, debounce theo lô, phân biệt sự kiện thuộc operation đang được app ghi với thay đổi chưa biết nguồn gốc. Watcher có thể bỏ sót sự kiện, nên bắt buộc đối soát khi mở lại dự án, sau reconnect, khi phát hiện mất sự kiện, trước thay đổi nhạy cảm và theo lệnh Refresh. Khi có dấu hiệu bỏ sót sự kiện phải kiểm tra lại toàn cây trước khi mở khóa ghi. Không quét lại toàn bộ cây cho mỗi phím gõ. Quản lý watcher theo dự án, không nhân bản theo tab.

### 8.1. Đối soát bắt buộc khi mở app hoặc mở dự án

Điều kiện sử dụng gồm hai cổng: cấu hình đã hoàn tất và kiểm tra toàn vẹn đạt. Dự án chưa hoàn tất cấu hình quay về wizard dù filesystem không có lỗi. Sau khi đã cấu hình: Đang kiểm tra → Sẵn sàng, hoặc Cần đối soát → Đang sửa → Xác minh lại → Sẵn sàng. Lỗi giữa thao tác đổi mã có trạng thái Cần phục hồi riêng; mất root là Mất kết nối. Chỉ dự án có cấu hình hoàn tất và Sẵn sàng được chạy command làm việc thông thường.

Khi mở app, kiểm tra mọi dự án được khôi phục thành tab; dự án chỉ lưu trong danh sách gần đây được kiểm tra khi mở. So sánh cây thực tế với snapshot đã xác nhận, registry mã và quy tắc. Baseline chỉ cập nhật sau khi thao tác app đã được xác minh hoặc người dùng hoàn tất đối soát, không cập nhật âm thầm rồi mất dấu thay đổi.

Phân loại: mục thêm/xóa, đổi tên/di chuyển, mã trùng giữa bất kỳ tệp/thư mục nào, thiếu mã, sai cha, sai width, tên sai chuẩn, metadata nội dung thay đổi và mục không đọc được. Thay đổi size/mtime được báo là dấu hiệu nội dung đã đổi; metadata scan không chứng minh không có thay đổi byte. Nếu sau này cần kiểm tra toàn vẹn nội dung tuyệt đối, bổ sung fingerprint/hash theo chính sách riêng và đo chi phí.

App hiển thị cảnh báo bắt buộc và vùng Cần đối soát, nêu đường dẫn và thay đổi trước/sau. Không dùng hộp thoại chặn toàn bộ điều hướng vì người dùng cần lần theo cây đến mục lỗi. Khóa tạo, đổi tên/mã, copy/cut/paste/move và xóa thông thường trong dự án đang lỗi; vẫn cho duyệt cây, chọn mục, xem danh sách/báo cáo, mở bảng xử lý lỗi và thoát/đóng tab. Không có Bỏ qua và tiếp tục ghi. Các dự án khác đã đạt kiểm tra vẫn dùng bình thường.

### 8.2. Cách người dùng xử lý ngay

| Thay đổi phát hiện | Hướng xử lý |
|---|---|
| Tệp/thư mục mới ngoài app | Cấp mã, chuẩn hóa tên và xác nhận tiếp nhận |
| Mã trùng | Hiển thị tất cả chủ thể; chọn mục giữ mã, cấp mã khác cho các mục còn lại và cập nhật hậu duệ |
| Đổi tên nhưng mã đúng | Chấp nhận tên mới nếu hợp lệ, hoặc lập kế hoạch khôi phục/chuẩn hóa |
| Chuyển nhánh nhưng mã còn theo cha cũ | Cấp mã theo cha hiện tại hoặc người dùng chủ động chọn đưa về vị trí cũ |
| Thay số cha bên ngoài | Preview và sửa toàn bộ mã hậu duệ tương ứng; kiểm tra xung đột toàn dự án |
| Mục đã xóa | Xác nhận xóa khỏi registry đang hoạt động, giữ lịch sử; không tự tạo lại tệp rỗng thay nội dung đã mất |
| Nội dung tài liệu được lưu từ ứng dụng mở bằng double click | Xác nhận cập nhật snapshot nếu mã/tên/vị trí vẫn hợp lệ; không bắt đổi tên chỉ vì nội dung đổi |
| Không truy cập được root hoặc một nhánh | Báo chưa thể xác minh, yêu cầu kết nối/cấp quyền lại; không coi là xóa và không mở khóa ghi |

Sửa có đề xuất tự động nhưng phải xem trước và xác nhận. Người dùng có thể xử lý từng lỗi hoặc Áp dụng các sửa đề xuất; không tự chọn bản nào được giữ mã khi không đủ bằng chứng. Sau sửa phải quét xác minh lại, chỉ mở khóa khi không còn lỗi và các thay đổi hợp lệ đã được xác nhận.

Việc thay đổi ngoài app là khả năng luôn tồn tại vì đây là thư mục thật. App bắt buộc phát hiện sai lệch ở các điểm kiểm tra, chặn thao tác của chính nó và hướng dẫn sửa; không hứa cấm File Explorer hoặc phần mềm khác tạo sai lệch khi app không kiểm soát chúng.

### 8.3. Cảnh báo trên cây và thông báo điều hướng

Mục có vấn đề có icon cảnh báo, mô tả lỗi và trạng thái đang xử lý. Mọi thư mục tổ tiên lên tới root/tab có badge số mục cần xử lý trong nhánh. Đếm theo tập mục duy nhất, không đếm số lỗi; một tệp thiếu mã và thiếu loại chỉ tính một mục. Báo riêng vấn đề thuộc chính thư mục cha để không nhầm với lỗi chỉ nằm ở bên dưới. Dùng icon/text cùng màu, không chỉ màu để truyền thông tin.

Thông báo trong app có hành động Đi tới mục cần đối soát. Một mục: kích hoạt đúng tab, mở rộng các ancestor, điều hướng đến thư mục chứa, scroll tới và chọn/làm nổi bật mục. Nhiều mục: mở danh sách Cần đối soát theo dự án, hỗ trợ lọc và chọn hàng loạt; từng dòng có Đi tới. Badge của thư mục mở danh sách đã lọc theo nhánh hoặc mở rộng nhánh để lần theo. Gộp thông báo theo đợt/dự án, cập nhật số lượng thay vì phát một thông báo cho mỗi sự kiện watcher.

Thông báo tham chiếu issue_id/entry_id với vị trí mới nhất, không dựa duy nhất vào path cũ. Mục bị xóa/không xác định vị trí mở bản ghi thay đổi và thư mục cha gần nhất còn tồn tại; không giả vờ chọn tệp không còn trên đĩa. Mục đã giải quyết thì thông báo cũ hiển thị trạng thái đã xử lý hoặc chuyển sang lỗi còn lại.

### 8.4. Bảng đối soát tên và phân loại dùng chung

Luồng: theo badge/thông báo hoặc danh sách Cần đối soát → chọn nhiều → chuột phải chọn cách xử lý → hoàn thiện tên và phân loại trong một bảng → xem trước → Áp dụng các dòng hợp lệ → xác minh lại.

| Cột | Thông tin |
|---|---|
| Chọn / Mục / Vị trí | Tên hiện tại, thư mục chứa, định danh và tập chọn |
| Vấn đề | Thêm mới/đổi ngoài app, thiếu hoặc trùng mã, sai tên, metadata bắt buộc còn thiếu |
| Mã và tên dự kiến | Tên cuối sau chuẩn hóa và cấp/sửa mã, cảnh báo xung đột |
| Loại / Nhóm / Nhãn | Giá trị hiện có, mặc định hoặc gợi ý và nguồn/trạng thái xác nhận |
| Trạng thái dòng | Cần bổ sung, Xung đột, Hợp lệ, Đang áp dụng, Đã xác minh, Thất bại |

Giữ tên và chuẩn hóa giữ phần mô tả gốc, chuẩn hóa và cấp/sửa mã; không cam kết giữ mọi ký tự nguyên xi. Đổi tên và chuẩn hóa mở các ô tên và công cụ tìm/thay thế, tiền tố/hậu tố cho phần mô tả; mã do numbering engine cấp, phần mở rộng hiển thị riêng. Thiết lập phân loại mở đúng phần metadata. Chuyển chế độ không mất thông tin đã điền; không thực hiện ba bước độc lập buộc người dùng làm lại.

Phân loại ban đầu ưu tiên giá trị đã xác nhận nếu đúng danh tính, rồi mặc định nhánh phù hợp, rồi gợi ý quy tắc. Trường thiếu bắt buộc và mâu thuẫn hiện rõ; thiếu nhãn tùy chọn không chặn. Với mục đổi nội dung nhưng tên/mã còn hợp lệ, chỉ yêu cầu xác nhận cập nhật, không ép đổi tên/phân loại lại.

Phía trên bảng có vùng Áp dụng cho các dòng được chọn, nhận kéo chip Loại/Nhóm/Nhãn từ cấu hình. Mặc định Chỉ điền phần thiếu; chế độ Thay thế giá trị hiện tại phải hiển thị ảnh hưởng. Nhãn có Thêm và Bỏ riêng; mixed values hiện “Nhiều giá trị”, không tự coi thành rỗng rồi ghi đè. Gán có chủ đích xác nhận giá trị; gợi ý chưa được chấp nhận không tự thành đã xác nhận. Nhóm suy ra từ loại không bắt nhập lại.

Nếu thiếu định nghĩa cần dùng, có liên kết tới Cài đặt dự án và quay lại giữ nguyên draft bảng. Khi dự án đang khóa do đối soát, việc thêm định nghĩa cần thiết chỉ được phép qua ngữ cảnh sửa lỗi có kiểm tra/journal, không mở khóa mọi sửa cấu hình; thay đổi naming/width ngoài kế hoạch khiến preview phải dựng lại. Không buộc người dùng đổi sang một loại không phù hợp chỉ để vượt qua lỗi.

### 8.5. Áp dụng một phần và gỡ cảnh báo

Nút ghi rõ số dòng hợp lệ sẽ được áp dụng và số dòng còn lỗi; cho phép sửa một phần nhưng không báo toàn dự án đã xong. Những thay đổi phụ thuộc nhau như sửa mã cha/con hoặc giải quyết mã trùng phải gom thành tập phụ thuộc và áp dụng cùng kế hoạch, không bỏ qua riêng một dòng làm phần còn lại sai. Backend kiểm tra snapshot, mã duy nhất và metadata bắt buộc trước khi thực hiện.

Sau mỗi đợt, xác minh mục/tập phụ thuộc, cập nhật registry/index/baseline của phần đã chấp nhận, tính lại badge ancestor và thông báo. Không cập nhật baseline cho phần chưa xử lý rồi làm mất cảnh báo. Dự án chỉ Sẵn sàng khi quét lại đạt, không còn vấn đề chưa xử lý và mọi thay đổi hợp lệ cần xác nhận đã được chốt. Nếu sửa thất bại thì giữ cảnh báo và journal, không gỡ badge chỉ vì đã bấm Áp dụng.

Danh sách lớn dùng virtualization; không tính tổng dung lượng mọi thư mục khi render. Thumbnail và thống kê đệ quy tải theo nhu cầu, có hủy.

## 9. Backlog và lộ trình theo cổng nghiệm thu

Các giai đoạn theo phụ thuộc; không cam kết số ngày khi chưa biết nhân lực và mức độ hoàn thiện giao diện. Ước lượng sau giai đoạn khảo sát kỹ thuật.

| Giai đoạn | Công việc | Điều kiện hoàn thành |
|---|---|---|
| 0. Chốt đặc tả và thử nghiệm kỹ thuật | Wireframe, mã duy nhất toàn dự án, width tùy chỉnh, nhận diện cây bất kỳ, đổi mã dây chuyền, thử Unicode/long path/watch trên Windows | Mô hình mã không mơ hồ; có nguyên mẫu migration và phát hiện sửa ngoài app |
| 1. Khung duyệt nhiều dự án | Tauri, tabs, project registry, tree/list, breadcrumb, khôi phục phiên, mở Explorer | Mở 3 root độc lập; đóng/mở app giữ vị trí; không sửa dữ liệu khi tiếp nhận cây |
| 2. Thiết lập, cấp mã và phân loại | Wizard tự thiết kế/kéo mẫu/chuẩn hóa cây cũ; registry chung tệp-thư mục, width, rename dây chuyền; cài đặt loại/nhóm/nhãn, thư viện mẫu và mặc định nhánh | Không trùng mã; migration phục hồi được; tự cấu hình taxonomy hoặc kéo mẫu và dùng được mà không bắt gõ metadata lặp lại |
| 3. Explorer và đối soát | Double click, context menu riêng, kéo thả gán metadata/hàng loạt, quy tắc gợi ý, tìm/lọc/nhóm theo, watcher, đối soát, copy/cut/paste/move, journal/undo | Lọc đúng loại dù tên viết tắt; phân loại không di chuyển file; thay đổi ngoài app chặn ghi đến khi sửa; chuyển giữa tab không trùng mã/mất nguồn |
| 4. Beta Windows và updater | Recycle Bin, kiểm thử lớn, khả năng truy cập, Next.js export offline, installer, CI phát hành ký updater, nâng cấp và migration/recovery | Cài được trên máy sạch và cập nhật bản cũ lên bản mới; dữ liệu/draft giữ nguyên, không cài giữa file operation |
| 5. Sau bản đầu | Column view, mẫu bộ hồ sơ, tích hợp clipboard Explorer, gợi ý phân loại | Mỗi tính năng có preview/undo/phạm vi riêng và được đo trước khi phát hành |
| 6. AI sau khi HFolder hoàn thiện | Trích xuất/OCR, thử model local/LAN/cloud, đề xuất tên và loại/nhãn trong bảng xem trước | P0/P1 đã hoàn thành, ổn định; AI đạt bộ đánh giá tài liệu thực tế và không làm giảm an toàn/tốc độ của chức năng chính |

Gói nâng cao ưu tiên đầu tiên: New → Tải từ liên kết, source inspection, đặt tên/phân loại trước tải, staging, hàng đợi/tiến trình, hủy/thử lại và phục hồi. New → Nhập từ đường dẫn máy đã có trong giai đoạn 3; downloader mạng có cổng nghiệm thu riêng ở mục 6.3, không làm chậm kiểm chứng nguyên mẫu cốt lõi. Có thể đưa downloader vào bản đầu nếu đã đạt các kiểm thử cần thiết; xác thực dịch vụ và resume bằng Range làm sau.

P0 cho bản đầu: các giai đoạn 1–4, bao gồm cấu hình bắt buộc trước sử dụng, lưu nháp/tiếp tục wizard và sao chép cấu hình độc lập từ dự án khác; chuẩn hóa cây cũ, mã duy nhất toàn dự án, tùy chỉnh width, đổi mã dây chuyền, double click, context menu riêng, đối soát bắt buộc, taxonomy tùy biến, mẫu phân loại kéo thả, metadata mặc định/hàng loạt, quy tắc tên cơ bản, tìm/lọc/nhóm theo metadata và New → Nhập từ đường dẫn máy. P1: New → Tải từ liên kết ưu tiên đầu tiên, mẫu bộ hồ sơ tạo kèm nội dung, column view, export/import cấu hình hoàn chỉnh. P2: preview Office/PDF, tìm nội dung, AI/OCR, cloud/team, xác thực dịch vụ tải và resume nâng cao.

Trong giai đoạn 3 và P0 bổ sung đầy đủ Shift/Ctrl/Ctrl+Shift, chọn vùng/Ctrl+A trên virtualization, drag move/copy giữa thư mục/tab, badge lỗi lan ancestor, thông báo dẫn đúng mục và bảng đối soát tên + phân loại hàng loạt. Giai đoạn 4 phải nghiệm thu các luồng này trước khi phát hành.

Next.js static export và updater có ký xác thực thuộc P0. Giai đoạn 0 thử bản Tauri đóng gói với Next.js ngay từ đầu, kiểm tra quyền plugin-updater và dựng pipeline release thử nghiệm; giai đoạn 4 kiểm thử nâng cấp thực từ một bản đã cài, không chỉ chạy dev.

HFolder là tên chính thức trong toàn bộ deliverable sản phẩm. Giai đoạn 1 thêm external-open routing/single-instance; giai đoạn 4 thêm NSIS Explorer menu, bật/tắt, upgrade/uninstall và nghiệm thu Windows 11 Show more options. IExplorerCommand/menu Windows 11 hiện đại thuộc P1 sau spike packaging/app identity.

Ưu tiên AI được chốt ở P2/giai đoạn 6, SAU P0 và các tính năng P1 đã chốt. Giai đoạn 5 “gợi ý phân loại” là quy tắc cấu hình và cải tiến UX, không phải triển khai LLM/OCR sớm. Cloud/team, mobile và các ý tưởng tương lai chưa chốt không phải điều kiện vô hạn phải hoàn thành trước AI. Tại cổng cuối P1, đánh giá lại readiness và lên lịch riêng cho AI.

## 10. Nghiệm thu và kiểm thử

### Luồng người dùng

- Explorer → Open in HFolder khi app tắt/đang chạy mở đúng một instance, đúng root/tab/path. Tệp ngoài app chỉ được đưa vào preview import, không tự move.
- Thư mục ngoài root luôn đi qua setup bắt buộc; thư mục con không tạo dự án lồng; dự án lỗi dẫn tới đối soát. Bật/tắt menu, update/repair/uninstall không để mục trùng hoặc command trỏ exe cũ.
- Test multi-select, path có dấu/khoảng trắng/ký tự shell, ổ mất kết nối và đối tượng ảo; không thực thi path như lệnh. Ghi rõ vị trí menu legacy trên Windows 11 trước khi cam kết nghiệm thu menu hiện đại.
- Bản cài Tauri chạy Next.js export khi offline, không cần next dev/next start hoặc Node.js runtime; restore tabs và điều hướng hoạt động trong bundle thật.
- Kiểm tra updater tìm đúng bản mới, hiện release notes, tải/xác thực/cài rồi khôi phục dự án, metadata và draft; lỗi mạng hoặc không có bản mới không chặn dùng app.
- Chữ ký không hợp lệ bị từ chối. Yêu cầu cài trong khi rename/move/đối soát đang ghi phải chờ điểm an toàn, không làm gián đoạn dữ liệu.
- Nâng cấp DB thành công giữ liên kết mã/nhãn; migration lỗi khởi động vào phục hồi với backup nhất quán, không tự downgrade hay mất dữ liệu.
- Một tệp có nhiều lỗi chỉ làm badge mỗi ancestor tăng một mục; sửa đạt giảm đúng số. Thông báo đơn đi đúng tab/cha/tệp; nhiều lỗi mở danh sách đối soát; tệp đã xóa mở bản ghi thay đổi.
- Chọn hàng loạt mục lỗi bằng Ctrl/Shift/chọn vùng, chuột phải Giữ tên và chuẩn hóa hoặc Đổi tên và chuẩn hóa; cùng bảng hoàn thiện loại/nhãn bắt buộc, giữ draft khi đổi chế độ hoặc đi Cài đặt.
- Chỉ áp dụng dòng hợp lệ độc lập; lỗi liên quan cha/con hoặc mã trùng không bị tách sai. Còn lỗi thì badge và khóa ghi vẫn giữ; cảnh báo chỉ gỡ sau xác minh.
- Ctrl toggle, Shift range theo thứ tự đang hiển thị và Ctrl+A không bỏ sót dòng ngoài viewport. Kéo vùng từ nền không thành move; kéo mục đã chọn giữ nguyên tập chọn.
- Drag move/copy hiển thị đúng đích và modifier, chuyển tab bằng hover không tự move; thả vào vùng nhãn không di chuyển file; thả vào cha/hậu duệ hoặc dự án đang khóa bị chặn.
- New có nguồn URL và path; chọn đích, thông tin phân loại và Giữ tên nguồn/Tên mới trước khi thực hiện. Tên nguồn vẫn được chuẩn hóa và cấp mã; phần mở rộng không bị thay đổi thành định dạng khác chỉ do sửa tên.
- Dán path/kéo tệp cục bộ rồi xác nhận Di chuyển đưa đúng tệp vào đúng vị trí; không mất nguồn khi copy khác volume lỗi. Xóa nguồn lỗi sau hoàn tất đích phải báo trạng thái một phần và có journal.
- Tải direct URL có Content-Disposition tiếng Việt hoặc redirect ra tên khác vẫn preview/chốt đúng. Thiếu tên thì yêu cầu nhập; URL trả trang đăng nhập/lỗi không được báo tải thành công dưới tên tài liệu dự kiến.
- Hủy/lỗi mạng/hết dung lượng/đóng app không để bản dở xuất hiện như tệp hoàn chỉnh trong dự án; số mã không trùng khi nhiều download cùng chờ hoàn tất.
- Đổi/xóa thư mục đích, đổi quy tắc mã hoặc phát hiện lỗi đối soát trong lúc đang tải phải giữ bản staging và chốt lại kế hoạch, không tự lưu sai chỗ.
- Dự án mới hoặc tiếp nhận root cũ không được sử dụng trước khi hoàn tất checklist cấu hình và xác minh cây. Lưu nháp/đóng/mở lại tiếp tục wizard; gọi backend trực tiếp không vượt được cổng.
- Setup cho phép loại/nhóm/nhãn trống và bổ sung sau; không có lỗi yêu cầu tối thiểu một giá trị. Chính sách phân loại bắt buộc chỉ được bật khi có danh mục phù hợp.
- Mã mặc định 03.01.001, thay width/phân cách trong setup vẫn tuân thủ mã duy nhất. Giao diện tiếng Việt qua i18n; đổi locale không đổi tên/mã/danh mục người dùng.
- Tệp không đuôi không bị tự thêm đuôi; hidden không được tự loại trừ; technical exclusion không gây lỗi thiếu mã; .lnk/.url thao tác chính liên kết và không tự sửa đích. Junction/symlink không bị theo ra ngoài root hoặc tạo vòng quét.
- Kéo cấu hình dự án A sang B tạo bản sao độc lập; ID danh mục được ánh xạ đúng, không mang file/UUID/counter/path tuyệt đối của A. Đổi cấu hình A không thay đổi B.
- Sao chép thiếu ánh xạ nhánh hoặc có cấu hình xung đột chưa cho Hoàn tất; sau xử lý hợp lệ mới áp dụng. Đã sao chép vẫn phải xác nhận bước cuối.
- Tạo dự án trống và cây nhóm nhiều cấp từ wizard; nhận lỗi tên trước khi ghi.
- Mở Joyworld hiện tại không làm đổi bất kỳ tên/path nào ngoài thao tác chủ động đã xác nhận.
- Theo cấu hình mặc định, đang ở 03.01, nhập “Thanh toán tên miền tháng 10”, tạo đúng 03.01.001 Thanh_toan_ten_mien_thang_10 hoặc số tiếp theo đang có. Kiểu legacy 0301.001 chỉ dùng khi dự án chủ động cấu hình như vậy.
- Xóa 002 không làm 003 thành 002; sort theo ngày không sửa tên.
- Có 3 tab dùng 3 bộ quy tắc khác nhau; chuyển tab khôi phục đúng state và kết quả tìm.
- Tìm “thanh toan” thấy tên có dấu và không dấu; copy breadcrumb trả path thật.
- Đổi tên qua File Explorer được app phát hiện/đối soát; mất ổ đĩa không khiến app báo thư mục rỗng như dữ liệu đã xóa.
- Tự đặt tên nhóm bất kỳ, không chọn mẫu Joyworld, thiết lập và sử dụng đầy đủ được.
- Tiếp nhận cây sẵn có, xem trước và cấp lại mã chuẩn cho cả tệp/thư mục, giữ nội dung và phần mở rộng.
- Không thể cấp cùng mã cho hai tệp, hai thư mục hoặc một tệp và một thư mục ở bất kỳ vị trí nào trong dự án. Dự án khác được dùng mã đó.
- Đổi 03 thành 07 cập nhật mọi con/cháu; đổi width [2,2,3] thành [3,3,4] cập nhật tên/path nhất quán. Thu hẹp width có số không vừa bị chặn.
- Gián đoạn giữa khi đổi mã không để dự án quay về Sẵn sàng với cây trộn mã cũ/mới; có phục hồi theo journal.
- Double click tệp mở đúng app mặc định; thư mục điều hướng; không có app liên kết thì báo rõ.
- Chuột phải tệp, thư mục, nhiều mục, vùng trống và tab mở menu riêng đúng ngữ cảnh, không hiện menu WebView/Tauri mặc định.
- Khi app tắt, tạo tệp thiếu mã, đổi tên, move nhánh hoặc tạo mã trùng bằng Explorer; mở app phải hiển thị cảnh báo và khóa ghi dự án đó đến khi xử lý/xác minh xong. Không có lối bỏ qua để tiếp tục ghi.
- Lưu thay đổi nội dung tài liệu từ phần mềm ngoài app yêu cầu xác nhận cập nhật, không ép đổi mã khi cấu trúc vẫn hợp lệ.
- Dự án không nhập bộ mẫu hệ thống vẫn tự tạo loại/nhóm/nhãn và sử dụng đầy đủ được; không xuất hiện các loại Joyworld bắt buộc.
- Kéo bộ mẫu/loại/nhãn sang Cài đặt để dùng, kéo lại không tạo bản sao ngầm; tên trùng có bước giải quyết rõ.
- Tạo thư mục chỉ nhập tên nếu nhánh đã có đủ mặc định hoặc trường phân loại là tùy chọn; import giữ tên nguồn và metadata điền sẵn, không bắt gõ lại.
- Kéo chip Hợp đồng lên nhiều tệp gán loại mà không di chuyển/đổi path. Kéo tệp lên thư mục thật có preview import/move riêng; không nhầm hai thao tác.
- Tệp hd_abc.pdf đã gán Hợp đồng xuất hiện khi lọc Hợp đồng. Tệp khác chỉ có hd trong tên không bị tự khẳng định là Hợp đồng nếu chưa đủ quy tắc.
- Đổi tên loại hoặc mã tệp vẫn giữ liên kết metadata; xóa/ngừng dùng loại không làm mất phân loại đã gán mà không có kế hoạch chuyển đổi.
- Mặc định loại của hồ sơ thư mục không tự gán sai cho mọi tệp bên trong; thay mặc định nhánh không ghi đè mục đã xác nhận.
- Tất cả thao tác áp dụng mẫu/gán metadata bằng kéo thả có cách tương đương dùng bàn phím, không cần nhập lại tên danh mục.

### Bộ kiểm thử quan trọng

Unit Rust cho Unicode tiếng Việt dạng tổ hợp/dựng sẵn, đ/Đ, khoảng trắng, ký tự cấm, tên dành riêng, trùng tên sau chuẩn hóa, parse mã, gaps, overflow, high-water và nhận diện legacy. Bổ sung property tests cho bất biến mã duy nhất, ranh giới segment khi width thay đổi, cùng mã dưới các cách padding, đổi cha cập nhật mọi hậu duệ và hoán đổi không gây xung đột trung gian.

Integration trên thư mục tạm: tạo trùng đồng thời, rename chỉ khác hoa/thường, nguồn bị thay đổi ngoài app, thiếu quyền, file đang mở/khóa, full disk, mất ổ, copy/move lỗi giữa chừng, move khác volume, chặn di chuyển vào hậu duệ, junction/symlink ra ngoài root, undo sau khi đích có dữ liệu mới. Có fault injection để tái hiện lỗi; không chỉ test happy path.

Kiểm thử UI/E2E: wizard, tabs độc lập, bàn phím/focus, breadcrumb, chọn nhiều, menu riêng đúng ngữ cảnh, menu không tràn, double click tệp/thư mục, đích tạo mới rõ ràng, thao tác copy/move giữa tab. Thử gọi trực tiếp backend command ghi khi dự án Cần đối soát để bảo đảm không chỉ khóa bằng UI. Thử startup scan lỗi/mất root và thay đổi phát sinh giữa preview/commit. Chạy trên Windows thực ngoài các test frontend giả lập.

Bổ sung test quy tắc mơ hồ hd, xung đột nhiều rule, không ghi đè phân loại đã xác nhận, kế thừa theo đối tượng và nhánh gần nhất, bulk mixed values, kéo thả sai vùng, áp mẫu lặp/xung đột tên, gỡ định nghĩa đang dùng, undo metadata, ánh xạ taxonomy khi chuyển dự án, khôi phục DB và bộ lọc OR/AND. Đo số lần phải gõ ở các luồng tạo/import thường gặp; mục tiêu tạo thư mục đã có cấu hình chỉ gõ tên, import loạt chỉ giải quyết phần thiếu/xung đột.

Bộ test downloader dùng HTTP server fixture: HEAD không được hỗ trợ, filename*/filename, path traversal trong tên server, redirect loop, 401/403/404, HTML thay file, thiếu Content-Length, mất mạng/cắt luồng, tên/phần mở rộng mơ hồ, tệp lớn, cancel/retry, không ghi token vào log và race đổi đích lúc tải. Local import test đường dẫn có dấu/khoảng trắng, file bị khóa/thay thế, source thuộc dự án khác đang đóng, source=destination, thiếu quyền xóa và thất bại khác volume. Kiểm thử bảo đảm downloader không khóa ghi dự án trong suốt thời gian chờ mạng và không tự mở/chạy tệp tải về.

### Mục tiêu hiệu năng cần đo

Kiểm thử updater với manifest lỗi/không có bản mới, sai architecture, artifact tải dở, sai chữ ký, thiếu dung lượng/quyền installer, thao tác đang chạy và app mất kết nối khi mở lại. Thử nâng cấp từ ít nhất bản phát hành liền trước trên máy Windows sạch và bản đã có SQLite WAL/dự án/draft. Kiểm tra schema/version gate khi mở bằng bản app không tương thích. Build static export phải phát hiện component gọi API runtime lúc build và lỗi route/asset trong môi trường Tauri.

Bổ sung kiểm thử selection với sort/filter/refresh và danh sách 10.000 mục, vùng chọn auto-scroll, anchor mất/hết hiệu lực, range qua các dòng chưa render; right click trong/ngoài tập chọn. Kiểm thử drag đổi Ctrl/Shift giữa chừng, hủy Esc, hover tab/thư mục, tập chọn lẫn cha/con, nguồn/đích đổi sau preview, lỗi giữa batch. Đối soát test stale notification, lỗi bị xóa/di chuyển, đếm unique ancestor, partial apply phụ thuộc, mixed metadata và không có lối dùng menu/drag để vượt khóa ghi.

Trên máy thử SSD được ghi rõ cấu hình: chuyển tab đã nạp dưới 150 ms; tìm tên trên chỉ mục 100.000 mục dưới 300 ms ở p95, không tính debounce; preview tên dưới 50 ms; không đóng băng UI khi index/copy. Đây là mục tiêu nghiệm thu, chưa phải cam kết đã đạt. Thư mục mạng, USB và trạng thái index lạnh được đo riêng. Thử ít nhất 5 dự án mở và một thư mục có 10.000 mục.

## 11. Các quyết định mặc định đề xuất

1. Windows trước; offline, một người dùng, một instance.
2. Một tab tương ứng một dự án, một WebView chung; không trùng root.
3. Tree + details list là view mặc định; column view làm sau khi luồng cơ bản ổn định.
4. Tạo mới trong thư mục đang mở, không dùng mục chọn làm đích ngầm.
5. Mã hoàn chỉnh duy nhất trong toàn dự án, dùng chung tệp/thư mục. Sort không đánh lại số; người dùng được đổi số và độ dài mã bằng kế hoạch có kiểm tra.
6. Đổi mã cha cập nhật mọi hậu duệ; mã logic và UUID tách biệt. Chuẩn hóa phần tên theo cấu hình, giữ phần mở rộng tệp.
7. Joyworld là mẫu tùy chọn. Cây mới tự đặt tên; cây cũ được nhận diện và cấp lại mã qua preview trước khi đưa vào sử dụng.
8. Không ghi đè hoặc merge thư mục tự động. Thao tác có journal và hoàn tác khi đủ điều kiện.
9. Metadata trong app data; filesystem là nguồn sự thật; có xuất cấu hình và mốc cấp mã.
10. Đối soát bắt buộc khi mở dự án và phát hiện thay đổi ngoài app; khóa ghi đến khi sửa/xác nhận và xác minh đạt. Double click mở bằng app mặc định; context menu do app tự dựng.
11. Đo một nguyên mẫu đầy đủ từ tiếp nhận cây bất kỳ → tạo hồ sơ/tệp có mã → đổi mã cha/width → sửa ngoài app → khởi động lại và đối soát → move giữa tab trước khi mở rộng tính năng.
12. Loại/nhóm/nhãn cấu hình trong Cài đặt từng dự án; bộ hệ thống là tùy chọn. Áp dụng mẫu ưu tiên kéo thả, metadata ưu tiên điền sẵn/kế thừa/hàng loạt; chỉ gõ để tạo tên mới hoặc sửa thông tin còn thiếu.
13. Phân loại gắn UUID, không phụ thuộc tên file và không ngầm thay đổi đường dẫn. Lọc, nhóm hiển thị và sort là ba thao tác riêng. Quy tắc gợi ý không tự ghi đè lựa chọn đã xác nhận.
14. Mọi dự án phải hoàn tất cấu hình trước khi sử dụng, kể cả mở cây cũ. Có lưu nháp và sao chép cấu hình dự án đã hoàn tất bằng kéo thả; bản sao độc lập và luôn qua kiểm tra/xác nhận trước khi kích hoạt.
15. New là điểm vào cho tạo thư mục/hồ sơ, tải từ link và nhập path. Chốt metadata/đích/cách tên trước khi thực hiện; URL tải nền, path cục bộ mặc định di chuyển. Tất cả dùng chung mã, chuẩn hóa, kiểm tra toàn vẹn và nhật ký.
16. Cảnh báo đối soát hiển thị tại mục và ancestor, có thông báo dẫn thẳng đến; xử lý hàng loạt tên và phân loại trong cùng bảng. Gỡ cảnh báo sau xác minh, không gỡ khi còn lỗi chưa xử lý.
17. Chọn Shift/Ctrl/chọn vùng và drag move là chức năng cơ bản của bản đầu. Selection, điều hướng và drag có state riêng; đích phân loại tách rõ đích thư mục vật lý.
18. Stack chốt Tauri 2 + Rust + Next.js/React/TypeScript + SQLite; frontend export tĩnh, local backend là Rust. Có updater chính thức, gói ký xác thực, HTTPS, lưu dữ liệu trước install và migration phục hồi được.
19. Tên app HFolder; File Explorer có Open in HFolder cho thư mục/vùng trống/tệp. Mở hoặc nhập qua instance hiện tại, không vượt setup/đối soát và không tự sửa dữ liệu khi chọn menu. Tích hợp Explorer tách biệt menu riêng bên trong app.
20. AI được chấp thuận ở giai đoạn sau khi HFolder hoàn thành và ổn định P0/P1. Chỉ đề xuất giữ/đổi tên và phân loại theo danh mục có sẵn; người dùng duyệt, HFolder kiểm tra/cấp mã. Model và phương thức local/LAN/cloud chốt bằng đánh giá thực tế, không cản trở việc xây sản phẩm chính.
21. Repository D:\Github\HFolder; hiện chỉ tạo repo và tài liệu, chờ skill/quy định trước scaffold/implement. UI tiếng Việt mặc định, kiến trúc i18n từ đầu; mã mặc định 03.01.001.
22. Loại/nhóm/nhãn được để trống trong setup và bổ sung sau; cổng xác nhận dự án vẫn giữ. Chính sách tệp đặc biệt/loại trừ kỹ thuật được chấp thuận ngay bản đầu, phân biệt với ẩn giao diện.

23. Từ thời điểm tạo repository, docs/PLAN.md trong D:\Github\HFolder là bản kế hoạch làm việc chính thức. Bản trong thư mục outputs của chat là bản chuyển giao tại thời điểm khởi tạo, không phải nguồn cần đồng bộ hai chiều về sau. Bản ghi quyết định và checklist là tài liệu dẫn xuất; khi có xung đột ưu tiên quyết định người dùng mới nhất và cập nhật kế hoạch chính.

## 12. Nguồn kỹ thuật chính thức đã đối chiếu

- Ứng viên AI để đánh giá sau, không phải lựa chọn đã khóa: [Qwen3.5-0.8B](https://huggingface.co/Qwen/Qwen3.5-0.8B), [Qwen3.5-2B](https://huggingface.co/Qwen/Qwen3.5-2B), [Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B).
- Engine/OCR tham khảo cho giai đoạn AI: [llama.cpp](https://github.com/ggml-org/llama.cpp), [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR).
- Đăng ký menu Explorer và yêu cầu Windows 11 hiện đại: [Microsoft File Explorer integration](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/integrate-packaged-app-with-file-explorer).
- Cách mở rộng installer Tauri: [NSIS installer hooks](https://v2.tauri.app/distribute/windows-installer/).
- Tích hợp Next.js export với Tauri: [Next.js frontend](https://v2.tauri.app/start/frontend/nextjs/).
- Khả năng/giới hạn của Next.js export: [Next.js Static Exports](https://nextjs.org/docs/app/guides/static-exports).
- Ký và phát hành updater: [Tauri Updater](https://v2.tauri.app/plugin/updater/).
- Hành vi API cài trên Windows: [Updater API](https://v2.tauri.app/reference/javascript/updater/).
- Tauri capabilities và phạm vi window/WebView: https://v2.tauri.app/security/capabilities/
- Tauri gọi Rust từ frontend: https://v2.tauri.app/develop/calling-rust/
- Tauri events/channels từ Rust: https://v2.tauri.app/develop/calling-frontend/
- File system plugin và scope: https://v2.tauri.app/plugin/file-system/
- Chọn file/thư mục bằng native dialog: https://v2.tauri.app/plugin/dialog/
- Single-instance plugin: https://v2.tauri.app/plugin/single-instance/
- Đóng gói Windows installer: https://v2.tauri.app/distribute/windows-installer/
- Quy tắc tên/path Windows: https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
- HTTP client chính thức của Tauri: [HTTP Client](https://v2.tauri.app/plugin/http-client/).
- Cách xử lý tên tệp từ Content-Disposition: [RFC 6266](https://www.rfc-editor.org/rfc/rfc6266.html), mục 4.3; tên do server cung cấp chỉ là gợi ý, cần kiểm tra trước khi lưu.

Các luồng sản phẩm, schema, stack frontend, cách đánh số và mục tiêu hiệu năng trong tài liệu là đề xuất thiết kế cho dự án này; nguồn trên xác minh cơ chế nền tảng, không khẳng định Tauri có sẵn toàn bộ tính năng sản phẩm.
