@echo off
echo ==========================================
echo      DEPLOYING UPDATES TO GITHUB
echo ==========================================

cd ..

echo 1. Adding files...
git add .

echo 2. Committing changes...
git commit -m "feat: add credit cards, recurring expenses summary and dashboard improvements"

echo 3. Pushing to remote...
git push

echo ==========================================
echo      DONE! Check Vercel for deployment.
echo ==========================================
pause
