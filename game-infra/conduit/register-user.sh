#!/usr/bin/env bash
set -euo pipefail

# Register a user on the local Conduit homeserver.
# Usage: ./register-user.sh <localpart> <password>

HS_URL="http://localhost:8008"
LOCALPART="${1:-}"
PASSWORD="${2:-}"

if [ -z "$LOCALPART" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <localpart> <password>"
  echo "Example: $0 alice alicepass"
  exit 1
fi

echo "Registering @$LOCALPART:matrix.openclaw.local ..."
curl -s -X POST "${HS_URL}/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${LOCALPART}\",\"password\":\"${PASSWORD}\",\"auth\":{\"type\":\"m.login.dummy\"}}" | tee /dev/stderr
echo
