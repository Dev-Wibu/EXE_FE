# TÀI LIỆU KỸ THUẬT: CODE REVIEW - MENTOR REVIEW - AI INTERVIEW

> **Mục tiêu:** Cung cấp thông tin chi tiết 100% về API, Request/Response, Models, Services, luồng xử lý để AI agent có thể tự động implement mà không cần hỏi thêm.

---

## MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Enums & Constants](#2-enums--constants)
3. [CODE REVIEW - Vòng 4](#3-code-review---vòng-4)
4. [MENTOR REVIEW - Vòng Mentor](#4-mentor-review---vòng-mentor)
5. [AI INTERVIEW - Vòng 5+](#5-ai-interview---vòng-5)
6. [Luồng End-to-End hoàn chỉnh](#6-luồng-end-to-end-hoàn-chỉnh)
7. [Database Models](#7-database-models)
8. [External APIs](#8-external-apis)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1 RoundType Enum (Loại vòng thi)

```java
// File: src/main/java/fpt/org/inblue/enums/RoundType.java
public enum RoundType {
    CV_SCREENING,       // Lọc CV (Chấm Match Score, Keyword)
    EMAIL_SIMULATOR,     // Giao tiếp chuyên nghiệp (Báo cáo sếp, từ chối task)
    QUIZ,               // Trắc nghiệm kiến thức (Core, DB, Framework)
    CODING,             // Thuật toán / Logic
    CODE_REVIEW,        // Đọc hiểu & Bắt lỗi code người khác
    MENTOR_REVIEW,      // Phỏng vấn với mentor (có phần đánh giá mentor)
    AI_INTERVIEW        // Vấn đáp trực tiếp (Tech + Behavioral)
}
```

### 1.2 ApplicationDetailStatus Enum (Trạng thái bài nộp)

```java
// File: src/main/java/fpt/org/inblue/enums/ApplicationDetailStatus.java
public enum ApplicationDetailStatus {
    PENDING,        // Ứng viên đang làm bài
    SUBMITTED,      // Đã nộp bài, hệ thống đang gọi AI
    AI_EVALUATED,   // AI đã chấm điểm xong (Đang chờ HR duyệt)
    COMPLETED,      // HR đã chốt kết quả (Đóng vòng thi này)
    ERROR           // Lỗi gọi AI
}
```

### 1.3 AnythingLlmWorkspace Enum (AI Workspaces)

```java
// File: src/main/java/fpt/org/inblue/enums/AnythingLlmWorkspace.java
public enum AnythingLlmWorkspace {
    CV_ANALYSIS("cv-processor"),           // Workspace phân tích CV ứng viên (Gemini)
    CODING_GEN("coding-gen"),               // Workspace chuyên về coding (Gemini Pro)
    EMAIL("email-processor"),               // Workspace chuyên về email (Gemini Pro)
    CODE_REVIEW("code-review-processor"),   // Workspace chuyên chấm Code Review
    CODE_REVIEW_GEN("code-review-generator"), // Workspace chuyên sinh đề Code Review
    QUIZ_GEN("quiz-generator")              // Workspace chuyên sinh đề Quiz
}
```

### 1.4 CodeReviewMetricConstant (Metrics cho Code Review)

```java
// File: src/main/java/fpt/org/inblue/constants/CodeReviewMetricConstant.java
public class CodeReviewMetricConstant {
    public static final String BUG_DETECTION = "Bug Detection";
    public static final String SECURITY_AWARENESS = "Security Awareness";
    public static final String PERFORMANCE_ANALYSIS = "Performance Analysis";
    public static final String CODE_SMELL_DETECTION = "Code Smell Detection";
    public static final String SOLUTION_QUALITY = "Solution Quality";
    public static final String CLEAN_CODE_AWARENESS = "Clean Code Awareness";
    public static final String STRENGTH = "Strength";
    public static final String WEAKNESS = "Weakness";
    public static final String GENERAL_COMMENT = "General Comment";
    public static final String MISSED_ISSUES = "Missed Issues";
}
```

---

## 2. CODE REVIEW - Vòng 4

### 2.1 Controllers

#### 2.1.1 CodeReviewProblemController

```
Base URL: /api/code-review-problems
```

| Method | Endpoint    | Mô tả                       |
| ------ | ----------- | --------------------------- |
| GET    | `/`         | Lấy tất cả bài Code Review  |
| GET    | `/{id}`     | Lấy bài Code Review theo ID |
| POST   | `/`         | Tạo mới bài Code Review     |
| POST   | `/generate` | AI sinh đề Code Review      |

#### 2.1.2 ApplicationDetailController

```
Base URL: /api/application-details
```

| Method | Endpoint                       | Mô tả                              |
| ------ | ------------------------------ | ---------------------------------- |
| POST   | `/submit`                      | Nộp bài (multipart/form-data)      |
| POST   | `/code-review/evaluate`        | **Chấm bài Code Review**           |
| POST   | `/hr-score`                    | HR chấm điểm                       |
| GET    | `/{id}`                        | Lấy ApplicationDetail theo ID      |
| GET    | `/application/{applicationId}` | Lấy tất cả details của application |
| GET    | `/reviewer`                    | Lấy danh sách cần review cho staff |

---

### 2.2 Endpoints Chi Tiết

#### 2.2.1 POST `/api/code-review-problems/generate`

**Mục đích:** AI tự sinh đề Code Review

**Request Body:**

```json
{
  "topic": "Spring Boot Security", // Chủ đề code cần review
  "difficulty": "MEDIUM", // EASY, MEDIUM, HARD
  "targetLevel": "Backend Developer", // Trình độ ứng viên hướng tới
  "programmingLanguage": "Java", // Ngôn ngữ lập trình
  "context": {
    "jobTitle": "Backend Engineer", // Vị trí công việc
    "requirement": "Review đoạn code về authentication",
    "prompting": "Tập trung vào SQL Injection và XSS"
  }
}
```

**Response:**

```json
{
  "title": "Review Authentication Module",
  "difficulty": "MEDIUM",
  "language": "Java",
  "problemStatement": "Hãy review đoạn code sau và tìm các lỗi bảo mật, hiệu năng, và code smell.",
  "files": [
    {
      "filename": "src/main/java/UserService.java",
      "content": "public class UserService {\n    public User findById(Long id) {\n        return userRepository.findById(id);\n    }\n}",
      "language": "java"
    }
  ],
  "expectedIssues": [
    {
      "filename": "src/main/java/UserService.java",
      "lineNumber": 15,
      "severity": "CRITICAL",
      "description": "SQL Injection vulnerability - cần sử dụng PreparedStatement"
    }
  ]
}
```

---

#### 2.2.2 POST `/api/application-details/code-review/evaluate`

**Mục đích:** Chấm điểm bài Code Review của ứng viên

**Request Body:**

```json
{
  "applicationId": 123,
  "roundId": 456,
  "submissions": [
    {
      "filename": "src/main/java/UserService.java",
      "lineNumber": 15,
      "severity": "CRITICAL",
      "description": "SQL Injection - nên dùng PreparedStatement"
    },
    {
      "filename": "src/main/java/UserService.java",
      "lineNumber": 22,
      "severity": "WARNING",
      "description": "Missing null check for user object"
    }
  ]
}
```

**Response:** `ApplicationDetail` object

---

#### 2.2.3 POST `/api/application-details/submit` (Multipart)

**Mục đích:** Nộp bài Code Review (Frontend upload file + data)

**Request:** `multipart/form-data`

| Field          | Type                 | Mô tả                 |
| -------------- | -------------------- | --------------------- |
| applicationId  | Long                 | ID của application    |
| file           | MultipartFile        | File bài làm (nếu có) |
| textContent    | String               | Nội dung text         |
| quizAnswers    | List<String>         | Đáp án quiz           |
| compileRequest | List<CompileRequest> | Code submissions      |

**Response:**

```json
{
  "status": "PENDING | COMPLETED",
  "applicationId": 123,
  "detail": {
    /* ApplicationDetail object */
  },
  "message": "Bài đang được chấm, vui lòng chờ",
  "roundResult": "PASSED | FAILED",
  "testCases": [
    /* Compiler test results */
  ]
}
```

---

### 2.3 Models

#### 2.3.1 CodeReviewProblem Entity

```java
// File: src/main/java/fpt/org/inblue/model/CodeReviewProblem.java
@Entity
public class CodeReviewProblem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private CodingProblem.Difficulty difficulty;  // EASY, MEDIUM, HARD

    private String language;  // "Java", "Javascript", "C#"

    @Column(columnDefinition = "TEXT")
    private String problemStatement;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<CodeFile> files;  // Danh sách file code chứa lỗi

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<ExpectedIssue> expectedIssues;  // Lỗi mẫu để AI đối chiếu

    @Builder.Default
    private Boolean isDeleted = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // === Nested Classes ===

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeFile {
        private String filename;   // "src/main/java/UserService.java"
        private String content;    // Nội dung code
        private String language;   // "java", "sql", "xml"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExpectedIssue {
        private String filename;
        private Integer lineNumber;  // 1-indexed
        private String severity;      // CRITICAL, WARNING, INFO
        private String description;
    }
}
```

#### 2.3.2 ApplicationDetail Entity

```java
// File: src/main/java/fpt/org/inblue/model/ApplicationDetail.java
@Entity
public class ApplicationDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long applicationId;
    private Long roundId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationDetailStatus status = ApplicationDetailStatus.PENDING;

    private Double finalScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private SubmissionData submissionData;

    private Double aiScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private AiFeedback aiFeedback;

    private Double hrScore;
    private String hrNote;

    @Enumerated(EnumType.STRING)
    private RoundResult finalResult;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @ManyToOne
    @JoinColumn(name = "mentor_review_id")
    MentorReview mentorReview;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // === Nested Classes ===

    @Data
    @Builder
    public static class SubmissionData {
        private String textContent;
        private String fileUrl;
        private List<QuizAnswer> quizAnswers;
        private List<CodeSubmission> codeSubmissions;
        private List<CodeReviewSubmission> codeReviewSubmissions;
        private Long emailSubmissionId;
    }

    @Data
    @Builder
    public static class CodeSubmission {
        private List<String> sourceCode;
        private CompilerResponseDto testCases;
    }

    @Data
    @Builder
    public static class CodeReviewSubmission {
        private String filename;
        private Integer lineNumber;  // 1-indexed
        private String severity;      // CRITICAL, WARNING, INFO
        private String description;
    }

    @Data
    @Builder
    public static class AiFeedback {
        private String generalComment;
        private List<String> strengths;
        private List<String> weaknesses;
        private Map<String, Object> extraMetrics;
    }

    public enum RoundResult {
        PASSED,
        FAILED
    }
}
```

---

### 2.4 DTOs

#### 2.4.1 CodeReviewProblemGenerateRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/CodeReviewProblemGenerateRequest.java
@Data
@Builder
public class CodeReviewProblemGenerateRequest {
    private String topic;              // Chủ đề code cần review
    private String difficulty;          // EASY, MEDIUM, HARD
    private String targetLevel;        // Trình độ ứng viên
    private String programmingLanguage; // Java, Python, Javascript
    private Context context;

    @Data
    @Builder
    public static class Context {
        private String jobTitle;       // Vị trí công việc
        private String requirement;     // Yêu cầu chi tiết
        private String prompting;       // Prompt bổ sung
    }
}
```

#### 2.4.2 CodeReviewSubmitRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/CodeReviewSubmitRequest.java
@Data
public class CodeReviewSubmitRequest {
    private Long applicationId;
    private Long roundId;
    private List<ApplicationDetail.CodeReviewSubmission> submissions;
}
```

#### 2.4.3 CodeReviewEvaluationRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/CodeReviewEvaluationRequest.java
@Data
@Builder
public class CodeReviewEvaluationRequest {
    private EvaluationCriteria evaluationCriteria;
    private CodeReviewProblem codeReviewProblem;
    private List<ApplicationDetail.CodeReviewSubmission> submissions;

    @Data
    @Builder
    public static class EvaluationCriteria {
        private Integer maxScore;
        private String aiSystemPrompt;
        private List<String> extraMetrics;
    }

    @Data
    @Builder
    public static class CodeReviewProblem {
        private String title;
        private String difficulty;
        private String language;
        private String problemStatement;
        private List<CodeReviewProblem.CodeFile> files;
        private List<CodeReviewProblem.ExpectedIssue> expectedIssues;
    }
}
```

#### 2.4.4 SubmitRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/SubmitRequest.java
@Data
@Builder
public class SubmitRequest {
    private Long applicationId;
    private String textContent;

    @Nullable
    private MultipartFile file;

    private List<String> quizAnswers;
    private List<CompileRequest> compileRequest;
}
```

---

### 2.5 Services

#### 2.5.1 CodeReviewProblemService Interface

```java
// File: src/main/java/fpt/org/inblue/service/CodeReviewProblemService.java
public interface CodeReviewProblemService {
    Optional<CodeReviewProblem> findCodeReviewProblemById(Long id);
    CodeReviewProblem save(CodeReviewProblem codeReviewProblem);
    List<CodeReviewProblem> findAllCodeReviewProblems();
    CodeReviewProblemGenerateResponse generateCodeReviewProblem(CodeReviewProblemGenerateRequest request);
}
```

#### 2.5.2 SubmissionService (Xử lý nộp bài & chấm điểm)

```java
// File: src/main/java/fpt/org/inblue/service/submission/SubmissionService.java
@Service
@RequiredArgsConstructor
public class SubmissionService {

    @Transactional
    public ApplicationDetail evaluateCodeReview(CodeReviewSubmitRequest request) {
        // 1. Lấy Application và Round hiện tại
        Application currentApplication = applicationService.getApplicationById(request.getApplicationId());
        Round currentRound = jobDescriptionService.getRoundByOrder(
            currentApplication.getJdId(), currentApplication.getCurrentRoundOrder());

        // 2. Lấy Problem Snapshot từ Round config
        Round.CodeReviewProblemSnapshot problemSnapshot =
            currentRound.getConfigData().getCodeReviewProblems().get(0);

        // 3. Build EvaluationCriteria với metrics mặc định
        List<String> defaultMetrics = List.of(
            CodeReviewMetricConstant.BUG_DETECTION,
            CodeReviewMetricConstant.SECURITY_AWARENESS,
            CodeReviewMetricConstant.PERFORMANCE_ANALYSIS,
            CodeReviewMetricConstant.CODE_SMELL_DETECTION,
            CodeReviewMetricConstant.SOLUTION_QUALITY,
            CodeReviewMetricConstant.CLEAN_CODE_AWARENESS,
            CodeReviewMetricConstant.STRENGTH,
            CodeReviewMetricConstant.WEAKNESS,
            CodeReviewMetricConstant.GENERAL_COMMENT,
            CodeReviewMetricConstant.MISSED_ISSUES
        );

        // 4. Gọi AI qua AnythingLLM
        CvEvaluationResponse response = apiClient.sendChatToAnythingLlm(
            AnythingLlmWorkspace.CODE_REVIEW,
            evaluationRequest,
            "java-backend" + request.getApplicationId(),
            false,  // resetSession
            null,   // attachedFiles
            CvEvaluationResponse.class
        );

        // 5. Lưu kết quả vào ApplicationDetail
        // 6. Nếu PASSED -> gọi moveToNextRound()

        return applicationDetailRepository.save(detail);
    }

    @Transactional
    public SubmissionResult submitRound(SubmitRequest detail) throws IOException {
        // Sử dụng RoundProcessorFactory để lấy processor phù hợp với RoundType
        RoundSubmissionProcessor processor = roundProcessorFactory.getProcessor(
            currentRound.getRoundType()
        );
        return processor.process(processDto);
    }
}
```

#### 2.5.3 SubmissionResult

```java
// File: src/main/java/fpt/org/inblue/service/submission/SubmissionResult.java
@Data
public class SubmissionResult {
    public enum Status { PENDING, COMPLETED }

    private final Status status;
    private final Long applicationId;
    private final ApplicationDetail detail;  // null nếu PENDING
    private final String message;
    private final ApplicationDetail.RoundResult roundResult;
    private final List<CompilerResponseDto.TestCaseResult> testCases;

    public static SubmissionResult completed(ApplicationDetail detail) { ... }
    public static SubmissionResult pending(Long applicationId) { ... }
    public static SubmissionResult compileCode(CompilerResponseDto compilerResponse) { ... }
}
```

---

### 2.6 Luồng Code Review

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LUỒNG CODE REVIEW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. HR TẠO ROUND CODE_REVIEW
   │
   ├─ POST /api/rounds/jd/{jdId}
   │  Body: {
   │    "rounds": [{
   │      "name": "Code Review Round",
   │      "roundOrder": 4,
   │      "roundType": "CODE_REVIEW",
   │      "passThreshold": 7.0,
   │      "configData": {
   │        "maxScore": 10,
   │        "instruction": "Hãy review code...",
   │        "aiSystemPrompt": "Bạn là chuyên gia code review...",
   │        "codeReviewProblems": [{
   │          "problemId": 1,
   │          "title": "Review Authentication",
   │          "files": [...],
   │          "expectedIssues": [...]
   │        }]
   │      }
   │    }]
   │  }
   │
2. ỨNG VIÊN NỘP BÀI
   │
   ├─ POST /api/application-details/code-review/evaluate
   │  Body: {
   │    "applicationId": 123,
   │    "roundId": 456,
   │    "submissions": [
   │      {"filename": "UserService.java", "lineNumber": 15, "severity": "CRITICAL", "description": "..."},
   │      {"filename": "UserService.java", "lineNumber": 22, "severity": "WARNING", "description": "..."}
   │    ]
   │  }
   │
3. HỆ THỐNG XỬ LÝ
   │
   ├─ Lấy Application + Round hiện tại
   ├─ Lấy Problem Snapshot từ Round config
   ├─ Build CodeReviewEvaluationRequest
   ├─ Gọi AnythingLLM CODE_REVIEW workspace
   │
4. LƯU KẾT QUẢ
   │
   ├─ ApplicationDetail.status = AI_EVALUATED
   ├─ ApplicationDetail.aiScore = response.getScore()
   ├─ ApplicationDetail.aiFeedback = parsed metrics
   │
5. QUYẾT ĐỊNH PASS/FAIL
   │
   ├─ score >= passThreshold(7.0)?
   │   ├─ YES: roundResult = PASSED, moveToNextRound()
   │   └─ NO: roundResult = FAILED
   │
6. HR REVIEW
   │
   ├─ GET /api/application-details/reviewer  (Lấy danh sách cần review)
   ├─ POST /api/application-details/hr-score (Chấm điểm HR)
   │   Params: applicationDetailId, isPass, note, score
   └─ ApplicationDetail.status = COMPLETED
```

---

## 3. MENTOR REVIEW - Vòng Mentor

### 3.1 Controllers

#### 3.1.1 MentorReviewController

```
Base URL: /api/mentor-reviews
```

| Method | Endpoint | Mô tả                             |
| ------ | -------- | --------------------------------- |
| GET    | `/`      | Lấy tất cả Mentor Reviews         |
| POST   | `/`      | Tạo mới Mentor Review             |
| PUT    | `/`      | Cập nhật Mentor Review            |
| GET    | `/{id}`  | Lấy Mentor Review theo session ID |

#### 3.1.2 SessionController

```
Base URL: /api/sessions
```

| Method | Endpoint            | Mô tả                       |
| ------ | ------------------- | --------------------------- |
| GET    | `/`                 | Lấy tất cả sessions         |
| GET    | `/{id}`             | Lấy session theo ID         |
| GET    | `/{userId}/by-user` | Lấy sessions của user       |
| PUT    | `/`                 | Cập nhật session            |
| POST   | `/create-session`   | Tạo session họp với mentor  |
| POST   | `/join-session`     | Ghi nhận user tham gia      |
| POST   | `/webhooks/dailyco` | Webhook từ Daily.co         |
| GET    | `/update-status`    | Cập nhật trạng thái session |
| GET    | `/make-payment`     | Tạo payment                 |

---

### 3.2 Endpoints Chi Tiết

#### 3.2.1 POST `/api/mentor-reviews`

**Mục đích:** Tạo review cho mentor sau khi session hoàn thành

**Request Body:**

```json
{
  "sessionId": 1,
  "mentorId": 2,
  "userId": 3,
  "rating": 5,
  "situationNote": "Mentor giải thích rất rõ ràng về Spring Security",
  "taskNote": "Đưa ra bài tập phù hợp với trình độ",
  "actionNote": "Hướng dẫn từng bước cụ thể",
  "resultNote": "Đã hiểu rõ về authentication flow",
  "strength": "Kinh nghiệm thực tế phong phú, giải thích dễ hiểu",
  "weakness": "Đôi khi nói hơi nhanh",
  "improve": "Có thể chia nhỏ concept hơn"
}
```

**Response:** `MentorReview` object

**Validation:**

- Session phải có `status = COMPLETED`
- Session, Mentor, User phải tồn tại

---

#### 3.2.2 PUT `/api/mentor-reviews`

**Mục đích:** Cập nhật review đã tạo

**Request Body:**

```json
{
  "id": 1,
  "rating": 4,
  "situationNote": "string",
  "taskNote": "string",
  "actionNote": "string",
  "resultNote": "string",
  "strength": "string",
  "weakness": "string",
  "improve": "string"
}
```

---

#### 3.2.3 GET `/api/mentor-reviews/{id}`

**Mục đích:** Lấy review theo session ID

**Note:** Parameter `id` thực chất là `sessionId`

---

#### 3.2.4 POST `/api/sessions/create-session`

**Mục đích:** Tạo phòng họp với mentor qua Daily.co

**Request Body:**

```json
{
  "dailyCoCreationRequest": {
    "name": "Mentor Session",
    "privacy": "public",
    "properties": {
      "max_participants": 2,
      "start_video_off": true,
      "start_audio_off": true,
      "enable_screenshare": true,
      "exp": 120,
      "enable_recording": "cloud"
    }
  },
  "userId": 1,
  "mentorId": 2
}
```

**Response:**

```json
{
  "url": "https://api.daily.co/room/abc123",
  "name": "room-abc123",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 3.3 Models

#### 3.3.1 MentorReview Entity

```java
// File: src/main/java/fpt/org/inblue/model/MentorReview.java
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MentorReview {
    @Id
    int id;

    @MapsId
    @JoinColumn(name = "session_id")
    @OneToOne
    Session session;

    @JoinColumn(name = "mentor_id")
    @ManyToOne
    Mentor mentor;

    @JoinColumn(name = "user_id")
    @ManyToOne
    User user;

    int rating;           // 1-5 sao
    String situationNote; // Ghi chú về tình huống
    String taskNote;      // Ghi chú về task
    String actionNote;    // Ghi chú về action
    String resultNote;    // Ghi chú về kết quả
    String strength;      // Điểm mạnh của mentor
    String weakness;      // Điểm yếu
    String improve;       // Đề xuất cải thiện
}
```

#### 3.3.2 Session Entity (Phỏng vấn với Mentor)

```java
// File: src/main/java/fpt/org/inblue/model/Session.java
@Entity
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String roomName;    // Tên phòng Daily.co

    // Thông tin người dùng 1 (mentee)
    private int userId;
    private String participantId1;
    private Timestamp startTime1;
    private Timestamp endTime1;
    private Long durationSeconds1;

    // Thông tin người dùng 2 (mentor)
    private int userId2;
    private String participantId2;
    private Timestamp startTime2;
    private Timestamp endTime2;
    private Long durationSeconds2;

    private String roomUrl;    // URL phòng Daily.co

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss.SSS")
    private Timestamp joinTime;

    private String recordUrl;  // URL recording

    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    private Integer duration;      // Thời lượng (phút)
    private Integer totalPrice;    // Giá tiền
    private String transactionCode;
}
```

#### 3.3.3 SessionStatus Enum

```java
// File: src/main/java/fpt/org/inblue/enums/SessionStatus.java
public enum SessionStatus {
    DRAFT,
    SCHEDULED,
    PAID,
    REJECTED,
    ONGOING,
    COMPLETED,
    CANCELED
}
```

---

### 3.4 DTOs

#### 3.4.1 CreateMentorReviewRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/CreateMentorReviewRequest.java
@Data
public class CreateMentorReviewRequest {
    int sessionId;
    int mentorId;
    int userId;
    int rating;           // 1-5
    String situationNote;
    String taskNote;
    String actionNote;
    String resultNote;
    String strength;
    String weakness;
    String improve;
}
```

#### 3.4.2 UpdateMentorReviewRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/UpdateMentorReviewRequest.java
@Data
public class UpdateMentorReviewRequest {
    int id;
    int rating;
    String situationNote;
    String taskNote;
    String actionNote;
    String resultNote;
    String strength;
    String weakness;
    String improve;
}
```

#### 3.4.3 SessionCreationRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/dailyco/SessionCreationRequest.java
@Data
public class SessionCreationRequest {
    private DailyCoCreationRequest dailyCoCreationRequest;
    private int userId;
    private int mentorId;
}

@Data
public class DailyCoCreationRequest {
    private String name;
    private String privacy;  // "public" hoặc "private"
    private DailyCoProperties properties;
}

@Data
public class DailyCoProperties {
    private int max_participants;
    private boolean start_video_off;
    private boolean start_audio_off;
    private boolean enable_screenshare;
    private int exp;                    // Thời gian hết hạn (phút)
    private String enable_recording;     // "cloud" hoặc "local"
}
```

#### 3.4.4 JoinSessionDtoRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/JoinSessionDtoRequest.java
@Data
public class JoinSessionDtoRequest {
    private int userId;
    private String sessionName;  // roomName từ Daily.co
}
```

---

### 3.5 Services

#### 3.5.1 MentorReviewService Interface

```java
// File: src/main/java/fpt/org/inblue/service/MentorReviewService.java
public interface MentorReviewService {
    MentorReview mentorReview(CreateMentorReviewRequest mentorReview);
    MentorReview updateMentorReview(UpdateMentorReviewRequest mentorReview);
    MentorReview getMentorReviewById(int id);
    List<MentorReview> getAllMentorReviews();
}
```

#### 3.5.2 MentorReviewServiceImpl

```java
// File: src/main/java/fpt/org/inblue/service/impl/MentorReviewServiceImpl.java
@Service
@RequiredArgsConstructor
public class MentorReviewServiceImpl implements MentorReviewService {
    private final MentorReviewRepository repo;
    private final SessionRepository sessionRepo;
    private final MentorReviewMapper mentorReviewMapper;
    private final MentorRepository mentorRepo;
    private final UserService userService;

    @Override
    public MentorReview mentorReview(CreateMentorReviewRequest request) {
        Mentor mentor = mentorRepo.getMentorById(request.getMentorId());
        User user = userService.getById(request.getUserId());
        Session session = sessionRepo.findById(request.getSessionId()).orElse(null);

        if (session == null || user == null || mentor == null) {
            throw new CustomException("Session|Mentor|User not found", HttpStatus.NOT_FOUND);
        }

        if (session.getStatus().equals(SessionStatus.COMPLETED)) {
            MentorReview review = mentorReviewMapper.toEntity(request);
            review.setSession(session);
            return repo.save(review);
        } else {
            throw new CustomException(
                "Cannot review mentor for a session that is not completed",
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Override
    public MentorReview updateMentorReview(UpdateMentorReviewRequest request) {
        if (repo.existsById(request.getId())) {
            MentorReview review = repo.findById(request.getId()).orElse(null);
            mentorReviewMapper.fromUpdateToEntity(request, review);
            return repo.save(review);
        } else {
            throw new CustomException("Mentor review not found", HttpStatus.NOT_FOUND);
        }
    }

    @Override
    public MentorReview getMentorReviewById(int id) {
        if (sessionRepo.existsById(id)) {
            return repo.findBySession_Id(id);
        } else {
            throw new CustomException("Mentor review not found", HttpStatus.NOT_FOUND);
        }
    }

    @Override
    public List<MentorReview> getAllMentorReviews() {
        return repo.findAll();
    }
}
```

---

### 3.6 Luồng Mentor Review

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LUỒNG MENTOR REVIEW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. TẠO SESSION VỚI MENTOR
   │
   ├─ POST /api/sessions/create-session
   │  Body: {
   │    "dailyCoCreationRequest": {...},
   │    "userId": 1,
   │    "mentorId": 2
   │  }
   │  └─> Tạo phòng Daily.co, lưu Session với status = SCHEDULED
   │
2. THANH TOÁN (nếu cần)
   │
   ├─ GET /api/sessions/make-payment?sessionId=1
   │  └─> Trả về payment URL (PayOS)
   │
3. CẬP NHẬT TRẠNG THÁI
   │
   ├─ GET /api/sessions/update-status?sessionId=1&isApproved=true
   │  └─> Session.status = PAID
   │
4. BẮT ĐẦU PHỎNG VẤN
   │
   ├─ POST /api/sessions/join-session
   │  Body: {"userId": 1, "sessionName": "room-abc123"}
   │  └─> Ghi nhận thời gian vào của user
   │
5. KẾT THÚC PHỎNG VẤN (Daily.co webhook)
   │
   ├─ POST /api/sessions/webhooks/dailyco
   │  Event: "participant.left"
   │  └─> Cập nhật thời gian ra, duration, recording URL
   │
6. CẬP NHẬT TRẠNG THÁI COMPLETED
   │
   ├─ Session.status = COMPLETED
   │
7. TẠO MENTOR REVIEW
   │
   ├─ POST /api/mentor-reviews
   │  Body: {
   │    "sessionId": 1,
   │    "mentorId": 2,
   │    "userId": 3,
   │    "rating": 5,
   │    "situationNote": "...",
   │    "taskNote": "...",
   │    "actionNote": "...",
   │    "resultNote": "...",
   │    "strength": "...",
   │    "weakness": "...",
   │    "improve": "..."
   │  }
   │  └─> Validation: Session.status phải = COMPLETED
   │  └─> Lưu MentorReview, link với Session (OneToOne)
   │
8. CẬP NHẬT REVIEW (nếu cần)
   │
   ├─ PUT /api/mentor-reviews
   │  Body: { "id": 1, "rating": 4, ... }
   │
9. LẤY REVIEW
   │
   ├─ GET /api/mentor-reviews/1  (theo sessionId)
   └─ GET /api/mentor-reviews     (tất cả)
```

---

## 4. AI INTERVIEW - Vòng 5+

### 4.1 Controllers

#### 4.1.1 InterviewSessionController

```
Base URL: /api/interview-sessions
```

| Method | Endpoint                    | Mô tả                                       |
| ------ | --------------------------- | ------------------------------------------- |
| POST   | `/generate-job-requirement` | Parse JD thành structured data              |
| GET    | `/config-options`           | Lấy options cho UI (modes, difficulties...) |
| POST   | `/create-session`           | Tạo AI Interview session                    |
| GET    | `/user/{userId}`            | Lấy tất cả sessions của user                |
| GET    | `/cache/{sessionKey}`       | Lấy session từ Redis cache                  |
| GET    | `/{sessionId}`              | Lấy session từ DB                           |

#### 4.1.2 InterviewProcessController

```
Base URL: /api/v1/interview
```

| Method | Endpoint              | Mô tả                       |
| ------ | --------------------- | --------------------------- |
| GET    | `/start/{sessionKey}` | Bắt đầu/Khôi phục interview |
| POST   | `/submit`             | Gửi câu trả lời             |

---

### 4.2 Endpoints Chi Tiết

#### 4.2.1 POST `/api/interview-sessions/create-session`

**Mục đích:** Tạo AI Interview session mới

**Request Body:**

```json
{
  "user_id": 1,
  "candidate_profile": {
    // CandidateProfile object đã parse từ CV
    "fullName": "Nguyen Van A",
    "email": "nguyenvana@email.com",
    "phone": "0912345678",
    "skills": ["Java", "Spring Boot", "PostgreSQL"],
    "experiences": [
      {
        "company": "Tech Corp",
        "position": "Backend Developer",
        "duration": "2020-2023"
      }
    ],
    "education": "FPT University"
  },
  "job_requirement": {
    "basic_info": {
      "job_title": "Senior Backend Engineer",
      "industry_domain": "Fintech",
      "seniority_level": "Senior"
    },
    "competencies": {
      "hard_skills": ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Redis"],
      "tools_and_platforms": ["Docker", "Kubernetes", "AWS"],
      "soft_skills": ["Communication", "Problem Solving"]
    },
    "responsibilities": ["Thiết kế và phát triển microservices", "Review code và mentor junior"]
  },
  "session_config": {
    "duration_minutes": 45,
    "interview_mode": "STANDARD_MOCK",
    "difficulty": "FRESHER_ADVANCED",
    "language": "VI",
    "domain": "IT"
  }
}
```

**Response:** `sessionKey` (String - UUID)

```json
{
  "sessionKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### 4.2.2 GET `/api/v1/interview/start/{sessionKey}`

**Mục đích:** Bắt đầu hoặc khôi phục interview (gọi khi vào màn hình chat)

**Response:**

```json
{
  "sessionKey": "550e8400-e29b-41d4-a716-446655440000",
  "isFinished": false,
  "phaseName": "Introduction",
  "currentQuestionIndex": 1,
  "totalQuestionsInPhase": 3,
  "questionContent": "Xin chào! Mình là AI Interviewer. Bạn có thể giới thiệu về bản thân không?",
  "questionType": "BLUEPRINT"
}
```

---

#### 4.2.3 POST `/api/v1/interview/submit`

**Mục đích:** Gửi câu trả lời của ứng viên

**Request Body:**

```json
{
  "sessionKey": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "Tôi là Nguyễn Văn A, tốt nghiệp FPT University năm 2023. Tôi đã làm việc 2 năm với Java Spring Boot..."
}
```

**Response:**

```json
{
  "sessionKey": "550e8400-e29b-41d4-a716-446655440000",
  "isFinished": false,
  "phaseName": "Technical Core",
  "currentQuestionIndex": 2,
  "totalQuestionsInPhase": 5,
  "questionContent": "Bạn có thể giải thích sự khác nhau giữa @Component, @Service, và @Repository trong Spring không?",
  "questionType": "BLUEPRINT"
}
```

**Khi interview kết thúc:**

```json
{
  "sessionKey": "550e8400-e29b-41d4-a716-446655440000",
  "isFinished": true,
  "questionContent": "Cảm ơn bạn đã hoàn thành buổi phỏng vấn!"
}
```

---

#### 4.2.4 GET `/api/interview-sessions/config-options`

**Mục đích:** Lấy danh sách options cho UI

**Response:**

```json
{
  "interview_modes": [
    { "key": "STANDARD_MOCK", "label": "Phỏng vấn tiêu chuẩn", "description": "..." },
    { "key": "THEORY_CHECK", "label": "Dò bài lý thuyết", "description": "..." },
    { "key": "PROJECT_DEFENSE", "label": "Bảo vệ dự án", "description": "..." }
  ],
  "difficulties": [
    { "key": "FRESHER_BASIC", "label": "Cơ bản", "description": "..." },
    { "key": "FRESHER_ADVANCED", "label": "Nâng cao", "description": "..." }
  ],
  "languages": [
    { "key": "VI", "label": "Tiếng Việt", "description": "..." },
    { "key": "EN", "label": "Tiếng Anh", "description": "..." }
  ],
  "domains": [
    { "key": "IT", "label": "Công nghệ thông tin", "description": "..." },
    { "key": "NON_IT", "label": "Kinh tế & Nghiệp vụ", "description": "..." }
  ]
}
```

---

#### 4.2.5 POST `/api/interview-sessions/generate-job-requirement`

**Mục đích:** Parse JD text thành structured data

**Request Body:** Raw JD text string

**Response:** `JobRequirementData` object

---

### 4.3 Models

#### 4.3.1 InterviewSession Entity

```java
// File: src/main/java/fpt/org/inblue/model/InterviewSession.java
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String sessionKey;  // UUID để link với Redis

    // User
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Lưu Blueprint (JSONB)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private InterviewBlueprintResponse blueprint;

    // Lưu CV Snapshot (JSONB)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private CandidateProfile candidateProfile;

    // Lưu JD Snapshot (JSONB)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private OrchestratorRequest.JobRequirementData jobRequirement;

    // Lưu Config Snapshot (JSONB)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private OrchestratorRequest.SessionConfigData sessionConfig;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private InterviewEnums.InterviewMode mode;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private InterviewEnums.JobDomain domain;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SessionStatus status;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    // Kết quả
    @Column(name = "overall_score")
    private Double overallScore;  // 0.0 - 10.0

    @Enumerated(EnumType.STRING)
    private EvaluationResult result;

    // Chi tiết kết quả (JSONB)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private InterviewResultDetail resultDetail;

    // === Nested Enums ===

    public enum SessionStatus {
        CREATED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum EvaluationResult {
        STRONG_HIRE,  // >= 9.0
        HIRE,         // >= 7.0
        CONSIDER,     // >= 5.0
        REJECT        // < 5.0
    }
}
```

#### 4.3.2 InterviewSessionRedis (Redis Cache)

```java
// File: src/main/java/fpt/org/inblue/model/caching/InterviewSessionRedis.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash(value = "InterviewSession", timeToLive = 7200)  // 2 hours TTL
public class InterviewSessionRedis {
    @Id
    private String id;  // = sessionKey

    private InterviewBlueprintResponse blueprint;

    private int dbId;  // Link về DB

    // Current state
    private Integer currentPhaseIndex;
    private Integer currentQuestionIndex;
    private String currentQuestionText;
    private QuestionType currentQuestionType;

    @Builder.Default
    private List<InterviewExchange> chatHistory = new LinkedList<>();

    // === Nested Classes ===

    @Data
    @Builder
    public static class InterviewExchange implements Serializable {
        private String phaseName;
        private int questionId;
        private int questionOrder;
        private String questionText;
        private String answerText;
        private String submittedAt;
        private String currentQuestionText;
        private QuestionType type;  // BLUEPRINT hoặc FOLLOW_UP
    }

    public enum QuestionType {
        BLUEPRINT,   // Câu hỏi gốc trong kịch bản (Mỏ neo)
        FOLLOW_UP    // Câu hỏi bồi (AI tự nghĩ ra)
    }
}
```

#### 4.3.3 InterviewResultDetail

```java
// File: src/main/java/fpt/org/inblue/model/InterviewResultDetail.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResultDetail {
    private String aiOverviewFeedback;
    private String improvementPlan;
    private List<QAResult> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QAResult {
        private String questionType;     // BLUEPRINT hoặc FOLLOW_UP
        private int questionOrder;
        private String questionText;
        private String answerText;
        private String feedback;          // AI nhận xét
        private Double score;            // 0-10
        private String suggestion;       // Gợi ý câu trả lời tốt hơn
        private List<String> behavioralWarnings;  // Từ faceDetect
    }
}
```

#### 4.3.4 InterviewBlueprintResponse

```java
// File: src/main/java/fpt/org/inblue/model/dto/response/InterviewBlueprintResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class InterviewBlueprintResponse {
    @JsonProperty("strategy_analysis")
    private String strategyAnalysis;

    @JsonProperty("blueprint")
    private List<InterviewPhase> blueprint;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewPhase {
        @JsonProperty("phase_name")
        private String phaseName;

        @JsonProperty("duration_minutes")
        private Integer durationMinutes;

        @JsonProperty("questions")
        private List<InterviewQuestion> questions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewQuestion {
        @JsonProperty("order")
        private Integer order;

        @JsonProperty("question_text")
        private String questionText;

        @JsonProperty("rag_keyword")
        private String ragKeyword;

        @JsonProperty("question_type")
        private String questionType;  // CORE hoặc FOLLOW_UP
    }
}
```

---

### 4.4 DTOs

#### 4.4.1 InterviewSetupRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/InterviewSetupRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSetupRequest {
    @JsonProperty("user_id")
    private int userId;

    @JsonProperty("candidate_profile")
    private CandidateProfile candidateProfile;

    @JsonProperty("job_requirement")
    private OrchestratorRequest.JobRequirementData jobRequirement;

    @JsonProperty("session_config")
    private OrchestratorRequest.SessionConfigData sessionConfig;
}
```

#### 4.4.2 SubmitAnswerRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/SubmitAnswerRequest.java
@Data
public class SubmitAnswerRequest {
    private String sessionKey;
    private String answer;
}
```

#### 4.4.3 QuestionResponse

```java
// File: src/main/java/fpt/org/inblue/model/dto/response/QuestionResponse.java
@Data
@Builder
public class QuestionResponse {
    private String sessionKey;
    private boolean isFinished;
    private String phaseName;
    private Integer currentQuestionIndex;
    private Integer totalQuestionsInPhase;
    private String questionContent;
    private String questionType;  // BLUEPRINT hoặc FOLLOW_UP
}
```

#### 4.4.4 OrchestratorRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/OrchestratorRequest.java
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrchestratorRequest {
    @JsonProperty("candidate_profile")
    private CandidateProfile candidateProfile;

    @JsonProperty("job_requirement")
    private JobRequirementData jobRequirement;

    @JsonProperty("session_config")
    private SessionConfigData sessionConfig;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SessionConfigData {
        @JsonProperty("duration_minutes")
        private Integer durationMinutes;

        @JsonProperty("interview_mode")
        private InterviewEnums.InterviewMode interviewMode;

        @JsonProperty("difficulty")
        private InterviewEnums.DifficultyLevel difficulty;

        @JsonProperty("language")
        private InterviewEnums.Language language;

        @JsonProperty("domain")
        private InterviewEnums.JobDomain domain;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class JobRequirementData {
        @JsonProperty("basic_info")
        private BasicInfo basicInfo;

        @JsonProperty("competencies")
        private Competencies competencies;

        @JsonProperty("responsibilities")
        private List<String> responsibilities;

        @Data
        @Builder
        @AllArgsConstructor
        @NoArgsConstructor
        public static class BasicInfo {
            @JsonProperty("job_title")
            private String jobTitle;

            @JsonProperty("industry_domain")
            private String industryDomain;

            @JsonProperty("seniority_level")
            private String seniorityLevel;
        }

        @Data
        @Builder
        @AllArgsConstructor
        @NoArgsConstructor
        public static class Competencies {
            @JsonProperty("hard_skills")
            private List<String> hardSkills;

            @JsonProperty("tools_and_platforms")
            private List<String> toolsAndPlatforms;

            @JsonProperty("soft_skills")
            private List<String> softSkills;
        }
    }
}
```

#### 4.4.5 OrchestratorConductRequest

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/OrchestratorConductRequest.java
@Data
@Builder
public class OrchestratorConductRequest {
    @JsonProperty("current_anchor")
    private AnchorInfo currentAnchor;

    @JsonProperty("next_anchor")
    private AnchorInfo nextAnchor;

    @JsonProperty("context_history")
    private List<HistoryItem> contextHistory;

    @Data
    @Builder
    public static class AnchorInfo {
        @JsonProperty("question_text")
        private String questionText;

        @JsonProperty("phase_name")
        private String phaseName;
    }

    @Data
    @Builder
    public static class HistoryItem {
        private String role;    // "AI" hoặc "USER"
        private String content;
    }
}
```

#### 4.4.6 OrchestratorAnalysisResponse

```java
// File: src/main/java/fpt/org/inblue/model/dto/response/OrchestratorAnalysisResponse.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrchestratorAnalysisResponse {
    @JsonProperty("action")
    private AnalysisAction action;

    @JsonProperty("response_text")
    private String responseText;

    public enum AnalysisAction {
        DRILL_DOWN,         // Hỏi bồi (follow-up)
        MOVE_NEXT,         // Qua câu mới
        CLARIFY_AND_SUPPORT, // Ứng viên hỏi ngược lại AI
        FINISH             // Kết thúc sớm
    }
}
```

#### 4.4.7 GradingResponse

```java
// File: src/main/java/fpt/org/inblue/model/dto/response/GradingResponse.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingResponse {
    private Double score;     // 0-10
    private String feedback;
    private String suggestion;
}
```

---

### 4.5 InterviewEnums

```java
// File: src/main/java/fpt/org/inblue/enums/InterviewEnums.java
public class InterviewEnums {

    // Interview Mode
    public enum InterviewMode {
        STANDARD_MOCK("Phỏng vấn tiêu chuẩn", "Mô phỏng quy trình phỏng vấn thực tế..."),
        THEORY_CHECK("Dò bài lý thuyết", "Tập trung 90% vào kiến thức chuyên môn..."),
        PROJECT_DEFENSE("Bảo vệ dự án", "Tập trung 90% vào dự án trong CV...");
    }

    // Difficulty Level
    public enum DifficultyLevel {
        FRESHER_BASIC("Cơ bản", "Câu hỏi định nghĩa, khái niệm..."),
        FRESHER_ADVANCED("Nâng cao", "Câu hỏi tư duy chiến lược, xử lý tình huống...");
    }

    // Language
    public enum Language {
        VI("Tiếng Việt", "Phỏng vấn hoàn toàn bằng tiếng Việt"),
        EN("Tiếng Anh", "Phỏng vấn hoàn toàn bằng tiếng Anh");
    }

    // Job Domain
    public enum JobDomain {
        IT("Công nghệ thông tin", "Dành cho Dev, Tester, QA, DevOps..."),
        NON_IT("Kinh tế & Nghiệp vụ", "Dành cho Marketing, Sales, HR...");
    }
}
```

---

### 4.6 Services

#### 4.6.1 InterviewSessionService

```java
// File: src/main/java/fpt/org/inblue/service/InterviewSessionService.java
public interface InterviewSessionService {
    JobRequirementData getJobRequirementFromJD(String jobDescription);
    Map<String, Object> getInterviewConfigOptions();
    String createSession(InterviewSetupRequest request);
    List<InterviewSession> getAllSessionsForUser(Integer userId);
    InterviewSession getSessionById(Integer sessionId);
    InterviewSessionRedis getSessionFromCache(String sessionKey);
}
```

#### 4.6.2 InterviewSessionServiceImpl

```java
// File: src/main/java/fpt/org/inblue/service/impl/InterviewSessionServiceImpl.java
@Service
@RequiredArgsConstructor
public class InterviewSessionServiceImpl implements InterviewSessionService {

    @Override
    @Retryable(retryFor = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 3000))
    public JobRequirementData getJobRequirementFromJD(String description) {
        return ApiClient.callApi(
            PythonService.LLM,
            ApiPath.JD_API,
            HttpMethod.POST,
            new jobDescription(description),
            JobRequirementData.class
        );
    }

    @Override
    public Map<String, Object> getInterviewConfigOptions() {
        // Trả về interview_modes, difficulties, languages, domains
    }

    @Transactional
    @Override
    @Retryable(retryFor = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 3000))
    public String createSession(InterviewSetupRequest request) {
        // 1. Build payload cho Python Orchestrator
        OrchestratorRequest pythonPayload = OrchestratorRequest.builder()
            .candidateProfile(request.getCandidateProfile())
            .jobRequirement(request.getJobRequirement())
            .sessionConfig(request.getSessionConfig())
            .build();

        // 2. Gọi Python API để tạo Blueprint
        InterviewBlueprintResponse blueprint = ApiClient.callApi(
            PythonService.LLM,
            ApiPath.ORCHESTRATOR_API,
            HttpMethod.POST,
            pythonPayload,
            InterviewBlueprintResponse.class
        );

        // 3. Save xuống DB
        User user = User.builder().id(request.getUserId()).build();
        String sessionKey = UUID.randomUUID().toString();

        InterviewSession session = InterviewSession.builder()
            .user(user)
            .blueprint(blueprint)
            .sessionKey(sessionKey)
            .candidateProfile(request.getCandidateProfile())
            .jobRequirement(request.getJobRequirement())
            .sessionConfig(request.getSessionConfig())
            .mode(request.getSessionConfig().getInterviewMode())
            .domain(request.getSessionConfig().getDomain())
            .status(InterviewSession.SessionStatus.CREATED)
            .build();

        session = sessionRepository.save(session);

        // 4. Lưu vào Redis để track state
        InterviewSessionRedis sessionRedis = InterviewSessionRedis.builder()
            .id(sessionKey)
            .dbId(session.getId())
            .blueprint(blueprint)
            .currentPhaseIndex(0)
            .currentQuestionIndex(0)
            .build();

        sessionRedisRepository.save(sessionRedis);
        return sessionKey;
    }
}
```

#### 4.6.3 InterviewProcessService

```java
// File: src/main/java/fpt/org/inblue/service/InterviewProcessService.java
public interface InterviewProcessService {
    QuestionResponse getCurrentQuestion(String sessionKey);
    QuestionResponse submitAnswer(SubmitAnswerRequest request);
}
```

#### 4.6.4 InterviewProcessServiceImpl

```java
// File: src/main/java/fpt/org/inblue/service/impl/InterviewProcessServiceImpl.java
@Service
@RequiredArgsConstructor
public class InterviewProcessServiceImpl implements InterviewProcessService {

    private final InterviewSessionRedisRepository redisRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ApiClient ApiClient;
    private final ProctoringService proctoringService;

    @Override
    public QuestionResponse getCurrentQuestion(String sessionKey) {
        // 1. Lấy session từ Redis
        InterviewSessionRedis session = redisRepository.findById(sessionKey)
            .orElseThrow(() -> new RuntimeException("Session not found or expired"));

        // 2. Update status = IN_PROGRESS
        InterviewSession dbSession = sessionRepository.findById(session.getDbId())
            .orElseThrow(() -> new RuntimeException("DB Session not found"));
        dbSession.setStatus(InterviewSession.SessionStatus.IN_PROGRESS);
        sessionRepository.save(dbSession);

        // 3. Set câu hỏi đầu tiên nếu chưa có
        if (session.getCurrentQuestionText() == null) {
            var firstQ = session.getBlueprint().getBlueprint().get(0)
                .getQuestions().get(0);
            session.setCurrentQuestionText(firstQ.getQuestionText());
            session.setCurrentQuestionType(InterviewSessionRedis.QuestionType.BLUEPRINT);
            redisRepository.save(session);
        }

        return buildQuestionResponse(session);
    }

    @Override
    public QuestionResponse submitAnswer(SubmitAnswerRequest request) {
        // 1. Lấy Session
        InterviewSessionRedis session = redisRepository.findById(request.getSessionKey())
            .orElseThrow(() -> new RuntimeException("Session not found"));

        // 2. Lưu câu trả lời cũ vào chatHistory
        var currentPhase = session.getBlueprint().getBlueprint()
            .get(session.getCurrentPhaseIndex());

        var exchange = InterviewSessionRedis.InterviewExchange.builder()
            .phaseName(currentPhase.getPhaseName())
            .questionOrder(session.getCurrentQuestionIndex())
            .questionText(session.getCurrentQuestionText())
            .answerText(request.getAnswer())
            .type(session.getCurrentQuestionType())
            .submittedAt(LocalDateTime.now().toString())
            .build();

        session.getChatHistory().add(exchange);

        // 3. Chuẩn bị context & gọi AI (Python Orchestrator)
        var contextExchanges = getContextForAI(session.getChatHistory());
        var currentAnchorInfo = getCurrentAnchorInfo(session);
        var nextAnchorInfo = peekNextBlueprintQuestion(session);

        var pythonRequest = buildPythonRequest(
            currentAnchorInfo, nextAnchorInfo, contextExchanges, session
        );

        OrchestratorAnalysisResponse aiResponse = ApiClient.callApi(
            PythonService.LLM,
            ApiPath.ANALYZER_API,
            HttpMethod.POST,
            pythonRequest,
            OrchestratorAnalysisResponse.class
        );

        // 4. Xử lý response AI
        if (aiResponse.getAction() == OrchestratorAnalysisResponse.AnalysisAction.DRILL_DOWN
            || aiResponse.getAction() == OrchestratorAnalysisResponse.AnalysisAction.CLARIFY_AND_SUPPORT) {
            // Hỏi bồi -> cập nhật question text, type = FOLLOW_UP
            session.setCurrentQuestionType(InterviewSessionRedis.QuestionType.FOLLOW_UP);
            session.setCurrentQuestionText(aiResponse.getResponseText());
        } else {
            // Qua câu mới hoặc kết thúc
            if (nextAnchorInfo == null) {
                finishSession(session, request.getSessionKey());
                return QuestionResponse.builder()
                    .isFinished(true)
                    .sessionKey(session.getId())
                    .questionContent("Cảm ơn bạn đã hoàn thành buổi phỏng vấn!")
                    .build();
            }

            session.setCurrentPhaseIndex(nextAnchorInfo.getPhaseIndex());
            session.setCurrentQuestionIndex(nextAnchorInfo.getQuestionIndex());
            session.setCurrentQuestionType(InterviewSessionRedis.QuestionType.BLUEPRINT);
            session.setCurrentQuestionText(aiResponse.getResponseText());
        }

        redisRepository.save(session);
        return buildQuestionResponse(session);
    }

    private void finishSession(InterviewSessionRedis redisSession, String sessionKey) {
        // 1. Thu hoạch behavior từ Proctoring
        Map<Integer, List<String>> behaviorMap =
            proctoringService.getAndClearBehavioralRecord(redisSession.getId());

        // 2. Chấm điểm toàn bộ history
        List<InterviewResultDetail.QAResult> gradedHistory =
            gradeAndMapFullHistory(redisSession.getChatHistory(), behaviorMap);

        // 3. Tính điểm trung bình
        double avgScore = gradedHistory.stream()
            .filter(r -> r.getScore() != null)
            .mapToDouble(InterviewResultDetail.QAResult::getScore)
            .average().orElse(0.0);

        // 4. Lưu kết quả
        InterviewResultDetail resultDetail = InterviewResultDetail.builder()
            .history(gradedHistory)
            .aiOverviewFeedback("Đã chấm điểm xong.")
            .build();

        dbSession.setResultDetail(resultDetail);
        dbSession.setOverallScore(avgScore);
        dbSession.setStatus(InterviewSession.SessionStatus.COMPLETED);
        dbSession.setResult(determineEvaluationResult(avgScore));
        dbSession.setCompletedAt(LocalDateTime.now());

        sessionRepository.save(dbSession);
        redisRepository.delete(redisSession);
    }

    private InterviewSession.EvaluationResult determineEvaluationResult(double overallScore) {
        if (overallScore >= 9.0) return InterviewSession.EvaluationResult.STRONG_HIRE;
        else if (overallScore >= 7.0) return InterviewSession.EvaluationResult.HIRE;
        else if (overallScore >= 5.0) return InterviewSession.EvaluationResult.CONSIDER;
        else return InterviewSession.EvaluationResult.REJECT;
    }
}
```

---

### 4.7 Luồng AI Interview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LUỒNG AI INTERVIEW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. CHUẨN BỊ (Frontend gọi 2 API song song)
   │
   ├─ GET /api/interview-sessions/config-options
   │  └─> Lấy danh sách modes, difficulties, languages, domains cho UI
   │
   └─ POST /api/interview-sessions/generate-job-requirement
      └─> Parse JD text thành structured data (JobRequirementData)

2. TẠO SESSION
   │
   ├─ POST /api/interview-sessions/create-session
   │  Body: {
   │    "user_id": 1,
   │    "candidate_profile": {...},    // Đã parse từ CV
   │    "job_requirement": {...},       // Từ bước 1
   │    "session_config": {
   │      "duration_minutes": 45,
   │      "interview_mode": "STANDARD_MOCK",
   │      "difficulty": "FRESHER_ADVANCED",
   │      "language": "VI",
   │      "domain": "IT"
   │    }
   │  }
   │
   │  XỬ LÝ:
   │  ├─ Gọi Python API (/api/v1/orchestrator/create-plan)
   │  │  └─> Nhận về InterviewBlueprintResponse
   │  ├─ Lưu InterviewSession xuống DB
   │  ├─ Lưu InterviewSessionRedis vào Redis (TTL 2h)
   │  └─ Trả về sessionKey (UUID)
   │
3. BẮT ĐẦU/KHÔI PHỤC INTERVIEW
   │
   ├─ GET /api/v1/interview/start/{sessionKey}
   │  XỬ LÝ:
   │  ├─ Lấy session từ Redis
   │  ├─ Update status = IN_PROGRESS (DB)
   │  ├─ Set câu hỏi đầu tiên nếu chưa có
   │  └─ Trả về QuestionResponse
   │
4. VÒNG LẶP TRẢ LỜI-CÂU HỎI
   │
   ├─ POST /api/v1/interview/submit
   │  Body: {
   │    "sessionKey": "uuid",
   │    "answer": "Câu trả lời của ứng viên"
   │  }
   │
   │  XỬ LÝ:
   │  ├─ Lưu câu hỏi + câu trả lời vào chatHistory
   │  ├─ Lấy context (3-5 câu hỏi gần nhất)
   │  ├─ Gọi Python API (/api/v1/orchestrator/analyze-response)
   │  │  Request: { currentAnchor, nextAnchor, contextHistory }
   │  │  Response: { action: DRILL_DOWN|MOVE_NEXT|FINISH, response_text: "..." }
   │  │
   │  ├─ Xử lý response:
   │  │  ├─ DRILL_DOWN: Hỏi bồi (FOLLOW_UP)
   │  │  ├─ CLARIFY_AND_SUPPORT: Ứng viên hỏi lại
   │  │  ├─ MOVE_NEXT: Qua câu mới (BLUEPRINT)
   │  │  └─ FINISH: Kết thúc
   │  │
   │  └─ Trả về QuestionResponse
   │
5. KẾT THÚC INTERVIEW
   │
   ├─ Khi Python trả về FINISH hoặc hết câu hỏi
   │
   ├─ Gọi Python API (/api/v1/orchestrator/grade-answer)
   │  └─> Nhận GradingResponse { score, feedback, suggestion }
   │
   ├─ Xử lý kết quả:
   │  ├─ gradeAndMapFullHistory() - Chấm điểm từng nhóm câu hỏi
   │  ├─ Tính avgScore
   │  ├─ Determine EvaluationResult (STRONG_HIRE/HIRE/CONSIDER/REJECT)
   │  ├─ Lưu InterviewResultDetail vào DB
   │  └─ Xóa session khỏi Redis
   │
   └─ Response: { isFinished: true, questionContent: "Cảm ơn bạn..." }

6. LẤY KẾT QUẢ
   │
   ├─ GET /api/interview-sessions/{sessionId}
   │  └─> Trả về InterviewSession với resultDetail
   │
   └─ GET /api/interview-sessions/user/{userId}
      └─> Trả về tất cả sessions của user
```

---

## 5. API Paths (External Services)

```java
// File: src/main/java/fpt/org/inblue/constants/ApiPath.java
public class ApiPath {
    public static final String CV_API = "/api/v1/parse-cv";
    public static final String JD_API = "/api/v1/parse-jd";
    public static final String ORCHESTRATOR_API = "/api/v1/orchestrator/create-plan";
    public static final String ANALYZER_API = "/api/v1/orchestrator/analyze-response";
    public static final String GRADING_API = "/api/v1/orchestrator/grade-answer";
    public static final String OVERVIEW_FEEDBACK_API = "/api/v1/orchestrator/generate-overview";
    public static final String PROCTORING_SNAPSHOT_API = "/api/v1/proctoring/snapshot";
    public static final String GENERATE_PRACTICE_SET_API = "/api/v1/report/generate-practice";
    public static final String GENERATE_QUIZ_ITEM_API = "/api/v1/report/generate-quiz";
}
```

---

## 6. Round Model (Cấu hình vòng thi)

```java
// File: src/main/java/fpt/org/inblue/model/Round.java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Round {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Integer roundOrder;

    @Enumerated(EnumType.STRING)
    private RoundType roundType;

    @Column(name = "pass_threshold")
    private Double passThreshold;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private RoundConfig configData;

    @Column(name = "reviewer_id")
    private Integer reviewerId;

    @Builder.Default
    Boolean isDeleted = false;

    private Boolean isAuto = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class RoundConfig {
        private String instruction;
        private String submissionFormat;
        private Integer timeLimitMinutes;
        private Integer maxScore;
        private String aiSystemPrompt;
        private String evaluationCriteria;

        // Vòng Quiz
        private List<QuizQuestion> quizQuestions;

        // Vòng Coding
        private List<CodingProblemSnapshot> codingProblems;

        // Vòng Code Review
        private List<CodeReviewProblemSnapshot> codeReviewProblems;

        // Vòng Mentor Interview
        private MentorInterviewDto mentorInterview;
    }

    @Data
    @Builder
    public static class MentorInterviewDto {
        private Integer userId;
        private Integer mentorId;
        private Integer duration;
        private Integer totalPrice;
    }

    @Data
    @Builder
    public static class CodeReviewProblemSnapshot {
        private Long problemId;
        private String title;
        private CodingProblem.Difficulty difficulty;
        private String language;
        private String problemStatement;
        private List<CodeReviewProblem.CodeFile> files;
        private List<CodeReviewProblem.ExpectedIssue> expectedIssues;
    }
}
```

---

## 7. Application Model

```java
// File: src/main/java/fpt/org/inblue/model/Application.java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int userId;
    private Long jdId;

    @Builder.Default
    private Integer currentRoundOrder = 1;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.IN_PROGRESS;

    @Column(name = "overall_score")
    private Double overallScore = -1.0;

    @Builder.Default
    Boolean isDeleted = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

public enum ApplicationStatus {
    IN_PROGRESS,
    COMPLETED,
    REJECTED
}
```

---

## 8. Setup JD Rounds Request

```java
// File: src/main/java/fpt/org/inblue/model/dto/request/SetupJdRoundsRequest.java
@Data
public class SetupJdRoundsRequest {
    @NotEmpty(message = "Phải có ít nhất 1 vòng phỏng vấn")
    @Valid
    private List<RoundItemDto> rounds;

    @Data
    public static class RoundItemDto {
        @NotBlank(message = "Tên vòng không được để trống")
        private String name;

        @NotNull(message = "Thứ tự vòng là bắt buộc")
        @Min(value = 1, message = "Thứ tự vòng phải bắt đầu từ 1")
        private Integer roundOrder;

        @NotNull(message = "Loại vòng là bắt buộc")
        private RoundType roundType;

        @NotNull(message = "Điểm sàn không được để trống")
        @Min(0)
        private Double passThreshold;

        private Integer reviewerId;

        @NotNull(message = "Cấu hình vòng không được thiếu")
        @Valid
        private RoundConfigDto configData;
    }

    @Data
    public static class RoundConfigDto {
        private String instruction;
        private String submissionFormat;
        private Integer timeLimitMinutes;
        private Integer maxScore;
        private String aiSystemPrompt;
        private String evaluationCriteria;
        private List<QuizQuestionDto> quizQuestions;
        private List<Long> codingProblemsId;
        private Round.MentorInterviewDto mentorInterview;
    }
}
```

---

## 9. RoundController Endpoints

```java
// File: src/main/java/fpt/org/inblue/controller/RoundController.java
@RestController
@RequestMapping("/api/rounds")
@RequiredArgsConstructor
public class RoundController {

    // Thiết lập các vòng phỏng vấn cho JD
    @PutMapping("/jd/{jdId}")
    public ResponseEntity<List<Round>> setUpRoundForJd(
        @PathVariable Long jdId,
        @RequestBody SetupJdRoundsRequest request
    ) {
        List<Round> rounds = roundService.setUpRoundForJd(jdId, request);
        return ResponseEntity.ok(rounds);
    }

    // Lấy tất cả RoundTypes
    @GetMapping
    public List<RoundType> getAllRoundTypes() {
        return roundService.getAllRoundTypes();
    }

    // Cập nhật các vòng phỏng vấn cho JD
    @PutMapping("/jd/{jdId}/update")
    public ResponseEntity<List<Round>> updateRoundForJd(
        @PathVariable Long jdId,
        @RequestBody UpdateJdRoundRequest request
    ) {
        List<Round> rounds = roundService.updateRoundForJd(jdId, request);
        return ResponseEntity.ok(rounds);
    }

    // Sinh câu hỏi whiteboard
    @PostMapping("/generate-whiteboard-question")
    public WhiteboardQuestionDto generateQuestion(@RequestBody String hrIdea) {
        return apiClient.sendChatToAnythingLlm(
            CODING_GEN,
            "Tạo đề bài lập trình với yêu cầu sau: " + hrIdea,
            "Java - Backend",
            true,
            null,
            WhiteboardQuestionDto.class
        );
    }

    // Lấy round hiện tại của application
    @GetMapping("/find-by-application-order/{applicationId}")
    public ResponseEntity<Round> findByApplicationOrder(@PathVariable Long applicationId) {
        Round rounds = roundService.getRoundByOrder(applicationId);
        return ResponseEntity.ok(rounds);
    }
}
```

---

## 10. Tổng hợp tất cả endpoints

### Code Review

| Method | Endpoint                                        | Mô tả                      |
| ------ | ----------------------------------------------- | -------------------------- |
| GET    | `/api/code-review-problems`                     | Lấy tất cả bài Code Review |
| GET    | `/api/code-review-problems/{id}`                | Lấy bài theo ID            |
| POST   | `/api/code-review-problems`                     | Tạo mới bài Code Review    |
| POST   | `/api/code-review-problems/generate`            | AI sinh đề                 |
| POST   | `/api/application-details/code-review/evaluate` | Chấm bài Code Review       |
| POST   | `/api/application-details/submit`               | Nộp bài (multipart)        |

### Mentor Review

| Method | Endpoint                         | Mô tả                      |
| ------ | -------------------------------- | -------------------------- |
| GET    | `/api/mentor-reviews`            | Lấy tất cả reviews         |
| POST   | `/api/mentor-reviews`            | Tạo review mới             |
| PUT    | `/api/mentor-reviews`            | Cập nhật review            |
| GET    | `/api/mentor-reviews/{id}`       | Lấy review theo session ID |
| POST   | `/api/sessions/create-session`   | Tạo session với mentor     |
| POST   | `/api/sessions/join-session`     | Ghi nhận tham gia          |
| POST   | `/api/sessions/webhooks/dailyco` | Webhook Daily.co           |
| GET    | `/api/sessions/update-status`    | Cập nhật trạng thái        |

### AI Interview

| Method | Endpoint                                           | Mô tả                    |
| ------ | -------------------------------------------------- | ------------------------ |
| POST   | `/api/interview-sessions/create-session`           | Tạo AI Interview session |
| GET    | `/api/interview-sessions/config-options`           | Lấy options cho UI       |
| POST   | `/api/interview-sessions/generate-job-requirement` | Parse JD                 |
| GET    | `/api/interview-sessions/user/{userId}`            | Lấy sessions của user    |
| GET    | `/api/interview-sessions/cache/{sessionKey}`       | Lấy từ Redis             |
| GET    | `/api/interview-sessions/{sessionId}`              | Lấy session từ DB        |
| GET    | `/api/v1/interview/start/{sessionKey}`             | Bắt đầu/Khôi phục        |
| POST   | `/api/v1/interview/submit`                         | Gửi câu trả lời          |

### Application & Round

| Method | Endpoint                                               | Mô tả                              |
| ------ | ------------------------------------------------------ | ---------------------------------- |
| POST   | `/api/applications`                                    | Tạo application mới                |
| GET    | `/api/applications`                                    | Lấy tất cả applications            |
| GET    | `/api/applications/{id}`                               | Lấy application theo ID            |
| GET    | `/api/applications/me`                                 | Lấy applications của user hiện tại |
| GET    | `/api/application-details/{id}`                        | Lấy detail theo ID                 |
| GET    | `/api/application-details/application/{applicationId}` | Lấy details của application        |
| POST   | `/api/application-details/hr-score`                    | HR chấm điểm                       |
| GET    | `/api/application-details/reviewer`                    | Lấy danh sách cần review           |
| PUT    | `/api/rounds/jd/{jdId}`                                | Thiết lập rounds cho JD            |
| PUT    | `/api/rounds/jd/{jdId}/update`                         | Cập nhật rounds cho JD             |
| GET    | `/api/rounds`                                          | Lấy tất cả RoundTypes              |

---

## 11. Database Tables Summary

| Table                     | Description                             |
| ------------------------- | --------------------------------------- |
| `interview_session`       | Lưu AI Interview sessions               |
| `interview_session_redis` | Cache Redis cho session state           |
| `application`             | Ứng tuyển của ứng viên                  |
| `application_detail`      | Chi tiết bài nộp từng vòng              |
| `round`                   | Cấu hình vòng thi                       |
| `code_review_problem`     | Bài Code Review                         |
| `mentor_review`           | Review của ứng viên về mentor           |
| `session`                 | Session phỏng vấn với mentor (Daily.co) |

---

## 12. Redis Keys

| Key Pattern                     | TTL     | Description                           |
| ------------------------------- | ------- | ------------------------------------- |
| `InterviewSession:{sessionKey}` | 2 hours | Lưu trạng thái interview đang diễn ra |

---

## 13. Evaluation Logic

### Code Review Scoring

- AI chấm điểm dựa trên các metrics:
  - Bug Detection
  - Security Awareness
  - Performance Analysis
  - Code Smell Detection
  - Solution Quality
  - Clean Code Awareness
  - Strength/Weakness/Comment
- Pass threshold: configured per round (default 7.0)

### AI Interview Scoring

- Score range: 0.0 - 10.0
- Evaluation thresholds:
  - STRONG_HIRE: >= 9.0
  - HIRE: >= 7.0
  - CONSIDER: >= 5.0
  - REJECT: < 5.0

### Mentor Review Rating

- Rating: 1-5 sao (Không ảnh hưởng kết quả ứng tuyển)
- Đánh giá theo mô hình STAR:
  - Situation: Tình huống
  - Task: Nhiệm vụ
  - Action: Hành động
  - Result: Kết quả

---

## 14. External Services

| Service          | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| AnythingLLM      | AI cho CV, Email, Code Review analysis                      |
| Python LLM       | AI cho JD parsing, Blueprint generation, Interview analysis |
| Daily.co         | Video conferencing cho Mentor Interview                     |
| PayOS            | Payment gateway                                             |
| Cloudinary       | File upload storage                                         |
| Redis            | Session caching                                             |
| Compiler Sandbox | Code execution & testing                                    |

---

> **Tài liệu được generate tự động từ source code Java Spring Boot**
>
> **Last Updated:** 2026-07-02
