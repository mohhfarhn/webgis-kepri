# Graph Report - frontend  (2026-08-05)

## Corpus Check
- 66 files · ~45,079 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 404 nodes · 663 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- app/page.tsx
- Graphify
- Graphify Skill
- edit/page.tsx
- compilerOptions
- Map.tsx
- dependencies
- devDependencies
- Graphify Skill
- SiteForm.tsx
- Query Reference
- ToastProvider.tsx
- app/layout.tsx
- Vercel Brand Assets
- Admin Landing Page
- opencode.json
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `Graphify Skill` - 29 edges
2. `Graphify` - 21 edges
3. `compilerOptions` - 16 edges
4. `Site` - 13 edges
5. `getThemeColors()` - 13 edges
6. `authFetch()` - 11 edges
7. `Query Reference` - 11 edges
8. `Extraction JSON Schema` - 10 edges
9. `EditSitusPage()` - 9 edges
10. `Category` - 9 edges

## Surprising Connections (you probably didn't know these)
- `generateMetadata()` --calls--> `getCagarBudayaSiteBySlug()`  [EXTRACTED]
  app/cagar-budaya/[slug]/page.tsx → services/cagarBudaya.ts
- `SitesResult` --references--> `Site`  [EXTRACTED]
  app/page.tsx → data/sites.ts
- `MapProps` --references--> `MapTheme`  [EXTRACTED]
  components/Map.tsx → lib/sitePopup.ts
- `CategoryIconProps` --references--> `Category`  [EXTRACTED]
  components/icons/CategoryIcon.tsx → data/sites.ts
- `BasemapSwitcherProps` --references--> `MapTheme`  [EXTRACTED]
  components/map/BasemapSwitcher.tsx → lib/sitePopup.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Pipeline Stages** — codex_skills_graphify_skill_structural_extraction, codex_skills_graphify_skill_semantic_extraction, codex_skills_graphify_skill_extraction_cache, codex_skills_graphify_skill_community_detection [EXTRACTED 1.00]
- **Graph Data Integrity Guards** — codex_skills_graphify_skill_audit_trail, codex_skills_graphify_skill_health_check, codex_skills_graphify_skill_shrink_guard, codex_skills_graphify_references_extraction_spec_confidence_rubric, codex_skills_graphify_references_extraction_spec_source_file_rule [INFERRED 0.85]
- **Incremental Update Flow** — codex_skills_graphify_references_update_incremental_detection, codex_skills_graphify_references_update_build_merge, codex_skills_graphify_references_update_prune_sources, codex_skills_graphify_references_update_graph_diff, codex_skills_graphify_skill_manifest [EXTRACTED 1.00]
- **Graph Export Suite** — opencode_skills_graphify_references_exports_wiki_export, opencode_skills_graphify_references_exports_neo4j_export, opencode_skills_graphify_references_exports_falkordb_export, opencode_skills_graphify_references_exports_svg_export, opencode_skills_graphify_references_exports_graphml_export, opencode_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Semantic Extraction Subagent Spec** — opencode_skills_graphify_skill_semantic_extraction, opencode_skills_graphify_references_extraction_spec_extraction_schema, opencode_skills_graphify_references_extraction_spec_confidence_rubric, opencode_skills_graphify_references_extraction_spec_node_id_format, opencode_skills_graphify_references_extraction_spec_source_file_rule, opencode_skills_graphify_references_extraction_spec_file_type_enum, opencode_skills_graphify_references_extraction_spec_semantic_similarity_edges, opencode_skills_graphify_references_extraction_spec_hyperedges, opencode_skills_graphify_references_extraction_spec_deep_mode, opencode_skills_graphify_references_extraction_spec_frontmatter_copy [EXTRACTED 1.00]
- **Incremental Update Flow** — opencode_skills_graphify_references_update_incremental_update, opencode_skills_graphify_references_update_build_merge, opencode_skills_graphify_references_update_graph_diff, opencode_skills_graphify_skill_manifest, opencode_skills_graphify_references_transcribe_whisper_transcription, opencode_skills_graphify_references_add_watch_folder_watch [INFERRED 0.85]
- **Graphify Usage Workflow** — agents_graphify_skill, agents_graphify_out, agents_graphify_query, agents_graphify_wiki, agents_graphify_report, agents_graphify_update [INFERRED 0.85]
- **Next.js Development Workflow** — readme_nextjs_project, readme_create_next_app, readme_dev_server, readme_app_page_tsx [INFERRED 0.85]

## Communities (23 total, 5 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.06
Nodes (60): CagarBudayaDetailPage(), DetailPageProps, generateMetadata(), ALL_CATEGORIES, HomeContent(), Map, SitesResult, CATEGORY_CONFIG (+52 more)

### Community 1 - "Graphify"
Cohesion: 0.05
Nodes (51): Add and Watch Reference, Watch Debounce, URL Ingest, Needs-Update Flag, Folder Watch, Exports Reference, FalkorDB Export, MCP Server (+43 more)

### Community 2 - "Graphify Skill"
Cohesion: 0.07
Nodes (49): Folder Watcher, URL Ingest, Token Reduction Benchmark, FalkorDB Export, GraphML Export, MCP Server, Neo4j Export, SVG Export (+41 more)

### Community 3 - "edit/page.tsx"
Cohesion: 0.15
Nodes (30): AdminDashboardPage(), katColor, Site, statusColor, AdminLoginPage(), TambahSitusPage(), EditSitusPage(), GalleryItem (+22 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "Map.tsx"
Cohesion: 0.14
Nodes (16): categoryIconSvg(), BASEMAPS, BasemapSwitcher(), BasemapSwitcherProps, escapeHtml(), getPopupTarget(), Map(), stopMapSafe() (+8 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (23): graphify, leaflet, leaflet.markercluster, next, dependencies, graphify, leaflet, leaflet.markercluster (+15 more)

### Community 7 - "devDependencies"
Cohesion: 0.09
Nodes (23): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+15 more)

### Community 8 - "Graphify Skill"
Cohesion: 0.11
Nodes (18): Graphify Explain Tool, graphify-out Knowledge Graph, Graphify Path Tool, Graphify Query Tool, Graphify GRAPH_REPORT.md, Graphify Skill, Graphify Update Command, Graphify Wiki (wiki/index.md) (+10 more)

### Community 9 - "SiteForm.tsx"
Cohesion: 0.15
Nodes (17): bannerStyle, cardStyle, cardTitleStyle, gridStyle, inputStyle, labelStyle, optionStyle, selectStyle (+9 more)

### Community 10 - "Query Reference"
Cohesion: 0.25
Nodes (11): Query Reference, BFS Traversal, DFS Traversal, Explain Node, Graph Vocabulary, NetworkX Fallback, Constrained Query Expansion, Save-Result Feedback Loop (+3 more)

### Community 11 - "ToastProvider.tsx"
Cohesion: 0.22
Nodes (7): toastColor, ToastContext, ToastContextValue, toastIcon, ToastItem, ToastProvider(), ToastType

## Knowledge Gaps
- **148 isolated node(s):** `$schema`, `Site`, `katColor`, `statusColor`, `GalleryItem` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SmartImage()` connect `app/page.tsx` to `SiteForm.tsx`, `edit/page.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Graphify` connect `Graphify` to `Query Reference`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Site` connect `app/page.tsx` to `Map.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `$schema`, `Site`, `katColor` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Graphify` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill` be split into smaller, more focused modules?**
  _Cohesion score 0.0663265306122449 - nodes in this community are weakly interconnected._