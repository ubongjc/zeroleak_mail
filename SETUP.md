# 🚀 ZeroLeak Mail Setup Guide

Complete step-by-step guide to get ZeroLeak Mail running in development and production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Email Provider Setup](#email-provider-setup)
6. [Authentication Setup (Clerk)](#authentication-setup)
7. [Breach Monitoring Setup](#breach-monitoring-setup)
8. [Running the Application](#running-the-application)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL 16+** installed and running
- **Git** installed
- Accounts on:
  - [Clerk](https://clerk.com) - for authentication
  - [SendGrid](https://sendgrid.com) or [Mailgun](https://mailgun.com) or [Postmark](https://postmarkapp.com) - for email
  - [HaveIBeenPwned](https://haveibeenpwned.com/API/Key) - for breach monitoring (optional)

---

## Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd zeroleak_mail
```

### 2. Install Dependencies

**Web Application:**
```bash
cd zeroleak_web
npm install
```

**iOS Application (optional):**
```bash
cd zeroleak_ios
# Open in Xcode
open ZeroLeakMail.xcodeproj
```

---

## Database Setup

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-16
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE zeroleak_mail;

# Create user (optional)
CREATE USER zeroleak WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zeroleak_mail TO zeroleak;

# Exit
\q
```

### 3. Configure Database URL

Your database URL should look like:
```
postgresql://zeroleak:your_password@localhost:5432/zeroleak_mail
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cd zeroleak_web
cp .env.example .env.local
```

### 2. Configure Required Variables

Edit `.env.local` and add:

```bash
# Database
DATABASE_URL="postgresql://zeroleak:your_password@localhost:5432/zeroleak_mail"

# Clerk (see Authentication Setup section)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"

# Email Provider (choose one - see Email Provider Setup section)
SENDGRID_API_KEY="SG.xxxxx"

# Default email domain
DEFAULT_EMAIL_DOMAIN="zeroleak.email"
```

---

## Email Provider Setup

Choose ONE of the following providers:

### Option 1: SendGrid (Recommended)

1. **Create Account**: Sign up at [sendgrid.com](https://sendgrid.com)

2. **Get API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Full Access"
   - Copy the key to `.env.local`:
     ```bash
     SENDGRID_API_KEY="SG.xxxxx"
     ```

3. **Configure Inbound Parse**:
   - Go to Settings → Inbound Parse
   - Add your domain (or use SendGrid subdomain)
   - Set destination URL to: `https://your-domain.com/api/webhooks/email`
   - Enable spam check and POST raw email

4. **Verify Domain**:
   - Go to Settings → Sender Authentication
   - Follow steps to add DNS records
   - Wait for verification (can take up to 48 hours)

### Option 2: Mailgun

1. **Create Account**: Sign up at [mailgun.com](https://mailgun.com)

2. **Get API Key**:
   ```bash
   MAILGUN_API_KEY="xxxxx"
   MAILGUN_DOMAIN="mail.yourdomain.com"
   ```

3. **Configure Routes**:
   - Go to Sending → Routes
   - Create route with:
     - Expression: `match_recipient(".*@yourdomain.com")`
     - Actions: `forward("https://your-domain.com/api/webhooks/email")`

### Option 3: Postmark

1. **Create Account**: Sign up at [postmarkapp.com](https://postmarkapp.com)

2. **Get Server Token**:
   ```bash
   POSTMARK_SERVER_TOKEN="xxxxx"
   ```

3. **Configure Inbound**:
   - Go to Servers → Inbound
   - Set webhook URL to: `https://your-domain.com/api/webhooks/email`

---

## Authentication Setup (Clerk)

### 1. Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create new application
3. Choose "Email + Password" and "Passkeys" as sign-in methods

### 2. Get API Keys

1. Go to API Keys in your Clerk dashboard
2. Copy the keys to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"

# URLs for authentication
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

### 3. Configure Allowed Redirect URLs

In Clerk dashboard → Paths:
- Add `http://localhost:3000` for development
- Add your production domain for production

---

## Breach Monitoring Setup (Optional)

### 1. Get HaveIBeenPwned API Key

1. Go to [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)
2. Purchase API key (currently ~$3.50/month)
3. Add to `.env.local`:

```bash
HIBP_API_KEY="xxxxx"
```

### 2. Set Up Cron Job Secret

For the breach checking endpoint:

```bash
# Generate a random secret
CRON_SECRET="$(openssl rand -hex 32)"
```

Add to `.env.local`:
```bash
CRON_SECRET="your_random_secret_here"
```

---

## Running the Application

### 1. Generate Prisma Client

```bash
cd zeroleak_web
npx prisma generate
```

### 2. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will create all tables in your database.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 4. Verify Setup

1. **Open browser**: Navigate to `http://localhost:3000`
2. **Sign up**: Create a new account
3. **Create alias**: Try creating your first email alias
4. **Check database**: Verify data is being stored

```bash
npx prisma studio
```

This opens a GUI to view your database.

---

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd zeroleak_web
   vercel
   ```

3. **Configure Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.local`

4. **Configure Database**:
   - Use Vercel Postgres, or
   - Use external provider (Railway, Supabase, etc.)

5. **Set Up Cron Jobs**:
   Create `vercel.json` in `zeroleak_web/`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/breach-check",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```

### Option 2: Railway

1. **Create Account**: [railway.app](https://railway.app)

2. **Create New Project**:
   - Connect GitHub repo
   - Add PostgreSQL service
   - Copy database URL

3. **Configure Environment Variables**:
   - Add all variables from `.env.local`
   - Use Railway's database URL

4. **Deploy**: Railway auto-deploys on git push

### Option 3: Docker

1. **Build Image**:
   ```bash
   docker build -t zeroleak-mail .
   ```

2. **Run Container**:
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://..." \
     -e CLERK_SECRET_KEY="..." \
     zeroleak-mail
   ```

---

## DNS Configuration

### For Custom Email Domain

Add these DNS records:

**MX Record** (for receiving email):
```
Type: MX
Name: @
Value: [Your email provider's MX record]
Priority: 10
```

**SPF Record**:
```
Type: TXT
Name: @
Value: v=spf1 include:[your-provider-spf] ~all
```

**DKIM Record**:
```
Type: TXT
Name: [provided by email provider]
Value: [DKIM key from provider]
```

**DMARC Record**:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

---

## Testing Email Flow

### 1. Test Inbound Email

Send a test email to an alias you created:
```
merchant-test@zeroleak.email
```

### 2. Check Webhook

Monitor logs:
```bash
# In development
npm run dev

# Check terminal for webhook logs
```

### 3. Verify Database

```bash
npx prisma studio
```

Check:
- `EmailMessage` table for received email
- `RelayEvent` table for processing log
- Spam score and status

---

## Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL
# macOS:
brew services restart postgresql@16

# Linux:
sudo systemctl restart postgresql
```

### Clerk Authentication Issues

**Error**: "Invalid publishable key"

**Solution**:
- Verify keys in Clerk dashboard match `.env.local`
- Ensure you're using the correct environment (test vs production)
- Check that redirect URLs are configured

### Email Not Receiving

**Checklist**:
- [ ] Webhook URL is publicly accessible (use ngrok for local testing)
- [ ] DNS records are correctly configured
- [ ] Email provider webhook is enabled
- [ ] Check email provider logs for errors

**Local Testing with ngrok**:
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Use the ngrok URL for webhook:
# https://abc123.ngrok.io/api/webhooks/email
```

### Migration Issues

**Error**: "Migration failed"

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix:
npx prisma migrate resolve --applied "migration_name"
```

### Breach Monitoring Not Working

**Checklist**:
- [ ] `HIBP_API_KEY` is set
- [ ] Cron job is configured
- [ ] API key is valid (check HaveIBeenPwned dashboard)
- [ ] Rate limits not exceeded (1 request per 1.5 seconds)

---

## Performance Optimization

### Database Indexing

The schema includes indexes on:
- User lookup by `clerkId`
- Alias lookup by email
- Email messages by `aliasId` and `receivedAt`
- Audit logs by `userId` and `timestamp`

### Caching

Consider adding Redis for:
- Session caching
- API rate limiting
- Breach check results (cache for 24 hours)

### Email Processing

For high volume:
- Use queue system (Bull, BullMQ)
- Process emails asynchronously
- Scale webhook handlers horizontally

---

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] `CRON_SECRET` is set and strong
- [ ] Database password is strong
- [ ] Clerk is configured with 2FA
- [ ] Email provider has DKIM/SPF configured
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is enabled
- [ ] Sentry (or similar) is configured for error tracking

---

## Next Steps

1. ✅ Complete setup and test locally
2. ✅ Deploy to production
3. ✅ Configure DNS records
4. ✅ Test email flow end-to-end
5. ✅ Set up monitoring and alerts
6. ✅ Configure backup strategy for database
7. ✅ Set up cron jobs for breach monitoring

---

## Support

- **Documentation**: See [README.md](./zeroleak_web/README.md)
- **Issues**: Open a GitHub issue
- **Email**: Contact support team

---

**You're all set! 🎉**

ZeroLeak Mail is now ready to protect your email privacy with transparent auditing and automatic leak detection.
