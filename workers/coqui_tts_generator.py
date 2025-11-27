#!/usr/bin/env python3
"""
Coqui TTS Generator
Gera áudio TTS usando Coqui TTS (https://github.com/coqui-ai/TTS)

Uso:
    python coqui_tts_generator.py --text "Olá, mundo" --output output.wav

Requisitos:
    pip install TTS
"""

import argparse
import sys
import os
import json
from pathlib import Path

# Adicionar path do projeto ao sys.path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from TTS.api import TTS
    import torch
except ImportError as e:
    print(f"❌ Erro: Coqui TTS não está instalado. Execute: pip install TTS", file=sys.stderr)
    print(f"   Erro detalhado: {e}", file=sys.stderr)
    sys.exit(1)
except OSError as e:
    # Erro ao carregar bibliotecas nativas (torchaudio, etc.)
    if 'torchaudio' in str(e) or 'libtorchaudio' in str(e) or 'WinError 127' in str(e):
        print(f"❌ Erro: Problema ao carregar torchaudio no Windows", file=sys.stderr)
        print(f"   Este é um problema comum no Windows com dependências do PyTorch.", file=sys.stderr)
        print(f"", file=sys.stderr)
        print(f"   SOLUÇÕES:", file=sys.stderr)
        print(f"   1. Reinstalar PyTorch e torchaudio com versões compatíveis:", file=sys.stderr)
        print(f"      pip uninstall torch torchaudio", file=sys.stderr)
        print(f"      pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu", file=sys.stderr)
        print(f"", file=sys.stderr)
        print(f"   2. Instalar Visual C++ Redistributables:", file=sys.stderr)
        print(f"      Baixe e instale: https://aka.ms/vs/17/release/vc_redist.x64.exe", file=sys.stderr)
        print(f"", file=sys.stderr)
        print(f"   3. Se usar CUDA, instalar versão CUDA compatível:", file=sys.stderr)
        print(f"      pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118", file=sys.stderr)
        print(f"", file=sys.stderr)
        print(f"   Erro detalhado: {e}", file=sys.stderr)
    else:
        print(f"❌ Erro ao carregar bibliotecas: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro inesperado ao importar TTS: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Gerar áudio TTS com Coqui TTS')
    parser.add_argument('--text', help='Texto a ser convertido em fala')
    parser.add_argument('--text-file', help='Arquivo com texto a ser convertido (alternativa a --text)')
    parser.add_argument('--output', required=True, help='Caminho do arquivo de saída')
    parser.add_argument('--model', default='tts_models/multilingual/multi-dataset/xtts_v2', help='Modelo TTS (padrão: XTTS v2 para melhor clonagem)')
    parser.add_argument('--vocoder', help='Modelo vocoder (opcional)')
    parser.add_argument('--speed', type=float, default=1.0, help='Velocidade (0.5-2.0, padrão: 1.0)')
    parser.add_argument('--speaker_wav', help='Caminho para arquivo WAV de referência (clonagem de voz). Para XTTS v2, pode ser múltiplos arquivos separados por vírgula')
    parser.add_argument('--language', default='pt', help='Idioma (padrão: pt). XTTS v2 suporta: pt, en, es, fr, de, it, pl, tr, ar, zh, ja, ko')
    parser.add_argument('--speaker_id', help='ID do speaker (para modelos multi-speaker)')
    parser.add_argument('--emotion', help='Emoção (se o modelo suportar)')
    parser.add_argument('--device', default='cpu', choices=['cpu', 'cuda'], help='Dispositivo (cpu ou cuda, padrão: cpu)')
    parser.add_argument('--temperature', type=float, default=0.75, help='Temperatura para XTTS v2 (0.0-1.0, padrão: 0.75) - controla aleatoriedade/naturalidade')
    parser.add_argument('--top_p', type=float, default=0.85, help='Top-p para XTTS v2 (0.0-1.0, padrão: 0.85) - controla diversidade')
    parser.add_argument('--top_k', type=int, default=50, help='Top-k para XTTS v2 (padrão: 50) - controla amostragem')
    
    args = parser.parse_args()
    
    # Validar que pelo menos --text ou --text-file foi fornecido
    if not args.text and not args.text_file:
        print("❌ Erro: --text ou --text-file deve ser fornecido", file=sys.stderr)
        parser.print_help()
        sys.exit(1)
    
    # Ler texto do arquivo se --text-file foi fornecido
    text = args.text
    if args.text_file:
        if not os.path.exists(args.text_file):
            print(f"❌ Arquivo de texto não encontrado: {args.text_file}", file=sys.stderr)
            sys.exit(1)
        try:
            with open(args.text_file, 'r', encoding='utf-8') as f:
                text = f.read().strip()
            print(f"📄 Texto lido do arquivo: {args.text_file} ({len(text)} caracteres)", file=sys.stderr)
        except Exception as e:
            print(f"❌ Erro ao ler arquivo de texto: {e}", file=sys.stderr)
            sys.exit(1)
    
    if not text or len(text.strip()) == 0:
        print("❌ Erro: Texto não pode ser vazio", file=sys.stderr)
        sys.exit(1)
    
    # Validar velocidade
    if args.speed < 0.5 or args.speed > 2.0:
        print(f"⚠️ Velocidade {args.speed} fora do range válido (0.5-2.0). Usando 1.0.", file=sys.stderr)
        args.speed = 1.0
    
    # Verificar se CUDA está disponível
    device = args.device
    if device == 'cuda' and not torch.cuda.is_available():
        print("⚠️ CUDA não disponível, usando CPU", file=sys.stderr)
        device = 'cpu'
    
    try:
        print(f"🎤 Iniciando Coqui TTS...", file=sys.stderr)
        print(f"   Modelo: {args.model}", file=sys.stderr)
        print(f"   Dispositivo: {device}", file=sys.stderr)
        print(f"   Texto: {text[:50]}...", file=sys.stderr)
        sys.stderr.flush()  # Garantir que a mensagem apareça imediatamente
        
        # Inicializar TTS
        # IMPORTANTE: XTTS v2 requer gpu=False explicitamente para CPU
        # e progress_bar=False para evitar problemas de output
        print(f"⏳ Carregando modelo TTS (isso pode demorar na primeira vez)...", file=sys.stderr)
        sys.stderr.flush()
        
        tts = TTS(model_name=args.model, progress_bar=False, gpu=(device == 'cuda'))
        
        print(f"✅ Modelo carregado com sucesso!", file=sys.stderr)
        sys.stderr.flush()
        
        # Verificar se precisa de speaker_wav (clonagem de voz)
        if args.speaker_wav:
            if not os.path.exists(args.speaker_wav):
                print(f"❌ Arquivo de referência não encontrado: {args.speaker_wav}", file=sys.stderr)
                sys.exit(1)
            
            print(f"🎯 Usando clonagem de voz XTTS v2 com referência: {args.speaker_wav}", file=sys.stderr)
            sys.stderr.flush()
            
            # Gerar áudio com clonagem de voz usando XTTS v2
            # XTTS v2 requer parâmetros específicos para melhor qualidade
            tts_params = {
                'text': text,
                'file_path': args.output,
                'speaker_wav': args.speaker_wav,
                'speed': args.speed,
                'language': args.language if args.language else 'pt'  # XTTS v2 sempre requer language
            }
            
            # Adicionar parâmetros avançados do XTTS v2 para melhor qualidade
            # Esses parâmetros controlam a naturalidade e qualidade da voz clonada
            if 'xtts' in args.model.lower() or 'v2' in args.model.lower():
                # XTTS v2 suporta parâmetros de temperatura e top-p para melhor controle
                # Temperature: valores mais baixos (0.5-0.7) = mais consistente, valores mais altos (0.8-1.0) = mais natural
                # Top-p: controla diversidade, valores mais altos = mais variação natural
                tts_params['temperature'] = args.temperature
                tts_params['top_p'] = args.top_p
                tts_params['top_k'] = args.top_k
                print(f"🎛️ Parâmetros XTTS v2: temperature={args.temperature}, top_p={args.top_p}, top_k={args.top_k}", file=sys.stderr)
                sys.stderr.flush()
            
            # XTTS v2 suporta múltiplos arquivos de referência para melhor qualidade
            # Se o speaker_wav for uma lista (separada por vírgula), usar todos
            if ',' in args.speaker_wav:
                speaker_files_raw = [f.strip() for f in args.speaker_wav.split(',')]
                speaker_files = []
                # Verificar se todos os arquivos existem (usar lista nova para evitar problemas ao remover)
                for speaker_file in speaker_files_raw:
                    if os.path.exists(speaker_file):
                        speaker_files.append(speaker_file)
                    else:
                        print(f"⚠️ Arquivo de referência não encontrado: {speaker_file}, ignorando...", file=sys.stderr)
                
                if speaker_files:
                    # XTTS v2 aceita lista de arquivos para melhor clonagem
                    tts_params['speaker_wav'] = speaker_files
                    print(f"🎯 Usando {len(speaker_files)} arquivos de referência para melhor qualidade", file=sys.stderr)
                    sys.stderr.flush()
                else:
                    print(f"❌ Nenhum arquivo de referência válido encontrado", file=sys.stderr)
                    sys.stderr.flush()
                    sys.exit(1)
            
            print(f"🎙️ Gerando áudio (isso pode demorar alguns segundos)...", file=sys.stderr)
            sys.stderr.flush()
            
            tts.tts_to_file(**tts_params)
            
            print(f"✅ Áudio gerado, verificando arquivo...", file=sys.stderr)
            sys.stderr.flush()
        else:
            # Gerar áudio normal
            # Preparar parâmetros (só incluir language se o modelo for multi-lingual)
            tts_params = {
                'text': text,
                'file_path': args.output,
                'speed': args.speed
            }
            
            # Verificar se o modelo é multi-lingual antes de adicionar language
            # Modelos específicos de idioma (como pt/cv/vits) não precisam de language
            if args.speaker_id:
                tts_params['speaker'] = args.speaker_id
            
            # Só adicionar language se o modelo for multi-lingual
            # Modelos como "tts_models/multilingual/..." são multi-lingual
            if 'multilingual' in args.model.lower() and args.language:
                tts_params['language'] = args.language
            
            print(f"🎙️ Gerando áudio (isso pode demorar alguns segundos)...", file=sys.stderr)
            sys.stderr.flush()
            
            tts.tts_to_file(**tts_params)
            
            print(f"✅ Áudio gerado, verificando arquivo...", file=sys.stderr)
            sys.stderr.flush()
        
        # Verificar se o arquivo foi gerado
        if not os.path.exists(args.output):
            print(f"❌ Arquivo de saída não foi gerado: {args.output}", file=sys.stderr)
            sys.exit(1)
        
        file_size = os.path.getsize(args.output)
        print(f"✅ Áudio gerado com sucesso: {args.output} ({file_size / 1024:.2f} KB)", file=sys.stderr)
        sys.stderr.flush()
        
        # Retornar JSON com informações
        result = {
            "success": True,
            "output": args.output,
            "size_bytes": file_size,
            "model": args.model,
            "device": device
        }
        print(json.dumps(result))
        sys.stdout.flush()  # Garantir que o JSON seja enviado
        
    except KeyboardInterrupt:
        print(f"\n⚠️ Processo interrompido pelo usuário", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(130)  # Código padrão para SIGINT
    except Exception as e:
        print(f"❌ Erro ao gerar TTS: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)

if __name__ == '__main__':
    main()

