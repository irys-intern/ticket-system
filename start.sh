#!/bin/bash
# `wait -n` below is a bashism -- POSIX sh (dash) doesn't support it.
set -e

pids=""

cleanup() {
  trap - TERM INT
  [ -n "$pids" ] && kill $pids 2>/dev/null
  wait
}
trap cleanup TERM INT

redis-server --daemonize no --save "" &
pids="$pids $!"
until redis-cli ping >/dev/null 2>&1; do
  sleep 0.2
done

cd /app/nlp_service
PORT="$NLP_PORT" uvicorn main:app --host 0.0.0.0 --port "$NLP_PORT" &
pids="$pids $!"

cd /app/backend
PORT="$BACKEND_PORT" sh -c "npx drizzle-kit push --force && node build" &
pids="$pids $!"

cd /app/frontend
# PORT is already set to the frontend's port in the environment.
node build &
pids="$pids $!"

# Exit (and let the platform restart the container) if any service dies.
wait -n $pids
cleanup
exit 1
