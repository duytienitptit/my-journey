# My Journey — luật làm việc cho Claude

@AGENTS.md
*(Next.js tự sinh lại file này mỗi lần `next dev` chạy — bản 16 khác đáng kể so với kiến thức
huấn luyện, đọc trước khi đụng vào `app/`.)*

App cá nhân, **một người dùng duy nhất**. Toàn bộ mô tả sản phẩm nằm trong `SPEC.md` — đó là
nguồn sự thật duy nhất. Đọc `SPEC.md` trước mọi việc, đặc biệt **mục 4** (cơ chế),
**mục 8** (nguyên tắc kỹ thuật) và **mục 12** (bản trước hỏng vì sao).

- Trao đổi với chủ dự án **bằng tiếng Việt**. Chữ hiển thị trong app **bằng tiếng Anh**.

---

## Trạng thái hiện tại

- Giai đoạn: **xong mốc 1, 2, 3, 4, 5, 6, 7 (một phần), 8a, 8b — TOÀN BỘ 8 mốc gốc coi như xong**,
  kế hoạch đã duyệt ngày 2026-09-02 — xem `.claude/plans/h-y-l-n-1-plan-glimmering-clock.md`. Còn
  nợ đúng một việc lớn: đổi phong cách 3D (xem "Còn nợ" bên dưới), không thuộc 8 mốc gốc.
- **Mốc 7 — CHỈ thư viện hành trình + kho lưu trữ, KHÔNG làm phần cron [SỬA PHẠM VI — 2026-09-05]**.
  Chủ dự án chủ động bỏ qua "Vercel Cron xuất JSON hằng tuần" — app chưa deploy ở đâu cả (vẫn
  local + GitHub-only), cron của Vercel không chạy/test được ở local dev, và sau khi tôi hỏi thẳng
  thì chủ dự án nói thẳng "chưa cần làm mốc này" rồi quyết định chỉ giữ hai màn còn lại. **Đừng tự
  ý dựng phần cron/backup tự động sau này** — đây là quyết định phạm vi, không phải việc quên.
  - `app/library/page.tsx` (Thư viện hành trình, §5.4): `core/engine/journeyLibrary.ts`
    (`buildChapterCards`, hàm thuần) — đọc lại `chapter_events` LẦN ĐẦU kể từ khi ghi ở mốc 5.
    Chương 1 không có dòng trong `chapter_events` (cố ý, xem chapters.ts) → tự tổng hợp một "mốc
    ảo" từ `profileStartedDayKey`. "Hình hài cuối chương" = gọi LẠI `foldTimeline` với `nowMs` =
    cuối ngày cuối cùng chương đó còn sống (chương đang sống thì = hôm nay) — không lưu gì thêm,
    đúng §8.1. Không dựng cảnh 3D thu nhỏ cho từng khung (mọi giai đoạn hiện dùng CHUNG một model
    placeholder — cảnh riêng sẽ trông giống hệt nhau, vô nghĩa) — dùng chữ (`CHAPTER_NAMES` mới
    trong `balance.ts`, dịch từ bảng đã [CHỐT] ở §4.9) thay cho hình.
  - `app/archive/page.tsx` (Kho lưu trữ, §5.5): lọc theo ngày (input date thường) + **"hôm nay
    năm ngoái"** (`core/day.ts` thêm `oneYearAgo`/`endOfDayMs`, có test riêng kể cả biên 29/2).
  - 11 test mới cho `journeyLibrary.ts` + `day.ts` (tổng 265 test). QA bằng mắt qua trình duyệt +
    seed tạm rồi xoá sạch — **suýt xoá nhầm dữ liệu THẬT của chủ dự án lần nữa** lúc dọn dẹp
    (`delete from net_worth_entries;` không có `where`) — bắt kịp và khôi phục đúng giá trị cũ
    trong cùng lượt, xem [[feedback-shared-dev-db-caution]] (đã cập nhật, đây là lần LẶP LẠI lỗi
    đã ghi nhớ trước đó — cẩn thận hơn nữa ở các mốc sau).
