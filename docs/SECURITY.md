
# Security Documentation

This document outlines the security measures, policies, and best practices implemented in the Iceland B2B Wholesale Comparison Platform.

## 🔐 Security Architecture

### Multi-Tenant Security Model
The platform implements a strict multi-tenant architecture with the following security layers:

1. **Database Level Security**
   - Row Level Security (RLS) policies on all tables
   - Tenant-scoped data access enforced at the SQL level
   - Cross-tenant data leakage prevention through policy enforcement

2. **Application Level Security**
   - User authentication via Supabase Auth
   - Session management with automatic token refresh
   - Role-based access control (RBAC)

3. **API Security**
   - All endpoints require authentication
   - Request validation using Zod schemas
   - Rate limiting on sensitive endpoints

## 🔑 Authentication & Authorization

### User Authentication
- **Email/Password Authentication**: Secure password-based login
- **Session Management**: JWT tokens with automatic refresh
- **Multi-Factor Authentication**: Ready for MFA implementation
- **Password Requirements**: Enforced through Supabase Auth policies

### Role-Based Access Control
Three primary roles with different permissions:

#### Admin
- Full access to tenant data
- User management capabilities
- System configuration access
- Audit log access

#### Manager  
- Price comparison and analysis
- Order creation and management
- Supplier relationship management
- Limited user management

#### Buyer
- Price comparison access
- Order creation (with approval workflows)
- Basic reporting access
- Read-only supplier information

### Tenant Isolation
```sql
-- Example RLS Policy for Orders
CREATE POLICY "Orders isolated by tenant" ON public.orders
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );
```

## 🔒 Data Protection

### Encryption at Rest

#### Supplier Credentials
All supplier credentials are encrypted using **libsodium sealed boxes** before storage:

```typescript
// Encryption (client-side)
const encryptedCredentials = sodium.crypto_box_seal(
  JSON.stringify(credentials),
  publicKey
);

// Storage
await supabase
  .from('supplier_credentials')
  .upsert({
    tenant_id: tenantId,
    supplier_id: supplierId,
    encrypted_blob: encryptedCredentials
  });
```

#### Database Encryption
- All database connections use TLS 1.3
- Supabase provides encryption at rest for all stored data
- Backup encryption enabled

### Encryption in Transit
- All API communications over HTTPS/TLS 1.3
- WebSocket connections secured with WSS
- Internal service communication encrypted

### Key Management
- **Development**: Environment variables
- **Production**: Prepared for HashiCorp Vault or AWS KMS
- **Rotation**: Key rotation procedures documented
- **Access**: Principle of least privilege for key access

## 🛡️ Security Controls

### Input Validation
- All user inputs validated using Zod schemas
- SQL injection prevention through parameterized queries
- XSS prevention through proper output encoding
- CSRF protection via Supabase's built-in mechanisms

### Rate Limiting
```typescript
// Example rate limiting configuration
const rateLimits = {
  login: '5 attempts per 15 minutes',
  priceSearch: '100 requests per minute', 
  orderSubmission: '10 orders per hour',
  credentialTest: '3 attempts per 5 minutes'
};
```

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
```

## 📊 Audit Logging

### Audit Events
All security-relevant events are logged in the `audit_events` table:

```sql
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Logged Events
- User authentication (login/logout)
- Credential creation/modification/deletion
- Order creation and dispatch
- Price data ingestion
- Configuration changes
- Failed authentication attempts
- Privilege escalation attempts

### Log Retention
- **Development**: 30 days
- **Production**: 2 years minimum
- **Compliance**: Extended retention as required

## 🚨 Incident Response

### Security Incident Classification

#### Severity 1 (Critical)
- Data breach with PII exposure
- Unauthorized admin access
- System compromise

#### Severity 2 (High)
- Unauthorized tenant data access
- Credential exposure
- Service disruption

#### Severity 3 (Medium)
- Failed authentication attempts
- Suspicious activity patterns
- Performance degradation

#### Severity 4 (Low)
- Minor configuration issues
- Non-critical log anomalies

### Response Procedures

