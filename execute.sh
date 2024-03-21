#!/bin/bash
echo "Stopping containers"
docker stop core-robocupci-1 core-mongodb-1
echo "Containers stopped successfully"

echo "Restarting containers"
docker compose start
echo "Containers restarted successfully"

docker ps
