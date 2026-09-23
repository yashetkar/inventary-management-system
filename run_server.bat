@echo off
cd /d "%~dp0"
title Asset Management Server
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Press any key to exit...
    pause >nul
)
