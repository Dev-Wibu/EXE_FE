# Kiểm Tra Chất Lượng Mã Nguồn (Code Quality Audit) — Các Vấn Đề Trọng Tâm

## 1. File rác, Code thừa, Import không sử dụng (Dead Code & Unused Files)

- **Mô tả chi tiết:** Đây là những đoạn mã hoặc tệp tin tồn tại trong source code nhưng hoàn toàn bị cô lập, không đóng góp vào luồng chạy thực tế của ứng dụng. Việc giữ lại chúng làm tăng dung lượng dự án, gây nhiễu loạn khi tìm kiếm và làm giảm tốc độ build.
- **Tiêu chí để AI nhận diện:**
  - File `.ts`, `.tsx`, `.js`, `.css` không được `import` ở bất kỳ file nào khác trong toàn bộ dự án (ngoại trừ các file config ở root, hoặc file entry point như `index.tsx`, `main.tsx`).
  - Các biến (variables), hàm (functions), hoặc component đã được khai báo/export nhưng không có lời gọi (call) nào tới chúng.
  - Những khối code lớn bị comment out (vô hiệu hóa bằng `//` hoặc `/* */`) thay vì bị xóa đi.
  - Các thư viện (packages) có trong `package.json` nhưng không được `import` ở bất kỳ đâu trong thư mục `src`.
  - Các file không còn được sử dụng nhưng vẫn tồn tại trong thư mục `src` (ví dụ: file test cũ, file component đã bị refactor bỏ đi nhưng chưa xóa, file trang edit info cũ,.v.v).
- **Phát hiện:** Quét cây phụ thuộc (dependency tree), phân tích AST (Abstract Syntax Tree), rà soát các khối code bị comment.
- **Các file cụ thể là:**

## 2. Vi phạm nguyên tắc DRY (Lặp code UI & Logic - Code Duplication)

- **Mô tả chi tiết:** Tình trạng "Copy-Paste Driven Development", nơi các đoạn code xử lý logic giống hệt nhau hoặc các cấu trúc UI tương tự nhau bị lặp lại ở nhiều file khác nhau thay vì được đóng gói thành các module có thể tái sử dụng. Điều này khiến việc bảo trì trở thành thảm họa vì khi cần sửa một lỗi, lập trình viên phải sửa ở hàng chục nơi khác nhau.
- **Tiêu chí để AI nhận diện:**
  - **Lặp Logic:** Các file khác nhau có cùng một chuỗi các hook `useState`, `useEffect` để fetch cùng một loại data, hoặc có chung các hàm format dữ liệu (ngày tháng, tiền tệ, validation form). Cần được gom thành Custom Hook hoặc Utils function.
  - **Lặp UI:** Các khối JSX (HTML) dài có cấu trúc thẻ lồng nhau giống hệt nhau (ví dụ: các thẻ Card, Button, Modal, Sidebar,.v.v) chỉ khác vài dòng text hoặc tham số. Cần được gom thành Shared Component.
- **Phát hiện:** Tìm kiếm các chuỗi mã nguồn trùng lặp (code clones), phân tích cấu trúc JSX tương đồng giữa các file component.
- **Các file/đoạn code cụ thể là:**

## 3. File quá dài, "God Component" (Trên 500 dòng code)

- **Mô tả chi tiết:** File vi phạm nghiêm trọng nguyên tắc "Đơn trách nhiệm" (Single Responsibility Principle). Một file nhồi nhét quá nhiều công việc: khai báo type/interface, xử lý logic gọi API phức tạp, quản lý hàng tá state nội bộ, và render một cây DOM (JSX) khổng lồ lồng nhau nhiều cấp. Những file này cực kỳ khó đọc, khó viết test và rất dễ sinh bug khi có thay đổi.
- **Tiêu chí để AI nhận diện:**
  - File vượt quá **500 dòng code** (Lines of Code - LOC).
  - Có sự xuất hiện của quá nhiều React Hooks (ví dụ: > 7 `useState`, nhiều `useEffect` phức tạp) trong cùng một component.
  - Định nghĩa nhiều hơn 2 Component phức tạp bên trong cùng một file (thay vì tách file riêng).
  - Khối `return (...)` chứa cấu trúc JSX lồng sâu (deep nesting) quá 5-6 cấp.
- **Phát hiện:** Đếm số dòng code tự động, đếm số lượng hooks/functions được khai báo trong một component.
- **Các file cụ thể là:**

## 4. Tên file sai lệch với chức năng (Mismatched Naming & Purpose)

