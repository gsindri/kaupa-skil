
# Iceland B2B Wholesale Comparison Platform

A comprehensive buyer-side B2B wholesale comparison and ordering tool designed specifically for the Icelandic market. This platform enables restaurants, hotels, and shops to compare unit-normalized prices across their authorized wholesalers, maintain price history, and place split orders via email.

## Developer Onboarding

- [Duplication Audit](duplication-audit.md) – inventory of duplicated code segments and remediation plans.

## 🎯 Core Features

### Phase 1 (Current Implementation)
- **Multi-tenant Authentication** - Secure user management with organization-based access
- **Supplier Credential Management** - Encrypted storage of supplier portal credentials with test functionality
- **Unit-Normalized Price Comparison** - Compare prices per kg, L, or unit across suppliers with VAT toggle
- **VAT Management** - Iceland-specific VAT rates (24% standard, 11% reduced) with ex-VAT/inc-VAT toggle
- **Order Composition** - Smart cart that automatically splits orders by supplier
- **Email Dispatch** - Generate and send orders via email with CSV/PDF attachments
- **Price History Tracking** - Visualize price trends over time per item and supplier
- **Audit Logging** - Complete audit trail for compliance and security

### Phase 2 (Planned)
- **API Connectors** - Direct integration with supplier APIs
- **EDI/Peppol Integration** - Electronic document interchange for orders and invoices
- **Advanced Entity Matching** - ML-powered product matching across suppliers
- **Mobile App** - Native mobile application for on-the-go ordering

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui with Radix UI primitives
- **Charts**: Recharts
- **Icons**: Lucide React

### Database Schema
The platform uses a multi-tenant PostgreSQL database with Row Level Security (RLS) for data isolation:

- **Core Tables**: `tenants`, `profiles`, `suppliers`, `supplier_credentials`
- **Product Data**: `catalog_product`, `supplier_product`, `categories`, `units`, `vat_rules`
- **Pricing**: `offer`, `item_matches` (for entity resolution)
- **Orders**: `orders`, `order_lines`, `order_dispatches`
- **System**: `connector_runs`, `audit_events`

### Security Features
- **Row Level Security (RLS)** - Database-level tenant isolation
- **Encrypted Credentials** - Supplier credentials encrypted at rest using libsodium
- **Audit Logging** - All sensitive operations tracked with metadata
- **Environment-based Secrets** - No hardcoded credentials or API keys

## 🇮🇸 Iceland Market Specifics

### Currency & Locale
- **Primary Currency**: ISK (Icelandic Króna)
- **Locale**: is-IS (Icelandic)
- **Number Formatting**: Uses Icelandic conventions

### VAT Configuration
- **Standard Rate**: 24% (most goods and services)
- **Reduced Rate**: 11% (food items, books, newspapers)
- **Zero Rate**: 0% (exports, certain services)

### Unit System
- **Weight**: kg, g (kilograms, grams)
- **Volume**: L, ml (liters, milliliters)  
- **Count**: each, pack, case
- **Conversion**: Automatic unit conversion for price comparison

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iceland-b2b-compare
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run database migrations**
   The SQL schema has been applied to your Supabase project.

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Default Login
The application requires sign-up. Create an account with any email and password to get started.

## 📋 User Guide

### 1. Authentication
- Sign up with email and password
- Profile creation is automatic with basic tenant setup

### 2. Supplier Management
- Navigate to **Suppliers** tab
- Select a supplier from the list
- Add credentials (username/password for portal access)
- Test connection to verify credentials
- Run price ingestion to fetch latest data

### 3. Price Comparison
- Visit **Price Comparison** page
- Use VAT toggle to switch between ex-VAT and inc-VAT pricing
- Search products by name, brand, or SKU
- Compare unit-normalized prices across suppliers
- Look for price badges (Best, Good, Average, Expensive)

### 4. Order Management
- Add items to cart from comparison table
- Review **Order Management** page
- Orders automatically split by supplier
- Add order notes if needed
- Dispatch orders via email to suppliers

### 5. Price History
- Access **Price History** page
- Select a product to view trends
- Charts show price evolution over time per supplier

## 🔧 Configuration

### VAT Rules
VAT rules are configurable in the database:
```sql
INSERT INTO vat_rules (code, rate) VALUES 
  ('standard', 0.24),
  ('reduced', 0.11),
  ('zero', 0.00);
```

### Units
Additional units can be added:
```sql
INSERT INTO units (code, name, base_unit, conversion_factor) VALUES
  ('kg', 'Kilogram', 'kg', 1.0),
  ('g', 'Gram', 'kg', 0.001);
```

### Suppliers
New suppliers can be added via SQL:
```sql
INSERT INTO suppliers (name, contact_email, ordering_email, connector_type) VALUES
  ('New Supplier', 'contact@supplier.is', 'orders@supplier.is', 'email');
```

## 🔒 Security Considerations

### Data Protection
- All supplier credentials are encrypted using libsodium sealed boxes
- Database access is strictly controlled via RLS policies
- Audit logging tracks all sensitive operations
- No plain-text passwords stored anywhere

### Tenant Isolation
- Each organization's data is completely isolated
- Cross-tenant data access is impossible at the database level
- All queries automatically scope to the user's tenant

### Compliance
- GDPR-ready with data minimization principles
- Audit trail for regulatory compliance
- Right to deletion supported via cascading deletes

## 🧪 Testing

### Running Tests
```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

### Test Coverage
- Unit tests for VAT calculations and unit conversions
- Integration tests for price comparison logic
- E2E tests for complete order flow

## 📚 API Documentation

The platform exposes a REST API for integration purposes. Key endpoints:

- `GET /api/v1/catalog/items` - Search and filter products
- `POST /api/v1/orders/compose` - Create order with supplier splits  
- `GET /api/v1/prices/history` - Price history data
- `POST /api/v1/suppliers/credentials` - Manage supplier credentials

Full OpenAPI 3.1 specification available at `/api/docs`.

## 🚧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── compare/        # Price comparison features
│   ├── orders/         # Order management
│   ├── suppliers/      # Supplier management
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── types/          # TypeScript type definitions
│   └── unitVat.ts      # Unit conversion and VAT engine
├── pages/              # Page components
└── integrations/       # External service integrations
    └── supabase/       # Supabase client and types
```

### Key Architectural Decisions
- **Supabase-first**: Leverages Supabase for auth, database, and file storage
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Component-based**: Modular React components for maintainability
- **Design System**: Consistent UI with shadcn/ui component library

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for all new code
- Follow existing component patterns
- Write tests for new functionality
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Review the documentation in the `/docs` folder

## 🗺️ Roadmap

### Q1 2024
- [ ] Advanced filtering and search
- [ ] Bulk order templates
- [ ] Email notification system
- [ ] Mobile-responsive improvements

### Q2 2024
- [ ] Supplier API connectors
- [ ] Advanced analytics dashboard
- [ ] Export/import functionality
- [ ] Multi-language support

### Q3 2024
- [ ] EDI/Peppol integration
- [ ] Machine learning entity matching
- [ ] Mobile application
- [ ] Advanced reporting

### Q4 2024
- [ ] Nordic market expansion
- [ ] Enterprise features
- [ ] Advanced workflow automation
- [ ] Third-party integrations

---

Built with ❤️ for the Icelandic B2B market
