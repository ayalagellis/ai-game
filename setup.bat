@echo off
REM Dynamic Storylines Setup Script for Windows
REM This script sets up the entire project for development

echo 🎮 Setting up Dynamic Storylines...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js detected

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo [SUCCESS] npm detected

REM Install root dependencies
echo [INFO] Installing root dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

REM Install server dependencies
echo [INFO] Installing server dependencies...
cd server
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

REM Install client dependencies
echo [INFO] Installing client dependencies...
cd client
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

REM Create environment files
echo [INFO] Creating environment files...

REM Server environment
if not exist "server\.env" (
    copy "server\env.example" "server\.env" >nul
    echo [WARNING] Created server\.env from template. Please configure your environment variables.
) else (
    echo [INFO] server\.env already exists
)

REM Client environment
if not exist "client\.env" (
    copy "client\env.example" "client\.env" >nul
    echo [WARNING] Created client\.env from template. Please configure your environment variables.
) else (
    echo [INFO] client\.env already exists
)

REM Create asset directories
echo [INFO] Creating asset directories...
if not exist "client\src\assets\backgrounds" mkdir "client\src\assets\backgrounds"
if not exist "client\src\assets\sounds" mkdir "client\src\assets\sounds"
if not exist "client\src\assets\particles" mkdir "client\src\assets\particles"
if not exist "client\src\assets\icons" mkdir "client\src\assets\icons"

echo [SUCCESS] Setup completed successfully!
echo.
echo [INFO] Next steps:
echo 1. Configure your environment variables in server\.env and client\.env
echo 2. Set up your PostgreSQL database
echo 3. Run 'cd server ^&^& npm run db:migrate' to create database tables
echo 4. Run 'npm run dev' to start the development servers
echo.
echo [INFO] Development servers will run on:
echo   - Frontend: http://localhost:5173
echo   - Backend: http://localhost:3001
echo.
echo [INFO] For production deployment:
echo   - Run 'npm run build' to build both client and server
echo   - Configure your production environment variables
echo   - Set up your production database
echo.
echo [SUCCESS] Happy coding! 🚀
pause
