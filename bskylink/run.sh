export OZONE_AGENT_HANDLE="mod-authority.test"
export OZONE_AGENT_PASS="hunter2"

export OZONE_URL=http://localhost:2583
export OZONE_DID=ANY_TIME_YOU_RELAUNCH_ATPROTO_THIS_MUST_BE_DONE_AGAIN

export LINK_DB_POSTGRES_URL=postgres://pg:password@localhost:5433/link_db
export SAFELINK_ENABLED=true

node dist/bin.js
