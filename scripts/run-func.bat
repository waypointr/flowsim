@echo off

title Run Functional Tests

docker exec -e BROWSER=chrome -it vsm sh -c "cd /var/www/vsm && npm run test-functional"
timeout /t 5 /nobreak > NUL

@echo on
