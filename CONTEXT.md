# Project Context

This file defines the domain vocabulary for Portable BI. Use these terms consistently in task names, requirements, acceptance criteria, tests, code, and ADRs.

---

## Domain terms

### Portable BI

**Definition**: A browser-first business intelligence application for connecting data, asking analytical questions, and building interactive dashboards.
**Usage**: Product name, repository domain, and top-level system context.
**Constraints**: The product must support client-only deployment while keeping client-server, serverless, monolith, and microservice deployment modes viable.

### Datasource

**Definition**: A user or seed-defined data input such as CSV, Parquet, or JSON that can be queried by the BI engine.
**Usage**: `Datasource` entity, datasource list/editor UI, datasource repository ports, datasource connector extension point.
**Constraints**: Storage location, loading mechanism, and execution runtime are adapter details.

### Question

**Definition**: A reusable analytical query definition that can be executed directly or embedded in a dashboard widget.
**Usage**: `Question` entity, question list/editor UI, question repository ports, ask/query workflows.
**Constraints**: A question may be backed by SQL or natural language, but UI components must not own query execution infrastructure.

### Dashboard

**Definition**: A BI workspace containing widgets, layout, filters, and interactions for exploring data.
**Usage**: `Dashboard` entity, dashboard editor/workspace UI, dashboard repository ports, widget extension point.
**Constraints**: Dashboard persistence format must be owned behind contracts so legacy `DashboardConfig` and future dashboard entities can migrate safely.

### Ask Data

**Definition**: The natural-language analytics capability that parses a user question, plans SQL, executes it, and returns a result with explanation and visualization guidance.
**Usage**: `AskData` use case, ask input/result UI, ask engine port, semantic modeling modules.
**Constraints**: Text search, semantic matching, model choice, SQL execution, and database runtime are replaceable details.

### Semantic Model

**Definition**: Metadata that describes fields, entities, relationships, vocabulary, and defaults used to translate analytical intent into executable queries.
**Usage**: Ask Data configuration, catalog builder, field matcher, query planner, datasource/dashboard configuration.
**Constraints**: The model is a BI domain concept and should not depend on Fuse, MiniSearch, Transformers.js, DuckDB, or UI types.

### Extension Point

**Definition**: A stable platform contract that lets built-in or final-user extensions contribute behavior without importing application internals.
**Usage**: Datasource connector, query engine, semantic matcher, widget renderer, exporter, storage provider, and UI contribution contracts.
**Constraints**: Extensions register capabilities through composition-controlled registries and receive only stable platform APIs.

### Capability

**Definition**: A named behavior available at runtime, such as a datasource type, visualization type, query executor, or ask strategy.
**Usage**: Feature flag evaluation, extension registration, UI availability checks, and deployment composition.
**Constraints**: UI reads capabilities; it does not inspect concrete adapter classes or deployment mode.

### Deployment Mode

**Definition**: A runtime topology such as client-only, client-server, serverless, monolith, or microservice deployment.
**Usage**: Composition containers, adapter selection, HTTP/serverless entrypoints, and operational documentation.
**Constraints**: Deployment mode must not change core application use case contracts.

---

## Decisions and constraints

### Architecture direction

Portable BI should follow Clean Architecture dependency direction: domain and application contracts point inward, while UI, storage, frameworks, databases, HTTP, serverless handlers, and deployment wiring stay outside.

### Extensibility direction

Extensibility is a product requirement. Extension APIs must be explicit and stable enough for final-user plugins, while internal modules remain private.

### Deployment direction

Client-only deployment is a required supported mode, not a prototype shortcut. Other deployment modes must be enabled by adapters and composition rather than by changing core use cases.

---

## Out of scope

This planning batch does not implement authentication, authorization, marketplace distribution, extension sandboxing, remote plugin installation, or production microservice extraction.
