#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Instalação das Dependências
"""

print("🧪 Testando instalação das dependências...")
print()

# Teste 1: Básicos
try:
    import librosa
    import soundfile
    import numpy
    import scipy
    print("✅ Básicos: librosa, soundfile, numpy, scipy - OK")
except ImportError as e:
    print(f"❌ Erro nos básicos: {e}")

# Teste 2: Resemblyzer com patch
try:
    # Aplicar patch primeiro
    try:
        import webrtcvad
        print("✅ webrtcvad disponível")
    except ImportError:
        from unittest.mock import MagicMock
        import sys
        
        # Criar classe Vad mock que aceita os argumentos corretos
        class MockVad:
            def __init__(self, mode=2):
                self.mode = mode
            
            def is_speech(self, buf, sample_rate):
                # Aceita sample_rate mas sempre retorna True (voz ativa)
                return True
        
        webrtcvad_mock = MagicMock()
        webrtcvad_mock.Vad = MockVad
        sys.modules['webrtcvad'] = webrtcvad_mock
        print("⚠️ webrtcvad não disponível - usando mock")
    
    # Agora importar resemblyzer
    from resemblyzer import VoiceEncoder, preprocess_wav
    print("✅ Resemblyzer - OK")
except ImportError as e:
    print(f"❌ Erro no resemblyzer: {e}")
except Exception as e:
    print(f"❌ Erro no resemblyzer: {e}")

# Teste 3: Outros
try:
    import requests
    import noisereduce
    import pydub
    print("✅ Utilitários: requests, noisereduce, pydub - OK")
except ImportError as e:
    print(f"❌ Erro nos utilitários: {e}")

print()
print("🎉 Teste concluído!")

