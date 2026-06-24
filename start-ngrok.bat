@echo off
cd /d "%~dp0"
ngrok start --all --config "%LOCALAPPDATA%\ngrok\ngrok.yml,ngrok.yml"
