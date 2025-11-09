# 📝 CMS Setup Guide for GoalCoin

## Overview
This guide explains how to set up a headless CMS for managing warm-up sessions and meal plans content.

---

## 🎯 Recommended CMS Options

### Option 1: Supabase (Recommended for MVP)
**Pros:**
- Free tier available
- PostgreSQL-based (same as our main DB)
- Built-in auth & storage
- Real-time subscriptions
- Easy to integrate

**Setup Steps:**
1. Create Supabase project at https://supabase.com
2. Create tables:
   - `warmup_content` (id, title, description, video_url, difficulty, approved, created_at)
   - `meal_content` (id, title, description, ingredients, region, country_codes, tier, approved, created_at)
3. Enable Row Level Security (RLS)
4. Add API keys to `.env`:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_KEY=your_anon_key
   ```

### Option 2: Strapi
**Pros:**
- Open-source
- Self-hosted option
- Rich admin UI
- Content versioning

**Setup Steps:**
1. Install Strapi: `npx create-strapi-app@latest cms`
2. Create content types for warmups and meals
3. Configure API permissions
4. Deploy to Render/Heroku

### Option 3: Directus
**Pros:**
- Database-first approach
- Works with existing PostgreSQL
- Powerful API
- Free & open-source

**Setup Steps:**
1. Install: `npm create directus-project@latest`
2. Connect to existing PostgreSQL
3. Configure collections
4. Set up API access

---

## 🤖 AI Content Generation

### Setup for Meal Generation

```typescript
// backend/src/services/aiContentService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMealContent(params: {
  country: string;
  tier: 'budget' | 'balanced' | 'protein-boost';
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}) {
  const prompt = `Generate a healthy ${params.category} meal for ${params.country} 
  with ${params.tier} tier. Include:
  - Title (max 50 chars)
  - Description (max 100 chars)
  - Ingredients list
  - Substitutions
  - Prep time
  - Estimated calories and protein
  
  Format as JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Content Validation

```typescript
export function validateMealContent(content: any): boolean {
  // Length caps
  if (content.title.length > 50) return false;
  if (content.description.length > 100) return false;
  
  // Profanity filter
  const profanityList = ['bad', 'words', 'here'];
  const text = `${content.title} ${content.description}`.toLowerCase();
  if (profanityList.some(word => text.includes(word))) return false;
  
  // Dedupe via embeddings (optional)
  // Use OpenAI embeddings API to check similarity
  
  return true;
}
```

---

## 📊 Content Management Workflow

### 1. Content Creation
- AI generates content OR admin manually creates
- Content saved with `approved = false`
- Stored in CMS database

### 2. Review & Approval
- Admin reviews content in CMS dashboard
- Checks for quality, accuracy, cultural appropriateness
- Sets `approved = true` when ready

### 3. API Integration
```typescript
// Only fetch approved content
const meals = await supabase
  .from('meal_content')
  .select('*')
  .eq('approved', true)
  .eq('country_code', userCountry);
```

### 4. Caching
```typescript
// Cache approved content for 24 hours
import NodeCache from 'node-cache';
const contentCache = new NodeCache({ stdTTL: 86400 });

export async function getCachedMeals(country: string) {
  const cacheKey = `meals_${country}`;
  let meals = contentCache.get(cacheKey);
  
  if (!meals) {
    meals = await fetchMealsFromCMS(country);
    contentCache.set(cacheKey, meals);
  }
  
  return meals;
}
```

---

## 🔐 Security & Licensing

### Content Licensing
- **Text:** Must be original or properly licensed
- **Images:** Use royalty-free sources (Unsplash, Pexels)
- **Videos:** Own content or licensed from creators

### Audit Logging
```sql
CREATE TABLE content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'approved', 'rejected', 'updated'
  admin_id TEXT,
  ai_prompt TEXT,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 Admin Endpoints

### Upload CSV/JSON
```typescript
POST /api/admin/content/upload
Content-Type: multipart/form-data

{
  "file": meals.csv,
  "type": "meals",
  "auto_approve": false
}
```

### Bulk Approve
```typescript
POST /api/admin/content/bulk-approve
{
  "content_ids": ["id1", "id2", "id3"],
  "type": "meals"
}
```

### Generate AI Content
```typescript
POST /api/admin/content/generate
{
  "type": "meals",
  "count": 10,
  "params": {
    "country": "NG",
    "tier": "budget"
  }
}
```

---

## 🚀 Implementation Priority

### Phase 1 (MVP) - Static Content
- ✅ Use hardcoded catalogs (already done)
- ✅ Basic meal & warmup data
- ⏳ Manual updates via code

### Phase 2 - CMS Integration
- 🔄 Setup Supabase
- 🔄 Migrate static content to CMS
- 🔄 Build admin approval UI

### Phase 3 - AI Generation
- 🔄 Integrate OpenAI API
- 🔄 Build content validation
- 🔄 Implement review workflow

---

## 💰 Cost Estimates

### Supabase (Free Tier)
- 500MB database
- 1GB file storage
- 2GB bandwidth
- **Cost: $0/month**

### OpenAI API
- GPT-4: ~$0.03 per meal generated
- 1000 meals = $30
- **Cost: ~$30 one-time**

### Strapi (Self-hosted)
- Render.com: $7/month
- **Cost: $7/month**

---

## 📚 Next Steps

1. **Choose CMS:** Supabase recommended for MVP
2. **Setup Database:** Create content tables
3. **Migrate Content:** Move static catalogs to CMS
4. **Build Admin UI:** Simple approval interface
5. **Add AI Generation:** Optional for Phase 2

---

## 🔗 Resources

- Supabase Docs: https://supabase.com/docs
- Strapi Docs: https://docs.strapi.io
- Directus Docs: https://docs.directus.io
- OpenAI API: https://platform.openai.com/docs

---

**Status:** Documentation complete, ready for implementation in Phase 2
