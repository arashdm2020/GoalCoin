# 🛍️ Shopify Integration Guide

## Overview
Integrate Shopify merch store with GoalCoin platform for order-based challenge entry.

---

## 🎯 Integration Goals

### Features
- **Merch Store:** T-shirts, hoodies, accessories
- **Order Tracking:** Link purchases to user accounts
- **Challenge Entry:** Unlock 90-day challenge with purchase
- **Wallet Linking:** Connect order to wallet address
- **Automatic Tier Assignment:** Grant tier based on purchase

---

## 🔧 Setup Steps

### 1. Shopify Store Setup
1. Create Shopify store at https://shopify.com
2. Add products (merch items)
3. Configure payment gateway
4. Setup shipping zones

### 2. Create Custom App
```
Shopify Admin → Apps → App and sales channel settings → Develop apps
→ Create an app → Configure Admin API scopes
```

**Required Scopes:**
- `read_orders`
- `read_products`
- `read_customers`
- `write_customers` (for custom attributes)

### 3. Get API Credentials
```env
SHOPIFY_SHOP_NAME=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_API_VERSION=2024-01
```

---

## 📊 Database Schema

```sql
CREATE TABLE shopify_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  shopify_order_id TEXT NOT NULL UNIQUE,
  order_number TEXT NOT NULL,
  wallet_address TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tier_granted TEXT, -- 'FAN', 'FOUNDER', 'PLAYER'
  challenge_unlocked BOOLEAN DEFAULT FALSE,
  order_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shopify_orders_user ON shopify_orders(user_id);
CREATE INDEX idx_shopify_orders_wallet ON shopify_orders(wallet_address);
CREATE INDEX idx_shopify_orders_shopify_id ON shopify_orders(shopify_order_id);
```

---

## 🔗 Webhook Setup

### Configure Webhooks in Shopify
```
Settings → Notifications → Webhooks → Create webhook
```

**Webhook Events:**
- `orders/create` → New order placed
- `orders/paid` → Payment confirmed
- `orders/fulfilled` → Order shipped

**Webhook URL:**
```
https://your-api.com/api/shopify/webhooks/orders
```

---

## 💻 Backend Implementation

### Webhook Handler
```typescript
// backend/src/routes/shopifyRoutes.ts
import crypto from 'crypto';

function verifyShopifyWebhook(req: Request): boolean {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = JSON.stringify(req.body);
  
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64');
    
  return hash === hmac;
}

router.post('/webhooks/orders', async (req, res) => {
  if (!verifyShopifyWebhook(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const order = req.body;
  
  // Process order
  await shopifyService.processOrder(order);
  
  res.status(200).json({ received: true });
});
```

### Order Processing
```typescript
// backend/src/services/shopifyService.ts
export async function processOrder(orderData: any) {
  const walletAddress = orderData.note_attributes?.find(
    (attr: any) => attr.name === 'wallet_address'
  )?.value;
  
  if (!walletAddress) {
    console.log('No wallet address provided');
    return;
  }
  
  // Find or create user
  let user = await prisma.user.findFirst({
    where: { wallet: walletAddress }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        wallet: walletAddress,
        email: orderData.email,
        handle: orderData.customer?.first_name,
      }
    });
  }
  
  // Determine tier based on order total
  const tier = determineTier(parseFloat(orderData.total_price));
  
  // Create order record
  await prisma.shopifyOrder.create({
    data: {
      user_id: user.id,
      shopify_order_id: orderData.id.toString(),
      order_number: orderData.order_number,
      wallet_address: walletAddress,
      total_price: parseFloat(orderData.total_price),
      currency: orderData.currency,
      tier_granted: tier,
      challenge_unlocked: true,
      order_data: orderData,
    }
  });
  
  // Update user tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier,
      paid: true,
    }
  });
}

function determineTier(totalPrice: number): string {
  if (totalPrice >= 49) return 'PLAYER';
  if (totalPrice >= 35) return 'FOUNDER';
  return 'FAN';
}
```

---

## 🎨 Storefront Integration

### Add Wallet Input Field
```liquid
<!-- Shopify theme: cart page or checkout -->
<div class="wallet-input">
  <label for="wallet_address">
    GoalCoin Wallet Address (Optional)
  </label>
  <input 
    type="text" 
    id="wallet_address" 
    name="attributes[wallet_address]"
    placeholder="0x..."
  />
  <small>
    Link your purchase to unlock the 90-Day Challenge!
  </small>
</div>
```

### Custom Checkout Script
```javascript
// Add to theme.liquid or checkout settings
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Auto-fill wallet if user is logged in to GoalCoin
  const savedWallet = localStorage.getItem('goalcoin_wallet');
  if (savedWallet) {
    document.getElementById('wallet_address').value = savedWallet;
  }
});
</script>
```

---

## 📱 API Endpoints

### Redeem Order Code
```typescript
POST /api/shopify/redeem
{
  "order_number": "1001",
  "email": "user@example.com",
  "wallet_address": "0x..."
}

Response:
{
  "success": true,
  "tier": "FOUNDER",
  "challenge_unlocked": true,
  "message": "Order linked successfully!"
}
```

### Check Order Status
```typescript
GET /api/shopify/orders/:order_number

Response:
{
  "order_number": "1001",
  "tier_granted": "FOUNDER",
  "challenge_unlocked": true,
  "wallet_linked": true
}
```

---

## 🔐 Security

### Best Practices
- Verify webhook signatures
- Rate limit redemption endpoint
- Validate wallet addresses
- Prevent duplicate redemptions
- Log all order processing

### Fraud Prevention
```typescript
// Check for duplicate redemptions
const existingOrder = await prisma.shopifyOrder.findUnique({
  where: { shopify_order_id: orderId }
});

if (existingOrder && existingOrder.challenge_unlocked) {
  throw new Error('Order already redeemed');
}
```

---

## 💰 Pricing Tiers

### Merch + Challenge Bundle
- **Fan Tier ($19):** T-shirt + 90-Day Challenge
- **Founder Tier ($35):** Hoodie + Challenge + NFT
- **Player Tier ($49):** Premium Bundle + All Benefits

---

## 📊 Analytics

### Track Metrics
- Orders per day
- Conversion rate (orders → challenge entries)
- Average order value
- Wallet link rate
- Tier distribution

---

## 🚀 Implementation Timeline

### Phase 1 (Week 1)
- Setup Shopify store
- Add products
- Configure webhooks

### Phase 2 (Week 2)
- Build webhook handler
- Implement order processing
- Test redemption flow

### Phase 3 (Week 3)
- Add storefront customizations
- Launch merch store
- Monitor & optimize

---

**Status:** Documentation complete, ready for Phase 2 implementation
