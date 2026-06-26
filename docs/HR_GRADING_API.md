# TÀI LIỆU API — HR CHẤM BÀI & CHUYỂN VÒNG

## MỤC LỤC

1. [Tổng quan luồng](#1-tổng-quan-luồng)
2. [Các role chấm bài](#2-các-role-chấm-bài)
3. [ApplicationDetail — Trung tâm lưu kết quả](#3-applicationdetail--trung-tâm-lưu-kết-quả)
4. [API Chi tiết từng endpoint](#4-api-chi-tiết-từng-endpoint)
5. [SubmissionData — JSONB lưu bài nộp](#5-submissiondata--jsonb-lưu-bài-nộp)
6. [ApplicationDetailStatus — Trạng thái vòng thi](#6-applicationdetailstatus--trạng-thái-vòng-thi)
7. [RoundResult — Kết quả đậu/rớt](#7-roundresult--kết-quả-đậurớt)
8. [Luồng hoàn chỉnh từng vòng thi](#8-luồng-hoàn-chỉnh-từng-vòng-thi)

---

## 1. TỔNG QUAN LUỒNG

```
Ứng viên nộp bài (user)
        │
        ▼
POST /api/application-details/submit
        │
        ├─► CV_SCREENING ────► AI chấm (async) ────► HR duyệt ────► Qua vòng
        ├─► EMAIL_SIMULATOR ──► AI chấm (async) ────► HR duyệt ────► Qua vòng
        ├─► QUIZ ────────────► TỰ ĐỘNG chấm ───────────────────────► Qua vòng
        ├─► CODING ──────────► AI chấm (async) ────► HR duyệt ────► Qua vòng
        ├─► CODE_REVIEW ─────► AI chấm (auto) ────► HR duyệt ────► Qua vòng
        └─► MENTOR_REVIEW ────► Mentor chấm (MANUAL) ───────────────► Qua vòng

HR chấm bài (admin/staff)
        │
        ▼
PUT /api/application-details/hr-score?applicationId=&isPass=&note=&score=
        │
        ▼
Ứng viên được chuyển vòng hoặc từ chối
```

**Nguyên tắc vàng:**

- **AI chấm ≠ qua vòng.** AI chỉ đánh giá, HR mới là người quyết định có qua vòng hay không.
- **`currentRoundOrder`** là thước đo DUY NHẤT để xác định ứng viên đang ở vòng nào.
- Ứng viên chỉ thấy nút "Vào phòng" khi `currentRoundOrder` đã được update lên vòng tương ứng.

---

## 2. CÁC ROLE CHẤM BÀI

| Role                 | Quyền chấm bài                                     | API chấm                                |
| -------------------- | -------------------------------------------------- | --------------------------------------- |
| **AI (tự động)**     | CV_SCREENING, EMAIL_SIMULATOR, CODING, CODE_REVIEW | Không cần API — hệ thống tự gọi         |
| **HR (ADMIN/STAFF)** | Tất cả các vòng, override kết quả AI               | `PUT /api/application-details/hr-score` |
| **Mentor**           | Chỉ vòng `MENTOR_REVIEW`                           | `POST /api/mentor-reviews`              |

**Note quan trọng:**

- **`isAuto = true`** → AI chấm tự động → HR chỉ cần duyệt kết quả
- **`isAuto = false`** → HR chấm thủ công hoàn toàn

---

## 3. ApplicationDetail — TRUNG TÂM LƯU KẾT QUẢ

### 3.1 Entity mapping (Database)

```json
{
  "id": 101,
  "applicationId": 5,
  "roundId": 12,
  "status": "AI_EVALUATED",
  "finalScore": 75.5,
  "aiScore": 75.5,
  "aiFeedback": {
    "generalComment": "Ứng viên có kiến thức tốt về Java core...",
    "strengths": ["Hiểu rõ về OOP", "Có kinh nghiệm Spring Boot"],
    "weaknesses": ["Yếu về database optimization"],
    "extraMetrics": {
      "code_quality": 8.5,
      "problem_solving": 7.0
    }
  },
  "hrScore": null,
  "hrNote": null,
  "finalResult": null,
  "startedAt": "2026-06-25T10:00:00",
  "completedAt": null,
  "createdAt": "2026-06-25T10:00:00",
  "updatedAt": "2026-06-25T10:30:00",
  "mentorReview": null,
  "submissionData": { ... }
}
```

### 3.2 Chi tiết từng field

| Field            | Type     | Mô tả                                           |
| ---------------- | -------- | ----------------------------------------------- |
| `id`             | Long     | Primary key                                     |
| `applicationId`  | Long     | FK → Application (hồ sơ ứng tuyển)              |
| `roundId`        | Long     | FK → Round (vòng thi nào)                       |
| `status`         | Enum     | Trạng thái vòng thi (xem bảng bên dưới)         |
| `finalScore`     | Double   | **Điểm cuối cùng** = `aiScore` hoặc `hrScore`   |
| `aiScore`        | Double   | Điểm AI chấm (null nếu chưa chấm)               |
| `aiFeedback`     | Object   | Feedback chi tiết từ AI (JSONB)                 |
| `hrScore`        | Double   | Điểm HR chấm (null nếu chưa chấm)               |
| `hrNote`         | String   | Ghi chú của HR khi chấm bài                     |
| `finalResult`    | Enum     | `PASSED` hoặc `FAILED` (null = chưa có kết quả) |
| `startedAt`      | DateTime | Thời điểm bắt đầu vòng                          |
| `completedAt`    | DateTime | Thời điểm hoàn thành vòng                       |
| `submissionData` | Object   | Lưu trữ bài nộp của ứng viên (JSONB)            |
| `mentorReview`   | Object   | Link đến MentorReview (chỉ vòng MENTOR_REVIEW)  |

---

## 4. API CHI TIẾT TỪNG ENDPOINT

---

### 4.1 `POST /api/application-details/submit`

**Mục đích:** Ứng viên nộp bài theo từng vòng

**Content-Type:** `multipart/form-data` (vì có upload file)

**Request Body (form-data):**

| Field            | Type           | Bắt buộc | Mô tả                                | Dùng cho vòng   |
| ---------------- | -------------- | -------- | ------------------------------------ | --------------- |
| `applicationId`  | Long           | ✅       | ID hồ sơ ứng tuyển                   | Tất cả          |
| `textContent`    | String         | ❌       | Nội dung text (email, essay...)      | EMAIL_SIMULATOR |
| `file`           | MultipartFile  | ❌       | File upload (CV, zip...)             | CV_SCREENING    |
| `quizAnswers`    | List\<String\> | ❌       | Danh sách đáp án `["A","B","C","D"]` | QUIZ            |
| `compileRequest` | List\<JSON\>   | ❌       | Code đã nộp + test results           | CODING          |

**Ví dụ `compileRequest` (JSON string):**

```json
[
  {
    "problemId": 12,
    "language": "JAVA",
    "sourceCode": "class Solution { public int[] twoSum(int[] nums, int target) { ... } }",
    "isTest": false
  },
  {
    "problemId": 15,
    "language": "PYTHON",
    "sourceCode": "class Solution:\n    def isValid(self, s):\n        ...",
    "isTest": false
  }
]
```

**Lưu ý:**

- `isTest: true` → FE muốn compile thử code (chạy visible test cases)
- `isTest: false` → Nộp bài chính thức

**Response:**

```json
{
  "status": "COMPLETED",
  "applicationId": 5,
  "detail": {
    "id": 101,
    "applicationId": 5,
    "roundId": 12,
    "status": "AI_EVALUATED",
    "finalScore": 75.5,
    "aiScore": 75.5,
    "finalResult": "PASSED"
  },
  "message": "Nộp bài thành công",
  "roundResult": "PASSED",
  "testCases": null
}
```

**Hoặc khi đang chờ AI chấm (async):**

```json
{
  "status": "PENDING",
  "applicationId": 5,
  "detail": null,
  "message": "Bài đang được chấm, vui lòng chờ",
  "roundResult": null,
  "testCases": null
}
```

**SubmissionResult.Status:**

| Status              | Mô tả                                   |
| ------------------- | --------------------------------------- |
| `PENDING`           | AI đang chấm (async) — ứng viên cần chờ |
| `COMPLETED`         | Chấm xong ngay (QUIZ) hoặc AI chấm xong |
| `PENDING` (compile) | Đang compile code để test               |

---

### 4.2 `POST /api/code-review-problems/evaluate`

**Mục đích:** Chấm bài Code Review (AI tự động)

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "applicationId": 5,
  "roundId": 14,
  "submissions": [
    {
      "filename": "UserService.java",
      "lineNumber": 23,
      "severity": "CRITICAL",
      "description": "SQL Injection vulnerability — user input directly concatenated to query string"
    },
    {
      "filename": "UserService.java",
      "lineNumber": 45,
      "severity": "WARNING",
      "description": "Resource leak — Connection not closed in finally block"
    }
  ]
}
```

**Response:** `ApplicationDetail` object đầy đủ

```json
{
  "id": 102,
  "applicationId": 5,
  "roundId": 14,
  "status": "AI_EVALUATED",
  "finalScore": 68.0,
  "aiScore": 68.0,
  "aiFeedback": {
    "generalComment": "Ứng viên phát hiện được 2/3 lỗi chính...",
    "strengths": ["Nhận biết được lỗi bảo mật SQL Injection"],
    "weaknesses": ["Bỏ sót lỗi resource leak"],
    "extraMetrics": {
      "bug_detection": "2/3",
      "security_awareness": 8.0
    }
  },
  "hrScore": null,
  "hrNote": null,
  "finalResult": "PASSED",
  "submissionData": {
    "codeReviewSubmissions": [
      {
        "filename": "UserService.java",
        "lineNumber": 23,
        "severity": "CRITICAL",
        "description": "..."
      }
    ]
  }
}
```

**Luồng tự động:**

```
FE gọi endpoint này
    │
    ▼
Backend gọi Python AI (AnythingLLM workspace CODE_REVIEW)
    │
    ▼
AI chấm điểm + feedback
    │
    ▼
Lưu vào ApplicationDetail
    │
    ▼
Nếu score >= passThreshold → Tự động gọi moveToNextRound()
```

---

### 4.3 `PUT /api/application-details/hr-score`

**Mục đích:** HR/Admin chấm bài hoặc override kết quả AI

**Content-Type:** `application/x-www-form-urlencoded` (query params)

**Request Parameters:**

| Parameter       | Type    | Bắt buộc | Mô tả                             |
| --------------- | ------- | -------- | --------------------------------- |
| `applicationId` | int     | ✅       | ID của ApplicationDetail cần chấm |
| `isPass`        | boolean | ✅       | `true` = PASSED, `false` = FAILED |
| `note`          | String  | ✅       | Ghi chú của HR                    |
| `score`         | double  | ✅       | Điểm HR chấm (0-100)              |

**Ví dụ:**

```
PUT /api/application-details/hr-score?applicationId=101&isPass=true&note=OK&score=80.0
```

**Response:** `200 OK` (empty body)

**Logic bên trong:**

```java
public void hrScore(int applicationId, boolean isPass, String note, double score) {
    // 1. Lấy ApplicationDetail
    ApplicationDetail detail = getApplicationById(applicationId);

    // 2. Set HR score
    detail.setHrScore(score);           // Lưu điểm HR
    detail.setHrNote(note);             // Lưu ghi chú

    // 3. Set finalScore = HR score (override AI)
    detail.setFinalScore(score);

    // 4. Set result
    detail.setFinalResult(isPass ? PASSED : FAILED);

    // 5. Save
    applicationDetailRepository.save(detail);
}
```

**Lưu ý quan trọng:**

- HR có thể override kết quả AI
- `finalScore` = `hrScore` (HR override hoàn toàn)
- **KHÔNG tự động chuyển vòng** → HR phải gọi thêm API khác để chuyển vòng (hoặc hệ thống tự chuyển khi `finalResult` = `PASSED`)

---

### 4.4 `GET /api/application-details/{id}`

**Mục đích:** Lấy chi tiết 1 vòng thi của ứng viên

**Response:** `ApplicationDetail` object đầy đủ

```json
{
  "id": 101,
  "applicationId": 5,
  "roundId": 12,
  "status": "AI_EVALUATED",
  "finalScore": 75.5,
  "aiScore": 75.5,
  "aiFeedback": {
    "generalComment": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "extraMetrics": { ... }
  },
  "hrScore": null,
  "hrNote": null,
  "finalResult": null,
  "startedAt": "2026-06-25T10:00:00",
  "completedAt": null,
  "submissionData": { ... }
}
```

---

### 4.5 `GET /api/application-details/application/{applicationId}`

**Mục đích:** Lấy tất cả vòng thi của 1 hồ sơ ứng tuyển

**Response:** `List<ApplicationDetail>`

```json
[
  {
    "id": 100,
    "applicationId": 5,
    "roundId": 10,
    "status": "COMPLETED",
    "finalScore": 85.0,
    "finalResult": "PASSED"
  },
  {
    "id": 101,
    "applicationId": 5,
    "roundId": 12,
    "status": "AI_EVALUATED",
    "finalScore": 75.5,
    "finalResult": null
  },
  {
    "id": 102,
    "applicationId": 5,
    "roundId": 14,
    "status": "PENDING",
    "finalScore": null,
    "finalResult": null
  }
]
```

---

### 4.6 `POST /api/mentor-reviews`

**Mục đích:** Mentor đánh giá ứng viên sau buổi phỏng vấn

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "sessionId": 7,
  "mentorId": 3,
  "userId": 42,
  "rating": 4,
  "situationNote": "Ứng viên mô tả rõ tình huống dự án e-commerce với 10K users...",
  "taskNote": "Nhiệm vụ của candidate là thiết kế database và API...",
  "actionNote": "Candidate đã đề xuất giải pháp microservice với Spring Cloud...",
  "resultNote": "Kết quả: Hệ thống xử lý được 10K concurrent users...",
  "strength": "Kiến thức vững về microservices, có kinh nghiệm thực tế",
  "weakness": "Yếu về security implementation và caching strategy",
  "improve": "Nên học thêm về OAuth2 và Redis caching"
}
```

**Response:** `MentorReview` object

```json
{
  "id": 1,
  "session": {
    "id": 7,
    "status": "COMPLETED"
  },
  "mentor": { "id": 3, "name": "Nguyễn Văn Mentor" },
  "user": { "id": 42, "fullName": "Trần Thị Ứng Viên" },
  "rating": 4,
  "situationNote": "...",
  "taskNote": "...",
  "actionNote": "...",
  "resultNote": "...",
  "strength": "...",
  "weakness": "...",
  "improve": "..."
}
```

**Validation:**

- `session.status` phải = `COMPLETED`
- `session`, `mentor`, `user` phải tồn tại

---

### 4.7 `PUT /api/mentor-reviews`

**Mục đích:** Update đánh giá mentor (sửa ghi chú, điểm)

**Request Body:**

```json
{
  "id": 1,
  "rating": 5,
  "situationNote": "...",
  "taskNote": "...",
  "actionNote": "...",
  "resultNote": "...",
  "strength": "...",
  "weakness": "...",
  "improve": "..."
}
```

**Response:** `MentorReview` object đã update

---

### 4.8 `GET /api/mentor-reviews/{id}`

**Mục đích:** Lấy đánh giá mentor theo session ID

**Response:** `MentorReview` object

---

### 4.9 `GET /api/mentor-reviews`

**Mục đích:** Lấy tất cả đánh giá mentor

**Response:** `List<MentorReview>`

---

## 5. SubmissionData — JSONB LƯU BÀI NỘP

Tùy loại vòng thi, `submissionData` có cấu trúc khác nhau:

### 5.1 Vòng CV_SCREENING

```json
{
  "fileUrl": "https://s3.amazonaws.com/bucket/cv/user42_cv.pdf",
  "textContent": null,
  "quizAnswers": null,
  "codeSubmissions": null,
  "codeReviewSubmissions": null
}
```

### 5.2 Vòng EMAIL_SIMULATOR

```json
{
  "textContent": "Kính gửi Anh/Chị Phòng Nhân sự,\n\nEm xin phép được từ chối...",
  "fileUrl": null,
  "quizAnswers": null,
  "codeSubmissions": null,
  "codeReviewSubmissions": null
}
```

### 5.3 Vòng QUIZ

```json
{
  "textContent": null,
  "fileUrl": null,
  "quizAnswers": [
    {
      "questionText": "Time complexity of binary search?",
      "selectedAnswer": "O(log n)",
      "isCorrect": true
    },
    {
      "questionText": "Which annotation for DI?",
      "selectedAnswer": "@Autowired",
      "isCorrect": true
    },
    { "questionText": "HTTP status 404 means?", "selectedAnswer": "Not Found", "isCorrect": true }
  ],
  "codeSubmissions": null,
  "codeReviewSubmissions": null
}
```

### 5.4 Vòng CODING

```json
{
  "textContent": null,
  "fileUrl": null,
  "quizAnswers": null,
  "codeSubmissions": [
    {
      "sourceCode": ["class Solution { public int[] twoSum(...) { ... } }"],
      "testCases": {
        "passed": 3,
        "failed": 1,
        "testCaseResults": [
          {
            "input": "[2,7,11,15], 9",
            "expectedOutput": "[0,1]",
            "actualOutput": "[0,1]",
            "passed": true,
            "executionTimeMs": 5
          },
          {
            "input": "[3,2,4], 6",
            "expectedOutput": "[1,2]",
            "actualOutput": "[1,2]",
            "passed": true,
            "executionTimeMs": 4
          }
        ]
      }
    }
  ],
  "codeReviewSubmissions": null
}
```

### 5.5 Vòng CODE_REVIEW

```json
{
  "textContent": null,
  "fileUrl": null,
  "quizAnswers": null,
  "codeSubmissions": null,
  "codeReviewSubmissions": [
    {
      "filename": "UserService.java",
      "lineNumber": 23,
      "severity": "CRITICAL",
      "description": "SQL Injection"
    },
    {
      "filename": "UserService.java",
      "lineNumber": 45,
      "severity": "WARNING",
      "description": "Resource leak"
    }
  ]
}
```

---

## 6. ApplicationDetailStatus — TRẠNG THÁI VÒNG THI

| Status         | Mô tả                   | Ai đánh dấu | HR hành động       |
| -------------- | ----------------------- | ----------- | ------------------ |
| `PENDING`      | Ứng viên đang làm bài   | -           | Chờ                |
| `SUBMITTED`    | Đã nộp bài, đang gọi AI | -           | Chờ                |
| `AI_EVALUATED` | **AI đã chấm xong**     | ✅          | **Duyệt/Override** |
| `COMPLETED`    | HR đã chốt kết quả      | -           | Xong               |
| `ERROR`        | Lỗi khi gọi AI          | -           | Chấm thủ công      |

**Sơ đồ trạng thái:**

```
PENDING ──[nộp bài]──► SUBMITTED ──[AI chấm xong]──► AI_EVALUATED
                                                       │
                                               ┌───────┴───────┐
                                               │               │
                                          [HR duyệt]      [HR override]
                                               │               │
                                               ▼               ▼
                                           COMPLETED      COMPLETED
```

---

## 7. RoundResult — KẾT QUẢ ĐẬU/RỚT

```java
public enum RoundResult {
    PASSED,   // Điểm >= passThreshold → qua vòng
    FAILED    // Điểm < passThreshold → rớt
}
```

**Luồng tự động chuyển vòng:**

```
AI chấm xong (score >= passThreshold)
    │
    ▼
Backend tự động gọi: applicationService.moveToNextRound()
    │
    ▼
Application.currentRoundOrder++
    │
    ▼
Ứng viên có thể làm vòng tiếp theo
```

---

## 8. LUỒNG HOÀN CHỈNH TỪNG VÒNG THI

### 8.1 CV_SCREENING

```
FE                                    Backend                              AI
 │                                      │                                  │
 │  POST /submit (file)                 │                                  │
 │────────────────────────────────────►│                                  │
 │                                      │  Publish CVEvaluationEvent       │
 │                                      │──────────────────────────────►   │
 │                                      │                                  │ Parse CV
 │                                      │                                  │ Match JD
 │                                      │◄─────────────────────────────────│
 │                                      │  Response { score, feedback }    │
 │                                      │                                  │
 │  Response { status: PENDING }        │                                  │
 │◄────────────────────────────────────│                                  │
 │                                      │                                  │
 │  [Ứng viên chờ AI chấm...]          │                                  │
 │                                      │                                  │
 ├──────────────────────────────────── HR duyệt ──────────────────────────┤
 │                                      │                                  │
 │  PUT /hr-score                       │                                  │
 │  ?applicationId=101&isPass=true     │                                  │
 │  &note=CV tốt&score=80               │                                  │
 │────────────────────────────────────►│                                  │
 │                                      │  detail.hrScore = 80             │
 │                                      │  detail.finalResult = PASSED     │
 │                                      │                                  │
 │  200 OK                             │                                  │
 │◄────────────────────────────────────│                                  │
 │                                      │                                  │
 │  [Tự động moveToNextRound()]        │                                  │
```

### 8.2 QUIZ (Tự động chấm)

```
FE                                    Backend
 │                                      │
 │  POST /submit                        │
 │  { quizAnswers: ["A","B","C"] }       │
 │────────────────────────────────────►│
 │                                      │  QuizRoundProcessor.process()
 │                                      │  ├─ Đối chiếu đáp án
 │                                      │  ├─ Tính điểm
 │                                      │  └─ Lưu + PASS/FAIL
 │                                      │
 │  [Tự động moveToNextRound nếu PASS] │
 │                                      │
 │  Response {                          │
 │    status: COMPLETED,                │
 │    detail: { finalScore: 80,         │
 │               finalResult: PASSED }  │
 │  }                                   │
 │◄────────────────────────────────────│
```

### 8.3 CODING (AI chấm async)

```
FE                                    Backend                              AI
 │                                      │                                  │
 │  POST /submit                        │
 │  (compileRequest[])                  │
 │────────────────────────────────────►│
 │                                      │  CodeRoundProcessor
 │                                      │  ├─ Publish event (async)         │
 │                                      │
 │  Response { status: PENDING }       │
 │◄────────────────────────────────────│
 │                                      │
 │  [Ứng viên chờ AI chấm...]          │  CoderGradingEventHandle
 │                                      │  ├─ Gọi Python chấm code
 │                                      │  └─ Lưu result
 │                                      │
 ├──────────────────────────────────── HR duyệt ──────────────────────────┤
 │                                      │                                  │
 │  PUT /hr-score ...                  │                                  │
 │────────────────────────────────────►│                                  │
 │                                      │                                  │
```

### 8.4 CODE_REVIEW

```
FE                                    Backend                              AI
 │                                      │                                  │
 │  POST /code-review-problems/evaluate │
 │  { submissions: [...] }              │
 │────────────────────────────────────►│
 │                                      │  sendChatToAnythingLLM
 │                                      │  (CODE_REVIEW workspace)
 │                                      │──────────────────────────────►   │
 │                                      │                                  │ Parse submissions
 │                                      │                                  │ Compare with expectedIssues
 │                                      │◄─────────────────────────────────│
 │                                      │
 │                                      │  Lưu vào ApplicationDetail
 │                                      │  Nếu PASS → moveToNextRound()
 │
 │  Response ApplicationDetail
 │◄────────────────────────────────────│
```

### 8.5 MENTOR_REVIEW

```
FE/Ứng viên                         Backend
 │
 │  [Buổi phỏng vấn kết thúc]
 │
 │  Mentor đánh giá:
 │  POST /api/mentor-reviews
 │  { sessionId, mentorId, userId,
 │    rating, situationNote, taskNote... }
 │────────────────────────────────────►│
 │                                      │  Validate session.status=COMPLETED
 │                                      │  Lưu MentorReview
 │
 │  Response MentorReview
 │◄────────────────────────────────────│
 │
 │  [Tùy business: tự động hoặc HR
 │   chuyển vòng tiếp theo]
```

---

## TÓM TẮT NHANH

| API                                         | Method | Role        | Mô tả                                     |
| ------------------------------------------- | ------ | ----------- | ----------------------------------------- |
| `/api/application-details/submit`           | POST   | USER        | Ứng viên nộp bài                          |
| `/api/code-review-problems/evaluate`        | POST   | USER        | Ứng viên nộp bài Code Review (AI tự chấm) |
| `/api/application-details/hr-score`         | PUT    | ADMIN/STAFF | HR chấm bài / override AI                 |
| `/api/application-details/{id}`             | GET    | ADMIN/STAFF | Xem chi tiết 1 vòng thi                   |
| `/api/application-details/application/{id}` | GET    | ADMIN/STAFF | Xem tất cả vòng thi                       |
| `/api/mentor-reviews`                       | POST   | MENTOR      | Mentor đánh giá                           |
| `/api/mentor-reviews`                       | PUT    | MENTOR      | Update đánh giá mentor                    |
| `/api/mentor-reviews/{id}`                  | GET    | MENTOR      | Lấy đánh giá theo session                 |
