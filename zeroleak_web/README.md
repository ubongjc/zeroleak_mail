# 🔒 ZeroLeak Mail - Web Application

Privacy-first disposable email service with transparent auditing, automatic leak detection, and spam protection.

## 🎯 Features

### Core Features
- **Disposable Email Aliases**: Create unlimited unique email addresses for each service
- **Automatic Leak Detection**: Integration with HaveIBeenPwned API to detect data breaches
- **Decoy Token Seeding**: Embed unique tokens in emails to detect when they're leaked
- **Spam Protection**: Advanced spam detection with automatic filtering
- **Auto-Kill on Leak**: Automatically disable aliases when breaches are detected
- **Email Forwarding**: Forward emails to your real address (sanitized and with banners)
- **Transparent Auditing**: Complete audit log of all actions and security events
- **Receipt Management**: Extract and organize receipts for tax purposes
- **Custom Domains**: Use your own domain for aliases (premium feature)

### Security & Privacy
- **Passkey Authentication**: WebAuthn-first with magic link fallback (Clerk)
- **End-to-End Visibility**: Complete transparency of all email handling
- **Privacy First**: No tracking, no data selling
- **Client-Side Encryption**: Sensitive data encrypted before storage
- **DKIM/DMARC Support**: Email authentication for custom domains

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 with Prisma 6
- **Authentication**: Clerk (passkeys/WebAuthn)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Email Providers**: SendGrid, Mailgun, Postmark, or Amazon SES
- **Breach Monitoring**: HaveIBeenPwned API
- **Storage**: AWS S3 / Cloudflare R2 (for attachments)
- **Payments**: Stripe
- **Observability**: Sentry + OpenTelemetry

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+
- Clerk account (for authentication)
- Email provider account (SendGrid, Mailgun, or Postmark)
- HaveIBeenPwned API key (optional but recommended)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd zeroleak_web
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following in `.env.local`:

   **Required:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - Email provider credentials (one of):
     - `SENDGRID_API_KEY` (recommended)
     - `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`
     - `POSTMARK_SERVER_TOKEN`

   **Optional but Recommended:**
   - `HIBP_API_KEY` - HaveIBeenPwned API key for breach monitoring
   - `CRON_SECRET` - Secret for cron job endpoint security
   - `SENTRY_DSN` - Error tracking

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
zeroleak_web/
├── app/
│   ├── api/
│   │   ├── health/              # Health check endpoint
│   │   ├── alias/               # Alias CRUD operations
│   │   ├── inbox/               # Email viewing endpoints
│   │   ├── audit/               # Audit log API
│   │   ├── export/              # Receipt export
│   │   ├── webhooks/
│   │   │   └── email/           # Email receiving webhook
│   │   └── cron/
│   │       └── breach-check/    # Periodic breach monitoring
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Dashboard layout with nav
│   │   └── dashboard/
│   │       ├── page.tsx         # Dashboard home
│   │       ├── aliases/         # Alias management UI
│   │       ├── inbox/           # Email inbox UI
│   │       ├── receipts/        # Receipt management
│   │       └── audit/           # Audit log viewer
│   ├── globals.css
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── lib/
│   ├── services/
│   │   ├── spam-detector.ts    # Spam detection logic
│   │   ├── breach-monitor.ts   # HIBP integration
│   │   └── email-forwarder.ts  # Email forwarding service
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # Utility functions
├── components/                  # Reusable UI components
├── prisma/
│   └── schema.prisma           # Database schema
└── public/                      # Static assets
```

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/health` - Service health check with database status

### Authenticated Endpoints
- `POST /api/alias` - Create new email alias
- `GET /api/alias` - List user's aliases (with pagination and filtering)
- `POST /api/alias/kill` - Permanently deactivate an alias
- `GET /api/inbox` - List received emails
- `GET /api/inbox/[emailId]` - Get email details
- `PATCH /api/inbox/[emailId]` - Update email (mark read/unread)
- `DELETE /api/inbox/[emailId]` - Delete email
- `GET /api/audit` - Get audit logs
- `POST /api/audit` - Get audit statistics
- `GET /api/export/receipts` - Export receipts (CSV, JSON, summary)

### Webhook Endpoints
- `POST /api/webhooks/email` - Receive incoming emails from email provider

### Cron Endpoints
- `GET /api/cron/breach-check` - Run breach check on all active aliases (requires `CRON_SECRET`)

## 💾 Database Schema

### Core Models

**User**
- Authentication via Clerk
- Role-based permissions (USER, PREMIUM, ADMIN)
- Stripe subscription integration
- Custom domain support

