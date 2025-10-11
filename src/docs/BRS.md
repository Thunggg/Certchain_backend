## 🧩 Business Rules Specification (BRS)

### 1) Chống giả mạo & minh bạch dữ liệu

| Rule  | Mô tả                                                                         | Lý do nghiệp vụ                                                        |
| ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| BR-01 | Mỗi file chỉ có một `publishedHash` duy nhất → nếu trùng, từ chối mint (409). | Tránh double‑mint hoặc giả mạo chứng chỉ.                              |
| BR-02 | `publishedHash` luôn là hash của file đã watermark.                           | Đảm bảo file xác thực công khai trùng khớp với file người dùng tải về. |
| BR-03 | `originalHash` chỉ dùng nội bộ để nhận diện/khôi phục liên kết.               | Bảo vệ quyền riêng tư, không công khai file gốc.                       |

### 2) Xác thực & Truy xuất nguồn gốc

| Rule  | Mô tả                                                                             | Lý do nghiệp vụ                                        |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| BR-04 | Verify bằng 2 cách: upload file hoặc quét QR (`tokenId`).                         | Linh hoạt cho nhiều tình huống (máy tính, điện thoại). |
| BR-05 | Khi verify: `onChainHash == publishedHash`.                                       | Chỉ file hợp lệ mới được xác nhận.                     |
| BR-06 | Nếu verify bằng file gốc → tra `originalHash` trong DB để suy ra `publishedHash`. | Hỗ trợ người dùng chỉ có bản gốc.                      |

### 3) Kiểm soát phát hành & quyền hạn

| Rule  | Mô tả                                                                      | Lý do nghiệp vụ                    |
| ----- | -------------------------------------------------------------------------- | ---------------------------------- |
| BR-07 | Chỉ Issuer (owner contract) mới gọi được `mintCertificate` hoặc `setUser`. | Ngăn người khác cấp chứng chỉ giả. |
| BR-08 | ERC‑4907 chỉ cho phép `setUser()` khi `msg.sender == owner`.               | Kiểm soát việc cho thuê hợp pháp.  |
| BR-09 | Hết hạn `expires`, người thuê tự mất quyền truy cập.                       | Tuân thủ thời hạn leasing.         |

### 4) Lưu trữ & Bất biến dữ liệu

| Rule  | Mô tả                                                                       | Lý do nghiệp vụ                      |
| ----- | --------------------------------------------------------------------------- | ------------------------------------ |
| BR-10 | Artifact đã watermark lưu Cloudinary, metadata lưu riêng (`metadata.json`). | Phân tách hiển thị và mô tả dữ liệu. |
| BR-11 | Metadata có thể chứa: issuer, issueDate, hash, tokenId, URLs.               | Cho phép truy vết và xác minh nhanh. |
| BR-12 | Không bao giờ lưu file gốc lên Cloudinary.                                  | Bảo vệ bản quyền & dữ liệu nhạy cảm. |

### 5) Quản lý người dùng & trách nhiệm

| Rule  | Mô tả                                                                             | Lý do nghiệp vụ                               |
| ----- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| BR-13 | Khi upload nội dung, người dùng đồng ý điều khoản “chịu trách nhiệm về nội dung”. | Tránh vi phạm bản quyền/nội dung bất hợp pháp |
| BR-14 | Lưu log mọi upload (IP, wallet, timestamp, hash).                                 | Hỗ trợ truy vết & điều tra tranh chấp.        |
| BR-15 | Có thể áp dụng “Issuer whitelist” để giới hạn tổ chức hợp lệ.                     | Bảo vệ thương hiệu & độ tin cậy nền tảng.     |

### 6) QR & Verify Logic

| Rule  | Mô tả                                                              | Lý do nghiệp vụ                  |
| ----- | ------------------------------------------------------------------ | -------------------------------- |
| BR-16 | QR encode verify URL + `tokenId` + `contract` + `chain` (+ `sig`). | Giúp bên ngoài xác thực tức thì. |
| BR-17 | Nếu có `sig` (EIP‑712), cần verify trước khi truy xuất blockchain. | Ngăn QR giả mạo/phishing.        |

### 7) Bảo mật & Quy định kỹ thuật

| Rule  | Mô tả                                                          | Lý do nghiệp vụ                           |
| ----- | -------------------------------------------------------------- | ----------------------------------------- |
| BR-18 | Validate MIME type, kích thước file, token ownership.          | Ngăn tấn công upload và spam.             |
| BR-19 | Mỗi route public (vd `/verify`) giới hạn tốc độ và có CAPTCHA. | Chống brute‑force hash scan.              |
| BR-20 | Hash luôn tính SHA‑256; lưu dạng hex chuẩn `0x${hash}`.        | Đồng nhất giữa backend và smart contract. |

### 8) Monetization & Leasing Model (giai đoạn mở rộng)

| Rule  | Mô tả                                                                   | Lý do nghiệp vụ                     |
| ----- | ----------------------------------------------------------------------- | ----------------------------------- |
| BR-21 | Khi cho thuê tài sản (ERC‑4907), hệ thống có thể thu phí (leasing fee). | Tạo nguồn thu cho nền tảng.         |
| BR-22 | Người thuê chỉ được phép truy cập artifact trong thời gian hiệu lực.    | Giữ quyền sở hữu cho creator.       |
| BR-23 | Giao dịch cho thuê và xác minh có thể log vào DB để theo dõi.           | Cơ sở dữ liệu cho thống kê & audit. |

### 9) Multi‑Issuer & Governance (V2+)

| Rule  | Mô tả                                               | Lý do nghiệp vụ                                  |
| ----- | --------------------------------------------------- | ------------------------------------------------ |
| BR-24 | Mỗi issuer có domain và policy riêng.               | Phục vụ B2B: tổ chức phát hành theo chuẩn riêng. |
| BR-25 | Issuer ký metadata bằng private key → EIP‑712.      | Tăng tính xác thực giữa các tổ chức.             |
| BR-26 | Tương lai: DAO quản lý whitelist Issuer & contract. | Mở rộng thành hệ sinh thái cộng đồng.            |

### 📊 III) Derived Operational Rules (Logic‑Level)

| Quy tắc | Mô tả kỹ thuật hóa                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| OR-01   | `findOne({ publishedHash })` → nếu tồn tại → `throw ApiError(409)`.                                           |
| OR-02   | `verifyCertificate()` → nếu `onChainHash != publishedHash` → `NotFoundError('Certificate not found')`.        |
| OR-03   | Nếu `tokenId` chưa có trong DB → `fetchFromChain(tokenId)` → đồng bộ DB.                                      |
| OR-04   | QR → FE decode → gọi `GET /api/certificate/verify` → backend query blockchain & DB song song (`Promise.all`). |
| OR-05   | Watermark lưu tạm `tmp/uuid.png`, sau upload xóa file tạm.                                                    |

### 💰 IV) Business Value Summary

| Giá trị           | Diễn giải                                                           |
| ----------------- | ------------------------------------------------------------------- |
| Trust             | Dữ liệu on‑chain + watermark + hash đảm bảo nguồn gốc xác thực.     |
| Ownership Economy | Người dùng có thể kiếm tiền bằng việc cho thuê nội dung (ERC‑4907). |
| Transparency      | Hành vi phát hành, xác thực, cho thuê được ghi nhận công khai.      |
| Scalability       | Mở rộng từ 1 Issuer sang nhiều Issuer / Marketplace.                |
