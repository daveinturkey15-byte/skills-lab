@echo off
REM Skills Lab launcher: ue5-game-recording
REM Opened from the room of the same name. Reports what is installed; changes nothing.
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\launchers\check-prereqs.ps1" -Lane ue5-game-recording
echo.
pause