- **Màn `/stats` — thống kê dài hạn (SPEC.md §5.8, THÊM NGOÀI §9 ngày 2026-09-06).** Không thuộc
  8 mốc gốc — chủ dự án tự đề xuất sau khi dùng thử, chốt qua bốn vòng hỏi đáp trong cùng phiên.
  NĂM khối: tổng cộng dồn · heatmap 12 tháng (đậm theo SỐ PHIÊN) · xu hướng 3 chỉ số theo tháng ·
  kỷ lục · phân bổ giờ theo nhãn (một hàng mỗi nhãn, một cột mỗi TUẦN, màu lấy từ ba màu chỉ số).
  **HAI khối đã [GỠ — 2026-09-06]** theo yêu cầu chủ dự án sau khi xem trên dữ liệu thật, **đừng
  dựng lại cái nào**:
  - Khối 4 "Focus time" — thẻ riêng cho tổng giờ, chỉ nói lại con số khối 1 đã nói. **Luật tính
    giờ (`session_minutes + break_minutes`) thì VẪN HIỆU LỰC** — khối 1, 5, 6 đều dùng, đừng xoá
    theo.
  - Khối 7 "What's in your way" — cùng với nó, **giọng KHUYÊN biến mất khỏi toàn bộ app**. App
    quay về ranh giới cũ: kể và trách được, KHÔNG khuyên. Muốn khuyên trở lại thì chốt câu chữ
    lại từ đầu (§11.5), đừng lấy lại câu cũ như thể đã duyệt. `missedDayAnalysis` + hai hằng số
    `MISSED_DAY_*` + 8 test đã xoá theo, không để lại hàm không ai gọi (luật cứng 3).

  Số thứ tự các khối còn lại giữ nguyên (1, 2, 3, 5, 6) để chú thích trong code và SPEC khớp nhau.
  - **Giọng MỚI:** khối 7 là chỗ ĐẦU TIÊN app *khuyên* chứ không chỉ kể/trách. Câu chữ đã được
    chủ dự án tự duyệt (phương án A trong ba phương án đưa ra) — *"Of 30 missed days, 22 were
    missing just Sport. One habit is standing between you and most of them."* Đừng tự mở rộng
    giọng khuyên này sang khối khác mà không hỏi (§11.5).
  - **Giờ = `session_minutes + break_minutes`**, KHÔNG phải hằng số 0,5 giờ. Chủ dự án nói "0,5
    tiếng thay vì 25 phút"; tôi hỏi lại và chốt viết theo công thức để không hỏng khi đổi độ dài
    phiên (§4.3 [CHỐT] cho phép đổi). Hệ quả đã nói rõ với chủ dự án và được chấp nhận: tổng giờ
    luôn tỉ lệ thuận với tổng phiên, là cách ĐỌC khác chứ không phải thông tin mới.
  - `foldTimeline` được MỞ RỘNG (không phải gọi lặp như `journeyLibrary.ts`): nhả thêm
    `dailySeries` (XP + ngày-đạt mỗi ngày) và `longestDayAchievedStreak`, sinh trong CHÍNH pass
    đã có. Toàn bộ tính toán ở `core/engine/longTermStats.ts` (thuần) + `app/actions/longTermStats.ts`.
  - **Luật Chủ nhật ở khối 7** — §4.5 nói Chủ nhật chỉ cần nhật ký, nên Chủ nhật không đạt CHỈ
    tính thiếu nhật ký, không đổ lỗi cho Sport/Deep work. Bắt gặp lúc dựng, đã ghi vào SPEC.md.
  - 30 test mới (tổng 295). Ba lỗi bắt được lúc soi bằng mắt: "1 sessions" (số ít/số nhiều),
    nhãn tháng CUỐI biến mất khỏi heatmap (mùng 1 nằm chung cột với ngày cuối tháng trước), và
    **biểu đồ cột trống trơn** vì `h-full` lồng trong khung cao tự động — `height: %` không có mốc
    quy chiếu. Cả ba chỉ lộ ra khi có dữ liệu thật, không lộ qua test.
  - **[SỬA — 2026-09-06, chủ dự án nhìn lưới thật rồi yêu cầu]** Khung KHÔNG lùi về trước ngày
    bắt đầu dùng app: cột đầu của bản đồ nhiệt = TUẦN ĐẦU TIÊN của chủ dự án, những ngày trước
    ngày bắt đầu trong chính tuần đó để trống. 12 tháng lăn còn lại vai trò TRẦN TRÊN.
    `windowDaysOf`/`windowMonthsOf` nhận thêm `startedDayKey`. Hai lỗi lộ ra ngay sau đó: nhãn
    tháng ĐẦU biến mất (luật gắn nhãn cần ô "mùng 1", mà mùng 1 nằm ngoài khung) và câu khối 7
    gọi *New knowledge* — một NHÃN — là "habit". Câu khuyên nay đổi từ: toàn thói quen thì giữ
    "habit", có nhãn thì dùng "thing". Đã ghi cả hai vào SPEC.md §5.8.
  - **[SỬA — 2026-09-06, vòng soi thứ hai của chủ dự án]** Ba lỗi trình bày nữa, đều chỉ lộ khi
    NHÌN chứ không test nào bắt được: (1) khối 6 xếp chồng ba nhãn cùng sắc xanh Mind → không
    thấy ranh giới, đổi thành **một hàng mỗi nhãn** (§5.8, đừng gộp lại); (2) chú giải heatmap
    "Less → More" hiện 4 ô GIỐNG HỆT lúc dữ liệu còn ít, vì quy ngược bậc qua số phiên mà
    `max` mới bằng 1 — nay vẽ thẳng theo BẬC; (3) biểu đồ xu hướng khi cả ba chỉ số bằng 0 vẽ ba
    đường chồng khít dưới đáy, chỉ còn thấy màu vẽ sau cùng (trông như chỉ có Spirit tồn tại) —
    nay im lặng, ẩn cả thẻ.
  - **DB demo `myjourney_demo` GIỮ LẠI** (13 tuần, 7/9→6/12/2026, 692 phiên) để chủ dự án tự xem
    giao diện "sau 3 tháng". Trỏ `.env.local` sang nó rồi KHỞI ĐỘNG LẠI server, và tua đồng hồ
    tới 12/2026 mới thấy dữ liệu. Nhớ trỏ ngược lại — nếu quên, mọi thao tác thật sẽ ghi vào DB
    giả.
  - **QA làm trên DB TẠM RIÊNG** (`myjourney_stats_qa`, tạo → đổ dữ liệu giả → soi → xoá), không
    đụng một dòng nào của DB thật — xem [[feedback-shared-dev-db-caution]]. Cách này nên thành
    thói quen cho mọi lần cần dữ liệu giả về sau.
