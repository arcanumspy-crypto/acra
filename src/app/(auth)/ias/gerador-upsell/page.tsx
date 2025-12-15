"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Loader2, Copy as CopyIcon, Sparkles, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function GeradorUpsellPage() {
  const [produtoPrincipal, setProdutoPrincipal] = useState("")
  const [produtoUpsell, setProdutoUpsell] = useState("")
  const [loading, setLoading] = useState(false)
  const [upsellGerado, setUpsellGerado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const { toast } = useToast()

  const handleGerar = async () => {
    // Validação
    if (!produtoPrincipal.trim()) {
      toast({
        title: "Erro",
        description: "Digite a descrição do produto principal",
        variant: "destructive"
      })
      return
    }

    if (!produtoUpsell.trim()) {
      toast({
        title: "Erro",
        description: "Digite a descrição do produto de upsell",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setUpsellGerado(null)
      setCopiado(false)

      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/ias/gerador-upsell', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          produto_principal: produtoPrincipal.trim(),
          produto_upsell: produtoUpsell.trim(),
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar upsell')
      }

      if (data.success && data.upsell) {
        setUpsellGerado(data.upsell)
        toast({
          title: "Sucesso",
          description: "Upsell gerado com sucesso!",
        })
      } else {
        throw new Error(data.error || 'Erro ao gerar upsell')
      }
    } catch (error: any) {
      console.error('Erro ao gerar upsell:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o upsell",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopiar = () => {
    if (upsellGerado) {
      navigator.clipboard.writeText(upsellGerado)
      setCopiado(true)
      toast({
        title: "Copiado!",
        description: "Upsell copiado para a área de transferência",
      })
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const handleLimpar = () => {
    setProdutoPrincipal("")
    setProdutoUpsell("")
    setUpsellGerado(null)
    setCopiado(false)
    toast({
      title: "Limpo",
      description: "Campos limpos com sucesso",
    })
  }

  const isFormValid = () => {
    return produtoPrincipal.trim() !== '' && produtoUpsell.trim() !== ''
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Gerador de Upsell</h1>
              <p className="text-gray-400">Crie ofertas complementares persuasivas para aumentar suas vendas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#ff5a1f]" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Produto Principal */}
              <div className="space-y-2">
                <Label className="text-white">
                  Produto Principal <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Descreva o produto principal que o cliente está comprando. Ex: Curso de Marketing Digital, Produto de Emagrecimento..."
                  value={produtoPrincipal}
                  onChange={(e) => setProdutoPrincipal(e.target.value)}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px] focus:border-[#ff5a1f] resize-none"
                />
                <p className="text-xs text-gray-500">
                  Descreva o produto ou serviço que o cliente já está adquirindo
                </p>
              </div>

              {/* Produto de Upsell */}
              <div className="space-y-2">
                <Label className="text-white">
                  Produto de Upsell <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Descreva o produto complementar que você quer oferecer. Ex: Bônus exclusivo, Upgrade premium, Produto relacionado..."
                  value={produtoUpsell}
                  onChange={(e) => setProdutoUpsell(e.target.value)}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px] focus:border-[#ff5a1f] resize-none"
                />
                <p className="text-xs text-gray-500">
                  Descreva o produto ou serviço complementar que você quer oferecer como upsell
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleGerar}
                  disabled={loading || !isFormValid()}
                  className="flex-1 bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Upsell
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleLimpar}
                  disabled={loading}
                  variant="outline"
                  className="border-[#2a2a2a] text-gray-300 hover:bg-[#0a0a0a] hover:text-white rounded-full"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultado */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#ff5a1f]" />
                  Upsell Gerado
                </CardTitle>
                {upsellGerado && (
                  <Button
                    onClick={handleCopiar}
                    variant="ghost"
                    size="sm"
                    className="text-[#ff5a1f] hover:text-[#ff4d29] hover:bg-[#0a0a0a]"
                  >
                    {copiado ? (
                      <>
                        <span className="text-green-500 mr-2">✓</span>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {upsellGerado ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">
                      {upsellGerado}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3" />
                    <span>Gerado com IA usando OpenAI</span>
                  </div>
                </div>
              ) : (
                <div className="min-h-[400px] bg-[#0a0a0a] border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">Seu upsell aparecerá aqui</p>
                    <p className="text-gray-500 text-sm">
                      Preencha os campos do produto principal e do produto de upsell, 
                      depois clique em &quot;Gerar Upsell&quot; para criar uma oferta persuasiva
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dicas */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ff5a1f]" />
                Dicas para criar upsells eficazes:
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm list-disc list-inside">
                <li>O produto de upsell deve complementar o produto principal</li>
                <li>Destaque o valor e os benefícios únicos do upsell</li>
                <li>Mencione ofertas especiais ou descontos para criar urgência</li>
                <li>Seja claro sobre como o upsell potencializa os resultados do produto principal</li>
                <li>Use uma chamada para ação convincente e direta</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
