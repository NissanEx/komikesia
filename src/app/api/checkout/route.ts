import { NextResponse } from "next/server";
// @ts-ignore
import midtransClient from "midtrans-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId, email } = body;

    // 1. Cek Environment Variable (Untuk Debugging)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      console.error("ERROR: MIDTRANS_SERVER_KEY tidak ditemukan di .env.local");
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 500 });
    }

    console.log("Menggunakan Server Key:", serverKey.substring(0, 15) + "...");
    console.log("Mode Production:", isProduction);

    const price = plan === "yearly" ? 240000 : 25000;

    // 2. Inisialisasi Midtrans
    let snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: serverKey,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    });

    // 3. Parameter Transaksi
    let parameter = {
      transaction_details: {
        order_id: `PREMIUM-${userId.slice(0, 5)}-${Date.now()}`,
        gross_amount: price,
      },
      customer_details: {
        email: email,
      },
      item_details: [
        {
          id: plan === "yearly" ? "PREMIUM-YEAR" : "PREMIUM-MONTH",
          price: price,
          quantity: 1,
          name: `Comic Network Premium (${plan === "yearly" ? "1 Tahun" : "1 Bulan"})`,
        },
      ],
    };

    // 4. Minta Token
    const transaction = await snap.createTransaction(parameter);
    console.log("Token berhasil dibuat:", transaction.token);

    return NextResponse.json({ token: transaction.token });

  } catch (error: any) {
    // 5. Tampilkan Error Asli di Terminal
    console.error("=== MIDTRANS ERROR ===");
    console.error("Pesan:", error.message);
    if (error.httpStatusCode) console.error("HTTP Status:", error.httpStatusCode);
    if (error.ApiResponse) console.error("API Response:", error.ApiResponse);
    
    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }
}