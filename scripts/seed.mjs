import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error("Missing ENV vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const IMAGES_DIR = "C:\\Users\\garag\\Desktop\\Clothing Generator\\test_images";

// GEMINI LOGIC (Copied from actions.ts for standalone usage)
async function analyzeImage(filePath, mimeType) {
    console.log(`Analyzing with Gemini: ${path.basename(filePath)}...`);
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    const MODEL = "gemini-3-flash-preview";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

    const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64 } }
                ]
            }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonStr = text?.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr || "{}");
}

async function main() {
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    console.log(`Found ${files.length} images.`);

    for (const file of files) {
        const fullPath = path.join(IMAGES_DIR, file);
        const mimeType = "image/jpeg"; // Assuming jpgs based on list_dir

        try {
            // 1. Upload to Supabase
            console.log(`\nProcessing ${file}...`);
            const buffer = fs.readFileSync(fullPath);
            const filename = `seed-${Date.now()}-${file}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("wardrobe")
                .upload(filename, buffer, { contentType: mimeType, upsert: true });

            if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

            const publicUrl = supabase.storage
                .from("wardrobe")
                .getPublicUrl(filename).data.publicUrl;

            console.log(` - Uploaded: ${publicUrl}`);

            // 2. Analyze
            const metadata = await analyzeImage(fullPath, mimeType);
            console.log(` - Tagged: ${metadata.color} ${metadata.category}`);

            // 3. Insert into DB
            const { error: dbError } = await supabase.from("items").insert({
                image_url: publicUrl,
                tags: metadata,
                is_clean: true,
            });

            if (dbError) throw new Error(`DB Insert Failed: ${dbError.message}`);
            console.log(" - Saved to Database ✅");

        } catch (e) {
            console.error(`Failed to process ${file}:`, e.message);
        }
    }
}

main();
