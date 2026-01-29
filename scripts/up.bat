echo off

title Docker Start

echo "Starting Docker through docker-compose..."
docker-compose up --build -d

timeout /t 5 /nobreak > NUL

echo on
