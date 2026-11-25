# Ghi chú đề & giả định

> Chưa hỏi được anh Duy nên làm theo mặc định của lộ trình. Khi có trả lời thì sửa lại file này.

## Chủ đề

Sản phẩm = **mô hình / thẻ bài sưu tầm** (Gundam, Yu-Gi-Oh, Pokémon).
Bài nộp chỉ dùng 3 field của đề + `category`. Field riêng từng loại (grade, rarity, stock...) để dành cho hướng phát triển.

## Giả định (cần xác nhận với anh Duy)

| # | Câu hỏi | Giả định hiện tại | Đã xác nhận? |
|---|---|---|---|
| 1 | Driver thuần hay mongoose | `mongodb` driver thuần | chưa |
| 2 | Local hay Atlas | chưa chọn (xem README) | chưa |
| 3 | Giữ nguyên endpoint/status bài CRUD cũ | có, xem bảng API trong README | chưa |
| 4 | Có field `category` | có (bắt buộc, chuỗi không rỗng) | chưa |
| 5 | Lọc `GET /products?category=` | chưa làm | chưa |
| 6 | Nộp gì | repo + README + ảnh test/Compass | chưa |
| 7 | Có vấn đáp "vì sao driver / mô hình collection" | giả định có, đã chuẩn bị trong README | chưa |

## Quyết định tự đặt (ngoài đề, ghi rõ để không bị hỏi bất ngờ)

- Thứ tự kiểm tra: **401 → 400 (JSON/body hỏng) → 404 (id sai định dạng) → 400 (validate field) → 404 (không tồn tại)**.
- `PATCH` với body `{}` hoặc chỉ có field lạ → 200, trả object không đổi (không coi là lỗi).
- `limit=0` hợp lệ → trả `[]`.
- Body tối đa 1MB, vượt quá → 413.
- Token cố định `Bearer demo-token` (đọc từ `AUTH_TOKEN`), chỉ áp cho route ghi (POST/PUT/PATCH/DELETE); GET công khai.
