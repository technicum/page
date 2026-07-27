@echo off
echo === PageZaper Deploy ===
cd /d D:\page\page
git add -A
git commit -m "feat: theme demo route + iframe preview modals for all themes"
git push origin main
echo.
echo === Done! Now SSH into the VPS and run: ===
echo cd /var/www/pagezaper ^&^& git pull origin main ^&^& pm2 restart pagezaper
pause
