#!/bin/bash
echo "Stopping Containers"
docker stop core-robocupci-1 core-mongodb-1
echo "Containers stopped successfully"

echo "Restarting Containers"
docker compose start
echo "Containers restarted successfully"
docker ps
