@echo off
title EngiGraph Pro Build System
echo ============================================================
echo   EngiGraph Pro - Windows Build Tool
echo ============================================================
echo.

:: 1. Verify Environment
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. 
    pause
    exit
)

rustc --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Rust compiler not found. Option 1 will fail.
)

echo Press 1 for Tauri (Premium, ~8MB)
echo Press 2 for Electron (Standard, ~150MB)
echo.

set /p userchoice=Your Selection: 

if "%userchoice%"=="1" goto DO_TAURI
if "%userchoice%"=="2" goto DO_ELECTRON

echo Invalid choice.
pause
exit

:DO_TAURI
echo.
echo === Starting Tauri Build ===
echo [Step 1/3] Staging Web Assets...
if not exist "web_build" mkdir web_build
xcopy /Y *.html web_build >nul
xcopy /Y *.js web_build >nul
xcopy /Y *.css web_build >nul
xcopy /Y *.png web_build >nul
xcopy /Y *.ico web_build >nul
xcopy /Y *.json web_build >nul

echo [Step 2/3] Installing CLI...
call npm install --save-dev @tauri-apps/cli
echo [Step 3/3] Building Binary...
call npx tauri build --verbose
if errorlevel 1 (
    echo.
    echo [BUILD FAILED] Tauri build encountered an error.
    pause
    exit
)
echo.
echo SUCCESS!
pause
exit

:DO_ELECTRON
echo.
echo === Starting Electron Build ===
echo Installing tools...
call npm install --save-dev electron electron-builder
echo Building Bundle...
call npm run build:electron
if errorlevel 1 (
    echo.
    echo [BUILD FAILED] Electron build encountered an error.
    pause
    exit
)
echo.
echo SUCCESS!
pause
exit
