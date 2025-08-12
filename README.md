
# Iceland B2B Wholesale Comparison Tool

A sophisticated B2B wholesale comparison and ordering platform designed specifically for the Icelandic market. This system enables restaurants, hotels, and shops to compare unit-normalized prices across their authorized Icelandic wholesalers and place split orders efficiently.

## 🚀 Live Demo

Visit the application to see the foundational architecture in action with Iceland-specific features including ISK currency, VAT handling, and supplier portal integration.

## 🏗️ Architecture Overview

This is the foundational scaffold for a comprehensive monorepo that will include:

### 📁 Planned Monorepo Structure
```
iceland-b2b-compare/
├── apps/
│   ├── api/                    # NestJS API with OpenAPI spec
│   ├── ingestor/              # Portal connectors & price list parsers
│   └── ui/                    # Next.js frontend (this app)
├── services/
│   ├── ml-entity-match/       # Python FastAPI for product matching
│   └── edi-peppol-adapter/    # Future EDI/Peppol integration
├── packages/
│   ├── shared/                # TypeScript types & Zod schemas
│   ├── queue/                 # BullMQ job definitions
│   ├── db/                    # Prisma schema & migrations
│   └── email/                 # Order dispatch & templating
├── docs/                      # Architecture docs & ADRs
└── tests/                     # Contract & integration tests
```

## 🎯 Core Features (Implemented)

### ✅ Professional UI Foundation
- **Iceland-specific design system** with ISK currency formatting
- **VAT toggle functionality** (24% and 11% Iceland rates)
- **Professional B2B interface** optimized for wholesale operations
- **Responsive design** for desktop and mobile use
- **Modern component architecture** with shadcn/ui

### ✅ Price Comparison Engine
- **Unit normalization** (compare per kg, L, each regardless of pack size)
- **Multi-supplier comparison** with price badges (best, good, average, expensive)
- **Real-time VAT calculations** with ex-VAT/inc-VAT toggle
- **Advanced filtering and search** across products and suppliers
- **Price history visualization** (foundation for charts)

### ✅ Dashboard & Analytics
- **Procurement overview** with key metrics
- **Activity monitoring** with supplier sync status
- **Price alerts** for significant changes
- **Quick actions** for common tasks

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend Planning**: NestJS, Prisma, PostgreSQL, Redis
- **Currency**: ISK (Icelandic Króna) with proper formatting
- **VAT Handling**: Iceland-specific rates (24% standard, 11% reduced)
- **Authentication**: Multi-tenant with buyer authorization

## 🇮🇸 Iceland Market Specifics

### VAT Compliance
- **Standard Rate**: 24% (most goods)
- **Reduced Rate**: 11% (food, books, accommodation)
- **Toggle Interface**: Easy switching between ex-VAT and inc-VAT views
- **Category-based VAT**: Automatic VAT rate application per product category

### Supplier Integration Strategy
- **Phase 1**: Gated portal access with buyer credentials
- **Phase 2**: Email-based price list imports (CSV/XLSX/PDF)
- **Phase 3**: API integrations where available
- **Phase 4**: EDI/Peppol compliance for automated invoicing

### Currency & Localization
- **Primary Currency**: ISK (Icelandic Króna)
- **Locale**: is-IS
- **Number Formatting**: Icelandic standards
- **Unit System**: Metric with common wholesale units (kg, L, each)

## 🔧 Development

### Prerequisites
- Node.js 18+ and npm
- Modern browser with ES2022 support

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:8080
```

### Available Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

## 🏆 Acceptance Criteria Status

### ✅ Completed
- [x] Professional Iceland-specific UI with ISK currency
- [x] VAT toggle functionality (ex-VAT/inc-VAT)
- [x] Price comparison table with unit normalization
- [x] Multi-supplier comparison with price badges
- [x] Dashboard with procurement analytics
- [x] Responsive design system
- [x] Modern component architecture

### 🚧 Planned (Monorepo Implementation)
- [ ] Portal connector architecture with Playwright
- [ ] CSV/XLSX price list parsers
- [ ] Entity matching ML service
- [ ] Order composition and email dispatch
- [ ] Multi-tenant authentication
- [ ] Audit logging and compliance
- [ ] Real supplier portal integrations

## 📊 Sample Data

The application includes realistic sample data for Icelandic wholesale scenarios:

- **Suppliers**: Véfkaupmenn, Heilsuhúsið, Matfuglinn
- **Products**: Local and imported goods with proper VAT categorization
- **Price Ranges**: Realistic ISK pricing for wholesale quantities
- **Pack Sizes**: Common wholesale packaging (500ml, 1kg, etc.)

## 🔒 Security & Compliance

### Data Protection
- **Tenant isolation**: Strict separation of buyer data
- **Credential security**: Encrypted storage of supplier portal access
- **Audit logging**: Comprehensive activity tracking
- **GDPR compliance**: Data minimization and buyer consent

### Supplier Ethics
- **Buyer authorization only**: No unauthorized scraping
- **Rate limiting**: Respectful portal access patterns
- **Credential management**: Secure, buyer-controlled access

## 📈 Roadmap

### Phase 1: Foundation (Current)
- ✅ UI framework and design system
- ✅ Price comparison foundation
- ✅ VAT handling system

### Phase 2: Core Backend
- [ ] API development with OpenAPI spec
- [ ] Database schema and migrations
- [ ] Authentication and multi-tenancy

### Phase 3: Supplier Integration
- [ ] Portal connector framework
- [ ] Email price list parsing
- [ ] Entity matching service

### Phase 4: Advanced Features
- [ ] Order management system
- [ ] EDI/Peppol integration
- [ ] Advanced analytics and reporting

## 🤝 Contributing

This is the foundational scaffold for a production system. The current implementation demonstrates the UI/UX vision and core functionality patterns that will be extended in the full monorepo.

## 📄 License

Proprietary - Iceland B2B Wholesale Platform

---

**Note**: This is the UI foundation of a comprehensive B2B wholesale platform. The full monorepo implementation will include backend services, supplier connectors, and advanced procurement features as outlined in the architecture documentation.
