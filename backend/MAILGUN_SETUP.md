# Mailgun Email Setup Guide

## 1. Create Mailgun Account

1. Go to https://www.mailgun.com/
2. Sign up for a free account
3. Select **EU region** (as per James requirements)

## 2. Add and Verify Domain

### Option A: Use Mailgun Sandbox (Testing)
- Mailgun provides a sandbox domain for testing
- Limited to 300 emails/day
- Can only send to authorized recipients

### Option B: Add Custom Domain (Production)
1. Go to **Sending** → **Domains** → **Add New Domain**
2. Enter your domain (e.g., `goalcoin.com`)
3. Add DNS records:

```
TXT  @  v=spf1 include:mailgun.org ~all
TXT  k1._domainkey  [Mailgun provides this]
CNAME  email  mailgun.org
```

4. Wait for verification (can take up to 48 hours)

## 3. Get API Credentials

1. Go to **Settings** → **API Keys**
2. Copy your **Private API Key**
3. Note your **Domain Name**

## 4. Configure Environment Variables

Add to Render.com backend environment:

```bash
MAILGUN_API_KEY=your-private-api-key-here
MAILGUN_DOMAIN=your-domain.com  # or sandbox domain
MAILGUN_REGION=eu
FROM_EMAIL=GoalCoin <noreply@your-domain.com>
FRONTEND_URL=https://your-frontend-url.com
```

## 5. Test Email Sending

### Using the API:

```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### Using the service directly:

```typescript
import { emailService } from './services/emailService';

// Test connection
const isConnected = await emailService.testConnection();
console.log('Mailgun connected:', isConnected);

// Send test email
await emailService.sendVerificationEmail('user@example.com', 'test-token-123');
```

## 6. Email Templates

### Verification Email
- **Trigger**: User registration
- **Template**: `verification`
- **Data**: `{ token: string }`

### Password Reset
- **Trigger**: User requests password reset
- **Template**: `password-reset`
- **Data**: `{ token: string }`

### Weekly Digest
- **Trigger**: Cron job (weekly)
- **Template**: `weekly-digest`
- **Data**: `{ xpEarned, currentStreak, tier, rank }`

### Admin Alert
- **Trigger**: Critical system events
- **Template**: `admin-alert`
- **Data**: `{ title, message, details }`

## 7. Email Queue

Emails are sent asynchronously via BullMQ:

```typescript
import { emailJobs } from './queue/jobs';

// Queue verification email
await emailJobs.sendVerification('user@example.com', 'token123');

// Queue password reset
await emailJobs.sendPasswordReset('user@example.com', 'reset-token');

// Queue weekly digest
await emailJobs.sendWeeklyDigest('user@example.com', stats);
```

## 8. Monitoring

### Mailgun Dashboard
- Track delivery rates
- View bounces and complaints
- Monitor sending volume

### GoalCoin Logs
```bash
# View email worker logs
[Email Worker] Processing: verification to user@example.com
[Email Worker] ✅ Sent verification to user@example.com
```

## 9. Best Practices

### SPF, DKIM, DMARC Setup
```
TXT  @  v=spf1 include:mailgun.org ~all
TXT  k1._domainkey  [Mailgun DKIM key]
TXT  _dmarc  v=DMARC1; p=none; rua=mailto:postmaster@your-domain.com
```

### Email Limits
- **Sandbox**: 300 emails/day
- **Free Plan**: 5,000 emails/month
- **Flex Plan**: Pay as you go

### Unsubscribe Links
All marketing emails (weekly digest) include unsubscribe links as required by law.

## 10. Troubleshooting

### "Domain not verified"
- Check DNS records are correctly configured
- Wait up to 48 hours for propagation
- Use Mailgun's DNS verification tool

### "API key invalid"
- Ensure you're using the **Private API Key**, not Public
- Check for extra spaces in environment variable

### "Rate limit exceeded"
- Upgrade Mailgun plan
- Reduce email sending frequency
- Use batch sending for bulk emails

### Emails going to spam
- Complete SPF/DKIM/DMARC setup
- Warm up your domain (gradually increase volume)
- Avoid spam trigger words
- Include unsubscribe link

## 11. Production Checklist

- [ ] Custom domain added and verified
- [ ] SPF record configured
- [ ] DKIM record configured
- [ ] DMARC record configured
- [ ] API key added to Render environment
- [ ] Test emails sent successfully
- [ ] Unsubscribe flow working
- [ ] Email templates reviewed
- [ ] Monitoring enabled
- [ ] Backup email provider configured (optional)

## 12. Cost Estimate

- **Sandbox**: Free (300 emails/day)
- **Flex Plan**: $0.80 per 1,000 emails
- **Foundation**: $35/month (50,000 emails)

For MVP with ~1,000 users:
- ~1,000 verification emails
- ~1,000 weekly digests
- ~100 password resets
- **Total**: ~2,100 emails/month = **~$2/month**