- **Mốc 8a — Cài đặt (chức năng), 2026-09-08.** Chủ dự án gộp hai yêu cầu trong một câu: "bắt đầu
  mốc 8 đi và xóa toàn bộ data hiện tại". Đã hỏi 2 câu trước khi làm: phạm vi xoá → **xoá SẠCH cả
  14 bảng, seed lại từ đầu**; cách tiếp cận mốc 8 → **chia 2 phần, 8a (chức năng) trước, 8b (đánh
  bóng) sau**. **Sự cố an toàn nghiêm trọng lúc xoá dữ liệu — đã sửa nhưng PHẢI đọc trước khi làm
  việc tương tự lần sau:** xem [[feedback-stated-boundary-must-hold-same-turn]].

  Dựng đủ theo đúng SPEC.md §5.6: `app/settings/page.tsx` + 8 file trong `components/settings/`
  (Card dùng chung, CharacterSection, LabelsSection, HabitsSection, DailyTasksSection,
  SessionSection, PromptsSection, DataSection, SettingsScreen) + `app/actions/settings.ts`. Nav
  "Settings" thêm vào cụm góc màn chính (`TimerOverlay.tsx`). Hai link "Export all data" tạm thời
  ở `EveningPanel`/`ArchiveScreen` (đã đánh dấu "chỗ tạm cho tới khi có Cài đặt" từ mốc 2/7) đã
  GỠ — Cài đặt giờ là nơi duy nhất cho xuất/nhập dữ liệu.

  **Nhân vật đổi từ 1 model sang 12 hình dáng chọn được** (`male-a`…`f`, `female-a`…`f`, tải lại
  từ Kenney Mini Characters) — pack KHÔNG hỗ trợ tách tóc/da/trang phục để trộn riêng như câu chữ
  gốc SPEC.md từng ngụ ý, mỗi tên là một nhân vật hoàn chỉnh dựng sẵn. Đã hỏi chủ dự án xác nhận
  hướng "chọn nguyên một bộ có sẵn" trước khi tải asset. `components/room/models.ts` đổi trục đơn
  (stage) sang trục kép (`CHARACTER_LOOKS × stage`), lưu lựa chọn ở `profile.avatar_config.characterKey`.
  Bảng "6 việc" (`DailyTaskWithRef`) thêm field `habitKind` để phân biệt habit "journal" (không
  có ngưỡng số) — Cài đặt cần biết điều này mà mốc 3/4 chưa từng cần. Habit tạo mới qua Cài đặt
  LUÔN `kind="score_1_5"` (đúng [CHỐT] §4.2) — `kind="boolean"` có trong schema nhưng không có
  đường render nào, cố ý không cho chọn.

  **Bug thật bắt được lúc TỰ CHẠY `importAllData` (không phải lúc soi code):** thiếu
  `tx.delete(schema.settings)` trong danh sách xoá trước khi ghi lại — nhập file sẽ luôn văng lỗi
  `duplicate key value violates unique constraint "settings_pkey"` vì bảng `settings` chỉ có đúng
  1 dòng cố định id=1. Phát hiện bằng script gọi thẳng hàm (Claude_Browser không có cách chọn file
  cho `<input type=file>`, `form_input` bị trình duyệt chặn với `InvalidStateError`). Đã sửa, chạy
  lại thành công, đối chiếu `psql` khớp 100% với file gốc — dùng luôn lần chạy này để dọn dữ liệu
  QA vì file nhập là bản chụp TRƯỚC lúc QA. **Hàm "khôi phục toàn bộ" kiểu này phải tự chạy thật
  ít nhất một lần trước khi báo xong — review tĩnh không bắt được một dòng `delete` bị thiếu.**

  **[CHƯA HỎI — cần chủ dự án xác nhận ở lượt báo cáo tới]** Nghĩa "nhập dữ liệu" = THAY THẾ TOÀN
  BỘ, không gộp — SPEC.md §5.6 chỉ nói "xuất/nhập", không nói rõ ngữ nghĩa. Tôi tự chọn cách đọc
  duy nhất hợp lý thay vì dừng lại hỏi trước — đúng ra phải hỏi theo luật cứng 1. Đã ghi flag
  `[CHƯA HỎI]` ngay trong SPEC.md §5.6.

  297 test, `tsc`/`eslint`/`npm run build` sạch.
