# My Journey — Bản mô tả dự án

> **Gửi AI sẽ dựng app này.**
>
> Đây là app cá nhân của tôi, chỉ mình tôi dùng. **Đọc hết file này trước khi viết dòng code đầu tiên**, đặc biệt là mục 12.

> Ngày viết: 2026-08-29 · Cập nhật: 2026-09-02 (thêm 8.5, viết lại 4.1, mở rộng mục 11)
> Ngôn ngữ trong app: tiếng Anh · Trao đổi giữa tôi và Claude: tiếng Việt

---

## 0. Cách tôi muốn bạn làm việc

Tôi đánh dấu ba loại thông tin trong file này:

| Ký hiệu | Nghĩa |
|---|---|
| **[CHỐT]** | Tôi đã quyết rồi. Dựng đúng như tôi viết. Đừng diễn giải khác, đừng "cải tiến" giúp tôi. |
| **[TẠM]** | Con số tôi tạm đặt để bạn có cái cụ thể mà dựng. Cứ dùng đúng số này. Tôi sẽ chỉnh lại sau khi dùng thật vài tuần — nên để nó ở chỗ dễ sửa (mục 8.2). |
| **[HỎI TÔI]** | Tôi chưa quyết. **Đừng tự chọn** — hỏi tôi khi dựng tới đó. Gom hết ở mục 11. |

**Quy tắc quan trọng nhất:** nếu file này không nói rõ một trường hợp, **dừng lại và hỏi tôi**. Đừng tự chọn một luật rồi đi tiếp. Bản trước hỏng chính vì chỗ nào tôi viết không rõ thì code tự bịa ra một luật, mà tôi không hề biết cho tới lúc quá muộn.

Nếu bạn thấy hai chỗ trong file này mâu thuẫn nhau — hỏi tôi, đừng tự chọn một bên.

---

## 1. Tôi muốn xây cái gì

**Một trò chơi mà nhân vật chính là tôi, và điểm số là cuộc đời thật.**

Tôi 22 tuổi, mới đi làm, đang xây sự nghiệp. Tôi muốn app này đi cùng tôi 2–3 năm tới dưới hình dạng một đứa bé lớn dần lên — lớn theo cách tôi sống, không theo cách tôi khai báo.

**Vòng lặp tôi muốn:** tôi làm việc trong app → app âm thầm ghi lại → tối tôi ngồi lại viết → đứa bé lớn lên → cuối tuần tôi rút ra kết luận → tuần sau tôi sống khác đi.

**Nguyên tắc trung tâm của toàn bộ thiết kế:**

> **Tài sản quyết định KÍCH THƯỚC không gian. Nỗ lực quyết định NHỮNG GÌ TRONG ĐÓ.**

Một người có thể ở phòng trọ mà đầy ắp sách vở, cây cối, dụng cụ tập — hoặc ở nhà lớn mà trống trơn. Tôi muốn nhìn thấy mình là loại nào, mỗi ngày, không cần ai giải thích.

**Điểm khác biệt cốt lõi so với mọi app ngoài kia:** dữ liệu tự chảy vào từ việc tôi làm việc, không phải từ việc tôi ngồi nhập liệu. Pomodoro là cái van — tôi bấm start vì tôi muốn tập trung, và tác dụng phụ là app biết tôi đã làm gì.

---

## 2. Năm nguyên tắc — dùng để phân xử khi bạn phân vân

Khi bạn gặp một lựa chọn mà file này không nói rõ, quay lại đây trước khi hỏi tôi. Năm điều này là toà án.


1. **Vui ở chỗ chuyển tiếp, tĩnh ở chỗ tập trung.** Hoạt ảnh và ăn mừng chỉ xuất hiện khi tôi bấm start, khi hết phiên, khi tích xong việc, khi lên cấp. Lúc đồng hồ chạy: gần như trống.
2. **Có thể trách móc tôi.** **[CHỐT — 2026-09-02]** Đúng năm điều, không phải bảy — tôi đã xác nhận. *Nhưng phạm vi trách móc còn phải chốt:* 4.3, 4.6, 4.9 và 4.12 hiện đang **cấm hẳn** chữ tiêu cực. Xem **R3** ở mục 11.2.
3. **Dữ liệu chảy vào, không bị bơm vào.** Ưu tiên tuyệt đối cho thứ app tự ghi được
4. **Thống kê không đập vào mặt.** Ban ngày không có biểu đồ. Số liệu sống ở màn hình riêng.
5. **Game phục vụ cuộc sống, không ngược lại.** Phải có nguồn điểm dành riêng cho nghỉ ngơi, để chính cái game không đẩy tôi tới kiệt sức.

---

## 3. Người dùng và phạm vi

- **Một người duy nhất — tôi.** Không chia sẻ, không cộng đồng, không so sánh với người khác. **[CHỐT]**
- **Máy tính là chính.** Thiết kế cho màn hình rộng. **[CHỐT]**
- Ngân sách thời gian của tôi: ****5–10 phút mỗi tối để viết nhật ký review tuần có thể lâu hơn**. **[CHỐT]**
- **Đừng dựng đăng nhập.** Không màn hình mật khẩu, không tài khoản. . **[CHỐT]**

---

## 4. Cơ chế — phần tôi cần bạn đọc kỹ nhất

> Tôi viết mục này chi tiết tới mức không còn chỗ cho bạn diễn giải. Nếu thấy vẫn còn chỗ mơ hồ, đó là lỗi của tôi — hỏi tôi.
>
> **Toàn bộ con số trong mục này phải nằm trong một file cấu hình duy nhất** (`balance.ts`), sửa được mà không phải đụng vào logic. Tôi sẽ chỉnh những số này nhiều lần.

### 4.1 Ba chỉ số

| Chỉ số | Biểu hiện trên nhân vật |
|---|---|
| 📚 **Trí tuệ** | Kính, sách cầm tay, dáng vẻ chăm chú |
| 💪 **Thể chất** | Cao hơn, chắc hơn, dáng đứng thẳng |
| 🧘 **Tinh thần** | Vẻ mặt bình thản, cuốn sổ luôn mang theo |

**Chỉ số có trừ XP thật.** **[CHỐT — 2026-09-02]**

Bỏ bê một chỉ số thì chỉ số đó **mất XP**, không phải chỉ mờ đi về mặt hình ảnh. Tôi chọn vậy vì tôi muốn có sức ép thật — hợp với nguyên tắc 2 (có thể trách móc tôi).

Vẫn phải giữ được luật 8.1: mức trừ là **hàm thuần của bản ghi thô** (`số ngày kể từ lần cuối chỉ số này nhận XP`), không lưu thêm cột nào.

| | **[CHỐT — 2026-09-02]** |
|---|---|
| Bắt đầu trừ sau | **3 ngày** chỉ số đó không nhận XP nào |
| Mức trừ mỗi ngày | **−20 × cấp hiện tại của chính chỉ số đó** |
| Sàn | **0** |
| Tụt cấp | **Có** — đồ của cấp vừa mất biến khỏi phòng |
| Giai đoạn nhân vật | **Có tụt.** Giai đoạn tính theo tổng XP ba chỉ số (4.8), nên **đứa bé nhỏ lại được**. Tôi đã cân nhắc và chấp nhận: cấp càng cao mà bỏ bê thì mất càng nhanh, đúng như ngoài đời. |

*Chi tiết nhỏ, để trong `balance.ts`:* ở cấp 0 công thức cho ra −0, nên dùng **`−20 × max(1, cấp)`** để cấp 0 vẫn trừ −20/ngày. **[TẠM]**

<details>
<summary><b>Con số này rơi ra một tính chất gọn — nhưng chỉ đúng ở dạng đại số, không đúng khi mô phỏng ngày-qua-ngày</b></summary>

**[SỬA — 2026-09-03, phát hiện lúc dựng mốc 3]** Bản trước tôi viết ở đây "bỏ bê 15 ngày = mất một cấp" và "150 ngày thì cấp 10 về 0" — hai con số đó chỉ đúng nếu mức trừ **khoá nguyên ở một cấp suốt 15 ngày rồi mới đổi**. Luật [CHỐT] thật của tôi lại là "`−20 × cấp HIỆN TẠI` mỗi ngày" — và "cấp hiện tại" tính lại từ XP còn lại **mỗi ngày**, đúng tinh thần §8.1. Hai cách đó cho ra hai kết quả khác nhau:

