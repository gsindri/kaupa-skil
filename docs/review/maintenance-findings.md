# Maintenance Findings

## Typo Fix
- **Issue**: The Smart Reorder widget headline currently reads “Predicted stockouts,” missing the hyphen the rest of the product copy uses for “stock-outs.”
- **Impact**: Creates inconsistent terminology in the dashboard and reads like a typo compared to other surfaces.
- **Proposed Task**: Update the heading string in `SmartReorderWidget` to “Predicted stock-outs” and verify the empty state copy for consistency. 【F:src/components/dashboard/widgets/SmartReorderWidget.tsx†L25-L69】

## Bug Fix
- **Issue**: The default Icelandic unit catalogue uses camelCase keys (`baseUnit`, `conversionFactor`), but `UnitVatEngine` expects snake_case (`base_unit`, `conversion_factor`).
- **Impact**: Default conversions throw “Unit conversion not supported” errors because lookups never resolve.
- **Proposed Task**: Normalize the default config to the engine’s schema (or vice versa) and add coverage that exercises the helper. 【F:src/lib/unitVat.ts†L2-L220】

## Comment/Docs Discrepancy
- **Issue**: The global error boundary tells end users “Our team has been notified,” yet the component only logs to the console and has a TODO for real reporting.
- **Impact**: Misleads users during outages and undermines trust.
- **Proposed Task**: Either implement the promised reporting integration or adjust the copy to match current behaviour. 【F:src/components/common/GlobalErrorBoundary.tsx†L59-L77】

## Test Improvement
- **Issue**: Router test coverage omits the `/cart` child route, even though it’s defined alongside `/orders` and is crucial for the email checkout experience.
- **Impact**: Regressions that drop the cart route would pass the existing test suite.
- **Proposed Task**: Extend `router.test.ts` to assert the presence of `cart` (and other checkout routes) in the authenticated tree. 【F:src/router.test.ts†L1-L36】【F:src/router.tsx†L37-L120】
