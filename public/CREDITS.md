# Nguồn tài nguyên

Âm thanh dưới `public/` là **CC0 (Creative Commons Zero / Public Domain)** — dùng tự do, không cần
xin phép, không bắt buộc ghi công. Ghi công ở đây là tự nguyện, theo đúng tinh thần Kenney đề nghị
trên trang gốc.

> **[GỠ 3D — 2026-09-16]** File này trước đây liệt kê ~70 model 3D CC0 (Kenney Furniture/Nature/
> Holiday/Mini Characters/Cube Pets, Quaternius Furniture + House Interior) cho căn phòng 3D. Toàn
> bộ đã gỡ khỏi dự án cùng với phòng. Rừng hiện tại dựng hình học trực tiếp bằng code,
> không sử dụng lại các model cũ. Cần dựng lại thì lấy từ lịch sử git (`git log -- public/models`), phần ghi công cũ
> nằm nguyên trong cùng file này ở các commit trước.

## Âm thanh — `public/sounds/`

**Kenney — Interface Sounds** (1.0, phát hành 2020)
Nguồn: https://kenney.nl/assets/interface-sounds
License: CC0 1.0 — http://creativecommons.org/publicdomain/zero/1.0/

`sounds/session-complete.ogg` = `Audio/bong_001.ogg` gốc, đổi tên — chuông hết phiên pomodoro
(SPEC.md §4.3, §6).

## Nếu cần thêm model sau này

Cùng hai nguồn trên (Kenney CC0) là lựa chọn đầu tiên để giữ phong cách nhất quán. Poly Pizza
(https://poly.pizza) tổng hợp lại nhiều pack CC0 khác (Quaternius, v.v.) nếu Kenney không có món
cần thiết — luôn kiểm license CC0 trước khi thêm, và cập nhật file này trong CÙNG lần thêm đó.

## Font — `public/fonts/`

Nunito variable, từ kho chính thức [Google Fonts](https://github.com/google/fonts/tree/main/ofl/nunito).
`Nunito-Variable.ttf` là bản variable (weight 200–1000), dùng qua `next/font/local`.
Giấy phép SIL Open Font License 1.1: [OFL-Nunito.txt](fonts/OFL-Nunito.txt).
Font được phân phối kèm để build không phụ thuộc kết nối tới Google Fonts.

## Phong cảnh rừng — 2026-10-02

`forest/day.webp` và `forest/night.webp`: tạo bằng công cụ ImageGen tích hợp trong
Codex, dựa trên mockup đã được chủ dự án duyệt; không có nội dung nhật ký/dữ liệu người
dùng gửi vào prompt. Xuất WebP chất lượng 85. Brief và tham chiếu ở
[docs/design/README.md](../docs/design/README.md).

Cây, đất, đá, cỏ và hoa trong rừng tiến độ được dựng bằng hình học trong
`components/forest/garden-model.ts`; Three.js dùng giấy phép MIT, giữ license trong
package. SVG fallback là code của dự án, không dùng model tải ngoài.