- **Mô tả chi tiết:** Việc đặt tên file không phản ánh đúng ngữ nghĩa và chức năng thực tế của mã nguồn bên trong. Điều này gây hiểu lầm nghiêm trọng cho các lập trình viên khác khi họ đọc cấu trúc thư mục hoặc tìm kiếm file.
- **Tiêu chí để AI nhận diện:**
  - **Sai lệch logic:** Phân tích logic nghiệp vụ bên trong và đối chiếu với tên file. Ví dụ: Tên file là `UserPayment.tsx` (ngụ ý thanh toán) nhưng code bên trong lại chủ yếu là gọi API `/api/users/update-profile` và render form đổi tên, đổi mật khẩu.
  - **Sai lệch Export:** Tên file là `Navbar.tsx` nhưng component được `export default` bên trong lại tên là `SidebarComponent`.
  - **Chứa code không liên quan:** Một file có tên `utils/formatDate.ts` nhưng lại chứa cả hàm tính toán giỏ hàng hoặc validate email.
- **Phát hiện:** AI cần đối chiếu ngữ nghĩa (semantic) của tên file với: (1) Tên component được export, (2) Các endpoint API được gọi bên trong, (3) Các từ khóa text được render ra UI.
- **Các file cụ thể là:**

## 5. File nằm sai thư mục (Misplaced Files)

- **Mô tả chi tiết:** File được đặt trong một thư mục không phù hợp với chức năng hoặc loại của nó. Điều này làm rối loạn cấu trúc dự án, khiến việc tìm kiếm và bảo trì trở nên khó khăn.
- **Tiêu chí để AI nhận diện:**
  - File component UI nhưng lại nằm trong thư mục `utils` hoặc `hooks`.
  - File chứa logic gọi API nhưng lại nằm trong thư mục `components`.
  - File test nhưng lại nằm trong thư mục `pages` hoặc `components`.
  - File có tên gợi ý về một loại chức năng (ví dụ: `UserProfile.tsx`) nhưng lại nằm trong thư mục của một loại chức năng khác (ví dụ: `AdminDashboard`).
  - File có chức năng hiển thị ở trang người dùng nhưng lại nằm trong thư mục dành cho mentor, hoặc ngược lại (ví dụ: `src/pages/Mentor/MentorDashboard/MentorDashboardPage.tsx` nhưng lại chứa code/file hiển thị thông tin người dùng).
- **Phát hiện:** AI cần phân tích tên file và nội dung bên trong để đối chiếu với cấu trúc thư mục chuẩn của dự án (ví dụ: `src/components`, `src/hooks`, `src/utils`, `src/pages`).
- **Các file cụ thể là:**

## 6. Không thống nhất quy ước đặt tên file (Naming Convention Inconsistency)

- **Mô tả chi tiết:** Sự hỗn loạn trong cách đặt tên file giữa các thành viên trong đội ngũ hoặc giữa các giai đoạn phát triển. Việc trộn lẫn giữa camelCase, kebab-case, hoặc PascalCase cho cùng một loại file (ví dụ: file hooks hoặc utils) làm giảm tính đồng bộ và chuyên nghiệp của dự án.
- **Tiêu chí để AI nhận diện:**
  - Thư mục `src/hooks`: Có file dùng `camelCase` (ví dụ: `useMentorFeedback.ts`) nhưng lại có file dùng `kebab-case` (ví dụ: `use-tabs-state.ts`). Quy chuẩn bắt buộc đối với Custom Hook là `camelCase` và bắt đầu bằng từ `use`.
  - Thư mục `src/utils` hoặc `src/lib`: Trộn lẫn giữa `camelCase` (`formatDate.ts`) và `kebab-case` (`speech-synthesis.utils.ts`). Quy chuẩn nên thống nhất dùng `kebab-case` cho helper/util.
  - Thư mục `src/components`: File chứa React Component không viết theo dạng `PascalCase` (ví dụ: `userCard.tsx` thay vì `UserCard.tsx`).
- **Phát hiện:** Kiểm tra định dạng chuỗi (Regex matching) của tên file dựa trên sơ đồ phân cấp thư mục để phát hiện các file "lệch pha".
- **Các file cụ thể là:**

## 7. Bỏ qua Tối ưu Hiệu năng & Re-render vô tội vạ (Performance & Memory Leaks)

- **Mô tả chi tiết:** Viết code không kiểm soát khiến component bị render lại liên tục không cần thiết, hoặc không dọn dẹp các tác vụ bất đồng bộ, dẫn đến tràn bộ nhớ (Memory Leak) và làm ứng dụng bị giật lag khi sử dụng lâu.
- **Tiêu chí để AI nhận diện:**
  - Sử dụng chỉ số mảng (`index`) làm thuộc tính `key` khi render danh sách động (vòng lặp `.map()` có thêm/xóa/sắp xếp phần tử).
  - Khai báo các hàm xử lý logic nặng hoặc các object/array thô ngay bên trong thân component và truyền xuống component con mà không bọc trong `useMemo` hoặc `useCallback`.
  - Trong hook `useEffect`, sử dụng `setInterval`, `addEventListener`, hoặc `subscribers` nhưng không viết hàm `return () => { ... }` để cleanup (hủy bỏ) khi component bị unmount.
