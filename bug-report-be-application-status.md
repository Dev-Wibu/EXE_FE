# 🐛 BUG REPORT: Application Status Changed to PASSED While Coding Round Is Still Unsubmitted

**Severity:** High  
**Date:** 2026-07-01  
**Reported by:** FE Team (via Product Owner)

---

## 1. Mô tả Bug

Khi user hoàn thành round 3 (QUIZ), Application status tự động chuyển sang **PASSED** nhưng **round 4 (CODING) chưa hề được làm**. Điều này khiến:

- User không biết mình còn vòng CODING phải làm
- Giao diện FE không thể hiển thị đúng trạng thái (CODING bị trắng, không có nút vào phòng)

---

## 2. Data thực tế

### GET `/api/rounds/find-by-application-order/{appId}` → 4 rounds:

```json
[
  { "id": 141, "name": "CV Screening", "roundOrder": 1, "roundType": "CV" },
  { "id": 142, "name": "Email Review", "roundOrder": 2, "roundType": "EMAIL" },
  { "id": 143, "name": "Technical Quiz", "roundOrder": 3, "roundType": "QUIZ" },
  { "id": 144, "name": "Lập trình", "roundOrder": 4, "roundType": "CODING" }
]
```

### GET `/api/application-details/application/{appId}` → Chi tiết:

```json
[
  { "id": 41, "roundId": 141, "status": "COMPLETED", "finalResult": "PASSED" },
  { "id": 42, "roundId": 142, "status": "COMPLETED", "finalResult": "PASSED" },
  { "id": 43, "roundId": 143, "status": "COMPLETED", "finalResult": "PASSED" }
  // ⚠️ roundId 144 (CODING) KHÔNG có trong danh sách — chưa submit!
]
```

### Application object → Status:

```json
{ "id": 34, "status": "PASSED", "currentRoundOrder": 4 }
```

---

## 3. Root Cause Phân tích

### Tình huống xảy ra:

1. User submit QUIZ (round 3)
2. AI evaluate QUIZ → auto-advance `currentRoundOrder` từ 3 → 4
3. **BE set `application.status = "PASSED"`** (vì HR score đã pass?)
4. User thấy Application = PASSED → không biết mình còn vòng CODING
5. `getDetail` cho CODING không có → FE không biết round 4 cần làm gì

### Câu hỏi cho BE:

1. **Tại sao `application.status` = "PASSED"` khi round 4 chưa submit?**
   - Có phải BE auto-advance kết hợp với HR review tự động set PASSED?
   - Hay logic nào đó set PASSED khi tất cả round đã được review (dù chưa submit)?

2. **Application nên ở trạng thái nào khi:**
   - Round 3 (QUIZ) đã submit và HR duyệt → PASSED
   - Nhưng round 4 (CODING) chưa hề được submit?
   - **Đề xuất:** `status` nên là `"IN_PROGRESS"` cho đến khi user thật sự submit round cuối cùng HOẶC HR manually advance qua tất cả rounds

3. **`currentRoundOrder = 4`** — BE đã advance đến round 4 rồi, nhưng không có detail nào cho round 4. Điều này có nghĩa là gì?
   - User đã bị advance nhưng chưa vào làm?
   - Nếu vậy thì BE nên tạo detail với `status = "PENDING"` cho round 4?

---

## 4. Hành vi mong muốn

| Step                              | Application Status | CODING Round Status | Hành động                               |
| --------------------------------- | ------------------ | ------------------- | --------------------------------------- |
| 1. User submit QUIZ               | IN_PROGRESS        | PENDING (chưa vào)  | Chờ AI evaluate                         |
| 2. AI + HR complete QUIZ → PASSED | IN_PROGRESS        | PENDING             | User thấy thông báo "Enter CODING room" |
| 3. User vào làm CODING            | IN_PROGRESS        | IN_PROGRESS         | Bắt đầu coding                          |
| 4. User submit CODING             | IN_PROGRESS        | PENDING             | Chờ AI evaluate                         |
| 5. All rounds complete            | PASSED             | COMPLETED           | Done                                    |

**Quy tắc:** Application chỉ `PASSED/FAILED` khi **tất cả rounds** đã được submit và evaluated.

---

## 5. Đề xuất Fix (BE)

### Option A: Fix `application.status` (Recommended)

- Khi submit round N → chỉ advance `currentRoundOrder`
- `application.status` chỉ set `PASSED/FAILED` khi **TẤT CẢ rounds** trong JD đã được submit và evaluated
- Hoặc: `application.status` chỉ set `PASSED/FAILED` khi user đã thật sự hoàn thành round cuối cùng

### Option B: Tạo detail entry cho round tiếp theo

- Khi user submit round N → BE tự động tạo detail entry cho round N+1 với `status = "PENDING"`
- Điều này giúp FE biết round tiếp theo là gì và hiển thị nút "Enter Room"

### Option C: API trả về `pendingRounds`

- API `getApplicationDetails` trả về thêm field `pendingRounds: Round[]` — danh sách rounds chưa có detail
- FE sử dụng `pendingRounds` để hiển thị những vòng chưa làm

---

## 6. Tác động

- **User:** Không biết mình còn vòng CODING phải làm → bỏ lỡ vòng thi
- **Data integrity:** Application PASSED nhưng thực tế chưa hoàn thành → báo cáo thống kê sai
- **HR:** Không thấy CODING submission → không đánh giá được kỹ năng lập trình của ứng viên

---

## 7. Reproduction Steps

1. User apply vào JD có 4 rounds: CV → Email → Quiz → Coding
2. User hoàn thành round 1, 2, 3
3. Sau khi HR review và duyệt round 3
4. Kiểm tra `GET /api/applications/{appId}` → `status = "PASSED"`
5. Kiểm tra `GET /api/application-details/application/{appId}` → chỉ có 3 details, không có round 4
6. User không thấy nút vào vòng CODING

---

## 8. Workaround hiện tại (FE)

FE tạm thời đã revert các workaround vì **không nên che giấu bug bằng mockdata/walkaround**. Chờ BE fix root cause.
