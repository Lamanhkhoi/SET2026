# SET2026

Bài tập khoá SET 2026 (Software Engineer Training). Chủ đề sản phẩm: **mô hình / thẻ bài sưu tầm** (Gundam, Yu-Gi-Oh, Pokémon).

| Thư mục | Nội dung | Trạng thái |
|---|---|---|
| `products-api/` | Products API bằng **Node thuần** (5 tầng) + MongoDB. Bài nộp riêng, không phụ thuộc thư mục khác | Xong code, thiếu README + ghi-chep |
| `server/` | Cùng API chuyển sang **Express 5**. `repositories/` và `data-sources/` giống hệt `products-api` | Xong, 52/52 test |
| `database/` | Seed data, schema, index, hướng dẫn Compass cho MongoDB | Xong |
| `client/` | Giao diện React (FE) | Chưa làm |

## Chạy server Express

```bash
cd server
npm install
copy .env.example .env      # rồi kiểm tra MONGODB_URI, MONGODB_DB
npm run seed                 # nạp 3 sản phẩm mẫu vào MongoDB
npm start                    # http://localhost:3001
npm test                     # 52 test x 2 nguồn dữ liệu (file, mongo)
```

Route ghi (POST/PUT/PATCH/DELETE) cần header `Authorization: Bearer demo-token`. GET là công khai.
