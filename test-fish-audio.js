/**
 * Script de Teste - Fish Audio API Integration
 * 
 * Execute com: node test-fish-audio.js
 * 
 * Este script testa a integração com a Fish Audio API
 * para verificar se os endpoints estão funcionando corretamente
 */

const FISH_AUDIO_API_KEY = '7c0f58472b724703abc385164af007b5'
const FISH_AUDIO_API_URL = 'https://api.fish.audio'

async function testEndpoints() {
  console.log('🧪 Testando integração com Fish Audio API...\n')

  // Teste 1: Verificar autenticação
  console.log('1️⃣ Testando autenticação...')
  try {
    // Tentar listar vozes (endpoint comum para testar auth)
    const response = await fetch(`${FISH_AUDIO_API_URL}/v1/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
      },
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Autenticação OK!')
      console.log(`   Resposta:`, JSON.stringify(data, null, 2).substring(0, 200))
    } else {
      const errorText = await response.text()
      console.log(`   ⚠️  Status não OK: ${errorText.substring(0, 200)}`)
      
      // Pode ser que o endpoint seja diferente
      if (response.status === 404) {
        console.log('   💡 Dica: Endpoint /v1/voices pode não existir. Testando alternativas...')
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`)
  }

  console.log('\n')

  // Teste 2: Verificar estrutura de criação de voz
  console.log('2️⃣ Testando estrutura de endpoint de criação...')
  const testEndpoints = [
    '/v1/voices',
    '/v1/models',
    '/api/v1/voices',
    '/v1/voices/create',
  ]

  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`${FISH_AUDIO_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        },
      })

      console.log(`   ${endpoint}: ${response.status}`)
      
      if (response.status === 400 || response.status === 422) {
        console.log(`   ✅ Endpoint existe! (esperando dados)`)
        const errorText = await response.text()
        console.log(`   Mensagem: ${errorText.substring(0, 150)}`)
        break
      }
    } catch (error) {
      console.log(`   ${endpoint}: Erro - ${error.message}`)
    }
  }

  console.log('\n')

  // Teste 3: Verificar endpoint TTS
  console.log('3️⃣ Testando endpoint de TTS...')
  try {
    const response = await fetch(`${FISH_AUDIO_API_URL}/v1/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Teste',
        voice_id: 'test',
      }),
    })

    console.log(`   Status: ${response.status}`)
    const responseText = await response.text()
    
    if (response.status === 400 || response.status === 404 || response.status === 422) {
      console.log(`   ✅ Endpoint existe!`)
      console.log(`   Resposta: ${responseText.substring(0, 200)}`)
    } else if (response.ok) {
      console.log(`   ✅ Endpoint funciona!`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
    } else {
      console.log(`   Resposta: ${responseText.substring(0, 200)}`)
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`)
  }

  console.log('\n✅ Testes concluídos!')
  console.log('\n📝 Próximos passos:')
  console.log('   1. Adicione a API Key no arquivo .env.local:')
  console.log('      FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5')
  console.log('   2. Execute o servidor Next.js: npm run dev')
  console.log('   3. Teste a funcionalidade em /voices')
}

// Executar testes
testEndpoints().catch(console.error)

