# Graph Report - webgis-kepri  (2026-08-27)

## Corpus Check
- 124 files · ~72,330 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 739 nodes · 1017 edges · 73 communities (51 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- cagarBudaya.service.ts
- edit/page.tsx
- devDependencies
- cagarBudaya.controller.ts
- backend/package.json
- compilerOptions
- dependencies
- What You Must Do When Invoked
- What You Must Do When Invoked
- What You Must Do When Invoked
- What You Must Do When Invoked
- Map.tsx
- SiteDetailPanel.tsx
- HomeClient.tsx
- SiteForm.tsx
- Lightbox.tsx
- compilerOptions
- services/cagarBudaya.ts
- statistik/page.tsx
- graphify reference: extra exports and benchmark
- graphify reference: extra exports and benchmark
- graphify reference: extra exports and benchmark
- getThemeColors
- graphify reference: extra exports and benchmark
- next.config.ts
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- seed.ts
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- app/layout.tsx
- app/page.tsx
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- geo.ts
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- README.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- seedAdmin.ts
- This is NOT the Next.js you know
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- backend/AGENTS.md
- backend/.codex/skills/graphify/references/extraction-spec.md
- backend/.opencode/opencode.json
- backend/.opencode/skills/graphify/references/extraction-spec.md
- frontend/.codex/skills/graphify/references/extraction-spec.md
- eslint.config.mjs
- frontend/.opencode/opencode.json
- frontend/.opencode/skills/graphify/references/extraction-spec.md
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Site` - 13 edges
3. `getThemeColors()` - 13 edges
4. `fail()` - 12 edges
5. `What You Must Do When Invoked` - 12 edges
6. `What You Must Do When Invoked` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `What You Must Do When Invoked` - 12 edges
9. `authFetch()` - 11 edges
10. `AppError` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CategoryIconProps` --references--> `Category`  [EXTRACTED]
  frontend/components/icons/CategoryIcon.tsx → frontend/data/sites.ts
- `deleteCagarBudaya()` --calls--> `isNotFoundError()`  [EXTRACTED]
  backend/src/services/cagarBudaya.service.ts → backend/src/utils/prisma.ts
- `deleteGalleryItem()` --calls--> `isNotFoundError()`  [EXTRACTED]
  backend/src/services/cagarBudaya.service.ts → backend/src/utils/prisma.ts
- `generateMetadata()` --calls--> `getCagarBudayaSiteBySlug()`  [EXTRACTED]
  frontend/app/cagar-budaya/[slug]/page.tsx → frontend/services/cagarBudaya.ts
- `CagarBudayaDetailPage()` --calls--> `getThemeColors()`  [EXTRACTED]
  frontend/app/cagar-budaya/[slug]/page.tsx → frontend/lib/theme.ts

## Import Cycles
- None detected.

## Communities (73 total, 22 thin omitted)

### Community 0 - "cagarBudaya.service.ts"
Cohesion: 0.08
Nodes (38): app, env, supabaseServiceKey, supabaseUrl, prisma, PrismaErrorCode, errorHandler(), notFoundHandler() (+30 more)

### Community 1 - "edit/page.tsx"
Cohesion: 0.10
Nodes (38): AdminDashboardPage(), katColor, Site, statusColor, AdminLoginPage(), TambahSitusPage(), EditSitusPage(), GalleryItem (+30 more)

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (46): babel-plugin-react-compiler, eslint, eslint-config-next, dependencies, graphify, leaflet, leaflet.markercluster, next (+38 more)

### Community 3 - "cagarBudaya.controller.ts"
Cohesion: 0.07
Nodes (31): login, me, addGallery, create, findAll, findById, findBySlug, remove (+23 more)

### Community 4 - "backend/package.json"
Cohesion: 0.06
Nodes (35): author, description, devDependencies, nodemon, tsx, @types/bcrypt, @types/cors, @types/express (+27 more)

### Community 5 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 6 - "dependencies"
Cohesion: 0.07
Nodes (27): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+19 more)

### Community 7 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 9 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 10 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "Map.tsx"
Cohesion: 0.15
Nodes (16): BASEMAPS, BasemapSwitcher(), BasemapSwitcherProps, getPopupTarget(), isMapSizeReady(), Map(), MapProps, boundaries (+8 more)

### Community 12 - "SiteDetailPanel.tsx"
Cohesion: 0.16
Nodes (16): CagarBudayaDetailPage(), DetailPageProps, generateMetadata(), ShareButton(), ShareButtonProps, ShareStatus, SiteDetailPanel(), SiteDetailPanelProps (+8 more)

### Community 13 - "HomeClient.tsx"
Cohesion: 0.18
Nodes (14): ALL_CATEGORIES, Map, SitesResult, MapLegend(), PremiumLoading(), escapeRegExp(), Highlight(), KabupatenDropdownProps (+6 more)

### Community 14 - "SiteForm.tsx"
Cohesion: 0.16
Nodes (16): bannerStyle, cardStyle, cardTitleStyle, gridStyle, inputStyle, labelStyle, optionStyle, selectStyle (+8 more)

### Community 15 - "Lightbox.tsx"
Cohesion: 0.16
Nodes (14): DetailGallery(), DetailGalleryProps, captionStyle, closeBtnStyle, counterStyle, figureStyle, Lightbox(), LightboxItem (+6 more)

### Community 16 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir, skipLibCheck (+7 more)

### Community 17 - "services/cagarBudaya.ts"
Cohesion: 0.17
Nodes (12): HomeContent(), ApiCategory, ApiStatus, ApiTingkat, CagarBudayaApiItem, CagarBudayaApiResponse, CagarBudayaDetailApiResponse, categoryMap (+4 more)

### Community 18 - "statistik/page.tsx"
Cohesion: 0.20
Nodes (8): CATEGORY_CONFIG, StatistikPage(), STATUS_CONFIG, TINGKAT_CONFIG, useAnimatedCounter(), CategoryIcon(), CategoryIconProps, ICON_PATHS

### Community 19 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 20 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 21 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 22 - "getThemeColors"
Cohesion: 0.28
Nodes (7): Sidebar(), SigPanel(), SigPanelProps, DARK_COLORS, getThemeColors(), LIGHT_COLORS, ThemeColors

### Community 23 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 24 - "next.config.ts"
Cohesion: 0.29
Nodes (5): apiPattern, isLocalHost, MediaPattern, nextConfig, remotePatterns

### Community 25 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 26 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 27 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 28 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 30 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 31 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 32 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 33 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 34 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 35 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 38 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 39 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 40 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 41 - "geo.ts"
Cohesion: 0.67
Nodes (3): haversineDistance(), LatLng, toRadians()

### Community 42 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 43 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 44 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 45 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **358 isolated node(s):** `$schema`, `name`, `version`, `description`, `main` (+353 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SmartImage()` connect `Lightbox.tsx` to `edit/page.tsx`, `statistik/page.tsx`, `SiteDetailPanel.tsx`, `SiteForm.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Site` connect `HomeClient.tsx` to `services/cagarBudaya.ts`, `statistik/page.tsx`, `Map.tsx`, `SiteDetailPanel.tsx`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `backend/package.json`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `version` to the rest of the system?**
  _358 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cagarBudaya.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07622504537205081 - nodes in this community are weakly interconnected._
- **Should `edit/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10289115646258504 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._