- Ngày đầu tiên trừ theo cấp cao đã kéo XP xuống dưới ngưỡng cấp đó ngay — nghĩa là mức trừ **giảm sớm hơn** dự tính, và vì vậy quá trình decay **kéo dài hơn** 15 ngày/cấp.
- Mô phỏng đúng luật [CHỐT]: **cấp 10 (16.500 XP) decay liên tục về 0 mất 191 ngày**, không phải 150. Khoá lại bằng test ở `test/core/engine/decay.test.ts`.

Vẫn đúng về mặt đại số: khoảng cách giữa cấp `n−1` và cấp `n` là `300×n` XP, mức trừ ở cấp đó là `20×n`/ngày, tỉ lệ `300n÷20n=15` — đây là một hằng số gọn, nhưng chỉ có ý nghĩa nếu bạn trừ **đúng 15 ngày ở nguyên một cấp rồi mới cho phép đổi cấp**, chứ không phải cách luật [CHỐT] thật sự vận hành (tính lại cấp mỗi ngày). Tôi giữ nguyên luật [CHỐT] — đơn giản hơn, nhất quán với "cấp luôn tính lại từ XP hiện tại", không thêm khái niệm "khoá cấp" nào — chỉ sửa lại con số minh hoạ ở đây cho đúng.
</details>

### 4.2 Nhãn và thói quen

**Nhãn** = loại việc tôi bấm đồng hồ pomodoro cho nó. **Thói quen** = việc tôi tự chấm vào buổi tối.

Mỗi nhãn và mỗi thói quen **bắt buộc gắn với đúng một chỉ số**. Không cho phép tạo nhãn không có chỉ số — máy cần biết đường mọc đồ trong phòng. **[CHỐT]**

Đây là danh sách của tôi, dùng làm dữ liệu khởi đầu:

| Tên | Loại | Chỉ số | Cách ghi |
|---|---|---|---|
| English | nhãn | 📚 Trí tuệ | phiên pomodoro |
| Deep work | nhãn | 📚 Trí tuệ | phiên pomodoro |
| New knowledge | nhãn | 📚 Trí tuệ | phiên pomodoro |
| Sport | thói quen | 💪 Thể chất | tôi tự chấm 1–5 |
| Sleep enough | thói quen | 💪 Thể chất | tôi tự chấm 1–5 |
| Viết nhật ký | thói quen | 🧘 Tinh thần | có viết / không viết |

**"Viết nhật ký" là một thói quen thật sự**, không phải việc riêng nằm ngoài hệ thống. Nó ăn +20 XP như Sport/Sleep, tính vào chuỗi, hiện trong danh sách thói quen buổi tối. Đây là nguồn Tinh thần duy nhất đến từ một hành động cụ thể của tôi. **[CHỐT]**

**Sport và Sleep enough tôi tự chấm điểm 1–5, không phải tích Có/Không.** **[CHỐT]**

Cả nhãn lẫn thói quen tôi phải **sửa được trong Cài đặt** (tên, emoji, màu, chỉ số, thêm/xoá/lưu trữ). Tôi thêm một nhãn mới thì không được làm hỏng bất kỳ phép tính nào — xem 4.5. **[CHỐT]**

### 4.3 Phiên pomodoro

- Mặc định **25 phút**. Tôi chỉnh được. **[CHỐT]**
- **Không có nghỉ dài.** Xong phiên nào cũng chỉ đề nghị nghỉ **5 phút**, không có luật "cứ 4 phiên thì nghỉ 15 phút". **[CHỐT — 2026-09-02]**
- Trước khi start tôi **bấm chọn một nhãn**. Đừng cho tôi gõ tự do. **[CHỐT]**
- **Hết phiên: chuông + thông báo trình duyệt**, một khoảnh khắc ăn mừng nhỏ, rồi đề nghị nghỉ 5 phút. **Đừng hỏi tôi gì cả lúc đó.** **[CHỐT]**
- **Phiên chỉ tính điểm khi chạy hết trọn thời lượng.** Tôi bấm dừng giữa chừng = 0 điểm. Không tín dụng một phần. **[CHỐT]**
- **Chỉ cho phép một phiên chạy tại một thời điểm.** **[CHỐT]**
- **Không có nút tạm dừng.** Tạm dừng là ngắt quãng, mà ngắt quãng thì không còn là làm việc tập trung. Chỉ có một nút, và nó có nghĩa là bỏ phiên. **[CHỐT — 2026-09-02]**
- Phiên tôi tự bấm dừng giữa chừng vẫn **lưu lại** với `status = abandoned`, ăn **0 XP**, để cuối tuần tôi biết mình có hay bỏ giữa chừng không. **[CHỐT — 2026-09-02]**
- **Phiên nghỉ không ghi vào dữ liệu**, không XP. **[CHỐT — 2026-09-02]**
- **Ghi bù:** cho lúc tôi làm việc mà quên bật đồng hồ. Tôi chọn nhãn + số phiên. **Chỉ ghi được cho hôm nay**, không lùi ngày. Đánh dấu trong dữ liệu để cuối tuần tôi thấy *"12 phiên, trong đó 3 phiên ghi bù"*. Đừng phạt, đừng giới hạn — người duy nhất tôi cần trung thực với là chính tôi. **[CHỐT]**

**Phiên tôi bỏ quên** (mở đồng hồ rồi đóng tab, không quay lại):
- **Phiên tự dừng khi chạy đủ thời lượng** — kể cả lúc tôi đã đóng tab. Máy chủ đóng phiên theo `ends_at`, tính là **hoàn thành**, ghi vào ngày lúc **bắt đầu**. **Không có hạn quay lại.** **[CHỐT — 2026-09-02]**
- *Hệ quả tôi chấp nhận:* một phiên mở từ thứ Hai mà thứ Sáu tôi mới mở lại app vẫn được tính cho thứ Hai — nên một ngày cũ có thể bỗng thành "đạt".

### 4.4 Nguồn điểm

| Hành động | XP | Vào chỉ số |
|---|---|---|
| Hoàn thành trọn một phiên pomodoro | **30** **[CHỐT — 2026-09-02]** | của nhãn |
| Ghi bù một phiên | **30** — bằng phiên thật | của nhãn |
| Giữ được một thói quen | **20** | của thói quen |
| Đóng ngày | **50** | 🧘 Tinh thần |
| Nghỉ ngơi đúng cách | **15** | 💪 Thể chất |
| Viết đúc kết tuần | **100** | 🧘 Tinh thần |
| **Ngày đạt** (theo luật 4.5) | **30** **[CHỐT — 2026-09-02]** | chia đều, 10 mỗi chỉ số |

*Dòng cuối bảng trước đây tên là "chạm cả ba chỉ số". Ngày 2026-09-02 tôi đổi thành **thưởng ngày đạt**: cứ ngày nào đạt theo 4.5 là được +30, **không** cần trải đủ ba chỉ số. Nghĩa là Chủ nhật chỉ viết nhật ký cũng được +30, vì luật Chủ nhật chỉ đòi có thế.* **[CHỐT]**

**Đừng dựng phép nhân, combo, hay "ngày vàng x2".** Mỗi hành động cộng đúng một số cố định — cộng thêm thưởng mốc chuỗi ở 4.6. **[CHỐT]**

*Về con số 30:* tôi lấy bằng đúng mức bản cũ (25 phút × 1 điểm + 5 thưởng) để thang cấp độ không phải tính lại. **Hệ quả tôi đã biết và chấp nhận:** vì tính theo phiên chứ không theo phút, nếu tôi đổi độ dài phiên thành 50 phút thì tốc độ lên điểm giảm một nửa. Nếu sau này tôi hay đổi độ dài phiên, tôi sẽ chốt lại luật này.

*Về ghi bù:* ăn đủ **30**, bằng phiên thật, **[CHỐT — 2026-09-02]** — quên bật đồng hồ thì đơn giản là quên, không phải lỗi đáng phạt. Đây là chỗ duy nhất nguyên tắc 2 (được trách móc) **không** áp dụng. Tôi vẫn có cột "% ghi bù" ở màn tuần để tự soi.

### 4.5 Ngày "đạt"

Mỗi ngày được chấm **đạt** hoặc **không đạt** dựa trên 6 việc:

| Việc | Điều kiện đạt |
|---|---|
| English | ≥ **4** phiên hoàn thành trong ngày |
| Deep work | ≥ **4** phiên **[CHỐT — 2026-09-02]** |
| New knowledge | ≥ **2** phiên |
| Sport | điểm tôi chấm **≥ 4** **[CHỐT — 2026-09-02]** |
| Sleep enough | điểm tôi chấm **≥ 4** **[CHỐT — 2026-09-02]** |
| Viết nhật ký | có chữ trong ô nhật ký |

