@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\.venv\Scripts\python.exe" (
  echo [INFO] Ambiente backend nao encontrado. Execute setup-local.cmd primeiro.
  exit /b 1
)

echo [Motiva ORION] Iniciando backend e frontend...

start "Motiva ORION - Backend" cmd /k "cd /d "%BACKEND%" && .venv\Scripts\python.exe -m uvicorn app.main:app --reload"
start "Motiva ORION - Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo [OK] Backend e frontend iniciados em janelas separadas.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173

endlocal
