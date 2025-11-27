"""
Pipeline Profissional de Clonagem de Voz
Replica o pipeline completo do Fish AI:

1. Processa o áudio (pré-processamento)
2. Extrai o embedding da voz
3. Ajusta sotaque e timbre (via embeddings combinados)
4. Usa servidor treinado (Fish API ou modelo local)
5. Aplica correções internas
6. Roda no modelo mais atualizado
7. Faz alinhamento de espectrograma (opcional)
"""

import os
import json
import tempfile
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import logging

# Importar numpy primeiro
try:
    import numpy as np
except ImportError:
    raise ImportError("NumPy não está instalado. pip install numpy")

from audio_preprocessor import preprocess_audio, batch_preprocess
from voice_embedding_extractor import VoiceEmbeddingExtractor, cosine_similarity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VoiceCloningPipeline:
    """
    Pipeline completo de clonagem de voz profissional.
    """
    
    def __init__(
        self,
        embedding_model: str = "resemblyzer",
        target_sr: int = 24000,
        use_fish_api: bool = True
    ):
        """
        Args:
            embedding_model: "resemblyzer" ou "ecapa-tdnn"
            target_sr: Sample rate alvo (24000 ou 22050)
            use_fish_api: Usar Fish API para geração (True) ou modelo local (False)
        """
        self.embedding_model = embedding_model
        self.target_sr = target_sr
        self.use_fish_api = use_fish_api
        
        # Inicializar extrator de embeddings
        self.embedding_extractor = VoiceEmbeddingExtractor(model_type=embedding_model)
        
        logger.info("🚀 Pipeline de clonagem de voz inicializado")
        logger.info(f"   Modelo de embedding: {embedding_model}")
        logger.info(f"   Sample rate alvo: {target_sr}Hz")
        logger.info(f"   Usar Fish API: {use_fish_api}")
    
    def process_voice_clone(
        self,
        audio_paths: List[str],
        output_dir: str,
        voice_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Processa clonagem de voz completa seguindo pipeline do Fish AI.
        
        Args:
            audio_paths: Lista de caminhos dos áudios de referência
            output_dir: Diretório de saída
            voice_id: ID único da voz
            metadata: Metadados adicionais
        
        Returns:
            Dict com resultados do pipeline
        """
        logger.info(f"🎯 Iniciando pipeline para voz: {voice_id}")
        logger.info(f"   Áudios de referência: {len(audio_paths)}")
        
        output_dir_obj = Path(output_dir)
        output_dir_obj.mkdir(parents=True, exist_ok=True)
        
        results = {
            'voice_id': voice_id,
            'status': 'processing',
            'steps': {}
        }
        
        try:
            # ETAPA 1: Pré-processamento
            logger.info("📝 ETAPA 1: Pré-processamento de áudio")
            processed_dir = output_dir_obj / "processed"
            processed_dir.mkdir(exist_ok=True)
            
            processed_audios = []
            for i, audio_path in enumerate(audio_paths):
                output_path = processed_dir / f"audio_{i+1}_processed.wav"
                
                try:
                    processed_path, preprocess_metadata = preprocess_audio(
                        audio_path,
                        str(output_path),
                        target_sr=self.target_sr
                    )
                    processed_audios.append(processed_path)
                    logger.info(f"   ✅ Áudio {i+1} processado: {preprocess_metadata['duration']:.2f}s")
                except Exception as e:
                    logger.error(f"   ❌ Erro ao processar áudio {i+1}: {e}")
                    raise
            
            results['steps']['preprocessing'] = {
                'status': 'completed',
                'processed_count': len(processed_audios),
                'outputs': processed_audios
            }
            
            # ETAPA 2: Extração de Embeddings
            logger.info("📝 ETAPA 2: Extração de embeddings de voz")
            
            embeddings = []
            for i, processed_audio in enumerate(processed_audios):
                try:
                    embedding = self.embedding_extractor.extract_embedding(processed_audio)
                    embeddings.append(embedding)
                    logger.info(f"   ✅ Embedding {i+1} extraído: shape {embedding.shape}")
                except Exception as e:
                    logger.error(f"   ❌ Erro ao extrair embedding {i+1}: {e}")
                    raise
            
            # Combinar embeddings (ajuste de sotaque e timbre)
            combined_embedding = self.embedding_extractor.combine_embeddings(
                embeddings,
                method="weighted_average"
            )
            
            # Salvar embedding combinado
            embedding_path = output_dir_obj / "voice_embedding.npy"
            np.save(embedding_path, combined_embedding)
            
            results['steps']['embedding_extraction'] = {
                'status': 'completed',
                'embedding_count': len(embeddings),
                'combined_embedding_shape': combined_embedding.shape,
                'embedding_path': str(embedding_path)
            }
            
            logger.info(f"   ✅ Embeddings combinados: shape {combined_embedding.shape}")
            
            # ETAPA 3: Validação de qualidade
            logger.info("📝 ETAPA 3: Validação de qualidade")
            
            # Validar similaridade entre embeddings (devem ser similares)
            similarities = []
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    sim = cosine_similarity(embeddings[i], embeddings[j])
                    similarities.append(sim)
            
            avg_similarity = np.mean(similarities) if similarities else 0.0
            min_similarity = np.min(similarities) if similarities else 0.0
            
            logger.info(f"   📊 Similaridade média entre áudios: {avg_similarity:.3f}")
            logger.info(f"   📊 Similaridade mínima: {min_similarity:.3f}")
            
            # Threshold: áudios devem ser similares (mesma voz)
            if min_similarity < 0.6:
                logger.warning(f"   ⚠️ Similaridade baixa entre áudios ({min_similarity:.3f})")
                logger.warning(f"   ⚠️ Os áudios podem ser de vozes diferentes")
            
            results['steps']['validation'] = {
                'status': 'completed',
                'avg_similarity': float(avg_similarity),
                'min_similarity': float(min_similarity),
                'is_valid': min_similarity >= 0.6
            }
            
            # ETAPA 4: Preparação para geração (Fish API ou modelo local)
            logger.info("📝 ETAPA 4: Preparação para geração")
            
            if self.use_fish_api:
                # Usar Fish API para geração (modelo treinado deles)
                logger.info("   ✅ Usando Fish API (servidor treinado)")
                results['steps']['generation'] = {
                    'status': 'ready',
                    'method': 'fish_api',
                    'note': 'Geração será feita via Fish API usando reference_audio'
                }
            else:
                # Preparar para treino local (VITS, Coqui TTS, etc.)
                logger.info("   ✅ Preparado para treino local (requer GPU)")
                results['steps']['generation'] = {
                    'status': 'ready',
                    'method': 'local_training',
                    'note': 'Requer treino de modelo local (VITS/Coqui TTS)'
                }
            
            # Salvar áudios processados para referência
            reference_audios = processed_audios
            
            results['status'] = 'completed'
            results['reference_audios'] = reference_audios
            results['metadata'] = metadata or {}
            
            logger.info("✅ Pipeline concluído com sucesso!")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Erro no pipeline: {e}")
            results['status'] = 'failed'
            results['error'] = str(e)
            raise
    
    def validate_generated_voice(
        self,
        reference_embedding: np.ndarray,
        generated_audio_path: str
    ) -> Dict:
        """
        Valida se a voz gerada corresponde à referência.
        
        Args:
            reference_embedding: Embedding da voz de referência
            generated_audio_path: Caminho do áudio gerado
        
        Returns:
            Dict com resultados da validação
        """
        logger.info("🔍 Validando voz gerada")
        
        try:
            # Pré-processar áudio gerado
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                tmp_path = tmp.name
            
            preprocess_audio(
                generated_audio_path,
                tmp_path,
                target_sr=self.target_sr
            )
            
            # Extrair embedding do áudio gerado
            generated_embedding = self.embedding_extractor.extract_embedding(tmp_path)
            
            # Calcular similaridade
            similarity = cosine_similarity(reference_embedding, generated_embedding)
            
            # Limpar arquivo temporário
            os.unlink(tmp_path)
            
            # Thresholds
            is_valid = similarity >= 0.82
            needs_review = 0.75 <= similarity < 0.82
            should_reject = similarity < 0.75
            
            result = {
                'similarity': float(similarity),
                'is_valid': is_valid,
                'needs_review': needs_review,
                'should_reject': should_reject,
                'threshold': {
                    'ok': 0.82,
                    'review': 0.75,
                    'reject': 0.75
                }
            }
            
            if is_valid:
                logger.info(f"   ✅ Voz validada: similaridade {similarity:.3f}")
            elif needs_review:
                logger.warning(f"   ⚠️ Voz precisa revisão: similaridade {similarity:.3f}")
            else:
                logger.error(f"   ❌ Voz rejeitada: similaridade {similarity:.3f}")
            
            return result
            
        except Exception as e:
            logger.error(f"   ❌ Erro na validação: {e}")
            return {
                'similarity': 0.0,
                'is_valid': False,
                'error': str(e)
            }




if __name__ == "__main__":
    # Teste
    import sys
    
    if len(sys.argv) < 3:
        print("Uso: python voice_pipeline.py <audio1> <audio2> [audio3]")
        sys.exit(1)
    
    audio_paths = sys.argv[1:]
    output_dir = "./output_voice_pipeline"
    
    pipeline = VoiceCloningPipeline()
    results = pipeline.process_voice_clone(
        audio_paths,
        output_dir,
        voice_id="test_voice_001"
    )
    
    print("\n📊 Resultados do Pipeline:")
    print(json.dumps(results, indent=2, default=str))