1. **Detection**: Automated monitoring and manual reporting
2. **Assessment**: Severity classification and impact analysis
3. **Containment**: Immediate threat mitigation
4. **Investigation**: Root cause analysis and evidence collection
5. **Recovery**: Service restoration and security hardening
6. **Lessons Learned**: Post-incident review and improvement

### Contact Information
- **Security Team**: security@example.com
- **Emergency Hotline**: +354-XXX-XXXX
- **Incident Reporting**: incidents@example.com

## 🔍 Vulnerability Management

### Security Testing
- **Static Analysis**: Automated code scanning
- **Dependency Scanning**: Regular vulnerability assessment of dependencies
- **Penetration Testing**: Annual third-party security assessment
- **Bug Bounty**: Responsible disclosure program

### Patch Management
- **Critical Patches**: Applied within 24 hours
- **High Priority**: Applied within 1 week
- **Medium Priority**: Applied within 1 month
- **Low Priority**: Applied during regular maintenance windows

### Dependency Management
```json
{
  "scripts": {
    "audit": "pnpm audit --audit-level high",
    "audit-fix": "pnpm audit --fix",
    "security-check": "pnpm dlx @cyclonedx/bom"
  }
}
```

## 🏢 Compliance & Governance

### Data Privacy Regulations

#### GDPR Compliance
- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Data used only for stated purposes
- **Storage Limitation**: Automatic data deletion policies
- **Data Portability**: Export functionality for user data
- **Right to Deletion**: Cascading delete procedures

#### Data Processing Records
- **Data Categories**: Customer data, supplier data, transaction data
- **Processing Purposes**: Order management, price comparison, analytics
- **Data Retention**: Configurable retention periods by data type
- **Third Party Sharing**: Limited to authorized suppliers only

### Regulatory Requirements

#### Iceland Data Protection Act
- Personal data protection measures
- Data controller registration
- Cross-border data transfer restrictions

#### Financial Regulations
- Transaction audit trails
- VAT calculation accuracy
- Financial data retention requirements

## 🛠️ Security Configuration

### Environment Variables
```bash
# Required security environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Encryption keys
ENCRYPTION_KEY=your-encryption-key
SIGNING_SECRET=your-signing-secret

# Third-party APIs (if used)
SMTP_API_KEY=your-smtp-key
```

### Supabase Security Settings
```sql
-- Enable RLS on all tables
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Set password requirements
UPDATE auth.users SET 
  password_requirements = '{
    "min_length": 12,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": true
  }';
```

## 📋 Security Checklist

### Development
- [ ] All secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention measures
- [ ] CSRF protection enabled
- [ ] Dependency vulnerability scanning
- [ ] Code review for security issues

### Deployment
- [ ] TLS/SSL certificates configured
- [ ] Database encryption enabled
- [ ] Backup encryption configured
- [ ] Log aggregation set up
- [ ] Monitoring and alerting configured
- [ ] Rate limiting implemented
- [ ] Security headers configured

### Operations
- [ ] Regular security updates
- [ ] Access review procedures
- [ ] Incident response plan tested
- [ ] Backup and recovery tested
- [ ] Audit log review processes
- [ ] Compliance documentation updated

## 🔗 Security Resources

### Internal Documentation
- [API Security Guidelines](./API-SECURITY.md)
- [Deployment Security Checklist](./DEPLOYMENT-SECURITY.md)
- [Incident Response Playbook](./INCIDENT-RESPONSE.md)

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Iceland Data Protection Authority](https://www.personuvernd.is/)

### Security Tools
- **SAST**: CodeQL, SonarQube
- **DAST**: OWASP ZAP, Burp Suite
- **Dependency Scanning**: Snyk, npm audit
- **Infrastructure Scanning**: Terraform security, Checkov

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create public GitHub issues for security vulnerabilities
2. Email security concerns to: security@example.com
3. Include detailed reproduction steps and potential impact
4. Allow reasonable time for response and remediation

We appreciate your help in keeping the platform secure!

---

*Last updated: January 2024*
*Review cycle: Quarterly*
*Next review: April 2024*
