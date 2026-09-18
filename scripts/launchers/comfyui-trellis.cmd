@echo off
REM Skills Lab launcher: comfyui-trellis
REM Opened from the room of the same name. Reports what is installed; changes nothing.
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\launchers\check-prereqs.ps1" -Lane comfyui-trellis
echo.
pause
