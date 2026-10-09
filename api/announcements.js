export default async function handler(req, res) {
  const { ticker } = req.query;
  const cleanTicker = (ticker || "").toUpperCase().trim().replace(".NS", "").replace(".BO", "");

  // Google News Financial RSS query targeted specifically at Indian regulatory filings & corporate announcements
  const rssUrl = cleanTicker 
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(cleanTicker + ' NSE stock announcement OR dividend OR financial results')}&hl=en-IN&gl=IN&ceid=IN:en`
    : `https://news.google.com/rss/search?q=NSE+corporate+announcements+dividend+results&hl=en-IN&gl=IN&ceid=IN:en`;

  try {
    const upstream = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ success: false, error: "Failed to fetch RSS upstream" });
    }

    const xmlText = await upstream.text();

    // Zero-dependency XML parser to avoid bundle bloat on Vercel Edge
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 6) {
      const itemContent = match[1];
      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/.exec(itemContent);
      const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent);
      const sourceMatch = /<source[^>]*>(.*?)<\/source>/.exec(itemContent);

      const rawTitle = (titleMatch ? (titleMatch[1] || titleMatch[2]) : "Corporate Disclosure")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      items.push({
        title: rawTitle,
        link: linkMatch ? linkMatch[1] : "#",
        pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toUTCString(),
        source: sourceMatch ? sourceMatch[1] : "Exchange Disclosures"
      });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ success: true, ticker: cleanTicker, items });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
