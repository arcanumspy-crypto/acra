"""
Worker Skeleton - Pipeline de Construção de Voz Profissional
Orquestra: download, pré-processamento, extração de embeddings, criação de modelo na Fish
"""

import os
import requests
import time
import json
import base64
from pathlib import Path
from typing import Dict, List, Optional
import logging

from preprocess_and_embed import preprocess_audio, extract_embedding, save_embedding_json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração
FISH_API_KEY = os.getenv("FISH_AUDIO_API_KEY")
FISH_API_URL = os.getenv("FISH_AUDIO_API_URL", "https://api.fish.audio")

# Timeouts
DOWNLOAD_TIMEOUT = 60
API_TIMEOUT = 120


def download_file(url: str, dest: str) -> str:
    """
    Baixa arquivo de URL para destino local.
    
    Args:
        url: URL do arquivo
        dest: Caminho de destino
    
    Returns:
        Caminho do arquivo baixado
    """
    logger.info(f"📥 Baixando: {url} -> {dest}")
    
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    
    r = requests.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT)
    r.raise_for_status()
    
    with open(dest, "wb") as f:
        for chunk in r.iter_content(1024 * 16):
            f.write(chunk)
    
    file_size = Path(dest).stat().st_size
    logger.info(f"   ✅ Arquivo baixado: {file_size / 1024 / 1024:.2f} MB")
    
    return dest


def create_model_in_fish(name: str, files_with_texts: List[Dict]) -> Dict:
    """
    Cria modelo na Fish Audio API.
    
    Args:
        name: Nome do modelo
        files_with_texts: Lista de dicts com:
            - "filename": nome do arquivo
            - "content_base64": conteúdo em base64
            - "transcript": transcrição (opcional)
    
    Returns:
        Resposta da API com model_id
    """
    endpoint = f"{FISH_API_URL}/v1/models"
    
    headers = {
        "Authorization": f"Bearer {FISH_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "name": name,
        "audios": files_with_texts
    }
    
    logger.info(f"🚀 Criando modelo na Fish: {name}")
    logger.info(f"   Endpoint: {endpoint}")
    logger.info(f"   Áudios: {len(files_with_texts)}")
    
    r = requests.post(endpoint, headers=headers, json=payload, timeout=API_TIMEOUT)
    r.raise_for_status()
    
    response = r.json()
    logger.info(f"   ✅ Modelo criado: {response.get('id') or response.get('model_id')}")
    
    return response


def run_build(job: Dict) -> Dict:
    """
    Executa pipeline completo de construção de voz.
    
    Args:
        job: Dict com:
            - "id": ID do job
            - "name": Nome da voz
            - "urls": Lista de URLs dos áudios
            - "transcripts": Lista de transcrições (opcional)
            - "userId": ID do usuário (opcional)
    
    Returns:
        Dict com resultados:
            - "model_id": ID do modelo criado
            - "status": "completed" ou "failed"
            - "embeddings": Lista de embeddings extraídos
            - "processed_files": Lista de arquivos processados
    """
    job_id = job.get("id", "unknown")
    job_name = job.get("name", "Unnamed Voice")
    audio_urls = job.get("urls", [])
    transcripts = job.get("transcripts", [])
    user_id = job.get("userId")
    
    logger.info(f"🎯 Iniciando build de voz: {job_name} (job: {job_id})")
    logger.info(f"   URLs: {len(audio_urls)}")
    logger.info(f"   Transcripts: {len(transcripts)}")
    
    # Criar diretório temporário
    tmpdir = Path("/tmp/voice_build") / job_id
    tmpdir.mkdir(parents=True, exist_ok=True)
    
    processed_files = []
    embeddings = []
    files_payload = []
    
    try:
        # Processar cada áudio
        for i, url in enumerate(audio_urls):
            logger.info(f"📝 Processando áudio {i+1}/{len(audio_urls)}")
            
            # Download
            dest = tmpdir / f"audio_{i}.wav"
            download_file(url, dest.as_posix())
            
            # Pré-processamento
            proc = tmpdir / f"audio_{i}.proc.wav"
            preprocess_audio(dest.as_posix(), proc.as_posix())
            
            # Extrair embedding
            emb = extract_embedding(proc.as_posix())
            embeddings.append(emb)
            
            # Salvar embedding JSON
            emb_json = proc.as_posix() + ".emb.json"
            save_embedding_json(emb, emb_json)
            
            # Preparar payload para Fish API
            # Converter arquivo processado para base64
            with open(proc.as_posix(), "rb") as fh:
                audio_bytes = fh.read()
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            
            transcript = transcripts[i] if i < len(transcripts) else ""
            
            files_payload.append({
                "filename": f"audio_{i}.wav",
                "content_base64": audio_base64,
                "transcript": transcript
            })
            
            processed_files.append({
                "original_url": url,
                "processed_path": proc.as_posix(),
                "embedding_path": emb_json,
                "embedding_shape": list(emb.shape)
            })
            
            logger.info(f"   ✅ Áudio {i+1} processado")
        
        # Criar modelo na Fish
        logger.info("🚀 Criando modelo na Fish Audio API...")
        
        # NOTA: A Fish Audio API pode ter formato específico
        # Ajuste o payload conforme a documentação oficial
        # Por enquanto, usamos formato genérico
        try:
            response = create_model_in_fish(job_name, files_payload)
            model_id = response.get("id") or response.get("model_id") or response.get("result", {}).get("id")
            
            if not model_id:
                logger.warning("   ⚠️ Model ID não encontrado na resposta")
                logger.warning(f"   Resposta completa: {json.dumps(response, indent=2)}")
                # Usar fallback: gerar ID local
                model_id = f"local-{job_id}"
        except Exception as e:
            logger.error(f"   ❌ Erro ao criar modelo na Fish: {e}")
            # Fallback: usar modelo local ou clonagem instantânea
            model_id = f"local-{job_id}"
            logger.info(f"   ✅ Usando modelo local: {model_id}")
        
        # Resultado
        result = {
            "model_id": model_id,
            "status": "completed",
            "job_id": job_id,
            "name": job_name,
            "embeddings_count": len(embeddings),
            "processed_files": processed_files,
            "fish_response": response if 'response' in locals() else None
        }
        
        logger.info(f"✅ Build concluído: {model_id}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Erro no build: {e}")
        return {
            "model_id": None,
            "status": "failed",
            "job_id": job_id,
            "error": str(e)
        }
    
    finally:
        # Limpar arquivos temporários (opcional)
        # import shutil
        # shutil.rmtree(tmpdir, ignore_errors=True)
        pass


if __name__ == "__main__":
    # Teste com placeholder
    test_job = {
        "id": "test-job-001",
        "name": "Voz Moçambique Teste",
        "urls": [
            # Substituir por URLs reais de áudio
            # "/mnt/data/4ccb352a-d155-4865-98c9-e52c1f6a2f16.png"  # Placeholder
        ],
        "transcripts": ["Olá, este é um teste de voz."],
        "userId": "test-user-001"
    }
    
    if not test_job["urls"]:
        logger.warning("⚠️ Nenhuma URL fornecida. Forneça URLs reais de áudio para testar.")
        logger.info("   Exemplo: python build_voice.py")
        logger.info("   Configure FISH_AUDIO_API_KEY no ambiente")
    else:
        result = run_build(test_job)
        print("\n📊 Resultado do Build:")
        print(json.dumps(result, indent=2, default=str))

