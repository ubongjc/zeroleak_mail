# ZeroLeak Mail - Web Application

Privacy-first email alias service with per-merchant burner aliases, automatic leak detection, and seamless receipts export.

## Features

- **Per-Merchant Aliases**: Unique email address for each merchant/service
- **Leak Detection**: Automated detection via seeded decoys
- **One-Tap Kill**: Instantly deactivate leaked aliases
- **Receipts Export**: Export to PDF/CSV for taxes and returns
- **Custom Domains**: Use your own domain for aliases (premium)
- **Passkey Auth**: WebAuthn-first authentication with magic link fallback

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 with Prisma 5
- **Auth**: Clerk (passkeys/WebAuthn)
- **Styling**: Tailwind CSS + shadcn/ui
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Stripe
- **Observability**: Sentry + OpenTelemetry
- **Email**: Mailgun/Postmark inbound relay

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+
- Clerk account
- Stripe account (for payments)
- Mailgun/Postmark account (for email relay)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in the required values in `.env.local`:
   - Database connection string
   - Clerk API keys
   - Stripe API keys
   - Storage credentials
   - Email relay credentials

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

## Project Structure

```
zeroleak_web/
├── app/
│   ├── api/              # API routes
│   │   ├── health/       # Health check endpoint
│   │   └── alias/        # Alias management
│   ├── (auth)/           # Auth pages (sign-in, sign-up)
│   └── (dashboard)/      # Protected dashboard pages
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## API Endpoints

### Public
- `GET /api/health` - Health check

### Authenticated
- `POST /api/alias` - Create new alias
- `GET /api/alias` - List user aliases
- `POST /api/alias/kill` - Kill an alias
- `GET /api/export/receipts` - Export receipts

See OpenAPI documentation for full API reference.

## Database Schema

Core models:
- **User**: User accounts with roles and subscriptions
- **Alias**: Email aliases with leak detection
- **RelayEvent**: Email relay events and logs
- **ReceiptTag**: Receipt attachments with metadata
- **Domain**: Custom domains with verification
- **AuditLog**: Security and compliance audit trail

## Security Features

- **Passkey Authentication**: WebAuthn-first with fallback
- **Client-Side Encryption**: Sensitive data encrypted before upload
- **RBAC**: Role-based access control
- **Audit Logging**: Comprehensive audit trail
- **DKIM/DMARC**: Email authentication
- **Rate Limiting**: API rate limiting

## Deployment

### Build

```bash
npm run build
npm start
```

### Database Migrations

Run migrations in production:
```bash
npx prisma migrate deploy
```
