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

A request that throws `WebAssembly.RuntimeError` initiates a graceful process
shutdown with exit code `1`: the renderer may stay broken after a WASM trap.
The process stops listening immediately and rejects subsequent requests on
existing connections with `503` while in-flight requests drain. The cluster
replaces that worker; single-process deployments rely on their process
supervisor. Other request errors return `500` without initiating a
shutdown. Starter-pack rendering failures include the pack URI, rendered title,
rendering stage, image count, build version, and configured font names, weights,
and SHA-256 hashes in the exception log. Font and image buffers are not logged.

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
sum/max. Memory gauges describe worker processes and omit the supervising
primary; Kubernetes container metrics cover the entire container.

The `worker!=""` filter excludes old, unlabeled series during rollout and when
viewing historical data. Historical metrics from the old shared-worker endpoint
remain unreliable. Worker counters can reset on replacement, and unscraped
increments lost in a crash cannot be recovered by collection.

Run the focused multi-process regression tests with `pnpm test` in this
directory, and check application types with `pnpm typecheck`. CI runs both once,
separately from the application's sharded Jest suite.
