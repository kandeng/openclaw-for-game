# Conduit Homeserver

A lightweight Matrix homeserver (Rust-based) running in Docker.

Part of `game-infra/` — shared infrastructure for the game project.

## Prerequisites

- Docker & Docker Compose

## Start

```sh
docker compose up -d
```

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
./register-user.sh <localpart> <password>
```

Example — register all game users:

```sh
./register-user.sh alice alice_pass
./register-user.sh bob bob_pass
./register-user.sh ai_director ai_director_pass
./register-user.sh human_director human_director_pass
```

## Clean Up Database

**Warning:** This deletes all users, rooms, and messages permanently.

```sh
docker compose down
rm -rf data/
```

Restart with `docker compose up -d` to create a fresh database.

## Configuration

- **Config file:** `conduit.toml`
- **server_name:** `matrix.openclaw.local`
- **Port:** 8008
- **Registration:** enabled (via `allow_registration = true` in conduit.toml)
- **Federation:** disabled
- **Admin API:** enabled
- **Data directory:** `data/` (gitignored — contains SQLite database)

## Cannot Run with Synapse

Conduit and Synapse both use port 8008. Only one can run at a time.