**Alias**
- Unique email aliases (localPart@domain)
- Status tracking (ACTIVE, KILLED, LEAKED, SUSPENDED)
- Decoy token for leak detection
- Spam counter for auto-kill
- Breach monitoring timestamps

**EmailMessage**
- Full email storage (headers, body, attachments)
- Spam scoring and status
- Read/unread tracking
- Forwarding status

**RelayEvent**
- Event logging (RECEIVED, FORWARDED, BLOCKED, SPAM_DETECTED, LEAK_DETECTED)
- Metadata for debugging

**ReceiptTag**
- Receipt extraction and categorization
- Tax year organization
- Encrypted document storage

**BreachCheck**
- Breach detection history
- Data class tracking
- Verification status

**AuditLog**
- Complete action logging
- IP address and user agent tracking
- Metadata for forensics

## 🔧 How It Works

### Email Flow

1. **Incoming Email**: Email provider receives email at alias address
2. **Webhook**: Provider sends webhook to `/api/webhooks/email`
3. **Processing**:
   - Parse email content
   - Run spam detection
   - Check for decoy token (leak detection)
   - Store email in database
   - Log relay event
4. **Forwarding** (if not spam):
   - Sanitize content (remove tracking pixels)
   - Add ZeroLeak banner
   - Forward to user's real email
   - Update forwarding status

### Leak Detection

**Method 1: Decoy Tokens**
- Unique token embedded in email address or content
- If token appears in received email → alias was leaked
- Automatically kill alias and notify user

**Method 2: HaveIBeenPwned Integration**
- Periodic checks via cron job (`/api/cron/breach-check`)
- Check each alias against breach database
- Calculate severity score
- Auto-kill if severe breach detected

### Spam Protection

- Content analysis (keywords, caps ratio, links)
- Sender pattern matching
- Header validation
- Scoring system (0-10+)
- Thresholds: 5.0 = spam, 7.5 = quarantine, 10.0 = block
- Auto-kill after 10 spam messages

## 🎨 User Interface

### Landing Page
- Feature showcase
- How it works
- Call-to-action

### Dashboard Pages
- **Home**: Statistics, recent aliases, recent emails
- **Aliases**: Create, view, filter, kill aliases
- **Inbox**: View received emails with filtering
- **Receipts**: Export for tax purposes
- **Audit Log**: Complete transparency of all actions

## 🔐 Security Features

1. **Authentication**: Passkey-first with Clerk
2. **Authorization**: Clerk middleware on all protected routes
3. **Encryption**: Client-side encryption for sensitive data
4. **Audit Logging**: All actions logged with IP and user agent
5. **CSRF Protection**: Built into Next.js
6. **Rate Limiting**: Configurable per endpoint
7. **Input Validation**: Zod schemas on all inputs
8. **SQL Injection Prevention**: Prisma ORM
9. **XSS Prevention**: React automatic escaping

## 🚢 Deployment

### Environment Setup

1. **Production Database**: Set up PostgreSQL instance
2. **Environment Variables**: Configure all required env vars
3. **Email Provider**: Configure webhook to point to your domain
4. **DNS**: Set up MX records for your email domain
5. **Cron Jobs**: Set up periodic breach checking (recommended: daily)

### Build & Deploy

```bash
# Build the application
npm run build

# Run database migrations
npx prisma migrate deploy

# Start production server
npm start
```

### Recommended Platforms
- **Vercel**: Automatic deployments with Next.js optimization
- **Railway**: Easy PostgreSQL + app hosting
- **Render**: Simple deployment with cron jobs
- **AWS**: Full control with ECS/RDS

### Cron Job Setup

For breach monitoring, set up a cron job or scheduled task:

**Vercel Cron** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/breach-check",
    "schedule": "0 2 * * *"
  }]
}
```

**GitHub Actions**:
```yaml
- cron: '0 2 * * *'  # Daily at 2 AM
  run: curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/breach-check
```

## 📧 Email Provider Setup

### SendGrid
1. Create account and verify domain
2. Get API key
3. Set up Inbound Parse webhook to `/api/webhooks/email`
4. Add `SENDGRID_API_KEY` to env

### Mailgun
1. Create account and add domain
2. Get API key
3. Set up Routes to forward to webhook
4. Add `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` to env

### Postmark
1. Create account and verify domain
2. Get server token
3. Set up Inbound webhook
4. Add `POSTMARK_SERVER_TOKEN` to env

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Audit Logs**: All user actions tracked
- **Health Check**: `/api/health` for uptime monitoring

## 🤝 Contributing

This is a privacy-focused project. Contributions welcome!

## 📄 License

See LICENSE file for details.

## 🙋 Support

For issues or questions, please open a GitHub issue.

---

Built with privacy and transparency in mind 🔒