- **Phát hiện:** Kiểm tra mảng dependency của hooks, phát hiện cú pháp render loop và các hàm lắng nghe sự kiện thiếu khối cleanup.
- **Các file/đoạn code cụ thể là:**

## 8. Xử lý bất đồng bộ thiếu an toàn & Nuốt lỗi (Poor Async Handling & Fragile Logic)

- **Mô tả chi tiết:** Gọi API hoặc xử lý các tác vụ bất đồng bộ (Promise) nhưng "quên" không bắt lỗi (`try-catch` hoặc `.catch()`), không quản lý trạng thái loading/error, hoặc truy cập trực tiếp vào các thuộc tính sâu của object trả về từ API mà không kiểm tra dữ liệu có tồn tại hay không (gây ra lỗi crash ứng dụng `Cannot read properties of undefined`).
- **Tiêu chí để AI nhận diện:**
  - Các hàm `async/await` gọi API từ backend nhưng không được bọc trong khối `try { ... } catch (error) { ... }`.
  - Dữ liệu trả về từ API được sử dụng trực tiếp theo kiểu `data.user.profile.avatar` thay vì sử dụng Optional Chaining (`data?.user?.profile?.avatar`) hoặc có giá trị fallback mặc định.
  - Thiếu biến state kiểm soát trạng thái giao diện khi API đang chạy (`isLoading`), dẫn đến việc người dùng có thể bấm click liên tục vào một nút gửi form.
- **Phát hiện:** Phân tích cú pháp các hàm `async`, các lệnh gọi Promise và kiểm tra độ an toàn của việc truy cập thuộc tính object (Object property access analysis).
- **Các file/đoạn code cụ thể là:**

## 9. Cạnh tranh dữ liệu do Thiếu kiểm soát luồng Bất đồng bộ (Race Conditions in Data Fetching)

- **Mô tả chi tiết:** Xảy ra khi thao tác người dùng quá nhanh (gõ thanh tìm kiếm liên tục, chuyển đổi tab nhanh chóng) kích hoạt hàng loạt API call. API gọi sau có thể hoàn thành trước API gọi trước, dẫn đến giao diện cập nhật sai dữ liệu cuối cùng. Lỗi do dev quên cơ chế hủy (abort) các request đã hết hạn.
- **Tiêu chí để AI nhận diện:**
  - Gọi `fetch` hoặc `axios` bên trong `useEffect` khi `dependency` thay đổi liên tục, nhưng không tích hợp `AbortController` để hủy request nếu component bị unmount hoặc chạy lại effect.
  - Không có cờ (flag) kiểu `let ignore = false` bên trong hàm async nội bộ của hooks để ngăn chặn việc set State khi request đã "ôi thiu".
- **Phát hiện:** Phân tích logic gọi API bên trong hooks/effects, tìm kiếm sự thiếu vắng của cơ chế cleanup block (`return () => {...}`) hoặc `AbortSignal`.
- **Các file cụ thể là:**

## 10. Lạm dụng useEffect để đồng bộ State thay vì tính toán trực tiếp (Derived State Abuse)

- **Mô tả chi tiết:** Đây là một trong những lỗi kinh điển nhất được tài liệu chính thức của React cảnh báo liên tục. Dev thường có thói quen tạo ra một state mới, rồi dùng `useEffect` chỉ để "lắng nghe" một state khác thay đổi để cập nhật theo. Điều này tạo ra chuỗi re-render kép (render hai lần liên tiếp), làm chậm ứng dụng và rất dễ sinh bug vòng lặp vô tận.
- **Tiêu chí để AI nhận diện:**
  - Xuất hiện một cặp `useState` và `useEffect` hoạt động theo kiểu: Cứ hễ `stateA` đổi thì `useEffect` chạy để gọi `setStateB(tính_toán_từ_stateA)`.
  - Cách xử lý đúng: Bỏ hoàn toàn `stateB` và `useEffect` đó đi. Thay vào đó, tạo một biến thông thường được tính toán trực tiếp (Derived State) ngay trong thân component trong mỗi lần render: `const dataB = tinhToan(stateA)`. Chỉ bọc trong `useMemo` nếu phép tính đó cực kỳ nặng.
- **Phát hiện:** Rà soát các `useEffect` có dependency chứa state, và bên trong chỉ có duy nhất logic cập nhật một local state khác.
- **Các file/đoạn code cụ thể là:**

# Kế hoạch tham khảo
