
# Heilda

A modern procurement platform that streamlines supplier management, price comparison, and order processing for businesses.

## Features

- **Supplier Management**: Connect and manage multiple suppliers
- **Price Comparison**: Compare prices across suppliers in real-time
- **Smart Ordering**: Optimized ordering suggestions and delivery calculations
- **Analytics Dashboard**: Real-time insights into procurement activities
- **Multi-tenant Support**: Organization-based access control

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: TanStack Query, React Context
- **UI Components**: shadcn/ui
- **Testing**: Vitest, Playwright
- **Build Tool**: Vite

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   VITE_CDN_URL="https://your-cdn.example.com"
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

### Testing

Run unit tests:
```bash
pnpm test
```

Run end-to-end tests:
```bash
pnpm test:e2e
```

### Building

Build for production:
```bash
pnpm build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # Business logic and API calls
├── lib/                # Utilities and configurations
└── integrations/       # External service integrations
```

## Key Features

### Authentication & Authorization
- Multi-tenant architecture with role-based access
- Platform admin elevation system
- Audit logging for security compliance

### Supplier Integration
- HAR file processing for web scraping
- Real-time price monitoring
- Automated inventory synchronization

### Order Management
- Smart delivery optimization
- Multi-supplier order splitting
- Approval workflows

### Analytics
- Price anomaly detection
- Performance dashboards
- Export capabilities

## Environment Variables

Configure these in your `.env` file:

- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – your Supabase anonymous public key
- `VITE_CDN_URL` – base URL for serving cached images
- `E2E_EMAIL` – account email used for Playwright tests
- `E2E_PASSWORD` – password for the above account
- `E2E_SIGNUP_PASSWORD` — password used in sign-up flow tests

In CI, configure these as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets.

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.
