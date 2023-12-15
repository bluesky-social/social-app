#!/usr/bin/env sh

# Example usage:
# ./with-test-redis-and-db.sh psql postgresql://pg:password@localhost:5433/postgres -c 'select 1;'
# ./with-test-redis-and-db.sh redis-cli -h localhost -p 6380 ping

dir=$(dirname $0)
. ${dir}/_common.sh

SERVICES="db_test redis_test" main "$@"
