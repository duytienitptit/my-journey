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

- Giai đoạn: **xong mốc 1, 2, 3, 4, 5**, kế hoạch đã duyệt ngày 2026-09-02 — xem
  `.claude/plans/h-y-l-n-1-plan-glimmering-clock.md`. Mốc 5 (tài sản + chương + nâng cấp nhà,
  SPEC.md §4.9): `core/engine/chapters.ts` (chương từ tổng tài sản, chương trung gian khi nhảy
  vọt, điều kiện "Trưởng thành" = Thanh niên + Chương 12) · `net_worth_entries`/`chapter_events`
  nối thật qua `db/queries.ts` + `app/actions/assets.ts` · số tài sản **[SỬA — 2026-09-05]**
  giờ LUÔN HIỆN, đặt nổi bật giữa màn hình chính (`components/assets/NetWorthControl.tsx`,
  `profile.hide_money` đổi mặc định `false`) — chủ dự án tự dùng thử rồi đổi ý, không còn mặc
  định làm mờ như bản đầu; đã sửa SPEC.md §4.9 cùng lúc, ghi rõ đây là ngoại lệ CÓ CHỦ Ý với
  nguyên tắc 4 (§2). **5 vỏ nhà gốc theo chương** (`components/room/shells/`)
  dựng ĐỦ ngay trong lượt này (chủ dự án chọn, không hoãn): phòng trọ → phòng rộng/studio → căn
  hộ (thêm sofa/TV/bếp) → căn hộ cao tầng (skyline thủ công, không tải model) → nhà phố (cầu
  thang trang trí) → nhà có sân/vườn (Kenney Nature Kit) — camera + sương mù co giãn theo cỡ
  phòng (`shells/footprint.ts`). Xác nhận bằng mắt qua trình duyệt cho ĐỦ CẢ 12 chương (không
  chỉ vài mẫu) + luồng thật bấm nút/gõ số/lưu, không chỉ seed thẳng DB.
- **Chế độ tập trung nâng cấp [SỬA/THÊM — 2026-09-05]** (SPEC.md §5.1) — chủ dự án tự bấm Start
  xem trực tiếp rồi cho ba phản hồi liên tiếp: (1) hạt sáng đom đóm `components/room/Fireflies.tsx`
  (InstancedMesh, mờ dần vào/ra theo `focusMode`) đổi từ "quanh nhân vật, bán kính hẹp" sang
  **rải khắp cả khung hình** (neo vào `framing.target` — điểm camera nhìn vào — không phải vị
  trí nhân vật, bán kính 5.5, ~90 hạt); (2) vòng tròn quanh đồng hồ đổi từ "số phiên trong ngày"
  (đứng yên suốt phiên, chủ dự án chê "không chuẩn xác") sang **thời gian phiên đang chạy** (đầy
  dần tới lúc hết giờ); (3) đồng hồ đếm ngược + vòng tròn **to hơn hẳn** (340→480, text-7xl→9xl).
  Đụng nguyên tắc 1 ở §2 ("gần như trống" lúc tập trung) — đã hỏi trước khi code (AskUserQuestion:
  mở rộng ambient trong phòng tối sẵn có, KHÔNG phải nền trừu tượng tách biệt), đã sửa SPEC.md
  cùng lúc ghi rõ đây là ngoại lệ có chủ ý, có giới hạn. `Math.random()` trong hạt sáng phải sinh
  ở `useEffect` (sau render), không phải `useMemo` — React Compiler/`react-hooks/purity` cấm gọi
  hàm không thuần ngay trong thân render, kể cả trong factory của useMemo.
- **Tiếp theo: mốc 6**
  (nhìn lại tuần + thống kê + tương quan).
- **Phát hiện đáng nhớ lúc soi mốc 5 — lỗi schema có thật, không chỉ lỗi hiển thị:**
  `net_worth_entries.stocks_vnd`/`gold_vnd` từng khai `integer` (Postgres, trần ~2,1 tỉ) trong
  khi SPEC.md §4.9 tự đòi tới 26.000.000.000 (Chương 12) — nhập bất kỳ số nào ≥ Chương 8 (3 tỉ)
  là lỗi INSERT ngay. Sửa bằng `bigint` (Drizzle `{mode:"number"}`, đủ an toàn tới 2^53), migrate
  `0001_left_ultimates.sql` (ALTER COLUMN, không mất dữ liệu cũ). Lỗi thứ hai: sương mù cảnh 3D
  cố định [9,19] không co giãn theo camera — phòng lớn (mốc 5 camera lùi xa hơn theo cỡ phòng)
  rơi hẳn vào dải sương mù, cả cảnh mờ trắng trông như vỡ hình dù không phải — sửa bằng co giãn
  `fogNear`/`fogFar` cùng hệ số với camera.
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
- **Bốn nguyên tắc kỹ thuật §8 đã có `core/day.ts`, `core/session.ts`, `core/summary.ts`,
  `core/journalPrompt.ts`, `core/engine/*` — thuần, đủ unit test (225 test qua `npm test`),
  không đụng DB/React.**
- Những thứ chủ dự án **cố ý hoãn** (`SPEC.md` §11.5) — số lựa chọn tóc/da/trang phục, thẻ cho
  nhật ký, mốc chương trung gian, và **câu chữ cụ thể khi app trách móc**. Hỏi khi dựng tới
  đúng chỗ cần.
- **30 câu gợi ý nhật ký đã seed** (mốc 2, tiếng Anh — bảng `prompts`) làm bộ khởi đầu, chưa
  phải bản duyệt cuối cùng "~60 câu" mà chủ dự án nhắc — mở rộng/sửa khi có Cài đặt (mốc 8),
  hoặc sớm hơn nếu được yêu cầu.

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