**Ngưỡng ở bảng này cũng chính là ngưỡng "giữ được" để ăn +20 XP ở 4.4 — nhưng chỉ áp cho THÓI QUEN.** Nhãn đạt ngưỡng chỉ tính vào "ngày đạt", **không** có +20 XP. **[CHỐT — 2026-09-02, câu Q10]** Tôi chấm Sport 2 điểm = không giữ được = không có 20 XP và không tính vào ngày đạt. Một ngưỡng duy nhất, dùng cho cả hai việc — đừng dựng hai ngưỡng riêng. **[CHỐT]**

Số việc tôi cần đạt, đổi theo thứ trong tuần:

| Thứ | Cần |
|---|---|
| Thứ 2 → Thứ 6 | **4/6** việc |
| Thứ 7 | **3/6** việc |
| Chủ nhật | **chỉ cần viết nhật ký** — không quan tâm 5 việc kia |

**Danh sách 6 việc này tôi phải sửa được trong Cài đặt** — mỗi dòng là (một nhãn hoặc một thói quen) + (ngưỡng). **Đừng viết cứng tên nhãn vào logic.** Tôi thêm/xoá/đổi tên nhãn thì phép tính không được hỏng. **[CHỐT — bản cũ sai đúng chỗ này]**

**Nhãn không nằm trong 6 việc vẫn ăn XP bình thường**, chỉ là không tính vào "ngày đạt". **[CHỐT]**

<details>
<summary><b>Tôi đã tính rồi, để bạn hiểu vì sao ngưỡng 4/6 quan trọng</b></summary>

3 việc rẻ (Sport, Sleep, Nhật ký) chỉ tốn vài cú bấm của tôi. Nên **4/6 ngày thường = 3 việc rẻ + đúng một việc pomodoro**. Việc pomodoro rẻ nhất giờ chỉ còn New knowledge — 2 phiên, tức **50 phút tập trung**. *(Deep work đã lên 4 phiên ngày 2026-09-02.)*

- Ngày thường đạt = 50 phút tập trung + 3 cú bấm buổi tối.
- Thứ 7 đạt = 3 cú bấm, không cần làm việc.
- Chủ nhật đạt = viết ba dòng.

Còn nếu tôi làm hết cả 3 việc pomodoro thì là **10 phiên = 4 giờ 10 phút** tập trung mỗi ngày — mức đó là mục tiêu tôi vươn tới, không phải mức để giữ chuỗi. Tôi cố ý thiết kế vậy: **chuỗi không được đòi hỏi ngày nào tôi cũng phải xuất sắc.**
</details>

### 4.6 Hai chuỗi và mốc thưởng

Hai chuỗi chạy **song song, hoàn toàn độc lập** — gãy chuỗi này không được đụng chuỗi kia: **[CHỐT]**

- **Chuỗi ngày-đạt** — đếm theo luật 4.5. **Chuỗi tính tới hết hôm qua.** Hôm nay chưa đạt thì con số vẫn đứng nguyên. ~~hết ngày mà không đạt thì sáng hôm sau về 0~~ **[SỬA — 2026-09-04, xem "Một ngày ân hạn" ngay dưới đây — không còn về 0 ngay, có ân hạn 1 ngày trước khi gãy thật]**. *(Luật gốc chốt 2026-09-02, xem §11.2 R5 — đổi ở đây, không sửa lại sổ quyết định.)*
- **Chuỗi nhật ký** — chỉ cần tôi có viết, không cần đạt cả ngày. **Không có ân hạn** — bỏ viết 1 ngày là về 0 ngay, đúng luật gốc, không đổi. **[CHỐT — 2026-09-04]**

**Một ngày ân hạn cho chuỗi ngày-đạt — [CHỐT — 2026-09-04].** Bỏ lỡ đúng 1 ngày không làm chuỗi mất ngay — số hiện tại đứng yên, chuyển sang trạng thái **"nguy hiểm"** (hiện bằng đổi màu badge góc màn hình, không cần thêm chữ). Đúng NGÀY KẾ TIẾP là cơ hội duy nhất để cứu:

- Ngày đó đạt **TRỌN VẸN CẢ 6 việc** (không phải ngưỡng "đạt" thường theo thứ ở 4.5 — kể cả Chủ nhật cũng cần đủ 6, không có ngoại lệ) → chuỗi **nối tiếp như chưa từng bỏ**: ngày bỏ không tính, không xoá; ngày cứu tính +1 bình thường.
- Ngày đó KHÔNG đủ 6/6 (kể cả nếu vẫn đủ ngưỡng "đạt" thường) → **gãy thật**, về 0 ngay lúc đó.

Chỉ đúng **một** ngày ân hạn — không phải "ân hạn dây chuyền": đang ở trạng thái nguy hiểm mà ngày cứu cũng bỏ luôn thì gãy thật ngay, không lùi thêm hạn nữa. Chưa có chuỗi nào (đang ở 0) thì bỏ 1 ngày không cần ân hạn gì — vẫn đứng yên tại 0 như cũ.

*Câu chữ lúc gãy thật, giọng "hờn dỗi dễ thương" — chủ dự án duyệt trực tiếp ngày 2026-09-04:* **"Okay. {n} days, gone. We're not talking about it."** — đây là câu trách móc ĐẦU TIÊN trong app (§4.12, R3).

**Gãy chuỗi không mất gì** — không mất XP, không mất đồ, không mất cấp. Số hiện tại về 0, **số dài nhất giữ vĩnh viễn**. Hiện hai con số song song. **[CHỐT]**

Thưởng khi chạm mốc, mỗi mốc **thưởng đúng một lần trong đời**:

| Mốc | 7 ngày | 30 ngày | 100 ngày | 365 ngày |
|---|---|---|---|---|
| Chuỗi ngày-đạt *(chia đều 3 chỉ số)* | +150 | **+450** | +1.500 | +6.000 |
| Chuỗi nhật ký *(toàn bộ vào Tinh thần)* | +100 | +400 | +1.200 | — |

*Mốc 30 ngày là **450** chứ không phải 500 — để chia đều cho 3 chỉ số không ra số lẻ.* **[CHỐT — 2026-09-02]** Cả bốn mốc giờ đều chia hết: 50 · 150 · 500 · 2.000 mỗi chỉ số.

**Thưởng tuần trọn vẹn:** cả 7 ngày trong tuần đều đạt **và** tôi có viết đúc kết tuần → **+200 Tinh thần**. **[CHỐT]**

*Đã cân nhắc và tôi loại bỏ:* cơ chế nhân ×1,25 cho chỉ số thấp nhất. Thưởng cứng theo mốc đơn giản hơn, đổi lại mất tác dụng tự động kéo chỉ số bị bỏ bê lên. Tôi chấp nhận đánh đổi này — **đừng dựng lại cơ chế nhân.**

### 4.7 "Nghỉ ngơi đúng cách"

**+15 Thể chất mỗi ngày**, tính từ hai điểm tôi tự chấm:

> **Đạt khi (Sport + Sleep enough) ÷ 2 ≥ 4** — tức tổng hai điểm ≥ 8. **[CHỐT — 2026-09-02]**

Ý ban đầu của tôi: một cái hỏi *"có làm không"*, cái kia hỏi *"có làm tử tế không"*.

**[CHỐT — 2026-09-02]** Giữ chấm 1–5 (bỏ ý "chỉ cần tích"), đạt = mỗi cái ≥ 4, nghỉ ngơi = trung bình ≥ 4.

*Hệ quả tôi biết và chấp nhận:* giữ được cả hai thói quen thì tổng luôn ≥ 8, nên **+15 gần như luôn đi kèm** — nó thành phần thưởng cộng thêm chứ không còn là cửa ải thứ hai. Cách duy nhất ăn +15 mà không giữ được cả hai là chấm lệch, ví dụ Sport 5 / Sleep 3.

