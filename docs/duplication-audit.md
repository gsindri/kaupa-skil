# Duplication Audit

This document records code and config duplicates identified in the repository. No storage or SQL duplicates were detected during the audit.

## Ingestion Catalog Matching

| Paths | Exports | Line counts | Hashes | Similarity | Inbound imports | Root-cause | Canonical file | Codemod plan | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ingestion/match.ts`<br/>`supabase/functions/ingest-supplier/index.ts` | `matchOrCreateCatalog`<br/>`matchOrCreateCatalog` | 41<br/>278 | `9e56f050a1c60c61662fe971e18d1acf`<br/>`db749d8ff5e4502e6f6fa706f15b76c7` | ≈100% | `ingestion/runner.ts`<br/>_none_ | Function copied between ingestion script and edge function | `ingestion/match.ts` | Export helper and import into edge function | Divergent implementations across runtimes |

## Extension Manifest

| Paths | Exports | Line counts | Hashes | Similarity | Inbound imports | Root-cause | Canonical file | Codemod plan | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `extension/manifest.json`<br/>`extension/dist/manifest.json` | _n/a_ | 50<br/>50 | `26d97c14bc458cd3382fc2d1172ed07f`<br/>`26d97c14bc458cd3382fc2d1172ed07f` | 100% | _none_ | Built artifact committed alongside source manifest | `extension/manifest.json` | Generate dist manifest at build and remove from repo | Packaging scripts must handle build step |

## Header Stability Test

| Paths | Exports | Line counts | Hashes | Similarity | Inbound imports | Root-cause | Canonical file | Codemod plan | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/header-stability.spec.ts` lines 41–53<br/>`e2e/header-stability.spec.ts` lines 54–66 | _n/a_ | 13<br/>13 | `90cba1f5ac0d4658071ac9109c437b6a`<br/>`eb5d2335ce6711ceafdbde0a64450332` | High | _none_ | Repeated style snapshot logic in test | First block | Extract helper function to avoid duplication | Minimal; test maintenance overhead |