- **Mốc 8b — đánh bóng, 2026-09-08 (cùng ngày với 8a).** Chủ dự án chỉ nói "làm mốc 8b đi" — trước
  khi code, hỏi MỘT round 4 câu AskUserQuestion vì cả bốn hạng mục (mùa/ngày lễ, vật phẩm hiếm,
  chế độ tối, phím tắt) đều có nhiều cách đọc hợp lý mà SPEC.md không nói rõ. Chủ dự án chọn hết
  phương án SÂU/ĐẦY ĐỦ hơn ở ba trong bốn câu (không chọn "Recommended" nhẹ nhàng): **mùa + ngày
  lễ cụ thể** (không chỉ 4 mùa dương lịch đơn giản) · **tải thêm asset động vật thật** (không
  dùng đồ thay thế có sẵn) · **chế độ tối tự động theo GIỜ THẬT** (không theo OS) · phím tắt thì
  chọn đúng phương án nhẹ "tôi đề xuất, bạn duyệt".

  **Mùa + ngày lễ** (`core/engine/seasons.ts`, MỚI, 15 test): Tết (mùng 1→7, bảng ngày mùng 1 tra
  **qua WebSearch** — không đoán/nhớ lại — cho 2026-2035, `TET_FIRST_DAY` trong `balance.ts`) ·
  Giáng sinh (20-26/12) · nắng hè (6-8) · mùa mưa (9-11) · còn lại giữ tông cũ. Tải thêm **Kenney
  Holiday Kit** (cây thông trang trí cho Giáng sinh) — Tết KHÔNG có asset CC0 nào tìm được (đã
  tìm, không có văn hoá Việt/Á trong pack phương Tây) nên dùng lại hoa vàng/đỏ Nature Kit sẵn có
  từ mốc 5, đúng tinh thần "gần đúng nhất" đã dùng cho đồ gym ở mốc 3.

  **Vật phẩm hiếm** (`core/engine/rareItems.ts`, MỚI, 12 test): tải thêm **Kenney Cube Pets**,
  chọn 3 con (cat/dog/panda) — thu hẹp từ "mèo/tranh/chậu cây" gốc, bỏ "tranh" vì cần dựng thêm
  hệ treo tường riêng cho một mục đích. Ba trigger đúng 3 ví dụ SPEC: ngày thứ 100 · đêm giao thừa
  (MỌI năm đã qua, không chỉ năm đầu) · tuần trọn vẹn (tái dùng ĐÚNG định nghĩa ở `timeline.ts`
  cho +200 XP, không thêm điều kiện đúc kết tuần). Xác suất [TẠM] 25%. **"Ngẫu nhiên" KHÔNG dùng
  `Math.random()`** — hàm băm ổn định (FNV-1a + fmix32 Murmur3) theo (trigger, ngày bắt đầu dùng
  app), để trúng/trượt luôn tính lại ra đúng kết quả cũ mà không cần bảng "đã thử" riêng, chỉ
  KẾT QUẢ TRÚNG mới ghi DB (đúng §7). **Bug thật bắt được khi VIẾT TEST** (không phải lúc soi
  code): thử djb2 trần trước, phát hiện qua bài test "tỉ lệ trúng xấp xỉ 25% trên 2000 trigger" ra
  **0/2000** — hai chuỗi chỉ khác ký tự cuối (`tet_eve_2026` vs `tet_eve_2027`) cho hash gần như
  giống hệt nhau. Đổi sang FNV-1a+fmix32 thì đúng ngay 25.1%. **Bài học: khi viết một hàm "trông
  ngẫu nhiên", test PHẢI kiểm THỐNG KÊ trên nhiều input GẦN GIỐNG NHAU thật, không chỉ kiểm tính
  ổn định (cùng input → cùng output) — một hash yếu vẫn ổn định, chỉ là ổn định SAI.**

  **Chế độ tối** — bỏ hẳn `@media (prefers-color-scheme: dark)` cũ (chưa từng nối UI), thay bằng
  `data-theme` do `components/theme/NightModeSync.tsx` gán theo giờ Việt Nam thật (19h→6h,
  `core/day.ts#isNightHour`, đi qua `now()` nên tua thời gian dev vẫn kiểm được) — client hỏi lại
  server mỗi phút. **Nhắc nghi thức 22h cũng dựng CHUNG cơ chế polling này** (`app/actions/
  liveClock.ts` trả cả hai giá trị một lượt gọi) — hoàn thành luôn phần "nhắc 22h thật sự chạy"
  còn thiếu từ mốc 2/§6, dùng lại đúng quyền Notification đã xin lúc bấm Start phiên đầu (không
  xin thêm lần hai), tự giới hạn một lần/ngày qua `localStorage`.

  **Phím tắt**: Space (bắt đầu phiên, chỉ lúc tĩnh) · phím số 1-9 (chọn nhãn) · Esc (đóng popup
  Backfill/sửa tài sản, hook dùng chung `useEscToClose`) — tự tắt khi đang gõ vào ô nhập bất kỳ.
  CỐ Ý không có phím tắt cho Abandon (dễ bấm nhầm mất phiên).

  **Bẫy dựng cảnh 3D bắt gặp lúc soi bằng mắt (không lộ qua test):** (1) model Cube Pets dựng ở
  tỉ lệ RIÊNG hẳn của pack đó — con mèo nguyên bản cao gần gấp đôi nhân vật, phải `scale=0.28`;
  (2) hoa Nature Kit có `translation` nội bộ âm — đặt ở `y=0` (không phải `FLOOR_TOP_Y=0.05` như
  mọi đồ đạc khác trong phòng) làm hoa chìm gần hết vào sàn, gần như vô hình; cây Giáng sinh vẫn
  thấy được vì đủ cao nên không lộ ra bằng bên cạnh nó cho tới khi so sánh. (3) Vị trí đặt vật
  phẩm hiếm/trang trí mùa CHỈ soi kỹ ở Chương 1 (phòng nhỏ nhất, rủi ro chồng lấn cao nhất) —
  chưa kiểm hết 12 chương, có thể cần chỉnh lại nếu chồng lấn ở chương khác.

  **[CHƯA HỎI thêm — cùng loại với flag import ở mốc 8a]** Câu chữ thông báo nhắc tối
  ("Evening's here...") là Claude tự viết theo giọng đã có, chưa hỏi riêng — mức trung tính hơn
  hẳn câu trách móc nên không dừng lại, nhưng có thể đổi nếu chủ dự án không thích.

  329 test (tổng, +32 so với mốc 8a), `tsc`/`eslint`/`npm run build` sạch. Dọn dữ liệu QA (1
  session bỏ dở + 1 vật phẩm hiếm sinh ra lúc tua đồng hồ test) bằng xoá đúng id, xem
  [[feedback-shared-dev-db-caution]] — không đụng gì khác trong DB thật.
