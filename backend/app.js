require('dotenv').config();
const connectDB = require('./config/db');

connectDB();

// Sau đó mới chạy app của bạn, ví dụ Express:
const express = require('express');
const app = express();

app.listen(process.env.PORT || 5000, () => {
  console.log('Server đang chạy!');
});
