# Wardrobe Engineer

**Your closet, but smarter.**

---

## The One-Liner

An AI-powered wardrobe app that understands your clothes better than you do—and tells you exactly what to wear, right now.

---

## The Problem

**Every morning, the same problem:**

You have clothes. Maybe even good clothes. But you're standing in front of your closet, late, staring at the same 3 combinations you always wear—while 60% of your wardrobe collects dust.

- **Decision fatigue is real.** Studies show we waste 10-20 minutes daily deciding what to wear.
- **We buy duplicates.** Without visibility into what we own, we keep buying the same types.
- **Good clothes go unworn.** That nice jacket? Sits there because we don't know how to style it.
- **Fashion apps don't get it.** Pinterest boards and outfit inspiration don't help when you need to work with *what you actually own*.

---

## The Solution

**Wardrobe Engineer: AI that thinks like a stylist, works like an engineer.**

### How It Works

1. **Snap. Upload. Done.**  
   Take a photo of a clothing item. AI validates it's a single piece (no selfies, no screenshots, no outfit photos). If it's valid, it extracts 20+ metadata points automatically:
   - Category, color, fabric, pattern, fit
   - Formality level, seasonality, occasions
   - Style tags, versatility score, color temperature
   - Even care instructions and styling tips

2. **Ask. Get dressed.**  
   Tell the stylist what you're doing: *"Class today"*, *"Presentation"*, *"Going out"*, *"Meeting someone"*. It builds you an outfit from what's clean in your closet—with reasoning.

3. **Wear it. Track it.**  
   Tap "Wear This" and those items are marked as worn. The app knows what's clean. No more guessing.

---

## What Makes It Different

### 1. Strict Validation = Real Wardrobe
Most apps let you upload anything. We don't. Single items only. Your digital closet mirrors reality.

### 2. Rich AI Metadata (Not Just Labels)
We don't just tag "Blue Shirt". We see:
```
Category: Top
Sub-category: Henley T-Shirt  
Color: Slate Blue
Fabric: Cotton-Linen Blend
Fit: Relaxed
Formality: Smart Casual
Color Temperature: Cool
Versatility: 4/5
Style Tags: ["Minimalist", "Elevated Casual"]
```

### 3. Stylist That Thinks, Not Just Matches
The AI uses actual fashion logic:
- **Color theory**: Contrast, tonal, earth palettes
- **Texture interplay**: Mixing smooth with textured
- **Formality balance**: Not just matching, but calibrating
- **Practical context**: Different output for "class" vs "presentation"

**Example output:**
> *"Navy henley + grey chinos + white sneakers. Tonal play with the cool blues, relaxed fit keeps it comfortable for a long day, but the clean lines say you showed up intentional. Elevated casual without trying too hard."*

### 4. Apple-Like UX
- Liquid glass design language
- Haptic feedback on every interaction
- Framer Motion animations
- Mobile-first, PWA-ready
- Works offline (IndexedDB + Supabase sync)

---

## The Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | Server actions, edge-ready |
| AI | Gemini 2.0 Flash | Fast, visual, structured JSON output |
| Storage | Supabase (Postgres + Storage) | Real-time sync, row-level security |
| Local | IndexedDB | Offline-first, instant feel |
| Animations | Framer Motion | Physics-based, Apple-quality |
| Styling | Tailwind CSS | Rapid iteration, dark mode native |

---

## Validation Pipeline (The Engineering)

```
User uploads image
        ↓
┌─────────────────────────────┐
│   STEP 1: Strict Validation │
│   "Is this ONE clothing     │
│    item? Not a selfie?      │
│    Not a screenshot?"       │
│                             │
│   ✓ Accept → Continue       │
│   ✗ Reject → Return reason  │
└─────────────────────────────┘
        ↓ (only if valid)
┌─────────────────────────────┐
│  STEP 2: Rich Extraction    │
│  20+ metadata fields        │
│  AI acts as fashion analyst │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  STEP 3: Upload & Store     │
│  Supabase Storage + DB      │
│  Sync to local IndexedDB    │
└─────────────────────────────┘
```

