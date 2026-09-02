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

- Giai đoạn: **xong mốc 1 và mốc 2**, kế hoạch đã duyệt ngày 2026-09-02 — xem
  `.claude/plans/h-y-l-n-1-plan-glimmering-clock.md`. Tiếp theo là **mốc 3** (XP/cấp/đồ đạc).
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
- **Bốn nguyên tắc kỹ thuật §8 đã có `core/day.ts`, `core/session.ts`, `core/summary.ts`,
  `core/journalPrompt.ts` — thuần, đủ unit test (70 test qua `npm test`), không đụng DB/React.**
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