**[GHI CHÚ KỸ THUẬT — mốc 3]** Công thức nêu đích danh "Sport" và "Sleep enough" — khác `daily_tasks` (4.5) vốn cố ý tổng quát, đọc từ bảng, không hard-code. Engine tìm hai thói quen này qua **slug** (`sport`, `sleep-enough`) chứ không phải tên hiển thị, để đổi tên qua Cài đặt không làm hỏng công thức — nhưng nếu tới mốc 8 tôi **xoá** một trong hai hoặc đổi cả slug, công thức này sẽ không tính được nữa và cần quyết định lại (im lặng bỏ qua? không cho xoá hai thói quen gốc? thay bằng thói quen khác?). Chưa phải **[HỎI TÔI]** vì Cài đặt (mốc 8) chưa tới, nhưng đánh dấu ở đây để không quên hỏi khi tới đó.

*Đã cân nhắc và tôi loại bỏ:* suy luận từ giờ giấc chạy phiên (không chạy sau 22h, có nghỉ giữa các phiên, đóng ngày trước nửa đêm). Ba tiêu chí đó đo sai thứ cần đo — chúng đo *thói quen dùng app của tôi*, không đo *tôi có được nghỉ hay không*. **Đừng dựng lại chúng.**

### 4.8 Cấp độ và giai đoạn

**Cấp của mỗi chỉ số** — lên cấp độc lập nhau. Cấp `n` cần `150 × n × (n+1)` XP tích luỹ trong chính chỉ số đó:

| Cấp | XP | Cấp | XP |
|---|---|---|---|
| 1 | 300 | 15 | 36.000 |
| 5 | 4.500 | 20 | 63.000 |
| 10 | 16.500 | 30 | 139.500 |

**Mỗi lần lên cấp = một món đồ mới trong phòng, hoặc một món cũ được nâng cấp** (kệ sách nhỏ → kệ lớn → cả bức tường sách). **[CHỐT]**

**Giai đoạn nhân vật** — theo **tổng XP cả ba chỉ số cộng lại**:

| GĐ | XP | GĐ | XP |
|---|---|---|---|
| 1 | 0 | 6 | 73.000 |
| 2 | 3.000 | 7 | 113.000 |
| 3 | 10.000 | 8 | 158.000 |
| 4 | 23.000 | **Thanh niên** | **208.000** |
| 5 | 43.000 | **Trưởng thành** | *xem dưới* |

**Trưởng thành — bước cuối cùng — cần đủ CẢ HAI điều kiện:** **[CHỐT — 2026-09-02]**
1. Tổng XP ≥ 208.000 (đã là thanh niên), **và**
2. Tài sản chạm Chương 12.

<details>
<summary><b>Tôi đã kiểm nhịp độ, đây là phép tính</b></summary>

**Ngày thường "vừa đủ đạt"** (2 phiên New knowledge + 3 thói quen + đóng ngày + nghỉ ngơi + thưởng ngày đạt):
`60 + 60 + 50 + 15 + 30 = 215 XP`
*(Việc pomodoro rẻ nhất giờ là New knowledge — Deep work đã lên 4 phiên ngày 2026-09-02.)*

**Ngày tôi làm hết sức** (10 phiên + mọi thứ): `300 + 60 + 50 + 15 + 30 = 455 XP`

**Một tuần đều đặn** (5 ngày thường đạt + T7 đạt 3/6 + CN có đúc kết):

- Thứ 7: `60 + 50 + 15 + 30 = 155`
- Chủ nhật: `40 + 20 + 50 + 100 + 15 + 30 = 255`
- `5×215 + 155 + 255 = **1.485 XP/tuần**`

**Tuần tệ nhất** (tôi chỉ ngồi xuống viết nhật ký + đóng ngày mỗi tối): `6 × 70 + 100 = **520 XP**`
→ *Dòng này là dòng quan trọng nhất với tôi. Tuần tệ nhất vẫn phải nhích lên được — đó là lý do tôi cho "đóng ngày" tới 50 điểm.* Riêng Chủ nhật được thêm +30 vì luật Chủ nhật chỉ đòi có nhật ký.

**Thời gian tới "thanh niên":** 208.000 ÷ 1.485 ≈ **140 tuần ≈ 2,7 năm.** Khớp mục tiêu 2–3 năm của tôi. ✓
</details>

### 4.9 Tài sản và các chương

Tôi nhập tổng tài sản từ hai nguồn: **chứng khoán** và **vàng**. Tôi nhập bất cứ khi nào tôi muốn — **đừng bao giờ nhắc, đừng bao giờ ép tôi nhập**. **[CHỐT]**

**Ngôi nhà bám theo giá trị hiện tại**, không phải mốc cao nhất: tài sản xuống thì nơi ở xuống theo. Tôi đã cân nhắc kỹ và chọn vậy. **[CHỐT]** Bù lại hai điều phải được bảo toàn:
- **Mốc cao nhất tôi từng chạm ghi vĩnh viễn** vào thư viện hành trình — đi qua rồi là đi qua rồi.
- ~~Khi xuống mốc, app tuyệt đối không dùng chữ tiêu cực.~~ **Gỡ ngày 2026-09-02** — nguyên tắc 2 thắng, app được nói thẳng. Câu chữ cụ thể chốt khi dựng màn hình.

| Chương | Mốc | Nơi ở |
|---|---|---|
| 1 | dưới 50tr | Phòng trọ nhỏ |
| 2 | 50tr | Phòng trọ có cửa sổ |
| 3 | 100tr | Phòng rộng, có bàn làm việc riêng |
| 4 | 300tr | Studio |
| 5 | 500tr | Studio có ban công |
| 6 | 1 tỉ | Căn hộ 1 phòng ngủ |
| 7 | 2 tỉ | Căn hộ 2 phòng ngủ |
| 8 | 3 tỉ | Căn hộ cao tầng, view thành phố |
| 9 | 5 tỉ | Nhà phố nhỏ |
| 10 | 10 tỉ | Nhà riêng có sân |
| 11 | 15 tỉ | Nhà có vườn |
| 12 | **26 tỉ** | Nhà lớn có vườn — **đứa bé trưởng thành** |

**Mỗi lần tôi chạm một chương mới lần đầu tiên, ghi lại thành một sự kiện có thật trong dữ liệu** (ngày giờ, ảnh chụp trạng thái). **Đừng tính lại bằng `max()` mỗi lần đọc** — thư viện hành trình cần đọc được "tôi lên Chương 3 vào ngày nào". **[CHỐT — bản cũ sai chỗ này]**

**Số tài sản mặc định làm mờ**, tôi bấm mới hiện. **Trạng thái ẩn/hiện phải lưu lại**, đừng để mất khi tải lại trang. **[CHỐT — bản cũ sai chỗ này]**

Mọi mốc chương ghi bằng **VNĐ**, kể cả chương 12 — **26.000.000.000 đ**, không quy đổi tỉ giá, không cần USD. **[CHỐT — 2026-09-02]**

App chỉ ghi lại con số tôi tự nhập. **Đừng dựng công cụ tài chính, đừng đưa lời khuyên đầu tư, đừng kết nối API sàn nào.** **[CHỐT]**

### 4.10 Mốc ngày: 4 giờ sáng

**Một "ngày" chạy từ 04:00 → 03:59:59 hôm sau, theo giờ Việt Nam.** Tôi viết nhật ký lúc 1 giờ sáng thì vẫn tính cho ngày hôm trước — một đêm thức khuya không được làm tôi mất một ngày trong lịch sử. **[CHỐT]**

Mọi mốc thời gian lưu UTC, hiển thị giờ Việt Nam.

### 4.11 Ghi bù

| Loại | Tôi ghi bù được đến |
|---|---|
| Nghi thức tối (thói quen, tâm trạng, nhật ký, đóng ngày) | hôm nay **hoặc hôm qua** |
| Phiên pomodoro | **chỉ hôm nay** |

Tôi đóng ngày muộn vẫn ăn đủ 50 XP — đừng phạt. **[CHỐT]**

### 4.12 Khi tôi vắng mặt

**[CHỐT — 2026-09-02] App được phép trách tôi ở đây.** Ba câu bảo vệ của bản v3 — không hiện số ngày vắng, chỉ được nói *"Good to see you back"*, không bao giờ dùng chữ tiêu cực — **đã gỡ hết**. Câu chữ cụ thể chốt khi dựng màn hình.

Phần **hình ảnh** vẫn giữ nguyên luật cũ, vì đây là chuyện biểu cảm chứ không phải chuyện điểm:

- **Biểu cảm** dịu xuống sau **3 ngày** tôi vắng mặt hoàn toàn (không phiên nào, không đóng ngày nào, không viết gì).
- Biểu cảm **dừng ở đúng một mức**. Vắng 3 tuần không được trông tệ hơn vắng 3 ngày.
- Biểu cảm **hồi phục ngay lập tức** khi tôi quay lại — một phiên, hoặc một lần đóng ngày.

