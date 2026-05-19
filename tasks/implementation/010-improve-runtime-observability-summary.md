# 010 Improve runtime observability and reduce console noise

## What changed

- `src/shared/observability/logger.ts`
  - Added a lightweight structured logger with level filtering (`debug`, `info`, `warn`, `error`), trace IDs, span timing, SQL summarization, and localStorage-based level control via `ask-data:log-level`.
- `src/infra/db/db.ts`
  - Replaced DuckDB's raw `ConsoleLogger` with an app logger bridge.
  - Added measured query logging with slow-query warnings and structured query failure logs.
- `src/features/ask/model/ask-data.ts`
  - Replaced ad-hoc console output with structured logs for catalog build, readiness, SQL generation, and ask completion.
  - Added traceable ask spans with outcome and timing metadata.
- `src/features/ask/model/catalog-builder.ts`
  - Replaced time-profile warning logs with structured warnings.
- `src/features/dashboard/ui/dashboard-workspace/dashboard-workspace.ts`
  - Replaced sheet/data lifecycle logs with structured logs.
- `src/features/dashboard/ui/dashboard-canvas/dashboard-canvas.ts`
  - Moved widget-selection chatter to debug-level logs.
- `src/features/dashboard/ui/widget/widget.ts`
  - Moved chart/widget interaction chatter to debug-level logs.
- `src/shared/observability/logger.spec.ts`
  - Added unit coverage for log filtering, span metadata, and SQL summarization.

## Behavior implemented

- Console noise is significantly reduced in normal dev usage.
- Useful observability remains available by default at `info` level.
- High-volume interaction and runtime-internal chatter now stays behind `debug` level instead of flooding the console.
- Ask Data executions now emit traceable logs with:
  - `traceId`
  - duration
  - outcome
  - chart type
  - warning count
  - metrics
- DuckDB runtime logs are now routed through app logging instead of printing raw event objects.
- Slow queries now have a dedicated warning path.

## How to increase logging when debugging

In the browser console:

```js
localStorage.setItem('ask-data:log-level', 'debug')
location.reload()
```

To restore the default:

```js
localStorage.removeItem('ask-data:log-level')
location.reload()
```

## Tests and validations run

- `npm run test:unit`
- `npm run build`
- `npm run dev -- --port 8000`
- Playwright CLI manual runtime check on Vite dev server
  - opened app
  - opened dashboard
  - switched to **Ask Data**
  - ran `sales by region`
  - navigated **Questions**
  - navigated **Datasources**
  - inspected browser console

## Runtime result

After the change, the dev console showed:

- `0` browser errors
- `1` expected dev warning from Lit (`Lit is in dev mode`)
- concise, structured app logs for datasource view creation and Ask Data execution
- no raw DuckDB event spam
- no widget/canvas interaction spam at the default log level

## Accessibility checks

- Existing interactive flows were exercised through standard Playwright-driven navigation and actions.

## ADR updates

- None.

## Intentional non-applicable test categories

- No component or e2e test files were added because the change is primarily observability behavior and runtime logging, validated through unit coverage plus browser runtime verification.

## Unresolved assumptions or follow-up work

- If desired later, the same structured logger can be rolled out to the remaining feature editors and registry modules for full consistency.
