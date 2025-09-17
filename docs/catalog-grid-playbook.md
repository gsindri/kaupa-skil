# Catalog Grid Visual & Practical Playbook

## Objective
Deliver a premium, calm catalog grid that improves scanning speed and decision-making without shipping code yet. This playbook converts the 17-point directive into actionable requirements, acceptance criteria, and validation checkpoints for design and engineering partners.

## Guiding Principles
1. **Consistency over cleverness** – Fixed card anatomy keeps rows aligned even with variable content.
2. **Material surfaces, not borders** – Prefer surface layering, soft rings, and elevation changes over hard strokes.
3. **Single primary action** – Every card advertises exactly one immediate action.
4. **Accessibility is non-negotiable** – Focus rings, contrast ratios, and combined icon+label treatments are treated as features.

## Card Layout Contract
| Region | Specs | Acceptance Criteria |
| --- | --- | --- |
| Image surface | 4:3 aspect surface with 8–12 px internal padding, neutral branded backdrop. Use `object-fit: contain`; never stretch. | All imagery sits on identical surfaces. Tall/skinny images letterbox with branded fill. Images below minimum resolution enter remediation queue. |
| Title block | Reserve fixed height for two 15–16 px semibold lines at 130–140% leading. Apply line clamp 2 with ellipsis. | Card heights remain consistent across the grid. No title pushes card taller. |
| Meta line | Single line at 12–13 px, 80–85% opacity. | Meta text never wraps. Overflow truncates with ellipsis. |
| Footer rail | One-row footer: Availability chip → Supplier chip → Right-aligned price or primary CTA. Chips 12 px text, 24–28 px height. | Footer never wraps. Excess suppliers collapse into `+N`. Primary action is always rightmost element. |

**Grid Gaps & Radius**
- Horizontal gap: 20–24 px. Vertical gap: 24–28 px.
- Card corner radius: 16–20 px consistent across surfaces.
- Base elevation: subtle surface lift. Hover/focus adds a single elevation step plus soft ring.

## State & Interaction System
- **Idle Ring:** `white/10` (or equivalent token). **Hover Ring:** `white/20`. Hover adds ≤2% image zoom and optional ≤1 s glint animation (once per hover).
- **Focus Ring:** 2 px cyan ring with 4 px offset, always visible on keyboard focus.
- **Reduced Motion:** Honor `prefers-reduced-motion` by disabling zoom, glint, chip pulse, and easing transitions.
- **Primary CTA:** Quick-add icon/button aligned right. Transitions to count +/- control when items are in cart without shifting layout. Out-of-stock swaps to `Notify` (enabled) or disabled state with tooltip.
- **Secondary Actions:** Compare, favorite, etc., appear only on hover in a compact top-right affordance. Never introduce a second simultaneous primary action.

## Typography & Hierarchy
1. **Title:** 15–16 px semibold, 130–140% leading, 2-line clamp with ellipsis.
2. **Meta:** 12–13 px regular at 80–85% opacity; treat pack size here if not next to title.
3. **Price:** Right-aligned, tabular numerals. Support VAT toggle states. Optional helper for unit price (`ISK / kg`, `/ L`).
4. **Chips:** 12 px text, pill shape. Maintain ≥4.5:1 text contrast against fill.

**Hierarchy Litmus:** Squint test surfaces title first, availability chip second, supplier/price third. Adjust weights/opacities until this holds across density modes.

## Chip & Status System
- **Availability:** Icon + text (“In”, “Out”, “Unknown”). Color tokens: Teal/rose/gray. Chip pulses for 150 ms on status change (disabled under reduced motion).
- **Supplier:** Logo (Comfy/Cozy) + short name. In Compact density, hide logo and show text only. For ≥2 suppliers: `Best from {Supplier}` + `+N` chip; detail view handles full list.
- **Promotions/Flags:** Single badge anchored to top-right image corner (“Special”, “Short-dated”). Never stack.
- **Placement Rule:** Chips remain within footer rail only; no wrapping permitted.

## Imagery Treatment
1. Normalize backgrounds with branded surface (light navy for dark mode, white/5 for light mode).
2. Reject stretching. Letterbox unusual aspect ratios using surface fill. Center product imagery.
3. Enforce minimum resolution (define concrete pixel threshold during QA). Log offenders for asset remediation.
4. Optional light sharpen; default off. Apply only when QA flags blurred assets.
5. Hover zoom max 2%; align animation curve with rest of motion system.

**Fallbacks:** Missing/broken images display immediate placeholder silhouette on the same surface while maintaining full image height.

