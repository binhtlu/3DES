# Quy trình Xử lý Mật mã trong 3DES Lab Suite

Tài liệu này chi tiết hóa luồng dữ liệu và các hàm tương ứng được sử dụng trong hệ thống mô phỏng 3DES.

## 1. Luồng Mã hóa Triple DES (Encryption Flow)

Luồng này chuyển đổi văn bản thuần (Plaintext) thành bản mã (Ciphertext) dạng Hex.

| Bước | Hoạt động | Hàm sử dụng | Tệp nguồn |
|:--- |:--- |:--- |:--- |
| **B1** | Tiếp nhận văn bản và thêm Padding PKCS7 | `prepareInput(text)` | `utils/encryption.js` |
| **B2** | Chia khóa chính 24-byte thành 3 khóa con (K1, K2, K3) | `hexToBits(keyHex)` | `utils/encryption.js` |
| **B3** | Tạo 16 tập khóa vòng cho mỗi khóa con K1, K2, K3 | `generateSubkeys(key64)` | `utils/encryption.js` |
| **B4** | **Chu trình Triple DES** | `tripleDES(block, keys)` | `utils/encryption.js` |
| | - Bước A: Mã hóa DES với K1 | `desProcess(block, K1_16, 'encrypt')` | `utils/encryption.js` |
| | - Bước B: Giải mã DES với K2 | `desProcess(stepA, K2_16, 'decrypt')` | `utils/encryption.js` |
| | - Bước C: Mã hóa DES với K3 | `desProcess(stepB, K3_16, 'encrypt')` | `utils/encryption.js` |
| **B5** | Chuyển đổi bit kết quả sang chuỗi Hex | `bitsToHex(final)` | `utils/encryption.js` |

---

## 2. Luồng Giải mã Triple DES (Decryption Flow)

Luồng này khôi phục văn bản gốc từ chuỗi Hex.

| Bước | Hoạt động | Hàm sử dụng | Tệp nguồn |
|:--- |:--- |:--- |:--- |
| **B1** | Chuyển chuỗi Hex đầu vào thành mảng bit | `hexToBits(hexStr)` | `utils/encryption.js` |
| **B2** | Khởi tạo lại các khóa K1, K2, K3 và khóa vòng | `generateSubkeys(key64)` | `utils/encryption.js` |
| **B3** | **Chu trình Giải mã 3DES** (Đảo ngược quy trình mã hóa) | `tripleDESDecrypt(block, keys)` | `utils/decode.js` |
| | - Bước A: Giải mã DES với K3 | `desProcess(block, K3_16, 'decrypt')` | `utils/encryption.js` |
| | - Bước B: Mã hóa DES với K2 | `desProcess(stepA, K2_16, 'encrypt')` | `utils/encryption.js` |
| | - Bước C: Giải mã DES với K1 | `desProcess(stepB, K1_16, 'decrypt')` | `utils/encryption.js` |
| **B4** | Chuyển mảng bit về mảng byte | `bitsToBytes(decryptedBits)` | `utils/decode.js` |
| **B5** | Loại bỏ Padding PKCS7 | `unpadPKCS7(bytes)` | `utils/decode.js` |
| **B6** | Giải mã UTF-8 để khôi phục văn bản (Tiếng Việt) | `TextDecoder.decode()` | `utils/decode.js` |

---

## 3. Chi tiết Hàm xử lý lõi: `desProcess`

Hàm `desProcess` thực hiện thuật toán DES tiêu chuẩn trên một khối 64-bit qua 3 giai đoạn chính:

1.  **Initial Permutation (IP)**: Hoán vị các bit đầu vào theo bảng `IP`.
2.  **16 Vòng lặp Feistel**:
    *   Hàm Feistel (`feistel`): Mở rộng nửa phải (32 bit -> 48 bit), XOR với khóa vòng, đi qua các hộp S (`S_BOXES`) và hoán vị `P`.
    *   XOR kết quả với nửa trái để tạo nửa phải mới.
    *   Hoán đổi nửa trái và nửa phải cho vòng kế tiếp.
3.  **Final Permutation (FP)**: Hoán vị lần cuối theo bảng `FP` (ngược với `IP`) để lấy kết quả.

---

## 4. Phụ lục: Mã hóa AES (Thư viện)

AES được triển khai qua thư viện `crypto-js` nhằm mục đích so sánh hiệu năng:

*   **Hàm chính**: `CryptoJS.AES.encrypt(inputText, key)`
*   **Chi tiết**: Sử dụng thuật toán AES-256 theo chế độ CBC (Cipher Block Chaining) và Padding PKCS7 mặc định.
