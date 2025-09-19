const axios = require("axios");
const router = require("express").Router();

function getTimestamp() {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
}

// Get OAuth token
router.post("/token", async (_, res) => {
  try {
    const basic = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const { data } = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${basic}` } }
    );

    res.json(data);
  } catch (err) {
    console.error("Token error:", err.response?.data || err.message);
    res.status(500).json({ message: "Token error", error: err.message });
  }
});

// Initiate STK Push
router.post("/stk", async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;

    const formattedPhone = phone.startsWith("254")
      ? phone
      : phone.replace(/^0/, "254");

    // 1. Get access token
    const basic = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const tokenRes = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${basic}` } }
    );
    const token = tokenRes.data.access_token;

    // 2. Generate password
    const timestamp = getTimestamp();
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    // 3. STK Push body
    const body = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.MPESA_CALLBACK_URL}?orderId=${orderId}`,
      AccountReference: `order_${orderId}`,
      TransactionDesc: "Construction materials",
    };

    // 4. Send STK push
    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(data);
  } catch (err) {
    console.error("STK Error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      message: "STK push failed",
      error: err.response?.data || err.message,
    });
  }
});

// Callback URL (Safaricom hits this after payment)
router.post("/callback", (req, res) => {
  console.log("📩 STK Callback:", JSON.stringify(req.body, null, 2));
  // TODO: Save to DB (req.body.Body.stkCallback)
  res.json({ status: "received" });
});

module.exports = router;


