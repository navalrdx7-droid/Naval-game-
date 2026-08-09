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
    const body = req.body || {};

    const duration = Number(body.duration) || 10;
    const width = Number(body.width) || 0;
    const height = Number(body.height) || 0;

    const prompt = `
You are NAVAL AI VIDEO EDITOR.

Analyze this video information and create an automatic editing plan.

Video duration: ${duration} seconds
Video width: ${width}
Video height: ${height}

Return ONLY valid JSON.

Rules:
- Select the best highlight section.
- Maximum edit duration is 30 seconds.
- Never exceed the original video duration.
- Prefer vertical format for Shorts/Reels.
- Create a short gaming caption.
- Select a suitable visual filter.
- Keep audio levels reasonable.

Allowed format:
vertical, landscape, square

Allowed filters:
none
contrast(1.35) saturate(1.4)
contrast(1.5) saturate(1.7)
brightness(1.2) saturate(1.5)
grayscale(1)
sepia(.7)

Return:

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
      const error = await response.text();

      console.error(error);

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

    let start = Number(ai.start) || 0;
    let end = Number(ai.end) || duration;

    start = Math.max(0, Math.min(start, duration));
    end = Math.max(start + 0.5, Math.min(end, duration));

    if (end > duration) {
      end = duration;
    }

    return res.status(200).json({
      success: true,

      start: start,
      end: end,

      format:
        ["vertical", "landscape", "square"].includes(ai.format)
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
