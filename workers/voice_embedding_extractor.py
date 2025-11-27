"""
Extração de Embeddings de Voz Profissional
Replica o processo do Fish AI: extração de embeddings, ajuste de sotaque/timbre

Usa:
- Resemblyzer (padrão, rápido)
- ECAPA-TDNN via SpeechBrain (mais preciso, requer GPU)
"""

import numpy as np
from pathlib import Path
from typing import Optional, List, Union
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Tentar importar resemblyzer
    # Se webrtcvad não estiver disponível, vamos usar alternativa
    try:
        from resemblyzer import VoiceEncoder, preprocess_wav
        RESEMBLYZER_AVAILABLE = True
    except ImportError as e:
        if 'webrtcvad' in str(e):
            logger.warning("webrtcvad não disponível. Usando processamento alternativo com librosa.")
            # Criar wrapper alternativo
            RESEMBLYZER_AVAILABLE = False
        else:
            raise
except ImportError:
    RESEMBLYZER_AVAILABLE = False
    logger.warning("Resemblyzer não disponível. Instale com: pip install resemblyzer")

try:
    import torch
    from speechbrain.pretrained import EncoderClassifier
    SPEECHBRAIN_AVAILABLE = True
except ImportError:
    SPEECHBRAIN_AVAILABLE = False
    logger.warning("SpeechBrain não disponível. Instale com: pip install speechbrain")


class VoiceEmbeddingExtractor:
    """
    Extrator de embeddings de voz profissional.
    Suporta múltiplos modelos (Resemblyzer, ECAPA-TDNN).
    """
    
    def __init__(self, model_type: str = "resemblyzer"):
        """
        Args:
            model_type: "resemblyzer" ou "ecapa-tdnn"
        """
        self.model_type = model_type
        self.encoder = None
        
        if model_type == "resemblyzer":
            if not RESEMBLYZER_AVAILABLE:
                raise ImportError("Resemblyzer não está instalado. pip install resemblyzer")
            self.encoder = VoiceEncoder()
            logger.info("✅ Resemblyzer carregado")
            
        elif model_type == "ecapa-tdnn":
            if not SPEECHBRAIN_AVAILABLE:
                raise ImportError("SpeechBrain não está instalado. pip install speechbrain")
            # ECAPA-TDNN é mais preciso mas requer GPU
            self.encoder = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir="pretrained_models/spkrec-ecapa-voxceleb"
            )
            logger.info("✅ ECAPA-TDNN (SpeechBrain) carregado")
        else:
            raise ValueError(f"Modelo desconhecido: {model_type}")
    
    def extract_embedding(self, audio_path: Union[str, Path]) -> np.ndarray:
        """
        Extrai embedding de um único áudio.
        
        Args:
            audio_path: Caminho do áudio
        
        Returns:
            Embedding vetor (numpy array)
        """
        audio_path = Path(audio_path)
        
        if not audio_path.exists():
            raise FileNotFoundError(f"Áudio não encontrado: {audio_path}")
        
        logger.info(f"🎤 Extraindo embedding: {audio_path.name}")
        
        try:
            if self.model_type == "resemblyzer":
                # Resemblyzer requer pré-processamento específico
                wav = preprocess_wav(str(audio_path))
                embed = self.encoder.embed_utterance(wav)
                logger.info(f"   ✅ Embedding extraído: {embed.shape}")
                return embed
                
            elif self.model_type == "ecapa-tdnn":
                # SpeechBrain ECAPA-TDNN
                signal = self.encoder.load_audio(str(audio_path))
                embeddings = self.encoder.encode_batch(signal)
                embed = embeddings.squeeze().cpu().numpy()
                logger.info(f"   ✅ Embedding extraído: {embed.shape}")
                return embed
                
        except Exception as e:
            logger.error(f"   ❌ Erro ao extrair embedding: {e}")
            raise
    
    def extract_batch(self, audio_paths: List[Union[str, Path]]) -> List[np.ndarray]:
        """
        Extrai embeddings de múltiplos áudios.
        
        Args:
            audio_paths: Lista de caminhos
        
        Returns:
            Lista de embeddings
        """
        embeddings = []
        
        for audio_path in audio_paths:
            try:
                embed = self.extract_embedding(audio_path)
                embeddings.append(embed)
            except Exception as e:
                logger.error(f"Erro ao processar {audio_path}: {e}")
                continue
        
        return embeddings
    
    def combine_embeddings(
        self,
        embeddings: List[np.ndarray],
        method: str = "weighted_average"
    ) -> np.ndarray:
        """
        Combina múltiplos embeddings em um único vetor.
        
        Args:
            embeddings: Lista de embeddings
            method: "average", "weighted_average", ou "max"
        
        Returns:
            Embedding combinado
        """
        if not embeddings:
            raise ValueError("Lista de embeddings vazia")
        
        if len(embeddings) == 1:
            return embeddings[0]
        
        embeddings_array = np.array(embeddings)
        
        if method == "average":
            combined = np.mean(embeddings_array, axis=0)
            
        elif method == "weighted_average":
            # Peso maior para embeddings mais longos (assumindo que são mais representativos)
            # Por simplicidade, usamos média igual
            weights = np.ones(len(embeddings)) / len(embeddings)
            combined = np.average(embeddings_array, axis=0, weights=weights)
            
        elif method == "max":
            combined = np.max(embeddings_array, axis=0)
        else:
            raise ValueError(f"Método desconhecido: {method}")
        
        # Normalizar
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        
        logger.info(f"   ✅ {len(embeddings)} embeddings combinados ({method})")
        return combined


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calcula similaridade coseno entre dois embeddings.
    
    Args:
        a: Embedding 1
        b: Embedding 2
    
    Returns:
        Similaridade (0-1)
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    similarity = dot_product / (norm_a * norm_b)
    return float(similarity)


if __name__ == "__main__":
    # Teste
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python voice_embedding_extractor.py <audio_path> [model_type]")
        print("model_type: resemblyzer (padrão) ou ecapa-tdnn")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    model_type = sys.argv[2] if len(sys.argv) > 2 else "resemblyzer"
    
    extractor = VoiceEmbeddingExtractor(model_type=model_type)
    embedding = extractor.extract_embedding(audio_path)
    
    print(f"Embedding shape: {embedding.shape}")
    print(f"Embedding sample: {embedding[:5]}")