Phần **điểm** thì khác, và đây là chỗ đổi:

- Chỉ số **mất XP thật** trong lúc tôi vắng (4.1). Khoản đó **không hồi lại bằng một cú bấm** — tôi phải kiếm lại. Đây là cái giá thật của việc biến mất.
- Và vì giai đoạn tính theo tổng XP, **đứa bé có thể nhỏ lại** nếu tôi biến mất đủ lâu. Câu "nhân vật không nhỏ lại" của bản v3 đã gỡ ngày 2026-09-02. Biểu cảm thì vẫn dừng ở một mức và hồi ngay — chỉ có hình hài là đi theo điểm.

---

## 5. Các màn hình

> **Đọc mục 12 trước khi dựng phần này.** Bản trước hỏng vì dựng engine trước, giao diện sau — và giao diện không bao giờ tới.

### 5.1 Hằng ngày — màn hình chính

**Gộp "Làm việc" và "Nghi thức tối" làm một.** Đừng tách theo giờ, đừng tự chuyển chế độ — với tôi cả hai đều là việc làm mỗi ngày, tôi mở lúc nào tuỳ tôi. **[CHỐT]**

**Bố cục:** căn phòng 3D chiếm phần lớn màn hình, đồng hồ pomodoro nổi ở trên. Phần ghi nhận cuối ngày nằm bên dưới, tôi cuộn xuống là tới.

**Phần trên — lúc tôi làm việc:**
- Tôi bấm chọn nhãn → Start → màn hình chuyển sang trạng thái tĩnh: số phút đếm ngược, tên nhãn. Nhân vật ngồi vào bàn / cầm tạ / ngồi thiền tuỳ nhãn.
- **Chế độ tập trung — [CHỐT — 2026-09-03].** Lúc đồng hồ đang chạy, phòng tối hẳn xuống gần như đen (đậm hơn hẳn mức "buổi tối" ở phần dưới) — nhân vật vẫn còn đó, chỉ lờ mờ, không biến mất hẳn (vẫn là "đang nuôi một đứa bé trong phòng", không tách thành màn hình tập trung riêng biệt). Đồng hồ đếm ngược phóng to, đứng giữa màn hình thay vì nổi ở góc dưới. Dải chấm phiên hôm nay + nút ghi bù (xem dưới) **ẩn đi lúc đang chạy** — đúng tinh thần nguyên tắc 1 (§2): "gần như trống" khi tập trung, chỉ hiện lại lúc tĩnh (chưa bấm Start / đã Start xong).
- **Vòng tròn mục tiêu ngày** bao quanh đồng hồ, đầy dần theo số phiên. Mục tiêu tôi tự đặt (mặc định 4). **Tôi vượt quá thì đừng có gì xảy ra, tôi không đạt cũng đừng có gì xảy ra** — nó là cái thước, không phải cái roi.
- Góc màn hình (chỉ lúc TĨNH, chưa bấm Start): dải chấm màu các phiên hôm nay + chuỗi ngày hiện tại. **Đây là thống kê duy nhất tôi cho phép hiện ban ngày.**
- Nút ghi bù (chỉ lúc TĨNH).

**Phần dưới — cuối ngày** (ánh sáng phòng chuyển tối, nhân vật về nhà):
1. **Hôm nay tôi đã ở đâu** — câu chữ, không biểu đồ: *"4 phiên · phần lớn vào Deep work"*
2. **Thói quen** — Sport và Sleep tôi chấm 1–5; nhật ký hiện trạng thái đã viết/chưa
3. **Tâm trạng** — một tâm trạng cho cả ngày, một cú bấm. **5 mức: 😢 🙁 😐 🙂 😁 = 1–5** (màn tuần cần số để vẽ đường cong). **[CHỐT — 2026-09-03, đổi từ bộ 😞 😕 😐 🙂 😄 chốt ngày 2026-09-02 — bộ cũ mức 4 (🙂) nhìn quá trung tính, dễ lẫn mức 3]**
4. **Nhật ký** — ba phần, gộp chung xuống một chuỗi lúc lưu (không tách bảng/cột DB):
   - **Ba câu hỏi quan trọng, CỐ ĐỊNH mỗi ngày** (không xoay vòng, khác câu gợi ý bên dưới) —
     **[CHỐT — 2026-09-03]**:
     1. *"Which of Mind, Health, or Spirit did you neglect most today — and why?"*
     2. *"What's one thing you did today that your future self will thank you for?"*
     3. *"What decision are you postponing that you already know the answer to?"*
   - **Câu gợi ý đổi mỗi ngày** như cũ, xoay vòng qua bảng `prompts`.
   - **Ô viết trắng tự do** — tôi bỏ qua bất kỳ phần nào cũng được, ô trắng luôn ở đó.
   - **Ngưỡng tối thiểu 200 TỪ trên toàn bộ nhật ký đã gộp** (cả ba phần cộng lại, không phải riêng ô tự do) — **chặn cứng nút "Close day"** tới khi đủ. **[CHỐT — 2026-09-03]** *Đi ngược nguyên tắc 3 ở §2 ("dữ liệu chảy vào, không bị bơm vào") một cách CÓ CHỦ Ý — tôi đã được hỏi thẳng về mâu thuẫn này và xác nhận vẫn muốn chặn cứng, không phải chỉ nhắc nhẹ. Ngưỡng số nằm ở `core/balance.ts` (`JOURNAL_MIN_WORDS`), sửa được không đụng logic.*
5. **Đóng ngày** — một nút, khoá bởi ngưỡng nhật ký ở trên. Nhân vật đi ngủ. Hoạt ảnh ngắn, dễ chịu.

**Vấn đề kỹ thuật tôi đã lường trước:** đồng hồ phải đúng khi tôi chuyển tab hoặc máy ngủ. **Đừng dùng `setInterval` đếm lùi** — lưu mốc kết thúc, tính lại mỗi lần render. Phiên đang chạy lưu xuống server để tôi đóng tab mở lại vẫn còn.

### 5.2 Nhìn lại tuần (Chủ nhật)

- Tổng số phiên trong tuần chia theo chỉ số — **ba thanh**, để tôi thấy ngay mảng nào bị bỏ bê.
- Thói quen: **tỉ lệ giữ được**, không phải streak.
- Đường cong tâm trạng theo ngày.
- **Một tương quan mỗi tuần**, một câu duy nhất: *"những ngày bạn tập thể thao, tâm trạng tốt hơn rõ rệt"*. Chỉ một câu, không phải bảng số liệu. **[CHỐT — 2026-09-02]**
  - Chỉ soi **6 cặp cố định**: thể thao↔tâm trạng · ngủ↔số phiên · nhật ký↔tâm trạng · số phiên↔tâm trạng · ngủ↔tâm trạng · thể thao↔số phiên.
  - Cần **≥ 14 ngày** có dữ liệu cả hai vế mới được nói.
  - Không đủ thì **im lặng hoàn toàn** — không hiện gì, không bịa.
- Bao nhiêu phần trăm phiên là ghi bù.
- **Trích lại vài dòng tôi đã viết trong tuần** — thường đây mới là thứ khiến tôi khựng lại.
- Ô trắng để tôi đúc kết tuần.
- Chỗ nhập tài sản (nếu tôi muốn — đừng ép).

### 5.3 Căn phòng / ngôi nhà

**Vỏ ngoài** — quy mô nơi ở — do **tài sản** quyết định (4.9).
**Bên trong** — đồ đạc — do **ba chỉ số** quyết định:

- 📚 Trí tuệ → giá sách, bàn học, đèn đọc, bản đồ, nhạc cụ
- 💪 Thể chất → tạ, thảm tập, xe đạp, giày chạy, chai nước
- 🧘 Tinh thần → cây xanh, góc ngồi yên, chồng nhật ký, tranh, mèo

**Đồ chỉ đến khi đủ điểm — không có món nào rơi xuống theo thời gian.** **[CHỐT — 2026-09-02]** Nếu tôi không đủ kỷ luật thì căn phòng đứng yên, và đó đúng là điều tôi muốn nhìn thấy. Bỏ lời hứa "mỗi tuần có thứ mới" ở bản trước.

Phòng là **không gian 3D thật**, tôi xoay và zoom được.

