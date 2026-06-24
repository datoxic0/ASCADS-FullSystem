@echo off
title EngiGraph Pro Master Build System
echo ============================================================
echo   EngiGraph Pro - Universal Hybrid Build Tool
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
    echo [WARNING] Rust compiler not found. Tauri build will fail.
)

echo Select Target Platform:
echo [1] Windows (Tauri - Premium, ~2MB)
echo [2] Windows (Electron - Standard, ~150MB)
echo [3] Android (Capacitor APK - Experimental)
echo [4] Web/PWA (Asset Staging Only)
echo.

set /p userchoice=Your Selection: 

:STAGE_ASSETS
echo.
echo === [Step 1] Staging Web Assets ===
if not exist "web_build" mkdir web_build
echo Cleaning old assets...
del /Q web_build\*.* >nul 2>&1
echo Copying fresh assets...
xcopy /Y *.html web_build >nul
xcopy /Y *.js web_build >nul
xcopy /Y *.css web_build >nul
xcopy /Y *.png web_build >nul
xcopy /Y *.ico web_build >nul
xcopy /Y *.json web_build >nul
xcopy /Y *.jpg web_build >nul
echo Asset staging complete.

if "%userchoice%"=="1" goto DO_TAURI
if "%userchoice%"=="2" goto DO_ELECTRON
if "%userchoice%"=="3" goto DO_ANDROID
if "%userchoice%"=="4" goto SUCCESS

echo Invalid choice.
pause
exit

:DO_TAURI
echo.
echo === [Step 2] Starting Tauri Build ===
call npm run tauri build
if errorlevel 1 (
    echo [BUILD FAILED] Tauri build encountered an error.
    pause
    exit
)
goto SUCCESS

:DO_ELECTRON
echo.
echo === [Step 2] Starting Electron Build ===
call npm run build:electron
if errorlevel 1 (
    echo [BUILD FAILED] Electron build encountered an error.
    pause
    exit
)
goto SUCCESS

:DO_ANDROID
echo.
echo === [Step 2] Starting Capacitor Sync ===
echo [Note] Requires Android Studio / SDK for final APK generation.
call npx cap sync
if errorlevel 1 (
    echo [INIT] Capacitor setup detected... attempting repair...
    call npx cap add android
)
echo To build the final APK, open the 'android' folder in Android Studio.
goto SUCCESS

:SUCCESS
echo.
echo ============================================================
echo   BUILD COMPLETED SUCCESSFULLY
echo ============================================================
pause
exit
