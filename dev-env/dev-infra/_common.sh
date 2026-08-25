#!/usr/bin/env sh

get_container_id() {
  local compose_file=$1
  local service=$2
  if [ -z "${compose_file}" ] || [ -z "${service}" ]; then
    echo "usage: get_container_id <compose_file> <service>"
    exit 1
  fi

  docker compose -f $compose_file ps --format json --status running \
    | jq -r '.[]? | select(.Service == "'${service}'") | .ID'
}

# Exports all environment variables
export_env() {
  export_pg_env
  export_redis_env
}

# Exports postgres environment variables
export_pg_env() {
  # Based on creds in compose.yaml
  export PGPORT=5433
  export PGHOST=localhost
  export PGUSER=pg
  export PGPASSWORD=password
  export PGDATABASE=postgres
  export DB_POSTGRES_URL="postgresql://pg:password@127.0.0.1:5433/postgres"
}

# Exports redis environment variables
export_redis_env() {
  export REDIS_HOST="127.0.0.1:6380"
}

# Main entry point
main() {
  # Expect a SERVICES env var to be set with the docker service names
  local services=${SERVICES}

  dir=$(dirname $0)
  compose_file="${dir}/docker-compose.yaml"

  # whether this particular script started the container(s)
  started_container=false

  # trap SIGINT and performs cleanup as necessary, i.e.
  # taking down containers if this script started them
  trap "on_sigint ${services}" INT
  on_sigint() {
    local services=$@
    echo # newline
    if $started_container; then
      docker compose -f $compose_file rm -f --stop --volumes ${services}
    fi
    exit $?
  }

  # check if all services are running already
  not_running=false
  for service in $services; do
    container_id=$(get_container_id $compose_file $service)
    if [ -z $container_id ]; then
      not_running=true
      break
    fi
  done

  # if any are missing, recreate all services
  if $not_running; then
    docker compose -f $compose_file up --wait --force-recreate ${services}
    started_container=true
  else
    echo "all services ${services} are already running"
  fi

  # setup environment variables and run args
  export_env
  "$@"
  # save return code for later
  code=$?

  # performs cleanup as necessary, i.e. taking down containers
  # if this script started them
  echo # newline
  if $started_container; then
    docker compose -f $compose_file rm -f --stop --volumes ${services}
  fi

  exit ${code}
}
