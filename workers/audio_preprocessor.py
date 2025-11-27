"""
Pipeline de Pré-processamento de Áudio Profissional
Replica o processo do Fish AI: processamento, normalização, denoise, trim

Etapas:
1. Conversão para WAV mono
2. Resample para 24kHz (ou 22.05kHz)
3. Normalização RMS
4. Redução de ruído (noisereduce)
5. Bandpass filter
6. Trim de silêncio
"""

import librosa
import soundfile as sf
import noisereduce as nr
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def preprocess_audio(
    input_path: str,
    output_path: str,
    target_sr: int = 24000,
    normalize_rms: bool = True,
    reduce_noise: bool = True,
    apply_bandpass: bool = True,
    trim_silence: bool = True,
    top_db: int = 25
) -> Tuple[str, dict]:
    """
    Pré-processa áudio seguindo pipeline profissional do Fish AI.
    
    Args:
        input_path: Caminho do áudio de entrada
        output_path: Caminho do áudio processado
        target_sr: Sample rate alvo (24000 ou 22050)
        normalize_rms: Normalizar RMS
        reduce_noise: Reduzir ruído
        apply_bandpass: Aplicar filtro bandpass
        trim_silence: Remover silêncio inicial/final
        top_db: Threshold para trim (dB)
    
    Returns:
        Tuple (output_path, metadata)
    """
    logger.info(f"🎵 Iniciando pré-processamento: {input_path}")
    
    try:
        # 1. Carregar áudio (preserva sample rate original)
        y, sr = librosa.load(input_path, sr=None, mono=False)
        logger.info(f"   📊 Áudio original: {sr}Hz, {len(y) if isinstance(y, np.ndarray) else len(y[0])} samples")
        
        # 2. Converter para mono se estéreo
        if len(y.shape) > 1:
            y = librosa.to_mono(y)
            logger.info("   ✅ Convertido para mono")
        
        # 3. Resample para target_sr
        if sr != target_sr:
            y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
            logger.info(f"   ✅ Resampleado para {target_sr}Hz")
        
        # 4. Normalização RMS (garante volume consistente)
        if normalize_rms:
            rms = np.sqrt(np.mean(y**2))
            if rms > 0:
                target_rms = 0.1  # RMS alvo (ajustável)
                y = y * (target_rms / rms)
                logger.info(f"   ✅ Normalizado RMS: {rms:.4f} → {target_rms:.4f}")
        
        # 5. Redução de ruído (noisereduce)
        if reduce_noise:
            try:
                y = nr.reduce_noise(y=y, sr=target_sr, stationary=False)
                logger.info("   ✅ Ruído reduzido")
            except Exception as e:
                logger.warning(f"   ⚠️ Erro na redução de ruído: {e}")
        
        # 6. Bandpass filter (remove frequências muito baixas/altas)
        if apply_bandpass:
            from scipy import signal
            # Filtro passa-banda: 80Hz - 8000Hz (voz humana)
            nyquist = target_sr / 2
            low = 80 / nyquist
            high = 8000 / nyquist
            b, a = signal.butter(4, [low, high], btype='band')
            y = signal.filtfilt(b, a, y)
            logger.info("   ✅ Filtro bandpass aplicado (80Hz-8kHz)")
        
        # 7. Trim de silêncio (remove silêncio inicial/final)
        if trim_silence:
            y_trimmed, _ = librosa.effects.trim(y, top_db=top_db)
            original_length = len(y)
            trimmed_length = len(y_trimmed)
            if trimmed_length < original_length:
                y = y_trimmed
                logger.info(f"   ✅ Silêncio removido: {original_length} → {trimmed_length} samples")
        
        # 8. Salvar áudio processado
        output_path_obj = Path(output_path)
        output_path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        sf.write(output_path, y, target_sr, subtype='PCM_16')
        logger.info(f"   ✅ Áudio salvo: {output_path}")
        
        # Metadata
        duration = len(y) / target_sr
        metadata = {
            'original_sr': sr,
            'target_sr': target_sr,
            'duration': duration,
            'samples': len(y),
            'file_size': Path(output_path).stat().st_size
        }
        
        logger.info(f"   ✅ Pré-processamento concluído: {duration:.2f}s")
        return output_path, metadata
        
    except Exception as e:
        logger.error(f"   ❌ Erro no pré-processamento: {e}")
        raise


def batch_preprocess(
    input_paths: list[str],
    output_dir: str,
    **kwargs
) -> list[Tuple[str, dict]]:
    """
    Pré-processa múltiplos áudios em lote.
    
    Args:
        input_paths: Lista de caminhos de entrada
        output_dir: Diretório de saída
        **kwargs: Argumentos para preprocess_audio
    
    Returns:
        Lista de (output_path, metadata)
    """
    results = []
    output_dir_obj = Path(output_dir)
    output_dir_obj.mkdir(parents=True, exist_ok=True)
    
    for i, input_path in enumerate(input_paths):
        input_name = Path(input_path).stem
        output_path = output_dir_obj / f"{input_name}_processed.wav"
        
        try:
            result = preprocess_audio(str(input_path), str(output_path), **kwargs)
            results.append(result)
        except Exception as e:
            logger.error(f"Erro ao processar {input_path}: {e}")
            continue
    
    return results


if __name__ == "__main__":
    # Teste
    import sys
    
    if len(sys.argv) < 3:
        print("Uso: python audio_preprocessor.py <input> <output>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    preprocess_audio(input_path, output_path)

