// api/quote.js
export default async function handler(req, res) {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });

  const symbol = ticker.toUpperCase().endsWith(".BO") || ticker.toUpperCase().endsWith(".NS") 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.NS`;

  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;

  try {
    const resp = await fetch(chartUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Upstream error: ${resp.statusText}` });
    }

    const data = await resp.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
