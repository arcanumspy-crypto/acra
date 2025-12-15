import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { produto_principal, produto_upsell } = await request.json()

    if (!produto_principal || !produto_principal.trim()) {
      return NextResponse.json(
        { error: "Descrição do produto principal é obrigatória" },
        { status: 400 }
      )
    }

    if (!produto_upsell || !produto_upsell.trim()) {
      return NextResponse.json(
        { error: "Descrição do produto de upsell é obrigatória" },
        { status: 400 }
      )
    }

    // Preparar prompt para gerar texto de upsell
    const prompt = `Crie um texto de upsell persuasivo e convincente que ofereça o seguinte produto complementar:

PRODUTO PRINCIPAL: ${produto_principal}
PRODUTO DE UPSELL: ${produto_upsell}

INSTRUÇÕES:
1. Crie uma conexão clara entre o produto principal e o upsell, mostrando como eles se complementam
2. Destaque os benefícios únicos e o valor agregado do produto de upsell
3. Crie urgência e escassez de forma natural (oferta limitada, desconto especial, etc.)
4. Inclua uma proposta de valor irresistível (desconto, bônus, garantia especial)
5. Use uma chamada para ação (CTA) clara, direta e convincente
6. O texto deve ser natural, persuasivo e não parecer forçado ou "vendedor demais"
7. Use tom conversacional e que gere confiança
8. O texto deve ter entre 150-300 palavras

Formato: Texto corrido, bem estruturado, com parágrafos claros e uma CTA destacada no final.`

    // Usar OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY
    let upsell = null

    if (openaiApiKey) {
      try {
        const systemInstruction = 'Você é um especialista em copywriting e vendas, com mais de 10 anos de experiência criando ofertas de upsell que convertem. Você domina técnicas de persuasão, psicologia do consumidor e criação de urgência. Seus textos são sempre naturais, convincentes e focados em valor, não em pressão de venda.'
        
        console.log('🤖 [Upsell] Iniciando geração com OpenAI...')
        
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: systemInstruction
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.8,
              max_tokens: 1000,
            })
          }
        )

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          upsell = openaiData.choices?.[0]?.message?.content || null
          if (upsell) {
            console.log('✅ [Upsell] Gerado com sucesso via OpenAI')
          } else {
            console.warn('⚠️ [Upsell] OpenAI retornou resposta vazia')
          }
        } else {
          const errorText = await openaiResponse.text()
          console.error('❌ [Upsell] Erro ao gerar com OpenAI:', errorText)
        }
      } catch (error) {
        console.error('❌ [Upsell] Erro ao chamar OpenAI:', error)
      }
    } else {
      console.warn('⚠️ [Upsell] OPENAI_API_KEY não configurada, usando fallback')
    }

    // Se não tiver resposta da API, retornar upsell de exemplo
    if (!upsell) {
      console.log('📝 [Upsell] Usando template de fallback')
      upsell = `🎯 Oferta Especial de Upsell

Você já está adquirindo: ${produto_principal}

Que tal potencializar ainda mais seus resultados?

Agora você tem a oportunidade única de complementar sua compra com: ${produto_upsell}

Esta combinação vai maximizar seus resultados e acelerar seu sucesso. É a escolha perfeita para quem quer ir além e obter resultados ainda melhores.

✨ Benefícios exclusivos:
• Complementa perfeitamente o produto principal
• Aumenta significativamente seus resultados
• Oferta especial disponível apenas agora

💰 Oferta Limitada:
Esta é uma oportunidade única com condições especiais que não se repetirá. Aproveite enquanto ainda está disponível.

🚀 Não perca esta chance de potencializar seus resultados!

[Nota: Para obter um upsell mais personalizado e persuasivo, configure a OPENAI_API_KEY nas variáveis de ambiente]`
    }

    // Salvar no banco se a tabela existir
    try {
      const { data, error } = await (supabase
        .from('upsells_gerados') as any)
        .insert({
          user_id: user.id,
          produto_principal,
          produto_upsell,
          texto: upsell,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar upsell:', error)
      }
    } catch (error) {
      // Tabela pode não existir, continuar
    }

    return NextResponse.json({
      success: true,
      upsell
    })
  } catch (error: any) {
    console.error('Error in upsell generation:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar upsell" },
      { status: 500 }
    )
  }
}
