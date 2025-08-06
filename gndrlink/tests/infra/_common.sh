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

main_native() {
  local services=${SERVICES}
  local postgres_url_env_var=`[[ $services == *"db_test"* ]] && echo "DB_TEST_POSTGRES_URL" || echo "DB_POSTGRES_URL"`

  postgres_url="${!postgres_url_env_var}"

  if [ -n "${postgres_url}" ]; then
    echo "Using ${postgres_url_env_var} (${postgres_url}) to connect to postgres."
    pg_init "${postgres_url}"
  else
    echo "Postgres connection string missing did you set ${postgres_url_env_var}?"
    exit 1
  fi

  cleanup() {
    local services=$@

    if [ -n "${postgres_url}" ] && [[ $services == *"db_test"* ]]; then
      pg_clear "${postgres_url}" &> /dev/null
    fi
  }

  # trap SIGINT and performs cleanup
  trap "on_sigint ${services}" INT
  on_sigint() {
    cleanup $@
    exit $?
  }

  # Run the arguments as a command
  DB_POSTGRES_URL="${postgres_url}" \
  "$@"
  code=$?

  cleanup ${services}

  exit ${code}
}

main_docker() {
  # Expect a SERVICES env var to be set with the docker service names
  local services=${SERVICES}

  dir=$(dirname $0)
  compose_file="${dir}/docker-compose.yaml"

  # whether this particular script started the container(s)
  started_container=false

  # performs cleanup as necessary, i.e. taking down containers
  # if this script started them
  cleanup() {
    local services=$@
    echo # newline
    if $started_container; then
      docker compose --file $compose_file rm --force --stop --volumes ${services}
    fi
  }

  # trap SIGINT and performs cleanup
  trap "on_sigint ${services}" INT
  on_sigint() {
    cleanup $@
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
    started_container=true
    docker compose --file $compose_file up --wait --force-recreate ${services}
  else
    echo "all services ${services} are already running"
  fi

  # do not exit when following commands fail, so we can intercept exit code & tear down docker
  set +e

  # setup environment variables and run args
  export_env
  "$@"
  # save return code for later
  code=$?

  # performs cleanup as necessary
  cleanup ${services}
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
