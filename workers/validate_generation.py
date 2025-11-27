"""
Script de Validação de Geração de Voz
Valida se a voz gerada corresponde à referência usando similaridade coseno
"""

import numpy as np
from pathlib import Path
from typing import Dict, Optional
import json
import logging
import argparse

from preprocess_and_embed import extract_embedding, load_embedding_json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calcula similaridade coseno entre dois embeddings.
    
    Args:
        a: Embedding 1
        b: Embedding 2
    
    Returns:
        Similaridade (0-1)
    """
    from numpy.linalg import norm
    
    dot_product = np.dot(a, b)
    norm_a = norm(a)
    norm_b = norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    similarity = dot_product / (norm_a * norm_b)
    return float(similarity)


def validate(
    reference_emb_path: str,
    generated_audio_path: str,
    threshold: float = 0.82
) -> Dict:
    """
    Valida se a voz gerada corresponde à referência.
    
    Args:
        reference_emb_path: Caminho do JSON com embedding de referência
        generated_audio_path: Caminho do áudio gerado
        threshold: Threshold de similaridade (padrão: 0.82)
    
    Returns:
        Dict com resultados:
            - "similarity": similaridade coseno (0-1)
            - "ok": True se >= threshold
            - "threshold": threshold usado
            - "status": "ok", "review", ou "reject"
    """
    logger.info("Validando geracao")
    logger.info(f"   Referencia: {reference_emb_path}")
    logger.info(f"   Gerado: {generated_audio_path}")
    logger.info(f"   Threshold: {threshold}")
    
    try:
        # Carregar embedding de referência
        ref_emb = load_embedding_json(reference_emb_path)
        logger.info(f"   [OK] Embedding de referencia carregado: shape {ref_emb.shape}")
        
        # Extrair embedding do áudio gerado
        gen_emb = extract_embedding(generated_audio_path)
        logger.info(f"   [OK] Embedding gerado extraido: shape {gen_emb.shape}")
        
        # Calcular similaridade
        sim = cosine_similarity(ref_emb, gen_emb)
        logger.info(f"   [INFO] Similaridade: {sim:.4f}")
        
        # Aplicar thresholds
        ok = sim >= threshold
        needs_review = 0.75 <= sim < threshold
        should_reject = sim < 0.75
        
        if ok:
            status = "ok"
            logger.info(f"   [OK] Validacao OK: {sim:.4f} >= {threshold}")
        elif needs_review:
            status = "review"
            logger.warning(f"   [WARN] Precisa revisao: {sim:.4f} < {threshold}")
        else:
            status = "reject"
            logger.error(f"   [ERROR] Rejeitado: {sim:.4f} < 0.75")
        
        result = {
            "similarity": float(sim),
            "ok": ok,
            "threshold": threshold,
            "status": status,
            "needs_review": needs_review,
            "should_reject": should_reject
        }
        
        return result
        
    except Exception as e:
        logger.error(f"   [ERROR] Erro na validacao: {e}")
        return {
            "similarity": 0.0,
            "ok": False,
            "threshold": threshold,
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import sys
    import io
    
    # 🚨 CRÍTICO: Configurar encoding UTF-8 para Windows
    # Isso evita erros de encoding com emojis
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    parser = argparse.ArgumentParser(description="Valida geração de voz")
    parser.add_argument("--reference", required=True, help="Caminho do JSON com embedding de referência")
    parser.add_argument("--generated", required=True, help="Caminho do áudio gerado")
    parser.add_argument("--threshold", type=float, default=0.82, help="Threshold de similaridade (padrão: 0.82)")
    
    args = parser.parse_args()
    
    try:
        result = validate(args.reference, args.generated, args.threshold)
        
        # 🚨 CRÍTICO: Imprimir JSON primeiro (sem emojis) para garantir que seja capturado
        # O Node.js precisa do JSON mesmo se houver erro de encoding depois
        print(json.dumps(result))
        sys.stdout.flush()
        
        # Depois imprimir mensagem formatada (pode falhar no Windows, mas JSON já foi impresso)
        try:
            print("\n[RESULTADO] Similaridade: {:.4f}, Status: {}".format(result['similarity'], result['status']))
        except:
            pass  # Ignorar erro de encoding se houver
            
    except Exception as e:
        # Em caso de erro, retornar JSON de erro
        error_result = {
            "similarity": 0.0,
            "ok": False,
            "threshold": args.threshold,
            "status": "error",
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)

