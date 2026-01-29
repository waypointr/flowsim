echo off

title Docker Clear

echo "Clearing Docker containers..."
docker container prune -f

echo "Clearing Docker images..."
docker image prune -f

echo "Clearing Docker networks..."
docker network prune -f

echo "Clearing Docker volumes..."
docker volume prune -f

timeout /t 5 /nobreak > NUL

echo on
