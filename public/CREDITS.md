# Nguồn tài nguyên — model 3D và âm thanh

Toàn bộ model và âm thanh dưới `public/` là **CC0 (Creative Commons Zero / Public Domain)** — dùng tự
do cho mục đích cá nhân, giáo dục, thương mại, không cần xin phép, không bắt buộc ghi công.
Ghi công ở đây là tự nguyện, theo đúng tinh thần Kenney đề nghị trên trang gốc.

Quyết định dùng model 3D (thay vì ảnh render xếp lớp như bản v3 gốc) — xem `SPEC.md` §5.3, §8.5,
đổi ngày 2026-09-02.

## Đồ đạc phòng — `room/`

**Kenney — Furniture Kit** (2.0, phát hành 2018)
Nguồn: https://kenney.nl/assets/furniture-kit
License: CC0 1.0 — http://creativecommons.org/publicdomain/zero/1.0/

Mốc 1 lấy 14/140 model cho phòng khởi đầu (Chương 1 — SPEC.md §4.9): `bedSingle`, `bookcaseOpenLow`,
`chairDesk`, `desk`, `doorway`, `floorFull`, `lampRoundTable`, `plantSmall1`, `pottedPlant`,
`rugRectangle`, `sideTable`, `wall`, `wallCorner`, `wallWindow`. Không có texture ngoài — vật
liệu là màu phẳng.

**Mốc 5 lấy thêm 14 model** — cùng file zip, cùng license — cho 5 vỏ nhà theo chương (§4.9, §5.3:
"5-6 vỏ nhà gốc + biến thể"), xem `components/room/shells/`: `bedDouble`, `cabinetTelevision`,
`chairRounded`, `coatRackStanding`, `kitchenCabinet`, `kitchenFridgeSmall`, `kitchenSink`,
`loungeChair`, `loungeSofa`, `stairs`, `table`, `tableCoffee`, `televisionModern`,
`wallWindowSlide`.

### `room-items/` — đồ mở khoá theo cấp (mốc 3, SPEC.md §4.8, §5.3)

12 món đầu (4 mỗi chỉ số), cùng nguồn Furniture Kit ở trên. Vị trí đặt trong phòng ở
`components/room/roomItemPlacements.ts`.

- **📚 Mind** — `books`, `lampSquareFloor`, `bookcaseOpen`, `bookcaseClosedWide` (đúng ý §4.8:
  "kệ sách nhỏ → kệ lớn → cả bức tường sách").
- **🧘 Spirit** — `pillowBlueLong`, `loungeChairRelax` ("góc ngồi yên" ở §5.3), `plantSmall2`, `bear`.
- **💪 Health** — **Furniture Kit không có đồ tập gym thật** (đã tìm, không ra — tạ/thảm
  tập/xe đạp/giày chạy ở §5.3 chỉ là ví dụ, không phải model có sẵn). Dùng đồ GẦN ĐÚNG nhất:
  `rugRound` (thảm tập), `bench` (ghế tập), `pillowLong` (đệm sàn), `plantSmall3` (cây, gắn với
  sức sống/không khí trong lành). Nếu sau này tìm được pack có đồ gym thật, đổi lại dễ dàng —
  chỉ sửa `room-items/*.glb` + `roomItemPlacements.ts`, không đụng logic.

## Nhân vật — `characters/`

**Kenney — Mini Characters** (1.0, phát hành 2024)
Nguồn: https://kenney.nl/assets/mini-characters
License: CC0 1.0 — http://creativecommons.org/publicdomain/zero/1.0/

**Mốc 8 (Cài đặt, SPEC.md §5.6):** lấy ĐỦ cả 12 nhân vật gốc trong pack —
`male-a`…`male-f`, `female-a`…`female-f` (6 nam/6 nữ). Pack KHÔNG tách rời tóc/da/trang phục để
trộn (mỗi tên là một model dựng sẵn trọn bộ) — chọn NGUYÊN một bộ gần giống mình nhất qua Cài
đặt, lưu ở `profile.avatar_config.characterKey`, xem `components/room/models.ts`. `male-a.glb`
trước đây tên `stage-1.glb` (mốc 1) — đã đổi tên khớp quy ước 12 model, nội dung file y hệt.
Mỗi hình dáng hiện chỉ có ĐÚNG một model (giai đoạn 1, §4.8) — biến thể theo cấp cho từng hình
dáng thêm dần sau, cùng tinh thần "đồ chỉ đến khi đủ điểm" ở §5.3.

Kèm `characters/Textures/colormap.png` — texture atlas dùng chung, GLB tham chiếu tương đối tới
file này (đừng di chuyển hai file tách rời nhau).

**32 animation dùng chung một rig**, trong đó có `idle`, `sit`, `crouch`, `static` — dùng để dựng
3 tư thế theo chỉ số ở §5.1 (`ngồi vào bàn / cầm tạ / ngồi thiền`). Pack không có animation
"nâng tạ" hay "thiền" đúng nghĩa đen — `crouch` và `static` là lựa chọn GẦN ĐÚNG nhất hiện có,
xem ghi chú trong `components/room/Character.tsx`. Chỉ 8/12 giai đoạn còn lại (2 → Trưởng thành)
chưa có model — thêm dần khi tới cấp đó, đúng tinh thần "đồ chỉ đến khi đủ điểm" ở §5.3.

## Sân vườn — `garden/` (mốc 5, chương 10-12)

**Kenney — Nature Kit** (1.0, phát hành 2020)
Nguồn: https://kenney.nl/assets/nature-kit
License: CC0 1.0 — http://creativecommons.org/publicdomain/zero/1.0/

4 model cho sân/vườn ở Chương 10-12 (§4.9: "Nhà riêng có sân", "Nhà có vườn", "Nhà lớn có
vườn"): `tree_detailed`, `plant_bushDetailed`, `flower_yellowA`, `flower_redA`. Nền cỏ dùng màu
phẳng (mặt phẳng tô màu, không phải model) — giữ đúng phong cách "vật liệu màu phẳng" đã dùng
cho phòng, không trộn hai phong cách khác nhau trong cùng cảnh.

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