- **Phong cách 3D — ĐANG THỬ, 2026-09-08 (cùng ngày mốc 8b).** Chủ dự án chê phòng "trông đồ hoạ
  rất cũ, khối vuông vức". Hỏi 2 câu AskUserQuestion: (1) hướng nào trước — chọn **nâng render
  trước** (Recommended) + cân nhắc riêng câu đồ đạc; (2) đồ đạc — chọn **tìm pack khác chi tiết
  hơn** (không chọn AI tự tạo, lý do rủi ro lệch phong cách khi tạo rời rạc hàng chục món) + **thử
  nhỏ trước** (không làm hết 12 chương ngay).

  **Đã làm (áp dụng MỌI chương ngay, không phải thử nghiệm):** đổ bóng thật lần đầu tiên
  (`GltfModel.tsx`/`Character.tsx` traverse gán `castShadow`/`receiveShadow`, `directionalLight`
  co `shadow-camera` theo cỡ phòng) + `<ContactShadows>` (drei) cho bóng mềm sát chân đồ — trước
  đó phòng KHÔNG có bóng đổ nào. Bẫy nhỏ: đặt `ContactShadows` ở `y=0.001` bị CHÌM vào sàn (mặt
  sàn thật ở `FLOOR_TOP_Y=0.05`, đúng lỗi đã gặp với hoa Tết ở mốc 8b) — sửa lên `y=0.052`.

  **Thử nghiệm (CHỈ Chương 1, chưa quyết mở rộng):** tải 2 pack Quaternius (CC0, qua poly.pizza)
  — `Furniture Pack` (desk/chair/bed/bookcase/nightstand) + `Ultimate House Interior Pack`
  (lamp/rug/plant/window) — thay hẳn đồ đạc rời của Chương 1 qua `RoomShellV2Trial.tsx`, bật/tắt
  bằng `V2_TRIAL_CHAPTER_1` ở đầu `RoomShell.tsx`. Tường/sàn/nhân vật GIỮ NGUYÊN Kenney. Kết quả
  soi bằng mắt: khác biệt RÕ RỆT — vân gỗ, sách trên kệ, giường có khung/nệm nhìn thật, khác hẳn
  khối phẳng cũ. Phải chỉnh scale nhiều lần (giường ban đầu to gần gấp đôi phòng) — cùng bài học
  "mỗi pack CC0 có tỉ lệ gốc riêng, không đoán được, phải soi bằng mắt" đã gặp lặp lại nhiều lần
  ở mốc 8b (Cube Pets, Nature Kit). **Đây CHƯA phải quyết định cuối** — đang chờ chủ dự án tự mở
  app xem rồi chốt có mở rộng ra 11 chương còn lại không, hay đổi hướng khác.
- **Tiếp theo:** chờ chủ dự án xem thử nghiệm phong cách 3D rồi quyết (mở rộng ra cả 12 chương /
  đổi hướng / giữ nguyên Kenney). Còn hai flag `[CHƯA HỎI]` cần xác nhận (nghĩa "nhập dữ liệu" ở
  mốc 8a, câu chữ thông báo nhắc tối ở mốc 8b) — hỏi lại nếu chưa được hỏi. Phần cron/backup của
  mốc 7 gốc vẫn còn treo nếu chủ dự án đổi ý.
- Nền tảng (`SPEC.md` §8.5): Next.js 16 (App Router, Turbopack) + TypeScript strict · Tailwind v4 ·
  react-three-fiber v9 + drei v10 · Vitest · **Postgres 16 local (Homebrew) qua Drizzle** — DB
  dev thật trên máy, không phải SQLite giả lập; production trỏ Neon qua `DATABASE_URL` khi
  deploy · asset 3D/âm thanh dùng pack Kenney CC0 có sẵn (`public/CREDITS.md`) · ba chỉ số
  **Mind · Health · Spirit**.
