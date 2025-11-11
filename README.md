# ZeroLeak Mail

Privacy-first email alias service with per-merchant burner aliases, automatic leak detection, and seamless receipts export.

## Overview

ZeroLeak Mail provides disposable email aliases that protect your real email address from spam, leaks, and tracking. Each merchant gets a unique alias that can be instantly killed if compromised.

### Key Features

- **Per-Merchant Aliases**: Unique email address for each service
- **Automatic Leak Detection**: Seeded decoys detect when aliases are shared
- **One-Tap Kill**: Instantly deactivate compromised aliases
- **Receipts Export**: Export to PDF/CSV for tax filing and returns
- **Custom Domains**: Use your own domain (premium)
- **Client-Side Encryption**: Sensitive data encrypted before upload
- **Passkey Authentication**: WebAuthn-first with biometric support

## Project Structure

This repository contains both web and iOS applications:

```
zeroleak_mail/
├── zeroleak_web/          # Next.js web application
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   ├── lib/               # Utilities and clients
│   └── prisma/            # Database schema
│
└── zeroleak_ios/          # iOS native application
    └── ZeroLeakMail/      # SwiftUI app
        ├── App/           # App entry point
        ├── Features/      # Feature screens
        ├── Networking/    # API client
        ├── Crypto/        # Encryption
        └── Services/      # Core services
```

## Tech Stack

### Web (`zeroleak_web/`)
- Next.js 15 + TypeScript 5 + React 18
- Tailwind CSS + shadcn/ui
- Prisma 5 + PostgreSQL 16
- Clerk (Passkeys/WebAuthn)
- Stripe (Payments)
- Sentry (Observability)

### iOS (`zeroleak_ios/`)
- SwiftUI + Swift 5.9+
- CryptoKit (Client-side encryption)
- AuthenticationServices (Passkeys)
- Combine (Reactive programming)

## Quick Start

### Web Application

```bash
cd zeroleak_web
npm install
cp .env.example .env.local
# Configure environment variables
npm run dev
```

See [zeroleak_web/README.md](./zeroleak_web/README.md) for detailed setup.

### iOS Application

```bash
cd zeroleak_ios
open ZeroLeakMail.xcodeproj
# Configure API URL and domain in code
# Build and run in Xcode
```

See [zeroleak_ios/README.md](./zeroleak_ios/README.md) for detailed setup.

## Architecture

### Data Flow

```
iOS/Web Client
    ↓ (Encrypted)
Next.js API Routes
    ↓
Prisma ORM
    ↓
PostgreSQL
```

### Email Relay Flow

```
External Email
    ↓
Mailgun/Postmark
    ↓ (Webhook)
Next.js API
    ↓ (Check Status)
Prisma/PostgreSQL
    ↓ (Forward or Block)
User's Real Email
```

### Leak Detection

1. Decoy tokens embedded in alias metadata
2. Monitoring for unexpected usage patterns
3. Alert user immediately on detection
4. Auto-kill option available

## Core Data Models

- **User**: Account with roles and subscriptions
- **Alias**: Email aliases with merchant association
- **RelayEvent**: Email forwarding events
- **ReceiptTag**: Receipt attachments with metadata
- **Domain**: Custom domain configurations
- **AuditLog**: Security and compliance logs

## API Endpoints

### Public
- `GET /api/health` - Health check

### Authenticated
- `POST /api/alias` - Create alias
- `GET /api/alias` - List aliases
- `POST /api/alias/kill` - Kill alias
- `GET /api/export/receipts` - Export receipts

See OpenAPI documentation for full API reference.

## Security

### Authentication
- Passkeys (WebAuthn) primary method
- Magic links as fallback
- JWT tokens for API access

### Encryption
- Client-side AES-256-GCM encryption
- Server only stores ciphertext
- Keys stored in device Keychain

### Email Security
- DKIM/DMARC verification
- SPF records
- Spam filtering
- Rate limiting

## Privacy

- **Zero-knowledge architecture**: Server cannot decrypt sensitive data
- **No tracking**: No analytics or tracking pixels
- **Data minimization**: Only essential data collected
- **Right to deletion**: Full GDPR compliance
- **Data export**: Export all your data anytime

## Monetization

- **Free Tier**: 10 aliases, basic features
- **Premium** ($2.99/mo): Unlimited aliases, custom domains, priority support
- **Custom Domain Add-on**: Use your own domain

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Xcode 15+ (for iOS)
- Clerk account
- Stripe account

### Running Locally

1. **Start database**
   ```bash
   # Using Docker
   docker run -d -p 5432:5432 \
     -e POSTGRES_PASSWORD=postgres \
     postgres:16-alpine
   ```

2. **Run web app**
   ```bash
   cd zeroleak_web
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Run iOS app**
   ```bash
   cd zeroleak_ios
   open ZeroLeakMail.xcodeproj
   # Build in Xcode
   ```

### Testing

```bash
# Web
cd zeroleak_web
npm test

# iOS
cd zeroleak_ios
xcodebuild test -project ZeroLeakMail.xcodeproj
```

## Deployment

### Web Application
- Deploy to Vercel, Railway, or AWS
- Set up PostgreSQL instance
- Configure environment variables
- Run database migrations

### iOS Application
- Build for App Store
- Configure associated domains
- Submit for review

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Roadmap

- [ ] Browser extension for auto-fill
- [ ] Android app
- [ ] Custom email forwarding rules
- [ ] Scheduled alias rotation
- [ ] Team/family plans
- [ ] API for developers

## License

[License TBD]

## Support

- **Documentation**: [docs link]
- **Issues**: [GitHub Issues](https://github.com/your-org/zeroleak_mail/issues)
- **Discord**: [community link]
- **Email**: support@zeroleak.app