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
// STEP 1: Strict Validation - Is this a single clothing item?
// =====================
async function validateClothingImage(base64: string, mimeType: string): Promise<{ valid: boolean; reason?: string }> {
    const url = getApiUrl();

    const validationPrompt = `You are a strict image validator for a wardrobe app.

TASK: Determine if this image shows EXACTLY ONE SINGLE CLOTHING ITEM.

ACCEPT ONLY:
- A single shirt, t-shirt, polo, blouse
- A single pair of pants, jeans, shorts, skirt
- A single jacket, coat, blazer, hoodie
- A single pair of shoes (counts as one item)
- A single accessory (watch, belt, bag, hat, sunglasses)
- Flat-lay photo of ONE item
- Item on hanger (ONE item)
- Close-up of ONE clothing piece

REJECT:
- Multiple clothing items in one photo
- Full outfit photos (person wearing multiple items)
- People/selfies where clothing is not the focus
- Screenshots from shopping websites
- Stock photos or catalog images
- Blurry or unclear images
- Non-clothing items (food, furniture, electronics, etc.)
- Memes, text, documents
- Collages or multiple images combined

Return JSON:
{
  "valid": true/false,
  "reason": "If invalid, explain why in 1 short sentence. If valid, null."
}

Be STRICT. When in doubt, reject.`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: validationPrompt },
                    { inlineData: { mimeType, data: base64 } }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error("Validation failed. Please try again.");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonStr = text?.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr || '{"valid": false, "reason": "Could not validate image"}');
}

// =====================
// STEP 2: Extract Clothing Metadata (Flexible & Rich)
// =====================
async function extractClothingMetadata(base64: string, mimeType: string) {
    const url = getApiUrl();

    const prompt = `You are an expert fashion analyst with deep knowledge of clothing, textiles, and style.

Analyze this clothing item and extract as much useful metadata as possible.

REQUIRED FIELDS (always include):
- category: "Top" | "Bottom" | "Shoe" | "Outerwear" | "Accessory"
- sub_category: Be specific (e.g., "Henley T-Shirt", "Slim Chinos", "Chelsea Boots", "Bomber Jacket")
- color: Primary color, be specific (e.g., "Burgundy", "Slate Gray", "Cream", "Olive Green")
- formality: "Casual" | "Smart Casual" | "Business" | "Formal"

OPTIONAL BUT ENCOURAGED (include if identifiable):
- secondary_color: If the item has multiple colors
- pattern: "Solid" | "Striped" | "Plaid" | "Checkered" | "Floral" | "Geometric" | "Abstract" | "Graphic" | "Camo" | "Animal Print" | "Polka Dot" | "Paisley" | "Other"
- fabric: Be specific - "100% Cotton", "Cotton-Polyester Blend", "Linen", "Denim", "Leather", "Suede", "Wool", "Cashmere", "Silk", "Synthetic"
- texture: "Smooth", "Ribbed", "Knit", "Woven", "Brushed", "Distressed", "Quilted"
- fit: "Slim", "Regular", "Relaxed", "Oversized", "Tailored", "Cropped"
- length: For tops - "Cropped", "Regular", "Longline". For bottoms - "Short", "Knee", "Ankle", "Full"
- neckline: For tops - "Crew", "V-Neck", "Henley", "Polo", "Turtleneck", "Scoop", "Mock Neck"
- sleeve_length: "Sleeveless", "Short", "3/4", "Long", "Rolled"
- closure: "Button", "Zip", "Pullover", "Snap", "Tie", "Hook"
- details: Array of notable features like ["chest pocket", "contrast stitching", "raw hem", "embroidered logo", "metal hardware"]
- brand_visible: true/false - if brand logo/name is visible
- brand_guess: If recognizable brand style, guess it
- seasons: Which seasons it's best for ["Spring", "Summer", "Fall", "Winter"]
- occasions: Where to wear it ["Everyday", "Office", "Date Night", "Party", "Workout", "Beach", "Formal Event", "Travel"]
- style_tags: Fashion style descriptors ["Minimalist", "Streetwear", "Classic", "Preppy", "Athleisure", "Bohemian", "Edgy", "Vintage"]
- color_temperature: "Warm" | "Cool" | "Neutral"
- versatility_score: 1-5 how easy to pair with other items
- care_guess: Likely care instructions ["Machine Wash", "Hand Wash", "Dry Clean"]
- style_notes: A brief, useful styling tip for this specific item

Return as JSON object. Include as many fields as you can confidently identify. Be specific and creative with descriptions.`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: base64 } }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error("Failed to analyze clothing. Please try again.");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonStr = text?.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr || "{}");
}

// =====================
// MAIN: Analyze Clothing & Upload to Supabase
// =====================
export async function analyzeImageAction(formData: FormData) {
    const supabase = getSupabase();

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    try {
        // STEP 1: Strict validation
        const validation = await validateClothingImage(base64, mimeType);

        if (!validation.valid) {
            throw new Error(validation.reason || "This doesn't look like a single clothing item. Please upload a clear photo of one item only.");
        }

        // STEP 2: Extract metadata (only if valid)
        const tags = await extractClothingMetadata(base64, mimeType);

        // STEP 3: Upload image to Supabase Storage
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
// STYLIST: Recommend Outfit (Enhanced with Rich Metadata)
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

    // Enhanced prompt with rich styling knowledge
    const prompt = `You are an expert fashion stylist with deep knowledge of color theory, style coordination, and occasion-appropriate dressing.

USER'S REQUEST: "${intent}"

AVAILABLE WARDROBE (all clean items):
${JSON.stringify(availableItems, null, 2)}

YOUR EXPERTISE:
1. COLOR COORDINATION
   - Use color wheel principles (complementary, analogous, triadic)
   - Consider color temperature (warm with warm, cool with cool, or intentional contrast)
   - Neutrals (black, white, gray, navy, beige) pair with everything
   - Limit bright colors to 1-2 pieces max

2. PATTERN MIXING
   - Solid + Pattern is safe
   - Mix patterns only if different scales (small stripe + large plaid)
   - When in doubt, keep one statement piece

3. FORMALITY MATCHING
   - All pieces should be at similar formality level
   - Don't mix athletic wear with business pieces
   - Shoes set the tone (sneakers = casual, oxfords = formal)

4. STYLE COHESION
   - Match style tags when possible (streetwear with streetwear, classic with classic)
   - Consider the overall aesthetic (minimalist, edgy, preppy)

5. OCCASION AWARENESS
   - Match the dress code strictly
   - Consider weather/season if mentioned
   - Think about comfort for the activity

SELECTION RULES:
- Pick from the provided inventory ONLY (use exact "id" values)
- Build a COMPLETE outfit: Top + Bottom required
- Add Shoes if available and suitable
- Add Outerwear if weather/occasion calls for it
- Add 1-2 Accessories if they elevate the look
- If user's request can't be fulfilled well, suggest the closest alternative

Return JSON:
{
  "selected_item_ids": ["uuid-1", "uuid-2", ...],
  "outfit_type": "Casual" | "Smart Casual" | "Business" | "Formal",
  "reasoning": "2-3 sentences explaining WHY these pieces work together. Mention specific colors, textures, or style elements that complement each other."
}`;

    const body = {
        contents: [{
            role: 'user',
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
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
