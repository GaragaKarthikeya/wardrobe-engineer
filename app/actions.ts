"use server";

import { createClient } from '@supabase/supabase-js';

// Model and Endpoint Config
const MODEL = "gemini-3-flash-preview";

// Supabase client for server actions
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
}

// Helper: Build URL at runtime
function getApiUrl(): string {
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
        throw new Error("Server Config Error: GEMINI_KEY not set.");
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
}

// =====================
// VISION: Analyze Clothing & Upload to Supabase
// =====================
export async function analyzeImageAction(formData: FormData) {
    const url = getApiUrl();
    const supabase = getSupabase();

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    // Enhanced prompt for richer metadata
    const prompt = `You are a fashion expert analyzing a clothing item image.

Extract detailed metadata about this clothing item. Be specific and accurate.

Return a JSON object with this EXACT schema:
{
  "category": "Top" | "Bottom" | "Shoe" | "Outerwear" | "Accessory",
  "sub_category": "string (e.g., T-Shirt, Polo, Jeans, Chinos, Sneakers, Blazer)",
  "color": "string (primary color, be specific: Navy Blue, Forest Green, Charcoal)",
  "secondary_color": "string or null (if pattern has multiple colors)",
  "pattern": "Solid" | "Striped" | "Plaid" | "Floral" | "Graphic" | "Other",
  "fabric": "string (Cotton, Denim, Wool, Polyester, Linen, etc.)",
  "formality": "Casual" | "Smart Casual" | "Business" | "Formal",
  "fit": "Slim" | "Regular" | "Relaxed" | "Oversized",
  "seasons": ["Spring", "Summer", "Fall", "Winter"],
  "occasions": ["string (e.g., Office, Date, Casual, Sports, Party)"],
  "style_notes": "string (brief style description, e.g., 'Classic polo with contrast collar')"
}

Be accurate about the category. Shirts, T-shirts, Polos = "Top". Jeans, Pants = "Bottom".`;

    try {
        // 1. Analyze with Gemini
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
        const tags = JSON.parse(jsonStr || "{}");

        // 2. Upload image to Supabase Storage
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from('wardrobe')
            .upload(fileName, Buffer.from(arrayBuffer), {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Storage Error: ${uploadError.message}`);
        }

        // 3. Get public URL
        const { data: urlData } = supabase.storage
            .from('wardrobe')
            .getPublicUrl(fileName);

        const image_url = urlData.publicUrl;

        // 4. Insert into database
        const { data: item, error: dbError } = await supabase
            .from('items')
            .insert({
                image_url,
                tags,
                is_clean: true
            })
            .select()
            .single();

        if (dbError) {
            throw new Error(`Database Error: ${dbError.message}`);
        }

        // 5. Return complete ClothingItem
        return item;

    } catch (error: any) {
        console.error("Analyze & Upload Error:", error);
        throw new Error(error.message);
    }
}

// =====================
// STYLIST: Recommend Outfit
// =====================
export async function recommendOutfitAction(intent: string, inventory: any[]) {
    const url = getApiUrl();

    const availableItems = inventory
        .filter((i) => i.is_clean)
        .map((i) => ({
            id: i.id,
            ...i.tags
        }));

    if (availableItems.length === 0) {
        return {
            selected_item_ids: [],
            reasoning: "No clean items available. Mark some clothes as clean first!"
        };
    }

    // Enhanced prompt with style rules
    const prompt = `You are an expert fashion stylist helping a user choose an outfit.

USER'S OCCASION: "${intent}"

AVAILABLE CLEAN CLOTHES:
${JSON.stringify(availableItems, null, 2)}

YOUR TASK:
1. Select a complete outfit (Top + Bottom, optionally add Shoes/Outerwear if available)
2. Consider color coordination:
   - Complementary colors work well (Navy + Tan, Black + White)
   - Avoid clashing patterns
   - Match formality levels
3. Match the occasion's dress code
4. Consider seasonal appropriateness if mentioned

RULES:
- You MUST select from the provided inventory only
- Select items by their exact "id" field
- A complete outfit needs at minimum: 1 Top + 1 Bottom
- If no suitable match exists, explain why

Return JSON:
{
  "selected_item_ids": ["uuid-1", "uuid-2"],
  "outfit_type": "Casual" | "Smart Casual" | "Business" | "Formal",
  "reasoning": "Detailed explanation of why this combination works (2-3 sentences)"
}`;

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

// =====================
// UPDATE TAGS: Edit item metadata
// =====================
export async function updateItemTagsAction(id: string, tags: any) {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
        .from("items")
        .update({ tags })
        .eq("id", id);

    if (error) {
        throw new Error(`Failed to update tags: ${error.message}`);
    }

    return { success: true };
}
