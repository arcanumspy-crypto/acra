/**
 * Calcula créditos necessários para geração de áudio baseado na duração
 * Regra: 5 créditos por minuto de áudio
 * 
 * @param durationMinutes - Duração do áudio em minutos
 * @returns Número de créditos necessários (arredondado para cima)
 */
export function calculateAudioCredits(durationMinutes: number): number {
  // 5 créditos por minuto
  // Arredondar para cima para garantir que qualquer fração de minuto seja cobrada
  return Math.ceil(durationMinutes * 5)
}

/**
 * Calcula créditos necessários para geração de áudio baseado na duração em segundos
 * 
 * @param durationSeconds - Duração do áudio em segundos
 * @returns Número de créditos necessários (arredondado para cima)
 */
export function calculateAudioCreditsFromSeconds(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60
  return calculateAudioCredits(durationMinutes)
}
