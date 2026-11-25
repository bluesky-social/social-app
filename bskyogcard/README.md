# OGcard metrics

The application listens on `CARD_PORT` (default `3000`). Prometheus metrics are
served separately at `/metrics` on `CARD_METRICS_PORT` (default `3001`). Keep
this endpoint internal.

With `CARD_CLUSTER_WORKER_COUNT` set to a positive integer, the primary process
owns the metrics listener and collects a snapshot from every worker over Node
IPC. Workers continue to share the application listener. Without clustering,
the application serves its own metrics as before.

## Worker identity and health

Application HTTP and Node runtime metrics have a `worker` label: `0` through
`CARD_CLUSTER_WORKER_COUNT - 1`, or `0` in single-process mode. A replacement
worker reuses its slot, rather than introducing a new process-ID label.

The primary also exports:

| Metric | Meaning |
| --- | --- |
| `bskyogcard_workers_expected` | Configured worker count. |
| `bskyogcard_workers_live` | Processes with connected IPC channels; not a readiness or responsiveness check. |
| `bskyogcard_worker_restarts_total{worker}` | Unexpected exits requiring replacement, including native crashes. Normal cluster shutdown does not increment it. |

These primary-owned metrics exist only in clustered mode. A worker can restart
without a container restart. Conversely, a connected worker can be stuck, so
live-worker count alone does not establish health.

A scrape returns HTTP `503` if workers are starting, a worker disconnects/exits
during collection, or any worker fails to respond within five seconds. It never
returns a partial snapshot as successful. Concurrent scrapes share one
collection. Shutdown cancels collection, drains application requests, and
force-kills workers still running after the 17-second cluster shutdown budget.

## Render isolation

Satori and resvg run in disposable child processes. In clustered mode, the
primary owns a shared pool with one slot per HTTP worker; standalone mode uses
one slot. Each HTTP worker submits at most one render at a time. Processes start
lazily, and requests do not queue: saturation, replacement cooldown, and shutdown
return `503`.

Any render exception, child exit, invalid response, or 15-second deadline
retires that renderer. Replacement is attempted by a later request after an
exponential cooldown from one to 30 seconds, reset by a successful render.
There is no automatic respawn loop. Client disconnects and HTTP worker exits
cancel their renders and reap the child. Normal shutdown drains HTTP requests
before stopping renderers.

Only component inputs cross IPC, with a 16 MiB aggregate image-input limit and
a 16 MiB PNG-output limit. Fonts load in the renderer. Starter-pack exceptions
retain the original error type, stack and rendering stage, along with the pack
URI, rendered title, image count, build version, and configured font names,
weights and SHA-256 hashes. Font and image buffers are not logged.

The pool owner exports these metrics in both deployment modes:

| Metric | Meaning |
| --- | --- |
| `bskyogcard_renderer_restarts_total` | Failed renderer processes or starts requiring replacement; excludes cancellation and shutdown. |
| `bskyogcard_renderers_busy` | Slots occupied by a request, including startup. |
| `bskyogcard_renderers_ready` | Initialized renderer processes, including busy processes. |

Renderer failures do not increment `bskyogcard_worker_restarts_total`; monitoring
renderer failures requires the separate renderer counter. No alert configuration
is changed here.

A raw `WebAssembly.RuntimeError` in the HTTP process still initiates its graceful
shutdown with exit code `1`, stops listening immediately, and rejects subsequent
requests on existing connections with `503` while in-flight requests drain.
Isolated rendering errors preserve their diagnostics without triggering that
HTTP-process fallback.

The middleware's synthetic `up` metric is disabled: use the scraper-generated
`up` for target health, rather than counting one application `up` per worker.
A failed scrape does not necessarily mean all application requests are failing.
Keep independent load-balancer and Kubernetes monitoring.

## Querying worker metrics

Apply `rate` to individual counters before aggregating workers. For example:

```promql
sum by (path, status_code) (
  rate(http_request_duration_seconds_count{
    namespace="ogcard", worker!="", path!="/_health"
  }[5m])
)
```

Likewise, calculate HTTP latency from summed histogram-bucket rates, not by
averaging worker percentiles:

```promql
histogram_quantile(0.95,
  sum by (le, path) (
    rate(http_request_duration_seconds_bucket{
      namespace="ogcard", worker!="", path!="/_health"
    }[5m])
  )
)
```

Node event-loop percentiles remain per-worker values, not service-wide
percentiles. Group runtime charts by worker, or explicitly choose the relevant
sum/max. Node CPU and memory metrics describe HTTP worker processes and omit the
supervising primary and renderers; Kubernetes container metrics cover the entire
container.

The `worker!=""` filter excludes old, unlabeled series during rollout and when
viewing historical data. Historical metrics from the old shared-worker endpoint
remain unreliable. Worker counters can reset on replacement, and unscraped
increments lost in a crash cannot be recovered by collection.

Run the focused multi-process regression tests with `pnpm test` in this
directory, and check application types with `pnpm typecheck`. CI runs both once,
separately from the application's sharded Jest suite.
