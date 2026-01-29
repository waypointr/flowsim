echo off

title Docker Stop

echo "Stopping Docker through docker-compose..."
docker-compose down
timeout /t 5 /nobreak > NUL

echo on
