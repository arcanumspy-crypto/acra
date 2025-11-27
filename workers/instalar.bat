@echo off
echo ========================================
echo Instalacao de Dependencias Python
echo ========================================
echo.

REM Verificar se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao esta instalado!
    echo.
    echo Por favor, instale Python primeiro:
    echo 1. Abra a Microsoft Store
    echo 2. Procure por "Python 3.11" ou "Python 3.12"
    echo 3. Clique em Instalar
    echo 4. Feche e reabra este terminal
    echo.
    echo Ou baixe de: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python encontrado!
python --version
echo.

REM Verificar se pip esta disponivel
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] pip nao esta disponivel!
    echo.
    echo Tente reinstalar Python marcando "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo [OK] pip encontrado!
python -m pip --version
echo.

REM Instalar dependencias
echo [INFO] Instalando dependencias...
echo Isso pode levar alguns minutos...
echo.

python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias!
    echo.
    echo Tente executar como Administrador ou use:
    echo python -m pip install --user -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo [SUCESSO] Dependencias instaladas!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure as variaveis de ambiente (.env.local)
echo 2. Teste o script: python preprocess_and_embed.py --help
echo.
pause

