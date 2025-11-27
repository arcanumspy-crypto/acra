#!/usr/bin/env python3
"""
Listar modelos disponíveis do Coqui TTS
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    from TTS.api import TTS
except ImportError:
    print("[]", file=sys.stderr)
    sys.exit(1)

def main():
    try:
        # Listar modelos disponíveis
        models = TTS.list_models()
        
        # Retornar como JSON
        print(json.dumps(models))
    except Exception as e:
        print(f"[]", file=sys.stderr)
        print(f"Erro: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

