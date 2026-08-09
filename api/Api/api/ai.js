export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST requests are allowed"
    });
  }

  try {
    const body = req.body || {};

    return res.status(200).json({
      success: true,
      message: "NAVAL AI BACKEND CONNECTED",
      received: {
        duration: body.duration || 0,
        format: body.format || "vertical",
        text: body.text || ""
      },
      smartEdit: {
        captions: true,
        sceneDetection: true,
        smartCuts: true,
        shortsFormat: true
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Backend error"
    });
  }
                      }
