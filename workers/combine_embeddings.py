"""
Script para combinar múltiplos embeddings
Usado pelo pipeline profissional
"""

import json
import numpy as np
import sys
from pathlib import Path

def cosine_similarity(a, b):
    """Calcula similaridade coseno"""
    from numpy.linalg import norm
    dot_product = np.dot(a, b)
    norm_a = norm(a)
    norm_b = norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

def combine_embeddings(embedding_paths, method="weighted_average"):
    """Combina múltiplos embeddings"""
    embeddings = []
    
    for path in embedding_paths:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            embeddings.append(np.array(data['embedding'], dtype=np.float32))
    
    if len(embeddings) == 1:
        return embeddings[0]
    
    embeddings_array = np.array(embeddings)
    
    if method == "average":
        combined = np.mean(embeddings_array, axis=0)
    elif method == "weighted_average":
        weights = np.ones(len(embeddings)) / len(embeddings)
        combined = np.average(embeddings_array, axis=0, weights=weights)
    else:
        combined = np.mean(embeddings_array, axis=0)
    
    # Normalizar
    norm = np.linalg.norm(combined)
    if norm > 0:
        combined = combined / norm
    
    return combined

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Combina embeddings")
    parser.add_argument("--embeddings", nargs='+', required=True, help="Caminhos dos arquivos de embedding JSON")
    parser.add_argument("--output", required=True, help="Caminho de saída")
    parser.add_argument("--method", default="weighted_average", help="Método: average, weighted_average")
    
    args = parser.parse_args()
    
    combined = combine_embeddings(args.embeddings, args.method)
    
    output_data = {
        "embedding": combined.tolist(),
        "shape": list(combined.shape),
        "method": args.method,
        "count": len(args.embeddings)
    }
    
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
    
    print(json.dumps(output_data, indent=2))

