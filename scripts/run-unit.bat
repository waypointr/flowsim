@echo off

title Run Unit Tests

docker exec -it vsm sh -c "cd /var/www/vsm && npm run test-unit"
timeout /t 5 /nobreak > NUL

@echo on
