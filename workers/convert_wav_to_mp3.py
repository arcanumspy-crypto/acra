#!/usr/bin/env python3
"""
Converter WAV para MP3 usando pydub
"""

import argparse
import sys
from pathlib import Path

try:
    from pydub import AudioSegment
except ImportError:
    print("❌ Erro: pydub não está instalado. Execute: pip install pydub", file=sys.stderr)
    print("   NOTA: pydub requer ffmpeg. Instale: https://ffmpeg.org/download.html", file=sys.stderr)
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Converter WAV para MP3')
    parser.add_argument('--input', required=True, help='Arquivo WAV de entrada')
    parser.add_argument('--output', required=True, help='Arquivo MP3 de saída')
    
    args = parser.parse_args()
    
    try:
        # Carregar WAV
        audio = AudioSegment.from_wav(args.input)
        
        # Exportar como MP3
        audio.export(args.output, format='mp3', bitrate='128k')
        
        print(f"✅ Conversão concluída: {args.output}", file=sys.stderr)
    except Exception as e:
        print(f"❌ Erro ao converter: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

