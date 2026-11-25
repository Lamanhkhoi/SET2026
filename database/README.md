# database/ - MongoDB cho Products API

Thư mục này giữ **mọi thứ về dữ liệu** (không phải code chạy API):

| File | Vai trò |
|---|---|
| `seed/products.js` | 3 sản phẩm mẫu, nguồn dữ liệu duy nhất cho seed và test |
| `seed.js` | Xoá dữ liệu cũ + nạp seed. Chạy từ `server/`: `npm run seed` |
| `README.md` | Schema, index, cách xem bằng Compass |

Code truy cập DB (`mongo-data-source.js`) nằm trong `server/src/data-sources/`, vì nó thuộc tầng của server.

## Kết nối

| | Giá trị |
|---|---|
| MongoDB Server | Community 9.0 chạy service `MongoDB` trên máy, cổng 27017 |
| URI (Compass và `.env`) | `mongodb://127.0.0.1:27017` (không có mật khẩu) |
| Database của server Express | `express-khoi` (đề anh Duy: `express-<tên>`) |
| Database khi chạy test | `express-test` (test không bao giờ đụng DB thật) |
| Database của bài Node thuần | `set26_products` (tách riêng, không lẫn) |

Trong Compass: **Add new connection** > URI ở trên > **Save & Connect** > mở `express-khoi`.

## Collection

### `products`

```js
{
  _id: ObjectId("..."),   // Mongo tự gắn, KHÔNG trả ra API (toApi() bỏ đi)
  id: 4,                  // id số của API, giữ để không vỡ contract
  name: "MG Strike Freedom",
  price: 1900000,
  category: "gundam"      // gundam | yugioh | pokemon
}
```

| Field | Kiểu | Ràng buộc (kiểm ở controller, Mongo không tự kiểm) |
|---|---|---|
| `id` | số nguyên | server cấp, không cấp lại sau DELETE |
| `name` | string | không rỗng sau trim, tối đa 100 ký tự |
| `price` | number | hữu hạn, >= 0 |
| `category` | string | không rỗng |

Index: `{ id: 1 }` **unique** (tạo trong `connect()`), chặn trùng `id` ở mức DB.

### `counters`

```js
{ _id: "products", seq: 4 }   // id lớn nhất đã cấp
```

Cấp id mới bằng `findOneAndUpdate({_id:'products'}, {$inc:{seq:1}}, {upsert:true, returnDocument:'after'})`.
`$inc` nguyên tử nên 2 request cùng lúc không trùng id, và xoá sản phẩm cao nhất cũng không làm `seq` lùi.

## Thêm dữ liệu bằng Compass

Collection `products` > **ADD DATA** > **Insert document** > dán JSON, ví dụ:

```json
{ "id": 20, "name": "HG Zaku II", "price": 300000, "category": "gundam", "grade": "HG", "scale": "1/144" }
```

Lưu ý:
- Mongo nhận cả field lạ (`grade`, `scale`) và sai kiểu (`price: "abc"`). API hiện chỉ trả/ghi 4 field của đề.
- Sau khi chèn tay `id` lớn hơn `seq`, hãy **khởi động lại server** (`connect()` tự kéo `seq` lên bằng `$max`), nếu không POST kế tiếp có thể trùng id.

## Hướng phát triển (chưa làm, ghi cho README/portfolio)

| Category | Field riêng sau này |
|---|---|
| gundam | `grade` (HG/RG/MG/PG), `scale`, `series` |
| yugioh | `rarity`, `setCode`, `condition` |
| pokemon | `set`, `rarity`, `graded` |
| chung | `stock`, `priceHistory[]` |

Mỗi loại hàng có thuộc tính khác nhau nên document linh hoạt hợp hơn bảng cố định cột.
