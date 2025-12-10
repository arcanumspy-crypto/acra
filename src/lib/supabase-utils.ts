/**
 * Utilitários para trabalhar com respostas do Supabase de forma type-safe
 * 
 * Essas funções garantem que os dados retornados do Supabase sejam tipados
 * corretamente, evitando inferência de 'never' e erros de tipo.
 */

/**
 * Garante que um valor seja um array, retornando array vazio se não for
 * 
 * @param maybeArray - Valor que pode ser um array ou null/undefined
 * @returns Array tipado ou array vazio
 * 
 * @example
 * const { data } = await supabase.from('offers').select('*')
 * const offers = ensureArray<OfferRow>(data) // Sempre retorna OfferRow[]
 */
export function ensureArray<T>(maybeArray: unknown): T[] {
  if (Array.isArray(maybeArray)) return maybeArray as T[]
  return []
}

/**
 * Garante que um valor seja um objeto, retornando null se não for
 * 
 * @param maybeObject - Valor que pode ser um objeto ou null/undefined
 * @returns Objeto tipado ou null
 * 
 * @example
 * const { data } = await supabase.from('offers').select('*').single()
 * const offer = ensureObject<OfferRow>(data) // OfferRow | null
 */
export function ensureObject<T>(maybeObject: unknown): T | null {
  if (maybeObject && typeof maybeObject === 'object' && !Array.isArray(maybeObject)) {
    return maybeObject as T
  }
  return null
}

/**
 * Garante que um valor seja um objeto único (resultado de .single())
 * Retorna null se o valor não for um objeto válido
 * 
 * @param maybeSingle - Valor que pode ser um objeto único ou null/undefined
 * @returns Objeto tipado ou null
 * 
 * @example
 * const { data } = await supabase.from('offers').select('*').single()
 * const offer = ensureSingle<OfferRow>(data)
 * if (!offer) {
 *   return NextResponse.json({ error: 'Not found' }, { status: 404 })
 * }
 */
export function ensureSingle<T>(maybeSingle: unknown): T | null {
  if (maybeSingle && typeof maybeSingle === 'object' && !Array.isArray(maybeSingle)) {
    return maybeSingle as T
  }
  return null
}

/**
 * Garante que um valor seja um objeto único (resultado de .maybeSingle())
 * Retorna null se o valor não for um objeto válido
 * 
 * Alias para ensureSingle, mas semanticamente indica que o valor pode não existir
 * 
 * @param maybeSingle - Valor que pode ser um objeto único ou null/undefined
 * @returns Objeto tipado ou null
 * 
 * @example
 * const { data } = await supabase.from('offers').select('*').maybeSingle()
 * const offer = ensureMaybeSingle<OfferRow>(data) // OfferRow | null
 */
export function ensureMaybeSingle<T>(maybeSingle: unknown): T | null {
  return ensureSingle<T>(maybeSingle)
}

