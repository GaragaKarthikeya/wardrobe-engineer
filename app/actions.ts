"use server";

// Model and Endpoint Config
const MODEL = "gemini-3-flash-preview";

// Helper: Build URL at runtime to ensure env var is loaded
function getApiUrl(): string {
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
        throw new Error("Server Config Error: GEMINI_KEY not set.");
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
}

export async function analyzeImageAction(formData: FormData) {
    const url = getApiUrl(); // Get at call time

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    const prompt = `
    Analyze this clothing item. Return JSON:
    {
      "category": "Top" | "Bottom" | "Shoe" | "Outerwear" | "Accessory",
      "sub_category": "string",
      "color": "string",
      "pattern": "string",
      "fabric": "string",
      "formality": "string",
      "tags": ["string"]
    }
  `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const jsonStr = text?.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr || "{}");

    } catch (error: any) {
        console.error("Gemini Vision Error:", error);
        throw new Error(error.message);
    }
}

export async function recommendOutfitAction(intent: string, inventory: any[]) {
    const url = getApiUrl(); // Get at call time

    const availableItems = inventory
        .filter((i) => i.is_clean)
        .map((i) => ({
            id: i.id,
            ...i.tags
        }));

    const prompt = `
    User Intent: "${intent}"
    Available Inventory: ${JSON.stringify(availableItems)}

    Select best outfit. Return JSON:
    {
      "selected_item_ids": ["id"],
      "reasoning": "string"
    }
  `;

    const body = {
        contents: [{
            role: 'user',
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            // @ts-ignore
            thinkingConfig: {
                thinkingLevel: "HIGH",
            },
        },
        tools: [{ googleSearch: {} }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Stylist API Error:", err);
            return {
                selected_item_ids: [],
                reasoning: "AI Error: " + err
            };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");

        return JSON.parse(jsonMatch[0]);

    } catch (error: any) {
        console.error("Gemini Recommendation Error:", error);
        return {
            selected_item_ids: [],
            reasoning: "Stylist error: " + error.message
        }
    }
}
