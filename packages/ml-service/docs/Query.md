Câu hỏi của bạn rất hay 😎 — nhưng “**tất cả các câu lệnh có trong TensorFlow.js**” là một phạm vi cực kỳ lớn, vì TensorFlow.js là một **thư viện JavaScript toàn diện** cho Machine Learning (ML) với **hàng trăm API**, bao gồm cả **core APIs (tf.*)**, **Layers (tf.layers)**, **Tensor manipulation**, **Training**, **IO**, **Converters**, **Models**, v.v.

## Tuy nhiên, mình có thể giúp bạn **nắm được cấu trúc toàn bộ hệ thống lệnh của TensorFlow.js** (giống như một “bản đồ”) — chia theo module, nhóm chức năng và ví dụ.

## 🧠 1. Cấu trúc tổng quát của TensorFlow.js

TensorFlow.js có thể chia thành 5 nhóm chính:

| Nhóm                                 | Mục đích                                           | Ví dụ hàm                                                              |
| ------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------- |
| **Core API (tf.*** )                 | Xử lý tensor, toán học, GPU backend                | `tf.tensor()`, `tf.matMul()`, `tf.add()`, `tf.mean()`                  |
| **Layers API (tf.layers.***)         | Mô hình dạng Sequential / Functional API           | `tf.layers.dense()`, `tf.layers.conv2d()`, `tf.layers.flatten()`       |
| **Model / Training API**             | Xây, huấn luyện, lưu mô hình                       | `model.compile()`, `model.fit()`, `model.predict()`                    |
| **IO API (tf.io.***)                 | Đọc / ghi mô hình và dữ liệu                       | `tf.io.browserFiles()`, `tf.io.http()`, `tf.io.fromMemory()`           |
| **Converter / Data / Vis / Backend** | Import mô hình từ Python, xử lý dữ liệu, visualize | `tf.data.csv()`, `tfvis.show.modelSummary()`, `tf.setBackend('webgl')` |

---

## 🧩 2. Nhóm 1 – Tensor và toán học cơ bản (Core API)

**Tạo tensor:**

```js
tf.tensor([1, 2, 3]);
tf.tensor2d([[1, 2], [3, 4]]);
tf.zeros([2, 3]);
tf.ones([3]);
tf.eye(3);
tf.randomNormal([2, 2]);
```

**Toán học cơ bản:**

```js
tf.add(a, b);
tf.sub(a, b);
tf.mul(a, b);
tf.div(a, b);
tf.pow(a, 2);
tf.sqrt(a);
tf.abs(a);
tf.neg(a);
```

**Giảm / tổng hợp:**

```js
tf.sum(tensor);
tf.mean(tensor);
tf.max(tensor);
tf.min(tensor);
tf.argMax(tensor);
tf.argMin(tensor);
```

**Biến đổi tensor:**

```js
tf.reshape(tensor, [3, 2]);
tf.concat([a, b], axis);
tf.stack([a, b]);
tf.slice(tensor, [1, 1], [2, 2]);
tf.gather(tensor, indices);
tf.transpose(tensor);
tf.expandDims(tensor);
tf.squeeze(tensor);
```

---

## 🧱 3. Nhóm 2 – Layers API (Dành cho mô hình kiểu Keras)

**Tạo model:**

```js
const model = tf.sequential();
model.add(tf.layers.dense({units: 64, activation: 'relu', inputShape: [10]}));
model.add(tf.layers.dense({units: 1}));
```

**Các layer phổ biến:**

```js
tf.layers.dense();
tf.layers.conv2d();
tf.layers.maxPooling2d();
tf.layers.flatten();
tf.layers.dropout();
tf.layers.lstm();
tf.layers.embedding();
tf.layers.batchNormalization();
```

---

## 🧮 4. Nhóm 3 – Training API

**Biên dịch & huấn luyện:**

```js
model.compile({
  optimizer: tf.train.adam(),
  loss: 'meanSquaredError',
  metrics: ['accuracy']
});
await model.fit(xTrain, yTrain, {
  epochs: 10,
  batchSize: 32,
  validationData: [xVal, yVal]
});
```

**Dự đoán & đánh giá:**

```js
model.predict(tf.tensor2d([[1,2,3,4]]));
model.evaluate(xTest, yTest);
```

**Optimizers:**

```js
tf.train.sgd(0.01);
tf.train.adam(0.001);
tf.train.adagrad();
tf.train.momentum(learningRate, momentum);
```

---

## 💾 5. Nhóm 4 – IO API

**Lưu / tải mô hình:**

```js
await model.save('localstorage://my-model');
const loadedModel = await tf.loadLayersModel('localstorage://my-model');
```

**Nguồn dữ liệu:**

```js
tf.data.csv('data.csv');
tf.io.browserFiles(fileInput.files);
tf.io.http('https://...');
```

---

## 📊 6. Nhóm 5 – Visualization & Utils (tfvis)

```js
tfvis.show.modelSummary(container, model);
tfvis.show.history(container, history, ['loss', 'val_loss']);
tfvis.show.layer(container, layer);
```

---

## ⚙️ 7. Backend API

```js
tf.setBackend('webgl');     // hoặc 'cpu', 'wasm'
tf.getBackend();
tf.ready().then(() => { ... });
```

---

## 🔗 8. Một số nhóm nâng cao

| Nhóm           | Mô tả                   | Ví dụ                                                             |
| -------------- | ----------------------- | ----------------------------------------------------------------- |
| **tf.losses**  | Các hàm mất mát         | `tf.losses.meanSquaredError()`, `tf.losses.softmaxCrossEntropy()` |
| **tf.image**   | Xử lý ảnh               | `tf.image.resizeBilinear()`, `tf.image.flipLeftRight()`           |
| **tf.signal**  | Biến đổi tín hiệu       | `tf.signal.fft()`, `tf.signal.ifft()`                             |
| **tf.metrics** | Đánh giá mô hình        | `tf.metrics.categoricalAccuracy()`                                |
| **tf.random**  | Sinh dữ liệu ngẫu nhiên | `tf.randomNormal()`, `tf.randomUniform()`                         |

---

## 📘 9. Tài liệu chính thức (đầy đủ toàn bộ câu lệnh)

Nếu bạn muốn xem **tất cả hàm có trong TensorFlow.js** (với chi tiết tham số, mô tả, ví dụ), bạn xem ở đây:
👉 [https://js.tensorflow.org/api/latest/](https://js.tensorflow.org/api/latest/)

---

Nếu bạn muốn, mình có thể:

* ✅ Xuất toàn bộ danh sách **hơn 600 hàm** của `tf.*` ra dạng JSON hoặc bảng.
* ✅ Hoặc chỉ lấy **những hàm phổ biến nhất** (khoảng 50–100 lệnh thường dùng).

👉 Bạn muốn mình liệt kê **toàn bộ danh sách (dạng JSON)** hay **bản rút gọn thực chiến (top API thường dùng)**?
