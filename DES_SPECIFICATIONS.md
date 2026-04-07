# Giải thích các Thành phần Kỹ thuật trong Thuật toán DES

Các hằng số và bảng hoán vị trong mã nguồn chính là "bộ xương" và "quy tắc trò chơi" của thuật toán DES (Data Encryption Standard). Trong mật mã học, chúng được gọi là các **Bảng tra cứu (Lookup Tables)** hoặc **Bảng hoán vị (Permutation Tables)**.

Chúng không phải là dữ liệu ngẫu nhiên, mà là các hằng số tiêu chuẩn quốc tế được thiết kế để gây xáo trộn dữ liệu một cách khoa học. Dưới đây là ý nghĩa cụ thể của từng bảng:

## 1. IP & FP (Cổng vào và Cổng ra)
*   **IP (Initial Permutation):** Đây là bước đầu tiên. Nó xáo trộn 64 bit dữ liệu đầu vào theo một thứ tự mới. Giống như việc bạn xáo bài trước khi chia.
*   **FP (Final Permutation):** Là bước cuối cùng, nó là phép nghịch đảo của IP. Nó đưa các bit đã bị xáo trộn qua 16 vòng lặp về lại định dạng chuẩn để xuất ra bản mã.

## 2. E (Bảng mở rộng)
*   **Expansion Table:** Trong mỗi vòng lặp, thuật toán cần biến 32 bit thành 48 bit để XOR với khóa. Bảng này quy định bit nào sẽ được giữ nguyên và bit nào sẽ được nhân bản để tăng từ 32 lên 48.

## 3. P (Hoán vị P)
*   **Permutation P:** Sau khi dữ liệu đi qua các hộp S (S-Boxes), nó sẽ được xáo trộn một lần nữa bằng bảng P này trước khi kết thúc một vòng lặp. Việc này đảm bảo các bit đầu ra của hộp S này sẽ ảnh hưởng đến các hộp S khác nhau ở vòng kế tiếp (Lan truyền lỗi - Avalanche effect).

## 4. S_BOXES (Trái tim của độ bảo mật)
*   Đây là phần quan trọng nhất. DES là một thuật toán tuyến tính, nhưng các Hộp S này là các **hàm phi tuyến**.
*   Nó nhận vào 6 bit và trả về 4 bit. Việc thay thế này cực kỳ phức tạp và là lý do khiến người ta không thể dùng toán học đơn giản để "giải ngược" mã mà không có khóa.

## 5. PC1 & PC2 (Thợ rèn khóa)
*   **PC1 (Permuted Choice 1):** Dùng để chọn ra 56 bit thực sự có ích từ 64 bit của khóa chính (8 bit còn lại thường dùng để kiểm tra lỗi - parity bits).
*   **PC2 (Permuted Choice 2):** Từ 56 bit sau khi dịch chuyển, bảng này chọn ra 48 bit để tạo thành một "khóa con" (subkey) cho mỗi vòng trong số 16 vòng lặp.

---

> **Tóm lại:** Nếu thiếu những bảng này, thuật toán DES chỉ là những phép cộng trừ bit đơn giản. Nhờ có chúng, dữ liệu của bạn bị "băm" và "xáo" đến mức không thể nhận diện được nếu không có đúng chìa khóa để thực hiện ngược lại các quy tắc này.
