#!/usr/bin/env sh

# Exit if any command fails
set -e

get_container_id() {
  local compose_file=$1
  local service=$2
  if [ -z "${compose_file}" ] || [ -z "${service}" ]; then
    echo "usage: get_container_id <compose_file> <service>"
    exit 1
  fi

 # first line of jq normalizes for docker compose breaking change, see docker/compose#10958
  docker compose --file $compose_file ps --format json --status running \
    | jq -sc '.[] | if type=="array" then .[] else . end' | jq -s \
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
  export PGPORT=5432
  export PGHOST=localhost
  export PGUSER=pg
  export PGPASSWORD=password
  export PGDATABASE=postgres
  export DB_POSTGRES_URL="postgresql://pg:password@127.0.0.1:5432/postgres"
}

# Exports redis environment variables
export_redis_env() {
  export REDIS_HOST="127.0.0.1:6379"
}

pg_clear() {
  local pg_uri=$1

  for schema_name in `psql "${pg_uri}" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name NOT LIKE 'information_schema';" -t`; do
    psql "${pg_uri}" -c "DROP SCHEMA \"${schema_name}\" CASCADE;"
  done
}

pg_init() {
  local pg_uri=$1

  psql "${pg_uri}" -c "CREATE SCHEMA IF NOT EXISTS \"public\";"
}

redis_clear() {
  local redis_uri=$1
  redis-cli -u "${redis_uri}" flushall
}

main_native() {
  local services="db redis"
  local postgres_url_env_var="DB_POSTGRES_URL"
  local redis_host_env_var="REDIS_HOST"

  postgres_url="${!postgres_url_env_var}"
  redis_host="${!redis_host_env_var}"

  if [ -n "${postgres_url}" ]; then
    echo "Using ${postgres_url_env_var} (${postgres_url}) to connect to postgres."
    pg_init "${postgres_url}"
  else
    echo "Postgres connection string missing did you set ${postgres_url_env_var}?"
    exit 1
  fi

  if [ -n "${redis_host}" ]; then
    echo "Using ${redis_host_env_var} (${redis_host}) to connect to Redis."
  else
    echo "Redis connection string missing did you set ${redis_host_env_var}?"
    echo "Continuing without Redis..."
  fi

  cleanup() {
    if [ -n "${redis_host}" ]; then
      redis_clear "redis://${redis_host}" &> /dev/null
    fi

    if [ -n "${postgres_url}" ]; then
      pg_clear "${postgres_url}" &> /dev/null
    fi
  }

  # trap SIGINT and performs cleanup
  trap "on_sigint" INT
  on_sigint() {
    cleanup
    exit $?
  }

  # Run the arguments as a command
  DB_POSTGRES_URL="${postgres_url}" \
  REDIS_HOST="${redis_host}" \
  "$@"
  code=$?

  cleanup ${services}

  exit ${code}
}

main_docker() {
  local services="db redis"

  dir=$(dirname $0)
  compose_file="${dir}/docker-compose.yaml"

  started_container=false

  cleanup() {
    echo # newline
    if $started_container; then
      docker compose --file $compose_file rm --force --stop --volumes ${services}
    fi
  }

  trap "on_sigint" INT
  on_sigint() {
    cleanup
    exit $?
  }

  not_running=false
  for service in $services; do
    container_id=$(get_container_id $compose_file $service)
    if [ -z $container_id ]; then
      not_running=true
      break
    fi
  done

  if $not_running; then
    started_container=true
    docker compose --file $compose_file up --wait --force-recreate ${services}
  else
    echo "all services ${services} are already running"
  fi

  set +e

  export_env
  "$@"
  code=$?

  cleanup
  exit ${code}
}

# Main entry point
main() {
  if ! docker ps >/dev/null 2>&1; then
    echo "Docker unavailable. Running on host."
    main_native $@
  else
    main_docker $@
  fi
}
