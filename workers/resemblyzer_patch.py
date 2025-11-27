"""
Patch para tornar webrtcvad opcional no resemblyzer
Use este arquivo antes de importar resemblyzer
"""

import sys
from unittest.mock import MagicMock

# Criar mock do webrtcvad se não estiver disponível
try:
    import webrtcvad
except ImportError:
    # Criar classe Vad mock que aceita os argumentos corretos
    class MockVad:
        def __init__(self, mode=2):
            self.mode = mode
        
        def is_speech(self, buf, sample_rate):
            # Aceita sample_rate mas sempre retorna True (voz ativa)
            return True
    
    webrtcvad_mock = MagicMock()
    webrtcvad_mock.Vad = MockVad
    
    # Injetar no sys.modules
    sys.modules['webrtcvad'] = webrtcvad_mock
    
    print("⚠️ webrtcvad não disponível. Usando mock (detecção de voz sempre ativa).")