- Bốn vòng hỏi đáp đã xong (Q1–Q34 · R1–R10 · S1–S5 · T1) — sổ quyết định ở **`SPEC.md` §11.1–11.4**.
  **Không còn câu hỏi mở nào** ở mục 4.
- Đã xong trong mốc 1: `core/balance.ts` · `core/clock.ts` · `core/day.ts` · `core/session.ts` ·
  phòng Chương 1 + nhân vật giai đoạn 1 (`components/room/`) · đồng hồ pomodoro
  (`components/timer/`).
- Đã xong trong mốc 2: schema Postgres đầy đủ 14 bảng (`db/schema.ts`, đúng `SPEC.md` §7) ·
  seed (`db/seed.ts` — 3 nhãn, 3 thói quen, 6 daily_tasks, settings, 30 prompts tiếng Anh) ·
  `db/queries.ts` + Server Actions (`app/actions/`) · đồng hồ pomodoro chuyển sang DB thật
  (không còn localStorage), tự đóng phiên quá `ends_at` · nghi thức tối đầy đủ — thói quen,
  tâm trạng, nhật ký (câu gợi ý xoay theo ngày, `core/journalPrompt.ts`), đóng ngày, ghi bù
  tới hôm nay/hôm qua (`components/evening/`) · phòng chuyển tối khi cuộn tới nghi thức tối
  (`RoomScene` prop `timeOfDay`) · xuất JSON thủ công (`/api/export`). Test bằng tay qua trình
  duyệt: dùng thật rồi tải lại trang — dữ liệu còn nguyên (đúng luật nghiệm thu mốc 2).
- Đã xong trong mốc 3: toàn bộ `core/engine/` (`levels.ts` · `xp.ts` · `dayAchieved.ts` ·
  `decay.ts` · `streaks.ts` · `room.ts` · `timeline.ts` — hàm `foldTimeline` fold theo ngày, một
  pass duy nhất, xem ghi chú kiến trúc trong chính file đó) · 12 món đồ đầu mở khoá theo cấp,
  mọc/biến mất trong phòng (`components/room/roomItemPlacements.ts`, `RoomItems.tsx`) · ăn mừng
  lên cấp (`components/stats/`) · công cụ tua thời gian chỉ-dev (`app/api/dev/clock`,
  `components/dev/TimeTravelWidget.tsx`, 404 ở production). 173 test qua `npm test`. Đã sửa một
  lỗi CÓ TỪ MỐC 1 bắt gặp lúc soi phòng: div rỗng phủ toàn màn hình (khung nhìn đầu) chặn hết
  chuột chạm tới canvas phòng 3D + canvas dùng z-index âm nên còn thua cả `<body>` khi dò trúng
  chuột — OrbitControls (xoay/zoom, §5.3) thực ra CHƯA BAO GIỜ bấm được từ mốc 1, chỉ là ảnh
  chụp màn hình không lộ ra — xem `components/DailyScreen.tsx` để hiểu cách sửa (hai lớp
  `pointer-events` + bỏ z-index âm).
