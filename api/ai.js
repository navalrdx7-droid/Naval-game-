export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST requests are allowed"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "OPENAI_API_KEY is not configured in Vercel"
    });
  }

  try {
    const {
      duration = 10,
      width = 0,
      height = 0
    } = req.body || {};

    const prompt = `
You are NAVAL AI VIDEO EDITOR.

Create an automatic editing plan.

Video duration: ${Number(duration)}
Video width: ${Number(width)}
Video height: ${Number(height)}

Return ONLY valid JSON.

Rules:
- start must be 0 or greater
- end must not exceed video duration
- maximum edit duration is 30 seconds
- prefer vertical format
- create a short gaming caption

Return exactly:
{
  "start": 0,
  "end": 10,
  "format": "vertical",
  "caption": "NAVAL GAMING 🔥",
  "filter": "contrast(1.35) saturate(1.4)",
  "videoVolume": 80,
  "musicVolume": 20
}
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(errorText);

      return res.status(500).json({
        success: false,
        error: "AI request failed"
      });
    }

    const data = await response.json();

    const text = data.output_text || "";

    const clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const ai = JSON.parse(clean);

    const videoDuration = Number(duration) || 10;

    let start = Number(ai.start) || 0;
    let end = Number(ai.end) || videoDuration;

    start = Math.max(0, Math.min(start, videoDuration));
    end = Math.max(start + 0.5, Math.min(end, videoDuration));

    if (end - start > 30) {
      end = Math.min(start + 30, videoDuration);
    }

    return res.status(200).json({
      success: true,
      start,
      end,
      format: ["vertical", "landscape", "square"].includes(ai.format)
        ? ai.format
        : "vertical",
      caption:
        typeof ai.caption === "string"
          ? ai.caption.substring(0, 80)
          : "NAVAL GAMING 🔥",
      filter:
        typeof ai.filter === "string"
          ? ai.filter
          : "contrast(1.35) saturate(1.4)",
      videoVolume: Math.max(
        0,
        Math.min(100, Number(ai.videoVolume) || 80)
      ),
      musicVolume: Math.max(
        0,
        Math.min(100, Number(ai.musicVolume) || 20)
      )
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "AI backend error"
    });
  }
      }
