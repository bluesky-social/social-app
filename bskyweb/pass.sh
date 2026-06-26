HANDLE="thepope.dev"
read -s -p "App password: " PW; echo

JWT=$(curl -s -X POST https://bsky.social/xrpc/com.atproto.server.createSession \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$HANDLE\",\"password\":\"$PW\"}" \
  | jq -r .accessJwt)

echo "Got JWT (length: ${#JWT})"