- Đã xong trong mốc 4: chuỗi ngày-đạt hiện góc màn chính (`🔥{current}`, đổi màu cam khi "nguy
  hiểm") · ăn mừng chạm mốc 7/30/100/365 (`StreakMilestoneToast.tsx`) · **câu trách móc THẬT ĐẦU
  TIÊN trong app** (§4.12, R3, chủ dự án tự duyệt ngày 2026-09-04): *"Okay. {n} days, gone. We're
  not talking about it."* lúc chuỗi gãy thật (`StreakBrokenToast.tsx`) · luật **một ngày ân hạn**
  trước khi gãy thật (bỏ 1 ngày → "nguy hiểm", số giữ nguyên; hôm sau đủ TRỌN VẸN 6/6 thì cứu
  được) — đổi luật [CHỐT] cũ ở §4.6/R5, đã sửa SPEC.md cùng lúc. Phát hiện phụ: công cụ tua thời
  gian (§8.3) từng không tới được Server Action dưới Next.js 16 + Turbopack (route và action
  không share module instance của `core/clock.ts` trong dev mode) — sửa bằng lưu override vào
  `globalThis` thay vì biến module thường.
- Đã xong trong mốc 5 (tài sản + chương + nâng cấp nhà, SPEC.md §4.9): `core/engine/chapters.ts`
  (chương từ tổng tài sản, chương trung gian, điều kiện "Trưởng thành" = Thanh niên + Chương 12)
  · **5 vỏ nhà gốc** theo chương (`components/room/shells/`, dựng đủ ngay một lượt theo yêu cầu
  chủ dự án) · số tài sản **[SỬA — 2026-09-05]** đổi từ "mặc định làm mờ" sang LUÔN HIỆN, đặt
  nổi bật giữa màn hình chính (`components/assets/NetWorthControl.tsx`, `profile.hide_money`
  default `false`) sau khi chủ dự án tự dùng thử — ngoại lệ có chủ ý với nguyên tắc 4 (§2) · chế
  độ tập trung thêm **hạt sáng đom đóm** rải khắp khung hình (`components/room/Fireflies.tsx`,
  InstancedMesh) + đồng hồ/vòng tròn phóng to (340→480px) + vòng tròn đổi ý nghĩa từ "số phiên
  ngày" sang "thời gian phiên đang chạy" — cả ba cũng chủ dự án tự xem rồi yêu cầu, đã hỏi trước
  vì đụng nguyên tắc 1 (§2), đã sửa SPEC.md §5.1 cùng lúc. Hai lỗi thật bắt gặp lúc soi: (1)
  `net_worth_entries.stocks_vnd`/`gold_vnd` từng khai `integer` (trần ~2,1 tỉ) trong khi SPEC.md
  đòi tới 26 tỉ (Chương 12) — sửa bằng `bigint`, migrate không mất dữ liệu cũ; (2) sương mù cảnh
  3D cố định không co theo camera lùi xa dần theo cỡ phòng — phòng lớn bị mờ trắng như lỗi
  render — sửa bằng co giãn `fogNear`/`fogFar` cùng hệ số camera.
- Đã xong trong mốc 6 (nhìn lại tuần, SPEC.md §5.2): trang riêng đầu tiên ngoài `/`
  (`app/week/page.tsx`) — ba thanh chỉ số, tỉ lệ giữ thói quen, đường cong tâm trạng, % ghi bù,
  trích nhật ký, một câu tương quan (`core/engine/correlations.ts`, Pearson trên khung lăn 8 tuần,
  chọn |r| mạnh nhất vượt ngưỡng 0,3), ô đúc kết tuần (`core/weekReviewCompose.ts`, 4 câu hỏi cố
  định — thêm sau khi chủ dự án khen câu hỏi gốc, tách thuật toán gộp/tách dùng chung ra
  `core/qaCompose.ts` để nhật ký hằng ngày và đúc kết tuần cùng dùng). Kích hoạt lần đầu hai
  khoản thưởng (+100 viết đúc kết, +200 tuần trọn vẹn) đã có sẵn từ mốc 3 nhưng chưa từng có UI.
  Mở rộng `RawCompletedSession`/`RawDayLog` thêm `source`/`mood`/`journalText`. 254 test.
- **Bốn nguyên tắc kỹ thuật §8 đã có `core/day.ts`, `core/session.ts`, `core/summary.ts`,
  `core/journalPrompt.ts`, `core/engine/*` — thuần, đủ unit test (265 test qua `npm test`),
  không đụng DB/React.**
- Những thứ chủ dự án **cố ý hoãn** (`SPEC.md` §11.5) — thẻ cho nhật ký, mốc chương trung gian
  (UI/cách trình bày — engine đã xử lý từ mốc 5), và **câu chữ cụ thể khi app trách móc**. Hỏi
  khi dựng tới đúng chỗ cần. ~~Số lựa chọn tóc/da/trang phục~~ đã giải quyết ở mốc 8a — không
  phải slider độc lập (asset không hỗ trợ), mà 12 hình dáng dựng sẵn chọn nguyên bộ, chủ dự án
  đã xác nhận hướng này trước khi tải asset.
- **30 câu gợi ý nhật ký đã seed** (mốc 2, tiếng Anh — bảng `prompts`) làm bộ khởi đầu, chưa
  phải bản duyệt cuối cùng "~60 câu" mà chủ dự án nhắc. **Từ mốc 8a, Cài đặt đã có CRUD đầy đủ**
  (thêm/sửa/xoá câu gợi ý, `components/settings/PromptsSection.tsx`) — công cụ đã sẵn sàng, chỉ
  còn chờ chủ dự án tự duyệt/viết thêm khi rảnh, không cần tôi động tay vào code nữa cho việc này.

---

## Ba luật cứng — vi phạm là phải làm lại từ đầu

**1. Không rõ thì hỏi. Tuyệt đối không tự chọn luật.**
Spec không nói tới một trường hợp → dừng lại và hỏi. Đừng viết một luật "nghe hợp lý" rồi đi tiếp.
Hai chỗ trong spec mâu thuẫn nhau → hỏi, đừng tự chọn một bên.
*(Đây là lý do số 1 làm hỏng bản trước — `SPEC.md` §12.2)*

**2. Đổi luật thì sửa `SPEC.md` trong CÙNG lần thay đổi đó.**
Không có "sửa tài liệu sau". Code và spec nói hai chuyện khác nhau = bug nghiêm trọng. *(§12.3)*

**3. Chưa nối vào giao diện thì chưa xong.**
Hàm viết xong mà không chỗ nào gọi; trạng thái chỉ nằm trong React mà không lưu xuống DB;
tính năng không bấm tới được — **chưa xong, đừng báo là xong.** *(§12.5)*

---

## Ký hiệu trong `SPEC.md`

| Ký hiệu | Nghĩa |
|---|---|
| **[CHỐT]** | Đã quyết. Dựng đúng như viết. Không diễn giải khác, không "cải tiến" giúp. |
| **[TẠM]** | Số tạm. Dùng đúng số đó, đặt trong `balance.ts` để sửa dễ. |
| **[HỎI TÔI]** | Chưa quyết. Hỏi trước khi dựng tới đó. Gom ở mục 11. |

---

## Bốn nguyên tắc kỹ thuật (`SPEC.md` §8) — bản trước làm đúng, giữ nguyên

1. **Không lưu XP.** Không có cột XP / cấp / giai đoạn / chuỗi nào trong DB.
   Mọi con số tính lại từ bản ghi thô mỗi lần đọc, bằng hàm thuần.
2. **Một file cân bằng duy nhất — `balance.ts`.** Mọi con số (XP mỗi hành động, ngưỡng cấp,
   mốc chuỗi, mốc chương, ngưỡng thói quen) nằm ở đó, sửa được mà không đụng logic.
3. **Một chỗ duy nhất được đọc đồng hồ.** Chỉ một module gọi `Date.now()`; mọi nơi khác gọi
   `now()` của module đó. Bắt buộc — nếu không, công cụ tua thời gian để test sẽ vô nghĩa.
4. **Logic game là hàm thuần**, dạng `(bản ghi thô, thời điểm) → kết quả`, không đụng DB,
   không đụng React. Phần này phải có unit test đầy đủ.

**Thêm một luật rút ra từ bản hỏng:** không viết cứng tên nhãn / thói quen vào logic.
"6 việc trong ngày" đọc từ bảng `daily_tasks`, không phải hằng số trong code. *(§12.4)*

---

## Thứ tự dựng (`SPEC.md` §9) — không được đảo

`1` phòng 3D + nhân vật + pomodoro → `2` DB + nghi thức tối → `3` XP/cấp/đồ đạc →
`4` chuỗi + ngày đạt → `5` tài sản + chương → `6` nhìn lại tuần → `7` thư viện + kho lưu trữ →
`8` cài đặt đầy đủ + đánh bóng.

**Luật nghiệm thu:** cuối mỗi mốc, thứ mở ra phải **trông như sản phẩm thật**.
Nếu màn hình vẫn là danh sách nút và số → mốc đó chưa xong.

---

## Đừng đề xuất, đừng tự thêm (`SPEC.md` §10)

to-do list / quản lý dự án · lịch & time-blocking · theo dõi chi tiêu · API sàn chứng khoán ·
theo dõi đồ ăn/cân nặng · đồng bộ Google Calendar / Notion / Apple Health · app di động ·
nhiều người dùng · so sánh với người khác · lời khuyên đầu tư · push notification khi chưa cần ·
đăng nhập / tài khoản.

---

## Bản v3 hiền, chủ dự án đã đổi sang hướng khắc nghiệt (2026-09-02)

Đừng khôi phục lại các luật cũ dưới đây — chúng đã bị gỡ **có chủ ý**:

| Bản v3 nói | Giờ là |
|---|---|
| Chỉ số không bao giờ giảm | **Trừ `−20 × cấp` mỗi ngày** sau 3 ngày không chạm, sàn 0 |
| Không tụt cấp, không mất đồ | **Có tụt cấp, đồ biến khỏi phòng** |
| Nhân vật không nhỏ lại | **Đứa bé nhỏ lại được** — giai đoạn đi theo tổng XP |
| Không bao giờ dùng chữ tiêu cực | **Được trách hết** — vắng mặt, tài sản xuống, gãy chuỗi, ngày không đạt |
| Mỗi tuần có thứ mới trong phòng | **Chỉ có đồ khi đủ điểm**, không rơi theo thời gian |
| Sport/Sleep đạt ở mức ≥ 3 | **≥ 4** · Deep work **≥ 4 phiên** (không phải 2) |

Hai chỗ **vẫn hiền, giữ nguyên**: ghi bù ăn đủ 30 (quên chỉ là quên), và biểu cảm nhân vật lúc
vắng mặt vẫn dừng ở một mức rồi hồi ngay. Được phép trách **không** có nghĩa là tự nghĩ ra
giọng — câu chữ cụ thể phải hỏi trước khi viết.

---

## Giọng và cảm giác

- Viết lời trong app **như người nói chuyện**: "Nice — take a break" chứ không phải
  "Session completed".
- Nguyên tắc 2 là **"có thể trách móc tôi"**, và ngày 2026-09-02 chủ dự án chốt **được trách
  hết**: vắng mặt, tài sản xuống chương, gãy chuỗi, ngày không đạt. Mọi câu cấm chữ tiêu cực
  ở `SPEC.md` §4.9 và §4.12 đã gỡ. **Nhưng câu chữ cụ thể thì hỏi trước khi viết** — được phép
  trách không có nghĩa là tự nghĩ ra giọng.
- Phần **hình ảnh** khi vắng mặt vẫn giữ luật cũ: nhân vật buồn đi sau 3 ngày, dừng ở đúng một
  mức, hồi phục ngay khi quay lại. Chỉ có **XP** là mất thật và phải kiếm lại.
- Hoạt ảnh chỉ ở khoảnh khắc chuyển tiếp. Lúc đồng hồ đang chạy: gần như trống.
- Ban ngày không có biểu đồ. Thống kê sống ở màn hình riêng.

---

## Quy ước thời gian

Một "ngày" chạy **04:00 → 03:59:59 hôm sau**, theo giờ Việt Nam (`Asia/Ho_Chi_Minh`, UTC+7).
Mọi mốc thời gian **lưu UTC**, hiển thị giờ Việt Nam. `day_key` dạng `YYYY-MM-DD`.
