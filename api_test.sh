#!/bin/bash
echo "pulling changes from gitlab"
git checkout master
git pull
echo "branch updated"

echo "stop containers"
docker compose stop
echo "containers stopped"

echo "build new containers"
docker build -t fraunited/server .
echo "containers built"

echo "create and start containers"
docker compose create robocupci
docker compose start
docker ps



echo "executing custom file"
./newman.sh
echo "custom file executed"
