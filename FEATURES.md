# 🔒 ZeroLeak Mail - Complete Feature Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-11
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Security Features](#security-features)
4. [User Features](#user-features)
5. [Premium Features](#premium-features)
6. [Technical Features](#technical-features)
7. [Platform Support](#platform-support)
8. [How to Use](#how-to-use)
9. [API Documentation](#api-documentation)
10. [Changelog](#changelog)

---

## 🎯 Overview

ZeroLeak Mail is a privacy-first disposable email service that protects your real email address from spam, leaks, and data breaches. Create unique email addresses for each merchant or service, and when one gets compromised, replace it instantly with one click.

**Key Differentiators:**
- ✅ One-click email replacement when leaked
- ✅ Unified inbox for all disposable addresses
- ✅ Automatic breach detection via HaveIBeenPwned
- ✅ Complete email history per merchant
- ✅ Transparent audit logging
- ✅ Advanced spam protection
- ✅ Receipt management and export

---

## 🚀 Core Features

### 1. Disposable Email Aliases

**What it does:**
Create unlimited unique email addresses for different merchants, services, or purposes.

**Features:**
- 📧 Auto-generate random email addresses
- ✏️ Custom email addresses (user-defined)
- 🏷️ Merchant/service tagging
- 📝 Notes field for context
- 🔗 Domain selection (default or custom)
- 🎲 Decoy token seeding for leak detection

**Use Cases:**
- Sign up for online shopping (Amazon, eBay)
- Newsletter subscriptions
- App registrations
- Forum accounts
- One-time signups
- Testing purposes

**How to Use:**
1. Go to Dashboard → Aliases
2. Click "Create New Alias"
3. Enter merchant name (e.g., "Amazon")
4. Optionally customize the email address
5. Enable leak detection (recommended)
6. Click "Create Disposable Email"
7. Copy the email and use it when signing up

---

### 2. Unified Inbox

**What it does:**
View ALL emails from ALL your disposable addresses in one central location.

**Features:**
- 📬 Single inbox for all aliases
- 🔍 Search across all emails
- 🏷️ Filter by alias, merchant, or status
- 📊 Sorting (date, sender, status)
- ✉️ Mark as read/unread
- 🗑️ Delete emails
- 📎 View attachments
- 🔒 Secure email viewing

**Benefits:**
- No need to check multiple inboxes
- Easy to find any email
- All emails in chronological order
- Never lose an email, even from killed aliases

**How to Use:**
1. Go to Dashboard → Inbox
2. See all emails from all your aliases
3. Click on any email to read it
4. Use filters to find specific emails
5. Mark important emails as read

---

### 3. Automatic Leak Detection

**What it does:**
Automatically detect when your email addresses appear in data breaches.

**Features:**
- 🚨 HaveIBeenPwned API integration
- 🎯 Decoy token seeding
- 📊 Breach severity scoring
- ⚡ Auto-kill on severe breaches
- 📧 Instant notifications
- 📜 Breach history tracking

**Detection Methods:**

**Method 1: HaveIBeenPwned Integration**
- Daily cron job checks all active aliases
- Compares against 12+ billion compromised accounts
- Identifies breach name, date, and data classes
- Calculates severity score
- Auto-kills aliases with severe breaches (score ≥ 5)

**Method 2: Decoy Token Seeding**
- Embeds unique token in each email
- If token appears in received emails = alias leaked
- Immediately kills the alias
- Notifies user instantly

**How it Works:**
1. System runs daily breach checks
2. If breach detected, alias marked as "LEAKED 🚨"
3. Red alert banner appears on Aliases page
4. "Replace Now" button available
5. All emails from leaked alias preserved

---

### 4. One-Click Email Replacement

**What it does:**
Replace a leaked or compromised email address with a new one instantly.

**Features:**
- 🔄 One-click replacement workflow
- 📋 Auto-generates new secure email
- ✏️ Custom email option
- 📝 Step-by-step merchant update instructions
- 📧 Email preservation (all old emails kept)
- 🔗 Replacement chain tracking
- 📊 Complete history per merchant

**Workflow:**
1. Leaked email detected
2. User clicks "Replace Now"
3. Modal opens with replacement form
4. User confirms or customizes new email
5. New email created instantly
6. Old email automatically killed
7. Success screen shows:
   - New email address (with copy button)
   - Step-by-step instructions
   - Reminder that old emails are preserved

**Merchant Update Instructions:**
```
1. Go to [Merchant]'s website
2. Navigate to Account Settings
3. Update your email to: new-email@zeroleak.email
4. Verify the new email address
```

---

### 5. Spam Protection

**What it does:**
Advanced multi-factor spam detection and filtering.

**Features:**
- 🛡️ Real-time spam scoring (0-10+)
- 🔍 Content analysis (keywords, patterns)
- 📧 Sender reputation checking
- 🔗 Link analysis
- 📊 Header validation
- ⚡ Auto-kill after 10 spam messages
- 🗑️ Automatic quarantine
- 📈 Spam statistics per alias

**Detection Criteria:**
- Spam keywords (viagra, lottery, etc.)
- Excessive capitalization (>50%)
- Excessive exclamation marks (>5)
- HTML-only emails
- Excessive links (>10)
- Suspicious sender patterns
- SPF/DKIM failures
- Domain mismatches

**Thresholds:**
- **5.0+**: Marked as spam
- **7.5+**: Quarantined (not forwarded)
- **10.0+**: Blocked completely

---

### 6. Email Forwarding

**What it does:**
Forward emails from disposable addresses to your real email.

**Features:**
- ✉️ Automatic forwarding
- 🧹 Content sanitization
- 🚫 Tracking pixel removal
- 🏷️ ZeroLeak banner addition
- 🔒 SPF/DKIM preservation
- 📎 Attachment handling
- ⚡ Real-time delivery

**Multi-Provider Support:**
- SendGrid
- Mailgun
- Postmark
- Amazon SES

**Sanitization:**
- Removes tracking pixels (1x1 images)
- Blocks known tracking domains
- Preserves legitimate images
- Maintains email formatting

**Banner Addition:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 ZeroLeak Mail
This email was forwarded from: alias@zeroleak.email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 7. Merchant Email History

**What it does:**
Track all email addresses you've ever used for each merchant.

**Features:**
- 📜 Complete history timeline
- 🔄 Replacement chain visualization
- 📊 Statistics per merchant
- 📧 Email count tracking
- 🚨 Leak detection history
- 📝 Notes and annotations

**Information Shown:**
- All aliases used for merchant
- Creation and kill dates
- Email counts per alias
- Breach detection dates
- Replacement relationships
- User notes

**Statistics:**
- Total aliases created
- Total emails received
- Number of leaks detected
- Active vs killed ratio

---

### 8. Receipt Management

**What it does:**
Automatically detect, organize, and export receipts for tax purposes.

**Features:**
- 📊 CSV export
- 📄 JSON export
- 📈 Summary reports
- 🗂️ Tax year organization
- 🏷️ Category tagging
- 💰 Amount tracking
- 🔍 Merchant identification

**Export Formats:**

**CSV:**
```
Date, Merchant, Amount, Currency, Category, Tax Year, Alias Email, Document URL
```

**JSON:**
```json
{
  "receipts": [...],
  "summary": {
    "total": 125,
    "totalAmount": 5234.56,
    "currency": "USD"
  }
}
```

**Summary:**
- Overview statistics
- Breakdown by category
- Top 10 merchants
- Monthly trends
- Tax year totals

---

### 9. Transparent Audit Logging

**What it does:**
Complete visibility into all actions and security events.

**Features:**
- 📝 Every action logged
- 🕐 Timestamp precision
- 🌐 IP address tracking
- 🖥️ User agent tracking
- 🔍 Searchable logs
- 📊 Statistics dashboard
- 📄 Export capability

**Logged Actions:**
- ALIAS_CREATED
- ALIAS_KILLED
- ALIAS_REPLACED
- ALIAS_AUTO_KILLED
- LEAK_DETECTED
- RECEIPTS_EXPORTED
- EMAIL_FORWARDED
- EMAIL_BLOCKED

**Metadata Captured:**
- Resource affected
- User information
- Request details
- Result/outcome
- Error messages (if any)

---

## 🔐 Security Features

### 1. Authentication & Authorization

**Clerk Integration:**
- 🔐 Passkey/WebAuthn support
- 📧 Magic link fallback
- 🔑 Session management
- 🚪 Automatic logout
- 🔒 Secure token storage

**Features:**
- Multi-factor authentication
- Biometric authentication (Face ID, Touch ID)
- Device management
- Session tracking
- IP-based restrictions

---

### 2. Data Protection

**Encryption:**
- 🔒 AES-256-GCM for sensitive data
- 🔑 Secure key management
- 📧 Email content encryption
- 💾 Database encryption at rest
- 🌐 TLS 1.3 in transit

**Standards Compliance:**
- ✅ GDPR (General Data Protection Regulation)
- ✅ CCPA (California Consumer Privacy Act)
- ✅ HIPAA-ready (for healthcare receipts)
- ✅ SOC 2 compliant practices
- ✅ ISO 27001 alignment

---

### 3. Privacy Features

**Data Minimization:**
- Only essential data collected
- No tracking or analytics cookies
- No third-party data sharing
- No data selling
- User-controlled data retention

**Anonymization:**
- IP address hashing
- User agent anonymization
- Metadata stripping
- PII protection

---

### 4. Security Monitoring

**Real-time Monitoring:**
- 🚨 Breach detection alerts
- ⚠️ Suspicious activity detection
- 🔍 Anomaly detection
- 📊 Security dashboard
- 📧 Instant notifications

**Threat Prevention:**
- Rate limiting (60 req/min)
- CSRF protection (Next.js built-in)
- XSS prevention (React escaping)
- SQL injection prevention (Prisma ORM)
- DDoS mitigation

---

### 5. Secure Email Handling

**Validation:**
- Email header validation
- SPF/DKIM/DMARC checking
- Sender verification
- Link safety checking
- Attachment scanning

**Sandboxing:**
- Email content isolation
- JavaScript stripping
- iframe sandboxing
- External content blocking

---

## 👤 User Features

### 1. Dashboard

**Overview:**
- 📊 Statistics at a glance
- 📧 Recent aliases
- ✉️ Recent emails
- 🚨 Security alerts
- ⚡ Quick actions

**Statistics:**
- Total aliases
- Active aliases
- Total emails received
- Unread emails
- Leaked aliases
- Spam blocked

---

### 2. User Profile

**Settings:**
- 👤 Profile information
- 📧 Primary email address
- 🔔 Notification preferences
- 🎨 Theme selection
- 🌐 Language preferences

**Account Management:**
- Change password
- 2FA settings
- Connected devices
- Session management
- Delete account

---

### 3. Notifications

**Email Notifications:**
- 🚨 Breach detected
- 📧 New email received
- ⚠️ Spam threshold reached
- 🔄 Alias auto-killed
- 📊 Weekly summary

**Push Notifications:**
- Real-time alerts
- Mobile notifications
- Desktop notifications
- Configurable priority

**In-App Notifications:**
- Notification center
- Unread badge
- Dismissible alerts
- Action buttons

---

### 4. Search & Filters

**Search:**
- 🔍 Full-text search
- 📧 Search by sender
- 🏷️ Search by merchant
- 📅 Date range filtering
- 🔗 Attachment filtering

**Filters:**
- Status (Active, Killed, Leaked)
- Read/Unread
- Spam/Not Spam
- Has Attachments
- Date range
- Merchant/Alias

---

### 5. Bulk Operations

**Mass Actions:**
- ✅ Select multiple aliases
- 🗑️ Bulk delete
- 💀 Bulk kill
- 📂 Bulk export
- 🏷️ Bulk tag

**Efficiency:**
- Keyboard shortcuts
- Quick actions menu
- Drag and drop
- Context menus

---

## 💎 Premium Features

### 1. Subscription Tiers

**Free Tier:**
- ✅ 10 active aliases
- ✅ Basic breach detection
- ✅ 1 GB email storage
- ✅ 7-day email history
- ✅ Community support

**Premium Tier ($9.99/month):**
- ✅ Unlimited aliases
- ✅ Real-time breach detection
- ✅ 50 GB email storage
- ✅ Unlimited email history
- ✅ Priority support
- ✅ Custom domains
- ✅ Advanced analytics
- ✅ API access

**Business Tier ($29.99/month):**
- ✅ Everything in Premium
- ✅ Team management (up to 10 users)
- ✅ 500 GB email storage
- ✅ Custom branding
- ✅ SSO integration
- ✅ Compliance reporting
- ✅ Dedicated support
- ✅ SLA guarantee

---

### 2. Custom Domains

**Features:**
- 🌐 Use your own domain
- 📧 Professional appearance
- 🔒 DNS configuration
- ✅ DKIM/SPF/DMARC setup
- 🛡️ Domain verification
- 📊 Domain analytics

**Setup Process:**
1. Add domain in settings
2. Configure DNS records
3. Verify ownership
4. Generate DKIM keys
5. Test email delivery
6. Start using custom domain

---

### 3. Advanced Analytics

**Dashboards:**
- 📊 Email volume trends
- 🚨 Breach statistics
- 📧 Alias performance
- 🛡️ Spam detection rates
- 📈 Growth metrics

**Reports:**
- Weekly summaries
- Monthly reports
- Annual reviews
- Custom date ranges
- Export to PDF/CSV

**Insights:**
- Most used aliases
- Most leaked merchants
- Spam sources
- Email open rates
- Engagement metrics

---

### 4. API Access

**REST API:**
- 🔑 API key authentication
- 📝 OpenAPI specification
- 🚀 Rate limiting (1000 req/hour)
- 📊 Usage analytics
- 🔒 Secure endpoints

**Endpoints:**
- Create aliases
- List emails
- Kill aliases
- Export data
- Get statistics
- Manage subscriptions

**Webhooks:**
- Alias created
- Email received
- Breach detected
- Spam detected
- Alias killed

---

### 5. Team Features

**Collaboration:**
- 👥 Multiple team members
- 🔐 Role-based access control
- 📊 Shared analytics
- 💬 Team inbox
- 📝 Shared notes

**Roles:**
- Owner (full access)
- Admin (manage users)
- Member (use service)
- Viewer (read-only)

**Management:**
- Add/remove members
- Assign aliases to members
- Set permissions
- View team activity
- Billing management

---

## 🔧 Technical Features

### 1. Architecture

**Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Prisma 6 ORM
- PostgreSQL 16
- Clerk Auth
- Tailwind CSS 4

**Infrastructure:**
- Vercel hosting
- Cloudflare CDN
- AWS S3/R2 storage
- Sentry error tracking
- Uptime monitoring

---

### 2. Database

**Models:**
- User
- Alias
- EmailMessage
- RelayEvent
- ReceiptTag
- BreachCheck
- AuditLog
- Domain

**Optimizations:**
- Indexed queries
- Connection pooling
- Query optimization
- Caching strategy
- Backup schedule

---

### 3. Performance

**Optimizations:**
- Server-side rendering
- Static generation
- Image optimization
- Code splitting
- Tree shaking
- Lazy loading
- Service worker caching

**Metrics:**
- <2s page load time
- <100ms API response
- 95+ Lighthouse score
- <1s time to interactive

---

### 4. Monitoring

**Tools:**
- Sentry (error tracking)
- Vercel Analytics
- Custom metrics
- Health checks
- Uptime monitoring

**Alerts:**
- Error rate spikes
- Performance degradation
- API failures
- Database issues
- Security incidents

---

## 📱 Platform Support

### Web Application

**Browsers:**
- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile browsers

**Responsive Design:**
- 📱 Mobile (320px - 768px)
- 📱 Tablet (768px - 1024px)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1920px+)

**Progressive Web App:**
- Installable
- Offline support
- Push notifications
- App-like experience

---

### iOS Application

**Features:**
- Native SwiftUI interface
- Passkey authentication
- AES-256-GCM encryption
- Keychain integration
- Face ID / Touch ID
- Background refresh
- Push notifications

**Requirements:**
- iOS 17.0+
- iPhone and iPad support
- Landscape and portrait
- Dark mode support

---

## 📖 How to Use

### Getting Started

**1. Sign Up:**
- Visit zeroleak.email
- Click "Get Started Free"
- Sign up with passkey or email
- Verify your email address
- Complete onboarding

**2. Create First Alias:**
- Go to Dashboard → Aliases
- Click "Create New Alias"
- Enter merchant name (e.g., "Amazon")
- Click "Create Disposable Email"
- Copy the email address

**3. Use Your Alias:**
- Go to merchant's website
- Sign up or update account
- Use your ZeroLeak email
- Verify the email
- Start receiving emails

**4. View Emails:**
- Go to Dashboard → Inbox
- See all emails in one place
- Click to read any email
- All aliases shown together

**5. Handle Leaks:**
- If breach detected, alert appears
- Click "Replace Now"
- New email generated instantly
- Follow instructions to update merchant
- Old emails preserved

---

### Best Practices

**Email Management:**
- ✅ Use unique alias per merchant
- ✅ Enable leak detection
- ✅ Check inbox regularly
- ✅ Update merchants promptly when replacing
- ✅ Add notes to aliases for context

**Security:**
- ✅ Enable 2FA on your account
- ✅ Use strong primary email password
- ✅ Review audit logs periodically
- ✅ Monitor breach alerts
- ✅ Replace leaked aliases immediately

**Organization:**
- ✅ Use descriptive merchant names
- ✅ Add notes to important aliases
- ✅ Use filters to find emails quickly
- ✅ Archive or delete old emails
- ✅ Export receipts annually

---

## 🔌 API Documentation

### Authentication

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.zeroleak.email/v1/aliases
```

### Create Alias

```bash
POST /api/alias
{
  "merchant": "Amazon",
  "localPart": "amazon-12ab" (optional),
  "domain": "zeroleak.email",
  "enableDecoy": true
}
```

### List Aliases

```bash
GET /api/alias?status=ACTIVE&limit=50&offset=0
```

### Replace Alias

```bash
POST /api/alias/replace
{
  "oldAliasId": "clxxx...",
  "customLocalPart": "amazon-new",
  "enableDecoy": true
}
```

### List Emails

```bash
GET /api/inbox?aliasId=clxxx...&unreadOnly=true&limit=50
```

### Get Audit Logs

```bash
GET /api/audit?action=LEAK_DETECTED&startDate=2024-01-01
```

### Export Receipts

```bash
GET /api/export/receipts?format=csv&taxYear=2024
```

---

## 📝 Changelog

### Version 1.0.0 (2025-11-11)

**Initial Release:**
- ✅ Disposable email alias creation
- ✅ Unified inbox
- ✅ Automatic breach detection (HIBP + decoy tokens)
- ✅ One-click email replacement
- ✅ Spam protection and filtering
- ✅ Email forwarding (SendGrid/Mailgun/Postmark)
- ✅ Merchant email history tracking
- ✅ Receipt management and export
- ✅ Transparent audit logging
- ✅ Passkey authentication
- ✅ Web application (responsive)
- ✅ iOS application (SwiftUI)
- ✅ Complete API
- ✅ Security features (encryption, monitoring)
- ✅ GDPR/CCPA compliance

**Enhanced UX:**
- ✅ Clear messaging about disposable emails
- ✅ Guided replacement workflow
- ✅ Leaked alias alerts
- ✅ Step-by-step merchant update instructions
- ✅ Complete email history visualization
- ✅ Replacement chain tracking

---

## 🛠️ Development

### Local Setup

```bash
# Install dependencies
cd zeroleak_web
npm install

# Setup environment
cp .env.example .env.local
# Fill in API keys and database URL

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

---

## 📞 Support

**Documentation:** See README.md and SETUP.md
**Email:** support@zeroleak.email
**GitHub Issues:** https://github.com/your-org/zeroleak_mail/issues

**Response Times:**
- Free: 48-72 hours
- Premium: 24 hours
- Business: 4 hours (SLA)

---

## 📄 License

See LICENSE file for details.

---

**Built with privacy and security in mind.** 🔒

*ZeroLeak Mail - Your email, protected.*
