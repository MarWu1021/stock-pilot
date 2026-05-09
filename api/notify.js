export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Missing DISCORD_WEBHOOK_URL" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const payload = {
    username: "Stock Pilot",
    embeds: [
      {
        title: body.title || "AI watch alert",
        description: body.message || "",
        color: body.status?.includes("風險") ? 0xef4444 : body.status?.includes("目標") || body.status?.includes("觀察") ? 0x22c55e : 0xf59e0b,
        fields: [
          { name: "狀態", value: String(body.status || "--"), inline: true },
          { name: "目前價", value: String(body.price || "--"), inline: true },
          { name: "漲跌", value: String(body.change || "--"), inline: true },
          { name: "AI 分數", value: String(body.score || "--"), inline: true },
          { name: "R/R", value: String(body.rr || "--"), inline: true },
          { name: "防呆提醒", value: String(body.note || "請自行核對股價後再決定。"), inline: false }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return res.status(response.status).json({ error: "Discord webhook failed" });
  }

  return res.status(200).json({ ok: true });
}
