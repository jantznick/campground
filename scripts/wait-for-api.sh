#!/bin/sh
# wait-for-api.sh

# The host and port to check
HOST=api
PORT=3001

echo "Waiting for API at $HOST:$PORT..."

# Use a loop with netcat (nc) to check if the port is open
# -z: Zero-I/O mode (scanning)
# -w1: Timeout of 1 second for connection
while ! nc -z -w1 $HOST $PORT; do
  echo "API not ready, sleeping for 2 seconds..."
  sleep 2
done

echo "API is ready. Starting Nginx."
# Execute the original command (nginx)
exec "$@" 