This two-step process means:
- **No junk in the wardrobe** (validation gate)
- **Maximum intelligence** (rich extraction only runs on valid items)
- **Clear user feedback** (rejected images get a reason)

---

## Market Opportunity

| Segment | Size | Pain Point |
|---------|------|------------|
| Gen Z (18-25) | 2B globally | Decision fatigue, want to look good effortlessly |
| Professionals | 1.5B | Morning rush, need to look polished fast |
| Fashion-conscious | 500M+ | Own lots of clothes, wear fraction |
| Sustainability-minded | Growing | Buy less, wear more of what you have |

**Adjacent opportunities:**
- Outfit calendar / planning
- "Shop your gaps" recommendations
- Laundry integrations
- Seasonal wardrobe rotation
- Packing assistant for travel

---

## Competitive Landscape

| Competitor | Gap |
|------------|-----|
| **Cladwell** | Paid, no AI analysis, manual tagging |
| **Acloset** | Basic categorization, no styling logic |
| **Stylebook** | Manual everything, no AI |
| **Smart Closet** | Cluttered UX, outdated |
| **Pinterest** | Inspiration, not inventory |

**Wardrobe Engineer's edge:**
- AI-first (not AI-bolted-on)
- Single-item validation (real closet, not dump folder)
- Stylist with *reasoning* (not just random matches)
- Premium UX (Apple-tier, not utility-app-tier)

---

## Traction (If Applicable)

*Replace with your actual metrics:*

- [ ] Daily active users
- [ ] Items uploaded
- [ ] Outfits generated
- [ ] User retention (7-day, 30-day)
- [ ] Avg. items per user

---

## Roadmap

### Now (v1.0)
- ✅ Upload & AI analyze
- ✅ Smart filtering (category, clean/worn, sort)
- ✅ AI Stylist with reasoning
- ✅ Edit metadata
- ✅ Mark as worn

### Next (v1.1)
- [ ] Outfit history
- [ ] Favorites / saved looks
- [ ] "More like this" suggestions
- [ ] Weather integration

### Future (v2.0)
- [ ] Outfit calendar
- [ ] "What's missing" gap analysis
- [ ] Social: share fits, get feedback
- [ ] Packing assistant
- [ ] Shopping integration (what to buy next)

---

## The Team

**Karthikeya Garaga**  
ECE Undergrad @ IIIT Bangalore  
Builder. Engineer. Believes great products are invisible—they just work.

---

## The Ask

*Tailor to your audience:*

- **For hackathon judges:** See the product. See the engineering. This isn't a wrapper on GPT—it's a thoughtfully constrained system that solves a real, daily problem.

- **For investors:** Early-stage, but architected for scale. Supabase + edge deployment + AI pipeline = ready to grow. Looking for [X] to build [Y].

- **For users:** Download. Upload your clothes. Ask it what to wear tomorrow.

---

## Demo Flow (2 minutes)

1. **Show empty state** → Clean, inviting
2. **Upload 4-5 items** → Watch AI validate & extract
3. **Try to upload a selfie** → Watch it get rejected with reason
4. **Ask "Presentation tomorrow"** → See outfit with reasoning
5. **Hit "Wear This"** → Items marked, back to closet
6. **Show filters** → Only clean items visible

**End with:** *"Every morning, in under 30 seconds. That's Wardrobe Engineer."*

---

## One More Thing

The name isn't random.

**Wardrobe** = the problem space.  
**Engineer** = the approach.

We don't just match colors. We apply constraint satisfaction, color theory, and practical logic—like an engineer would. But wrapped in an experience that feels effortless.

**Your closet, but smarter.**

---

*Built with Next.js, Gemini AI, Supabase, and a lot of opinions about what good software should feel like.*
