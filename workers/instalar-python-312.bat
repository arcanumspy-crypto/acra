@echo off
echo ========================================
echo Instalacao de Dependencias - Python 3.12
echo ========================================
echo.

REM Verificar se Python 3.12 esta instalado
python3.12 --version >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Python 3.12 nao encontrado!
    echo.
    echo Python 3.14 nao e suportado por algumas bibliotecas.
    echo.
    echo Por favor, instale Python 3.12:
    echo 1. Acesse: https://www.python.org/downloads/release/python-3120/
    echo 2. Baixe "Windows installer (64-bit)"
    echo 3. Execute o instalador
    echo 4. MARQUE "Add Python to PATH"
    echo 5. Feche e reabra este terminal
    echo.
    pause
    exit /b 1
)

echo [OK] Python 3.12 encontrado!
python3.12 --version
echo.

REM Verificar se pip esta disponivel
python3.12 -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] pip nao esta disponivel!
    echo.
    pause
    exit /b 1
)

echo [OK] pip encontrado!
python3.12 -m pip --version
echo.

REM Atualizar pip primeiro
echo [INFO] Atualizando pip...
python3.12 -m pip install --upgrade pip
echo.

REM Instalar dependencias
echo [INFO] Instalando dependencias...
echo Isso pode levar alguns minutos...
echo.

python3.12 -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias!
    echo.
    echo Tente executar como Administrador ou use:
    echo python3.12 -m pip install --user -r requirements.txt
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
echo 2. Teste o script: python3.12 preprocess_and_embed.py --help
echo.
echo NOTA: Use python3.12 para executar os scripts Python
echo.
pause

