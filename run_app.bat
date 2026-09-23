@echo off
cd /d "%~dp0"
title Asset Management System

if exist inventary.py (
    python inventary.py
) else if exist inventory.py (
    python inventory.py
) else (
    echo Error: Could not find script file.
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Press any key to exit...
    pause >nul
)
