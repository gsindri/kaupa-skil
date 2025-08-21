# Dashboard & Pantry Mock Inventory

This document lists remaining hardcoded demo data powering the Dashboard and Pantry pages. Each entry includes the snippet where mock data appears and the plan for replacing it with live, tenant‑scoped queries.

| File / Component | Used by | Mock Snippet | Replacement Plan |
|---|---|---|---|
| `src/components/dashboard/DashboardOverview.tsx` | Dashboard KPI strip & filters | `const kpis = [{ title: 'Active suppliers', value: '3 / 5', ... }]`<br/>`<SelectItem value="org-1">Org 1</SelectItem>` | Replace with `useKpis(range)` hook querying suppliers, products, alerts and orders. Populate org filter from real workspaces. Show empty state when no data. |
| `src/pages/Pantry.tsx` | Pantry overview & inventory grid | `StockTrends` shows “Most Popular – Item X / Item Y”<br/>`StockAlerts` hardcodes `3 items` out of stock<br/>`DeliverySchedule` fixed date `July 20, 2024`<br/>`stockItems` array with `Milk`, `Eggs`, `Bread` | Implement hooks (`useInventory`, `useStockAlerts`, `useDeliveries`) reading `products`, `stock`, `orders`. Display neutral empty states when queries return no data. |

These mocks are removed in this PR to prepare for wiring the UI to real data sources.
