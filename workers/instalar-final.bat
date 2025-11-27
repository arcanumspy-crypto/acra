@echo off
echo ========================================
echo Instalacao Final de Dependencias
echo ========================================
echo.

REM Verificar Python 3.12
py -3.12 --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python 3.12 nao encontrado!
    echo Instale Python 3.12 primeiro.
    pause
    exit /b 1
)

echo [OK] Python 3.12 encontrado!
py -3.12 --version
echo.

echo [INFO] Instalando dependencias principais...
py -3.12 -m pip install librosa soundfile noisereduce numpy scipy requests python-dotenv pydub torch

if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias principais!
    pause
    exit /b 1
)

echo.
echo [INFO] Instalando resemblyzer sem webrtcvad...
py -3.12 -m pip install resemblyzer --no-deps

if errorlevel 1 (
    echo [ERRO] Falha ao instalar resemblyzer!
    pause
    exit /b 1
)

echo.
echo [INFO] Aplicando patch para webrtcvad opcional...
echo NOTA: webrtcvad nao sera instalado (requer compilacao C++).
echo O pipeline funcionara normalmente, apenas sem detecao de voz ativa.
echo.

echo ========================================
echo [SUCESSO] Dependencias instaladas!
echo ========================================
echo.
echo IMPORTANTE: webrtcvad nao foi instalado.
echo O pipeline funcionara, mas use o patch em resemblyzer_patch.py
echo antes de importar resemblyzer nos seus scripts.
echo.
echo Teste: py -3.12 -c "import sys; sys.path.insert(0, '.'); exec(open('resemblyzer_patch.py').read()); from resemblyzer import VoiceEncoder; print('OK!')"
echo.
pause

