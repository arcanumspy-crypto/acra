#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste rápido de extração de embedding
"""

import sys
from pathlib import Path

# Aplicar patch do webrtcvad
try:
    import webrtcvad
    print("✅ webrtcvad disponível")
except ImportError:
    class MockVad:
        def __init__(self, mode=2):
            self.mode = mode
        
        def is_speech(self, buf, sample_rate=16000):
            return True
    
    class MockWebRTCVad:
        Vad = MockVad
    
    sys.modules['webrtcvad'] = MockWebRTCVad()
    print("⚠️ webrtcvad não disponível - usando mock")

# Importar resemblyzer
from resemblyzer import VoiceEncoder, preprocess_wav
import librosa
import numpy as np

print("✅ Resemblyzer importado com sucesso!")

# Testar extração (se tiver arquivo de teste)
if len(sys.argv) > 1:
    audio_path = sys.argv[1]
    print(f"🎤 Testando extração de embedding: {audio_path}")
    
    encoder = VoiceEncoder()
    
    try:
        # Método 1: preprocess_wav
        wav = preprocess_wav(Path(audio_path))
        emb = encoder.embed_utterance(wav)
        print(f"✅ Embedding extraído: shape {emb.shape}")
    except Exception as e:
        print(f"⚠️ Erro com preprocess_wav: {e}")
        print("🔄 Tentando método alternativo...")
        
        # Método 2: carregar direto
        wav, sr = librosa.load(audio_path, sr=16000)
        emb = encoder.embed_utterance(wav)
        print(f"✅ Embedding extraído (alternativo): shape {emb.shape}")
else:
    print("✅ Teste de importação passou!")
    print("   Use: python test_extract_embedding.py <audio.wav> para testar extração")