**Nhân vật:** một đứa bé, phong cách hoạt hình 3D, tùy chỉnh nhẹ cho giống tôi (tóc, màu da, trang phục — mỗi thứ vài lựa chọn, tôi chọn lúc bắt đầu, đổi được sau).

*Ghi chú sản xuất tôi muốn bạn theo:* 12 chương **không** có nghĩa 12 mô hình 3D riêng. Dùng **5–6 vỏ nhà gốc**, mỗi vỏ vài biến thể (thêm ban công, đổi nội thất, mở thêm phòng, đổi cảnh ngoài cửa sổ).

**Nhân vật — đổi ngày 2026-09-02, khi lập kế hoạch dựng mốc 1:** dùng **model 3D low-poly có sẵn** (asset pack CC0, cùng nguồn với đồ đạc và nhà), không phải ảnh render xếp lớp như bản gốc viết. **[CHỐT]**

*Lý do đổi:* phòng là không gian 3D **xoay và zoom được** (mục này, đoạn trên). Một ảnh phẳng dán vào cảnh 3D luôn quay mặt về phía camera như tấm bìa — xoay phòng một góc là lộ ngay. Model 3D thật thì không có vấn đề đó, và cùng phong cách với đồ đạc quanh nó.

Nỗi lo "tránh rigging" của bản gốc vẫn được giữ đúng tinh thần: các pack low-poly miễn phí (Quaternius, Kenney) đã rig sẵn, việc của tôi chỉ là chọn — không tự dựng rig, không tự animate. Mỗi giai đoạn nhân vật (4.8) là một model riêng trong pack (hoặc scale dần cùng một model nếu pack không có đủ giai đoạn); mỗi nhãn ba tư thế tĩnh (ngồi bàn / cầm tạ / ngồi thiền, theo **chỉ số** chứ không theo tên nhãn — xem 5.1).

**Mùa thật:** phòng đổi theo mùa và ngày lễ thật (Tết, mùa mưa, nắng hè, Giáng sinh). Không tốn cơ chế gì, nhưng đây là thứ chống lại cảm giác chững ở tháng 4–6.

**Vật phẩm hiếm:** thỉnh thoảng có thứ lạ xuất hiện không do cấp nào mở khoá — một con mèo đến ở, một bức tranh, một chậu cây. Ngẫu nhiên, xác suất thấp, kích hoạt bởi khoảnh khắc đáng nhớ (ngày thứ 100, một tuần đặc biệt đều, đêm giao thừa). **Tôi không mua được, không cày được. Chỉ đến.**

### 5.4 Thư viện hành trình

Các chương tôi đã đi qua, mỗi chương một khung: nhân vật ở hình hài cuối chương, ngôi nhà, tổng số phiên, **ngày tôi chạm chương**, mốc tài sản cao nhất, và những dòng tôi đã viết. Đi qua hành lang đó là tôi thấy mình của những năm trước.

### 5.5 Kho lưu trữ

Đọc lại nhật ký. Lọc theo ngày. **Hôm nay năm ngoái.** Xuất toàn bộ dữ liệu.

### 5.6 Cài đặt

Nhân vật · **Nhãn** (tên + chỉ số + emoji + màu) · **Thói quen** · **6 việc trong ngày + ngưỡng mỗi việc** · Độ dài phiên · Mục tiêu phiên/ngày · Giờ nhắc · Bộ câu hỏi gợi ý · Ẩn/hiện số tài sản · Xuất/nhập dữ liệu.

### 5.7 Ngôn ngữ thiết kế tôi muốn

- Nền màu **ấm** (kem/be), không trắng tinh, không đen tuyền. Có chế độ tối cho buổi đêm.
- Bo góc lớn, bóng mềm, chữ tròn dễ chịu.
- **Emoji là công dân hạng nhất** — mỗi nhãn, mỗi thói quen đều có emoji riêng.
- Hoạt ảnh **chỉ ở khoảnh khắc chuyển tiếp**: nút nảy nhẹ khi bấm, pháo giấy nhỏ khi xong phiên, thẻ trượt vào khi mở phần buổi tối.
- **Viết lời trong app như người nói chuyện, đừng như phần mềm.** *"Xong rồi, nghỉ chút đi"* chứ không phải *"Phiên đã hoàn tất"*.
- Buổi tối giao diện tự dịu xuống: nền tối hơn, chữ to hơn, ít thành phần hơn.

---

## 6. Nhắc nhở

- **Chuông hết phiên** — âm thanh + thông báo trình duyệt.
- **Nhắc nghi thức 22h.**

*Điều tôi đã biết:* thông báo trình duyệt chỉ chạy khi tab còn mở. Muốn nhắc kể cả khi tôi đã tắt trình duyệt thì cần Service Worker + Web Push + cron — làm được nhưng đắt hơn đáng kể. **Dựng bản đơn giản trước; tôi sẽ bảo bạn nâng cấp nếu thấy hay quên.** **[CHỐT]**

---

## 7. Mô hình dữ liệu

```
profile            id, display_name, avatar_config(json), started_at, hide_money(bool)

labels             id, slug, name, emoji, color, stat, sort_order, archived

habits             id, slug, name, emoji, stat,
                     kind(score_1_5 | boolean | journal),
                     archived

daily_tasks        id, ref_type(label|habit), ref_id, threshold, sort_order, active
                     -- 6 dòng khởi đầu; TÔI SỬA ĐƯỢC, đừng viết cứng trong code

sessions           id, label_id, day_key, started_at, ends_at, ended_at,
                     planned_minutes, source(timer|manual),
                     status(running|completed|abandoned)
                     -- ends_at = mốc kết thúc DỰ KIẾN, đồng hồ đọc mốc này chứ không đếm lùi
                     -- abandoned = tôi tự bấm dừng giữa chừng, 0 XP, vẫn giữ bản ghi

habit_entries      id, habit_id, day_key, score(1-5)|done(bool), updated_at
                     -- unique (habit_id, day_key)

day_logs           id, day_key, mood, journal_text, journal_prompt_id?, closed_at
                     -- unique (day_key)

week_reviews       id, week_start, text, created_at

net_worth_entries  id, recorded_at, stocks_vnd, gold_vnd, note?
                     -- giữ TOÀN BỘ lịch sử, đừng ghi đè

chapter_events     id, chapter_index, reached_at, snapshot(json)
                     -- ghi MỘT LẦN khi tôi chạm chương mới; đừng bao giờ xoá

room_items         id, stat, name, model_key, unlock_level

rare_items         id, item_key, received_at, trigger
                     -- vật phẩm hiếm (5.3) PHẢI lưu; không lưu thì mỗi lần tải trang
                     -- con mèo lại biến thành chậu cây
prompts            id, text, category, active
settings           daily_session_goal, session_minutes, break_minutes, ...
```

**Những điều tôi muốn bạn lưu ý:**
- `labels.stat` và `habits.stat` là mấu chốt — không có nó, máy không biết mọc đồ gì trong phòng.
- `daily_tasks` là **một bảng, không phải hằng số trong code.**
- Thói quen "Viết nhật ký" có `kind = journal`: **đừng** tạo dòng riêng trong `habit_entries` cho nó, đọc thẳng từ `day_logs.journal_text`. Chỉ một chỗ chứa nội dung nhật ký, đừng nhân đôi dữ liệu.
- `net_worth_entries` giữ toàn bộ lịch sử. Ngôi nhà đọc bản ghi mới nhất; `chapter_events` là thứ thư viện hành trình đọc.
- **Đừng tạo bảng nào lưu XP.** Xem 8.1.

---

## 8. Bốn nguyên tắc kỹ thuật tôi yêu cầu — và nền tảng đã chốt

Bốn điều này bản dựng trước làm **đúng** — giữ lại.

### 8.1 XP là thứ tính ra, không phải thứ lưu lại

Đừng tạo cột XP nào trong cơ sở dữ liệu. Mọi con số (XP, cấp, giai đoạn, chuỗi) đều **tính lại từ các bản ghi thô** mỗi lần đọc, bằng một hàm thuần.

*Vì sao tôi muốn vậy:* tôi sẽ chỉnh số trong `balance.ts` nhiều lần. Cách này cho phép tôi sửa một con số là cả lịch sử tự tính lại đúng — không migration, không backfill, không có chuyện điểm lưu trong DB lệch khỏi bản ghi sinh ra nó. Tôi chỉ có một người dùng và vài năm dữ liệu nên chi phí đọc không đáng kể.

### 8.2 Một file cấu hình duy nhất