## Density Modes
| Mode | Intended Use | Image Size | Meta | Supplier Logo | Promo | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Comfy | Discovery/browse | Largest | Full meta line | Show logo | Allow 1 promo badge | Quick-add visible; chips spaced generously |
| Cozy (Default) | Balanced everyday | Medium | Single meta line | Show logo | Allow 1 promo badge | Default grid state |
| Compact | Power users | Smaller | Condensed meta | Text-only supplier | No promo unless critical | Tight spacing, maintain readable tap targets |

**Toggle & Persistence:** Expose density toggle in view menu. Persist selection per user/workspace via existing settings infrastructure.

## Visual Rhythm & Spacing
- Maintain vertical rhythm: align image bottoms, text blocks, and footers to lock row baselines.
- Use consistent padding tokens across cards to avoid micro-adjustments.
- Shadows appear only on hover; base relies on surface color differentiation.

## Edge Cases for the Design Board
Create dedicated mocks covering:
- Extremely long Icelandic product names (confirm 2-line clamp and ellipsis).
- No-image placeholder.
- ≥4 suppliers (validate `+3` treatment).
- Conflict between Out-of-stock and Special (Out-of-stock takes visual precedence; promo suppressed or demoted).
- Very light/white packshots (introduce subtle shadow or surface tint for separation).

## Accessibility Checklist
- Focus rings always visible on Tab. 2 px thickness, 4 px offset.
- Contrast ratios: Title ≥4.5:1, Meta ≥3:1, Chip text ≥4.5:1, icons meet 3:1 against surroundings.
- Hit areas ≥40 × 40 px for all interactive elements (card, buttons, chips).
- Availability/promo indicators always include icon + text; never rely on color alone.

## Practical Data Cues
- Keep pack size adjacent to title (e.g., “Granola Clusters · 600 g”).
- Optional unit price helper sits beneath price, right-aligned, lighter tone.
- Only active supplier appears in grid; full list shifts to detail drawer or modal.

## Loading, Empty, and Error States
- **Skeletons:** Mirror final layout with fixed image/text/footer heights. Apply shimmer within surfaces only.
- **Empty State:** Surface current filters, provide one-click reset, and suggest widening filters.
- **Image Errors:** Swap to placeholder immediately without flashing broken icon; card height remains constant.

## Micro-Interactions
- **Image Glint:** ≤1 s subtle sheen, plays once per hover.
- **Chip Pulse:** 150 ms highlight on availability change; suppressed when reduced motion is on.
- **Quick-Add Transition:** Plus morphs to count with smooth, non-jarring ease. No layout shift.

## Measurement & Validation
| Metric | Definition | Target | Validation Method |
| --- | --- | --- | --- |
| Row Stability Index | % of rows where card bottoms align within 2 px across sample data | ≥95% | Automated screenshot diffing across inventory variations |
| Scan Time | Time to locate target SKU in screenshot test | ≥15% faster vs baseline | Moderated usability study with before/after comparisons |
| Quick-add CTR | Quick-add clicks per 1 000 impressions | +10% vs baseline | Instrument in product analytics dashboard |
| Scroll Smoothness | Variance in scroll velocity | Reduced vs baseline | Telemetry from session replay/analytics |

**Measurement Hooks:** Ensure instrumentation captures density mode, supplier count, and availability state to segment results.

## Visual Directions to Explore
1. **Soft Industrial** – Cool navy bases, cyan focus rings, muted gray chips, teal availability. Keep promo accents desaturated.
2. **Warm Practical** – Deep ink neutrals with warm off-white image surfaces, brand-orange accents, greener availability tokens.

Run identical content through both palettes, test with preference study + key metrics. Lock winning palette before production build.

## Do & Don’t Reference
**Do**
- Use single chip row with overflow compressed into `+N`.
- Maintain clean imagery with internal padding; strip vendor drop shadows.
- Align price/action to right baseline.

**Don’t**
- Stack ribbons or badges on imagery.
- Allow chips to wrap or push title/meta.
- Mix filled and outline icon styles arbitrarily.

## Definition of Done Checklist
- Rows align visually; chip row never wraps; imagery consistent regardless of source.
- Availability & supplier info readable at a glance; primary action unmistakable.
- Focus states visible, hit targets generous, virtualization performs smoothly.
- Metrics show improvements in scan time and quick-add CTR; scroll smoothness maintained.

## Open Questions
- Confirm minimum acceptable image resolution (proposed: 800×600 px) and remediation workflow.
- Align on exact color tokens for teal/rose/gray chips in both visual directions.
- Validate persistence storage path for density preference (local storage vs user profile setting).

## Next Steps
1. Build Figma explorations for all density modes + edge cases using both visual directions.
2. Review with stakeholders focusing on Definition of Done checklist and open questions.
3. Hand off component specs to engineering with tokens, motion values, and accessibility annotations.
4. Plan measurement instrumentation updates ahead of rollout.
