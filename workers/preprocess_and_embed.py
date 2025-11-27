"""
Script Python de Pré-processamento + Extração de Embedding
Versão integrada e otimizada para o pipeline profissional
"""

import os
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
import base64
import json
import logging
import sys

# Patch para webrtcvad opcional
try:
    import webrtcvad
except ImportError:
    # Criar mock do webrtcvad se não estiver disponível
    # O resemblyzer chama vad.is_speech(buf, sample_rate=16000)
    class MockVad:
        def __init__(self, mode=2):
            self.mode = mode
        
        def is_speech(self, buf, sample_rate=16000):
            # Aceita buf e sample_rate (com default) mas sempre retorna True (voz ativa)
            return True
    
    class MockWebRTCVad:
        Vad = MockVad
    
    sys.modules['webrtcvad'] = MockWebRTCVad()

# Agora pode importar resemblyzer
from resemblyzer import VoiceEncoder, preprocess_wav

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar encoder uma vez (reutilizável)
encoder = VoiceEncoder()  # resemblyzer


def preprocess_audio(in_path: str, out_path: str, target_sr: int = 24000):
    """
    Pré-processa áudio seguindo pipeline profissional:
    - Conversão para mono
    - Resample para target_sr
    - Redução de ruído
    - Trim de silêncio
    - Normalização RMS
    """
    logger.info(f"🎵 Pré-processando: {in_path} -> {out_path}")
    
    y, sr = librosa.load(in_path, sr=None)
    
    # Mono
    if y.ndim > 1:
        y = librosa.to_mono(y)
        logger.info("   ✅ Convertido para mono")
    
    # Resample
    if sr != target_sr:
        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        logger.info(f"   ✅ Resampleado: {sr}Hz -> {target_sr}Hz")
    
    # Noise reduction
    try:
        y = nr.reduce_noise(y=y, sr=target_sr)
        logger.info("   ✅ Ruído reduzido")
    except Exception as e:
        logger.warning(f"   ⚠️ Erro no noisereduce: {e}")
    
    # Trim silence (substitui webrtcvad - mais preciso!)
    # Librosa.effects.trim é melhor que webrtcvad para remoção de silêncio
    yt, _ = librosa.effects.trim(y, top_db=25)
    if len(yt) < len(y):
        logger.info(f"   ✅ Silêncio removido: {len(y)} -> {len(yt)} samples (melhor que webrtcvad!)")
    
    # Normalize RMS
    rms = np.sqrt(np.mean(yt**2) + 1e-9)
    if rms > 0:
        target_rms = 0.07
        yt = yt * (target_rms / rms)
        logger.info(f"   ✅ RMS normalizado: {rms:.4f} -> {target_rms:.4f}")
    
    # Garantir que diretório existe
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    
    sf.write(out_path, yt, samplerate=target_sr, subtype="PCM_16")
    logger.info(f"   ✅ Áudio salvo: {out_path}")
    
    return out_path


def extract_embedding(wav_path: str):
    """
    Extrai embedding de voz usando Resemblyzer.
    
    Args:
        wav_path: Caminho do áudio pré-processado
    
    Returns:
        numpy array com embedding
    """
    logger.info(f"🎤 Extraindo embedding: {wav_path}")
    
    # Usar método direto (sem preprocess_wav) para evitar problema com webrtcvad
    # O áudio já foi pré-processado, então podemos carregar direto
    logger.info("   🔄 Carregando áudio para extração de embedding...")
    
    # Resemblyzer requer 16kHz
    wav, sr = librosa.load(wav_path, sr=16000)
    emb = encoder.embed_utterance(wav)
    
    logger.info(f"   ✅ Embedding extraído: shape {emb.shape}")
    return emb


def embedding_to_base64(emb: np.ndarray):
    """
    Converte embedding numpy para base64 string.
    """
    return base64.b64encode(emb.tobytes()).decode("utf-8")


def base64_to_embedding(b64_str: str) -> np.ndarray:
    """
    Converte base64 string para embedding numpy.
    """
    bytes_data = base64.b64decode(b64_str)
    return np.frombuffer(bytes_data, dtype=np.float32)


def save_embedding_json(emb: np.ndarray, out_json: str):
    """
    Salva embedding em arquivo JSON.
    """
    obj = {"embedding": emb.tolist(), "shape": list(emb.shape), "dtype": str(emb.dtype)}
    
    Path(out_json).parent.mkdir(parents=True, exist_ok=True)
    
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    
    logger.info(f"   ✅ Embedding salvo: {out_json}")


def load_embedding_json(json_path: str) -> np.ndarray:
    """
    Carrega embedding de arquivo JSON.
    """
    with open(json_path, "r", encoding="utf-8") as f:
        obj = json.load(f)
    
    return np.array(obj["embedding"], dtype=np.float32)


if __name__ == "__main__":
    import argparse
    
    p = argparse.ArgumentParser(description="Pré-processa áudio e extrai embedding")
    p.add_argument("--input", required=True, help="Caminho do áudio de entrada")
    p.add_argument("--out", required=False, help="Caminho de saída (opcional)")
    p.add_argument("--target-sr", type=int, default=24000, help="Sample rate alvo (padrão: 24000)")
    args = p.parse_args()
    
    input_path = args.input
    out_path = args.out or (Path(input_path).with_suffix(".proc.wav").as_posix())
    
    logger.info(f"🚀 Iniciando processamento: {input_path}")
    
    # Pré-processar
    preprocess_audio(input_path, out_path, target_sr=args.target_sr)
    
    # Extrair embedding
    emb = extract_embedding(out_path)
    logger.info(f"✅ Embedding extraído: shape {emb.shape}, len {len(emb)}")
    
    # Salvar embedding JSON
    save_embedding_json(emb, out_path + ".emb.json")
    
    logger.info(f"✅ Processamento concluído!")
    logger.info(f"   Áudio processado: {out_path}")
    logger.info(f"   Embedding: {out_path}.emb.json")