Mọi con số cân bằng (XP, ngưỡng cấp, mốc chuỗi, ngưỡng chương) nằm trong **một file `balance.ts`**. Tôi phải sửa được mà không cần đụng vào logic ở đâu khác.

### 8.3 Một chỗ duy nhất được đọc đồng hồ

Chỉ **một module** được phép gọi `Date.now()`. Mọi nơi khác gọi `now()` của module đó.

*Vì sao:* tôi cần công cụ tua thời gian để test — mốc ngày 4h sáng, chuỗi 7 ngày, phiên bỏ quên đều không thể test thủ công nếu phải đợi thật. Nếu có file nào gọi `new Date()` trực tiếp, nó sẽ lặng lẽ bỏ qua offset và mọi bài test thành vô nghĩa.

### 8.4 Logic game là hàm thuần, tách khỏi database

Toàn bộ luật ở mục 4 phải viết được thành hàm thuần `(dữ liệu thô, thời điểm) → kết quả`, không đụng DB, không đụng React. **Đây là phần phải có unit test đầy đủ** — vì đây là phần tôi sẽ bảo bạn sửa đi sửa lại khi cân bằng game.

### 8.5 Nền tảng — chốt ngày 2026-09-02

| | |
|---|---|
| **Nơi chạy** | Web **công khai**, deploy thật. Mở bookmark là dùng. |
| **Lớp bảo vệ** | **Không có.** Ai có link cũng **xem và sửa** được — kể cả viết vào nhật ký, nhập tài sản, đóng ngày. Tôi đã nghe cảnh báo và vẫn chọn vậy để chia sẻ cho dễ. **[CHỐT — 2026-09-02]** *Hệ quả: bản xuất JSON hằng tuần là thứ duy nhất cứu được dữ liệu nếu ai đó nghịch.* |
| **Ba chỉ số trong app** | 📚 **Mind** · 💪 **Health** · 🧘 **Spirit** |
| **Đồ hoạ 3D** | **Asset pack low-poly CC0 có sẵn** (Kenney / Poly Pizza / Quaternius). Không tự mô hình hoá, không thuê vẽ. |
| **Nhân vật** | **Model 3D low-poly có sẵn** (cùng pack CC0 với đồ đạc), một model riêng mỗi giai đoạn — **không** phải ảnh render xếp lớp. Đổi ngày 2026-09-02, xem 5.3. |
| **Backup** | DB có backup sẵn + tự xuất một file JSON mỗi tuần. |

Stack: **Next.js + TypeScript, Postgres, react-three-fiber, deploy Vercel** — nói một câu nếu muốn khác, vì đổi sau mốc 2 sẽ đắt.

---

## 9. Thứ tự tôi muốn bạn dựng

> **Thứ tự này khác bản trước, và đó là điều quan trọng nhất trong cả file.** Đọc mục 12 để hiểu vì sao.

| Mốc | Nội dung | Tôi có được gì |
|---|---|---|
| **1** | **Phòng 3D + nhân vật + đồng hồ pomodoro + nhãn.** Điểm số hard-code, chưa cần DB. | **Tôi nhìn thấy sản phẩm thật ngay từ đầu.** Chê được, sửa được. |
| **2** | DB + phần cuối ngày (thói quen, tâm trạng, nhật ký, đóng ngày) | Vòng lặp hằng ngày khép kín — **tôi dùng được thật** |
| **3** | Lớp điểm: XP, chỉ số, cấp, đồ đạc mọc trong phòng | App biến thành game |
| **4** | Chuỗi + mốc thưởng + ngày "đạt" | Tôi có lý do quay lại mỗi ngày |
| **5** | Tài sản + chương + nâng cấp nhà | Trục thứ hai vào cuộc |
| **6** | Nhìn lại tuần + thống kê + tương quan | Dữ liệu trả lại giá trị cho tôi |
| **7** | Thư viện hành trình, kho lưu trữ, hôm nay năm ngoái, xuất dữ liệu | Tôi yên tâm về dữ liệu |
| **8** | Cài đặt đầy đủ + đánh bóng: hoạt ảnh, phím tắt, nhắc nâng cao | App hoàn chỉnh |

**Luật cứng tôi đặt ra:** kết thúc mỗi mốc, thứ tôi mở ra phải **trông giống sản phẩm thật**, không phải bảng điều khiển kỹ thuật. Nếu một mốc kết thúc mà màn hình vẫn là danh sách nút và số — **mốc đó chưa xong, đừng báo tôi là xong.** **[CHỐT]**

---

## 10. Những gì tôi cố tình KHÔNG làm

Đừng đề xuất, đừng tự thêm: danh sách việc cần làm / quản lý dự án · lịch và time-blocking · theo dõi chi tiêu hằng ngày · kết nối API sàn chứng khoán · theo dõi đồ ăn/cân nặng · đồng bộ Google Calendar / Notion / Apple Health · ứng dụng di động · nhiều người dùng · so sánh với người khác · bất kỳ lời khuyên đầu tư nào · **thông báo đẩy khi chưa cần** · **đăng nhập/tài khoản.**

---

## 11. Sổ quyết định — bốn vòng hỏi đáp, chốt xong 2026-09-02

### 11.1 Sổ quyết định — vòng 1, chốt ngày 2026-09-02

| # | Câu hỏi | Tôi đã chốt | Ghi ở |
|---|---|---|---|
| Q1 | XP mỗi phiên | **30**, giữ nguyên | 4.4 |
| Q2 | Ngưỡng "giữ được" Sport / Sleep | **≥ 4** (nâng từ 3) — *vòng 2 lung lay, xem S1* | 4.5 |
| Q3 | Công thức nghỉ ngơi | **trung bình ≥ 4** (nâng từ 3,5) | 4.7 · *xem R10* |
| Q4 | Trưởng thành | cần **cả XP lẫn tài sản** | 4.8 |
| Q5 | Deploy | **công khai, không lớp bảo vệ nào**, ai có link cũng vào được | 8.5 · *xem R1* |
| Q6 | Mô hình 3D | asset pack low-poly **CC0 có sẵn** | 8.5 |
| Q7 | Chỉ số bỏ bê | **có trừ XP thật** | 4.1 · *xem R2* |
| Q8 | Tên ba chỉ số | 📚 **Mind** · 💪 **Health** · 🧘 **Spirit** | 8.5 |
| Q9 | Mục 2 | đúng **năm** nguyên tắc; *"có thể trách móc tôi"* đứng nguyên | 2 · *xem R3* |
| Q10 | +20 XP "giữ được" | chỉ áp cho **thói quen**; nhãn đạt ngưỡng không có +20 | 4.5 |
| Q11 | `status = abandoned` | = tôi tự bấm dừng giữa chừng; giữ bản ghi, 0 XP | 4.3 · 7 |
| Q12 | Nhịp ra đồ mới | **chỉ đến khi đủ điểm**, không rơi theo thời gian | 5.3 |
| Q13 | Nút tạm dừng | **không có** — tạm dừng là ngắt quãng | 4.3 |
| Q14 | Phiên nghỉ | **không ghi** vào dữ liệu | 4.3 · *xem R9* |
| Q15 | Tư thế nhân vật | theo **chỉ số** của nhãn, không theo tên nhãn | 5.1 |
| Q16 | Đóng ngày | **không khoá** ngày lại | 4.11 |
| Q17 | Phiên bỏ quên | tính **hoàn thành** | 4.3 · *xem R6* |
| Q18 | Tâm trạng | **5 mức 😞 😕 😐 🙂 😄 = 1–5** | 5.1 |
| Q19 | Mốc kết thúc phiên | thêm `ends_at` + `ended_at` | 7 |
| Q20 | Backup | DB backup + xuất JSON mỗi tuần | 8.5 |
| Q21 | "Chạm cả ba chỉ số" | = **hoàn thành đủ**, không muốn game quá dễ | *xem R4* |
| Q22 | Cấp | bắt đầu **cấp 0**, không có trần | 4.8 |
| Q23 | Vật phẩm hiếm | thêm bảng `rare_items` | 7 |
| Q24 | Thói quen chưa chấm | tính là **0** / chưa giữ được | 4.5 · 4.7 |
| Q25 | Ghi bù hôm qua | **có vá** lại chuỗi đã gãy | 4.6 |
| Q26 | Hôm nay chưa đạt | **làm gãy** chuỗi | *xem R5* |
| Q27 | Thưởng mốc chuỗi | = ngày **đầu tiên trong lịch sử** chuỗi chạm mốc | 4.6 |
| Q28 | Mốc chuỗi 30 ngày | **450** thay vì 500, để chia hết cho 3 | 4.6 |
| Q29 | Tuần | **T2 → CN**; đúc kết viết lúc nào cũng tính cho tuần đó | 4.6 · 5.2 |
| Q30 | Nhảy vọt nhiều chương | ghi **cả các chương trung gian** | 4.9 |
| Q31 | Chương 12 | ~~1 triệu USD~~ → **đảo lại ở R7: 26 tỉ VNĐ** | 4.9 |
| Q32 | Tương quan tuần | *(tôi chưa hiểu câu hỏi)* | *xem R8* |
| Q33 | Nhân vật | **xếp lớp lúc chạy**, không render sẵn từng tổ hợp | 8.5 |
| Q34 | Danh mục đồ | chốt **12 món đầu** ở mốc 3, thêm dần | 5.3 |

