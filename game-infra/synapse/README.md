# Synapse Homeserver

A full-featured Matrix homeserver (Python-based) running in Docker.

Part of `game-infra/` — shared infrastructure for the game project.

## Prerequisites

- Docker & Docker Compose

## Start

```sh
docker compose up -d
```

The first start initializes the database and generates signing keys automatically.

## Verify

```sh
curl -s http://localhost:8008/_matrix/client/versions
```

Should return a JSON object with a `versions` array.

## Stop

```sh
docker compose down
```

The database is preserved in `data/` and will survive stops.

## Register Users

```sh
docker exec game-player-synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -u <username> \
  -p '<password>' \
  --no-admin \
  http://localhost:8008
```

Example — register all game users:

```sh
docker exec game-player-synapse register_new_matrix_user -c /data/homeserver.yaml --no-admin -u alice -p 'alice_pass' http://localhost:8008
docker exec game-player-synapse register_new_matrix_user -c /data/homeserver.yaml --no-admin -u bob -p 'bob_pass' http://localhost:8008
docker exec game-player-synapse register_new_matrix_user -c /data/homeserver.yaml --no-admin -u ai_director -p 'ai_director_pass' http://localhost:8008
docker exec game-player-synapse register_new_matrix_user -c /data/homeserver.yaml --no-admin -u human_director -p 'human_director_pass' http://localhost:8008
```

## Reset a User's Password

Requires a server admin user. First register an admin:

```sh
docker exec game-player-synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -u admin -p 'admin_pass' \
  -a \
  http://localhost:8008
```

Then use the Synapse Admin API:

```sh
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8008/_matrix/client/r0/login \
  -H "Content-Type: application/json" \
  -d '{"type":"m.login.password","user":"admin","password":"admin_pass"}' | jq -r .access_token)

# Reset password for a user
curl -X PUT "http://localhost:8008/_synapse/admin/v2/users/@alice:matrix.openclaw.local" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"new_password"}'
```

## Clean Up Database

**Warning:** This deletes all users, rooms, and messages permanently.

```sh
docker compose down
rm -rf data/
```

Restart with `docker compose up -d` to create a fresh database.

## Configuration

- **server_name:** `matrix.openclaw.local` (set via `SYNAPSE_SERVER_NAME` env var)
- **Port:** 8008
- **Container name:** `game-player-synapse`
- **Network:** `game-player-net` (bridge)
- **Data directory:** `data/` (gitignored — contains SQLite database and signing keys)

## Cannot Run with Conduit

Synapse and Conduit both use port 8008. Only one can run at a time.
