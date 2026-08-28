# Graph Report - backend  (2026-08-24)

## Corpus Check
- 54 files · ~25,663 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 262 nodes · 372 edges · 33 communities (15 shown, 18 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Graphify Skill (Codex)
- cagarBudaya.service.ts
- cagarBudaya.controller.ts
- dependencies
- auth.routes.ts
- devDependencies
- compilerOptions
- package.json
- Extra Exports Reference (Codex)
- validation.ts
- Query Reference (Codex)
- seed.ts
- app.ts
- GitHub & Merge Reference (Codex)
- seedAdmin.ts
- opencode.json
- Uploaded Image 1785294332789-24004027
- Uploaded Image 1785813374515-655179929
- Uploaded Image 1785813374609-113534807
- Image File 1785813374629-387254339.jpg
- Uploaded Image 1785814523803-280720261.jpg
- Uploaded Image 1785814523829-249667419
- Image File 1785814886547-466367133.jpg
- Uploaded Image 1785831860058-802352968
- Uploaded Image 1785831860087-684386382
- Uploaded Image 1785832698884-910637563
- Uploaded Image 1785832981273-441804792
- Uploaded Image 1785832992986-640469460
- Uploaded Image 1785833182356-826251330
- Uploaded Image makam-raja-ali-haji
- Masjid Raya Image

## God Nodes (most connected - your core abstractions)
1. `Graphify Skill (Codex)` - 23 edges
2. `Graphify Full Pipeline` - 13 edges
3. `fail()` - 12 edges
4. `AppError` - 10 edges
5. `validateCagarCreate()` - 10 edges
6. `validateCagarUpdate()` - 10 edges
7. `compilerOptions` - 10 edges
8. `env` - 6 edges
9. `isPrismaError()` - 6 edges
10. `isNotFoundError()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Graphify Skill (Codex)` --semantically_similar_to--> `Graphify Skill (OpenCode)`  [INFERRED] [semantically similar]
  .codex/skills/graphify/SKILL.md → .opencode/skills/graphify/SKILL.md
- `Extra Exports Reference (Codex)` --semantically_similar_to--> `Extra Exports Reference (OpenCode)`  [INFERRED] [semantically similar]
  .codex/skills/graphify/references/exports.md → .opencode/skills/graphify/references/exports.md
- `Extraction Spec Reference (Codex)` --semantically_similar_to--> `Extraction Spec Reference (OpenCode)`  [INFERRED] [semantically similar]
  .codex/skills/graphify/references/extraction-spec.md → .opencode/skills/graphify/references/extraction-spec.md
- `Query Reference (Codex)` --semantically_similar_to--> `Query Reference (OpenCode)`  [INFERRED] [semantically similar]
  .codex/skills/graphify/references/query.md → .opencode/skills/graphify/references/query.md
- `Update Reference (Codex)` --semantically_similar_to--> `Update Reference (OpenCode)`  [INFERRED] [semantically similar]
  .codex/skills/graphify/references/update.md → .opencode/skills/graphify/references/update.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Extraction Pipeline Components** — _codex_skills_graphify_skill_ast_extraction, _codex_skills_graphify_skill_semantic_extraction, _codex_skills_graphify_references_extraction_spec_subagent_prompt, _codex_skills_graphify_skill_semantic_cache [INFERRED 0.85]
- **Query Answering Flow** — _codex_skills_graphify_references_query_query_expansion, _codex_skills_graphify_references_query_traversal, _codex_skills_graphify_references_query_save_result [EXTRACTED 1.00]
- **Graph Maintenance Subcommands** — _codex_skills_graphify_references_update_incremental_update, _codex_skills_graphify_references_update_cluster_only, _codex_skills_graphify_references_update_build_merge, _codex_skills_graphify_skill_manifest [INFERRED 0.80]

## Communities (33 total, 18 thin omitted)

### Community 0 - "Graphify Skill (Codex)"
Cohesion: 0.08
Nodes (39): Add & Watch Reference (Codex), URL Ingestion (graphify ingest), Folder Watcher (--watch), Confidence Score Rubric, Extraction Spec Reference (Codex), Deterministic Node ID Format, Extraction Subagent Prompt, Native CLAUDE.md Integration (+31 more)

### Community 1 - "cagarBudaya.service.ts"
Cohesion: 0.19
Nodes (13): PrismaErrorCode, errorHandler(), addGalleryItem(), createCagarBudaya(), deleteCagarBudaya(), deleteGalleryItem(), updateCagarBudaya(), withThumbnail() (+5 more)

### Community 2 - "cagarBudaya.controller.ts"
Cohesion: 0.15
Nodes (16): addGallery, create, findAll, findById, findBySlug, remove, removeGallery, update (+8 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (27): bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken, morgan (+19 more)

### Community 4 - "auth.routes.ts"
Cohesion: 0.13
Nodes (15): login, me, healthCheck(), authMiddleware(), AuthRequest, loginRateLimiter, ALLOWED_EXTENSIONS, MAGIC_BYTES (+7 more)

### Community 5 - "devDependencies"
Cohesion: 0.10
Nodes (21): nodemon, devDependencies, nodemon, tsx, @types/bcrypt, @types/cors, @types/express, @types/jsonwebtoken (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (15): dist, node_modules, src/**/*.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+7 more)

### Community 7 - "package.json"
Cohesion: 0.13
Nodes (14): author, description, keywords, license, main, name, prisma, seed (+6 more)

### Community 8 - "Extra Exports Reference (Codex)"
Cohesion: 0.33
Nodes (6): Extra Exports Reference (Codex), FalkorDB Export, MCP Server (graphify.serve), Neo4j Cypher Export, Agent-Crawlable Wiki Export, Extra Exports Reference (OpenCode)

### Community 9 - "validation.ts"
Cohesion: 0.27
Nodes (18): CATEGORIES, fail(), KNOWN_FIELDS, OPTIONAL_STRING_FIELDS, optionalEnum(), optionalString(), optionalYear(), parseCoordinates() (+10 more)

### Community 10 - "Query Reference (Codex)"
Cohesion: 0.60
Nodes (5): Query Reference (Codex), Constrained Query Expansion (Vocab), Save-Result Feedback Loop, BFS/DFS Graph Traversal, Query Reference (OpenCode)

### Community 12 - "app.ts"
Cohesion: 0.16
Nodes (7): app, env, supabaseServiceKey, supabaseUrl, prisma, notFoundHandler(), AppError

### Community 13 - "GitHub & Merge Reference (Codex)"
Cohesion: 0.67
Nodes (4): GitHub Repo Clone, GitHub & Merge Reference (Codex), Cross-Repo Graph Merge, GitHub & Merge Reference (OpenCode)

## Knowledge Gaps
- **100 isolated node(s):** `$schema`, `name`, `version`, `description`, `main` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Graphify Skill (Codex)` connect `Graphify Skill (Codex)` to `Extra Exports Reference (Codex)`, `Query Reference (Codex)`, `GitHub & Merge Reference (Codex)`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `version` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Graphify Skill (Codex)` be split into smaller, more focused modules?**
  _Cohesion score 0.08232118758434548 - nodes in this community are weakly interconnected._
- **Should `cagarBudaya.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._