---

### 11.2 Sổ quyết định — vòng 2, chốt ngày 2026-09-02

| # | Câu hỏi | Tôi đã chốt | Ghi ở |
|---|---|---|---|
| R1 | Web công khai | **Ai cũng sửa được**, không lớp bảo vệ nào. Đã nghe cảnh báo và vẫn chọn vậy. | 8.5 |
| R2 | Con số trừ XP | Bắt đầu sau **3 ngày**, **−20 XP/ngày**, **có tụt cấp**, **có mất đồ** | 4.1 · *còn S3* |
| R3 | Phạm vi trách móc | **Được trách hết** — gỡ mọi câu cấm chữ tiêu cực ở 4.9 và 4.12 | 4.9 · 4.12 · *còn S5* |
| R4 | Ngưỡng Deep work | **2 → 4 phiên** | 4.5 · *nửa sau thành S2* |
| R5 | Chuỗi | Tính tới hết hôm qua; hôm nay không đạt thì **sáng mai về 0** | 4.6 · *phần "về 0 ngay" sửa lại 2026-09-04, xem "Một ngày ân hạn" ở 4.6* |
| R6 | Phiên bỏ quên | **Tự dừng khi đủ thời lượng**, không có hạn quay lại | 4.3 |
| R7 | Chương 12 | **26 tỉ VNĐ**, bỏ ý USD — *(đảo lại câu Q31)* | 4.9 |
| R8 | Tương quan tuần | 6 cặp cố định · cần ≥ 14 ngày · không đủ thì im lặng | 5.2 |
| R9 | Nghỉ dài | *(tôi chưa hiểu "4 phiên rồi nghỉ dài")* | *xem S4* |
| R10 | Sport / Sleep | *"chỉ cần tích là coi như đạt"* — **đá vào 4.2 và câu Q2** | *xem S1* |

---

### 11.3 Sổ quyết định — vòng 3, chốt ngày 2026-09-02

| # | Câu hỏi | Tôi đã chốt | Ghi ở |
|---|---|---|---|
| S1 | Sport / Sleep | **Giữ chấm 1–5**, đạt = ≥ 4, nghỉ ngơi = trung bình ≥ 4 *(bỏ ý "chỉ cần tích")* | 4.5 · 4.7 |
| S2 | "+30 chạm cả ba chỉ số" | *(câu trả lời có hai vế đá nhau)* | *xem T1* |
| S3 | Trừ XP | Sàn **0** · **trừ theo cấp** `−20 × cấp` mỗi ngày · **có tụt cấp** · **giai đoạn cũng tụt — đứa bé nhỏ lại được** | 4.1 · 4.12 |
| S4 | Nghỉ dài | **Bỏ hẳn.** Phiên nào xong cũng chỉ nghỉ 5 phút | 4.3 |
| S5 | Ghi bù | **Ăn đủ 30** — quên bật đồng hồ đơn giản là quên, không phải lỗi | 4.4 |

---

### 11.4 Sổ quyết định — vòng 4, chốt ngày 2026-09-02

| # | Câu hỏi | Tôi đã chốt | Ghi ở |
|---|---|---|---|
| T1 | "+30 chạm cả ba chỉ số" | **Luật Z** — cứ **ngày đạt theo 4.5** là được +30, không cần trải đủ ba chỉ số. Dòng đó đổi tên thành **"thưởng ngày đạt"**. | 4.4 · 4.8 |

**Hết câu hỏi mở.** Mọi cơ chế ở mục 4 giờ đã đủ chi tiết để dựng mà không phải đoán chỗ nào.

---

### 11.5 Chưa cần hỏi ngay

- Bao nhiêu lựa chọn tóc/da/trang phục cho nhân vật là đủ?
- Bộ ~60 câu gợi ý nhật ký: tôi tự viết hay bạn soạn rồi tôi sửa? Mỗi ngày một câu — ngẫu nhiên hay theo thứ tự cố định?
- Có gắn thẻ (#công-việc, #sức-khỏe) cho nhật ký không?
- Các mốc chương trung gian (2/3/5/15 tỉ) — tôi duyệt hay sửa?
- Tên tiếng Anh cho từng nhãn và thói quen khởi đầu (English, Deep work, New knowledge, Sport, Sleep enough, Journal).
- Câu chữ cụ thể khi app trách tôi (vắng mặt, tài sản xuống chương, gãy chuỗi) — chốt khi dựng từng màn hình.

---

## 12. Tôi đã dựng app này một lần rồi, và nó hỏng

> Đọc mục này trước khi viết dòng code đầu tiên. Năm điều dưới đây là lý do tôi phải làm lại từ đầu — **đừng lặp lại chúng.**

**1. Tôi cho dựng engine trước, giao diện sau — và giao diện không bao giờ tới.**
Lộ trình cũ đặt "phòng 3D + nhân vật" ở mốc 4. Ba mốc đầu tạo ra một engine tính điểm rất chắc chắn cùng một bảng điều khiển kỹ thuật đầy nút và số — không hề giống sản phẩm trong đầu tôi. Đến lúc tôi nhìn thấy thì đã quá muộn để đổi hướng rẻ.
→ **Lộ trình mới đảo ngược: phòng và nhân vật là mốc 1. Đừng thuyết phục tôi làm ngược lại.**

**2. Chỗ nào tôi viết không rõ, code tự bịa ra luật.**
Spec cũ của tôi mô tả cảm giác rất kỹ nhưng không nói *"thế nào là hôm nay đã học English"*. Code tự chọn: "có bất kỳ phiên nào > 0 phút". Cả hệ thống "6 việc mỗi ngày" — thứ quan trọng nhất của vòng lặp — chưa từng có trong spec, nó sinh ra trong lúc code mà tôi không biết.
→ **Mục 4 lần này tôi viết ở mức không còn chỗ diễn giải. Chỗ nào tôi chưa chốt thì đánh dấu [HỎI TÔI]. Gặp chỗ mơ hồ thì hỏi, đừng tự chọn.**

**3. Tài liệu và code trôi khỏi nhau, không ai kéo lại.**
Spec ghi cơ chế nhân ×1,25; code làm thưởng mốc chuỗi ngay từ commit đầu tiên. Bản thân việc đổi hướng không sai — nhưng hai bản mô tả cùng một sản phẩm mà nói hai chuyện khác nhau suốt nhiều tuần, và tôi không hề nhận ra.
→ **Bạn đổi luật gì thì sửa file này trong cùng lần đó. Đừng để "sửa sau".**

**4. Viết cứng thứ đáng lẽ phải cấu hình được.**
Danh sách việc trong ngày bị khoá cứng vào ba cái tên nhãn trong code. Tôi thêm một nhãn mới trong Cài đặt là phép tính "ngày đạt" sai ngay, mà không có lỗi nào báo cho tôi biết.
→ **`daily_tasks` là một bảng trong DB (mục 7), không phải hằng số.**

**5. Tính năng làm dở nửa chừng, mà tôi không biết.**
Hàm kiểm tra chương cuối viết xong rồi **không bao giờ được gọi** ở đâu cả. Nút ẩn số tài sản chỉ là biến tạm trong React, tải lại trang là mất. Mốc tài sản cao nhất tính bằng `max()` mỗi lần đọc nên không có "ngày chạm chương" để thư viện hành trình hiển thị.
→ **Một tính năng chưa nối vào giao diện thì chưa xong. Đừng báo tôi là hoàn thành.**

---

*Hết. Có gì trong file này mâu thuẫn hoặc không rõ — hỏi tôi trước khi đoán.*
