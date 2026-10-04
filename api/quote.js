// api/quote.js
export default async function handler(req, res) {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });

  const symbol = ticker.includes(".") ? ticker : `${ticker}.NS`;
  const target = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;

  try {
    const resp = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await resp.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}