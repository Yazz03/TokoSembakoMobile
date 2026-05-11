require('dotenv').config();
const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');

const app = express();
const port = 8080;

// Middleware
app.use(cors()); // Mengizinkan request dari aplikasi Expo/React Native
app.use(express.json()); // Agar bisa membaca data JSON yang dikirim aplikasi

// 1. Setup Environment Midtrans
// Pastikan isProduction: false karena kita pakai Sandbox
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY
});

// 2. Endpoint untuk membuat token transaksi
app.post('/api/get-token', (req, res) => {
    // Menangkap data order_id dan total pembayaran (gross_amount) dari React Native
    const { order_id, gross_amount } = req.body;

    let parameter = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount
        },
        "credit_card": {
            "secure": true
        }
    };

    // 3. Meminta token ke Midtrans
    snap.createTransaction(parameter)
        .then((transaction) => {
            // Token berhasil didapat, kirim balik ke React Native
            let transactionToken = transaction.token;
            console.log('Token berhasil dibuat:', transactionToken);
            res.json({ token: transactionToken });
        })
        .catch((e) => {
            console.log('Error:', e.message);
            res.status(500).json({ error: e.message });
        });
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server Backend Node.js berjalan di http://localhost:${port}`);
});