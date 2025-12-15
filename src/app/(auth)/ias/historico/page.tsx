"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Type, 
  FileAudio, 
  Copy as CopyIcon, 
  Trash2, 
  Search, 
  Calendar,
  Loader2,
  Download,
  Eye,
  EyeOff,
  ShoppingCart
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CopyCriativa {
  id: string
  style: string
  creative_type: string
  mechanism: string
  product_name: string
  audience_age: number
  headline: string
  subheadline: string
  body: string
  cta: string
  created_at: string
}

interface Transcricao {
  id: string
  nome_arquivo: string
  texto_transcrito: string
  confianca: number
  duracao: number
  idioma: string
  modelo: string
  palavras_count: number
  status: string
  created_at: string
}

interface Upsell {
  id: string
  produto_principal: string
  produto_upsell: string
  texto: string
  created_at: string
}

export default function HistoricoPage() {
  const [copies, setCopies] = useState<CopyCriativa[]>([])
  const [transcricoes, setTranscricoes] = useState<Transcricao[]>([])
  const [upsells, setUpsells] = useState<Upsell[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCopy, setSearchCopy] = useState("")
  const [searchTranscricao, setSearchTranscricao] = useState("")
  const [searchUpsell, setSearchUpsell] = useState("")
  const [selectedCopy, setSelectedCopy] = useState<CopyCriativa | null>(null)
  const [selectedTranscricao, setSelectedTranscricao] = useState<Transcricao | null>(null)
  const [selectedUpsell, setSelectedUpsell] = useState<Upsell | null>(null)
  const [openCopyDialog, setOpenCopyDialog] = useState(false)
  const [openTranscricaoDialog, setOpenTranscricaoDialog] = useState(false)
  const [openUpsellDialog, setOpenUpsellDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadCopies(), loadTranscricoes(), loadUpsells()])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCopies = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ias/copies-criativas', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCopies(data.copies || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar copys:', error)
    }
  }

  const loadTranscricoes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ias/transcricoes', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTranscricoes(data.transcricoes || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar transcrições:', error)
    }
  }

  const loadUpsells = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ias/upsells', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUpsells(data.upsells || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar upsells:', error)
    }
  }

  const handleDeleteCopy = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta copy?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/ias/copies-criativas?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Copy excluída com sucesso",
        })
        loadCopies()
      } else {
        throw new Error('Erro ao excluir copy')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a copy",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTranscricao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transcrição?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/ias/transcricoes?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Transcrição excluída com sucesso",
        })
        loadTranscricoes()
      } else {
        throw new Error('Erro ao excluir transcrição')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transcrição",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUpsell = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este upsell?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/ias/upsells?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Upsell excluído com sucesso",
        })
        loadUpsells()
      } else {
        throw new Error('Erro ao excluir upsell')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o upsell",
        variant: "destructive"
      })
    }
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    })
  }

  const handleDownloadTranscricao = (transcricao: Transcricao) => {
    const blob = new Blob([transcricao.texto_transcrito], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcricao.nome_arquivo.replace(/\.[^/.]+$/, '')}_transcricao.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredCopies = copies.filter(copy => 
    copy.product_name.toLowerCase().includes(searchCopy.toLowerCase()) ||
    copy.headline.toLowerCase().includes(searchCopy.toLowerCase()) ||
    copy.style.toLowerCase().includes(searchCopy.toLowerCase())
  )

  const filteredTranscricoes = transcricoes.filter(transcricao =>
    transcricao.nome_arquivo.toLowerCase().includes(searchTranscricao.toLowerCase()) ||
    transcricao.texto_transcrito.toLowerCase().includes(searchTranscricao.toLowerCase())
  )

  const filteredUpsells = upsells.filter(upsell =>
    upsell.produto_principal.toLowerCase().includes(searchUpsell.toLowerCase()) ||
    upsell.produto_upsell.toLowerCase().includes(searchUpsell.toLowerCase()) ||
    upsell.texto.toLowerCase().includes(searchUpsell.toLowerCase())
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <CopyIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words">
              Histórico de IA
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Visualize e gerencie todas as suas copys, upsells e transcrições geradas
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="copies" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-[#2a2a2a]">
          <TabsTrigger value="copies" className="data-[state=active]:bg-[#ff5a1f]">
            <Type className="h-4 w-4 mr-2" />
            Copys ({copies.length})
          </TabsTrigger>
          <TabsTrigger value="upsells" className="data-[state=active]:bg-[#ff5a1f]">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Upsells ({upsells.length})
          </TabsTrigger>
          <TabsTrigger value="transcricoes" className="data-[state=active]:bg-[#ff5a1f]">
            <FileAudio className="h-4 w-4 mr-2" />
            Transcrições ({transcricoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="copies" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por produto, headline ou estilo..."
                value={searchCopy}
                onChange={(e) => setSearchCopy(e.target.value)}
                className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
            </div>
          ) : filteredCopies.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="py-12 text-center">
                <Type className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchCopy ? "Nenhuma copy encontrada" : "Nenhuma copy gerada ainda"}
                </p>
                {!searchCopy && (
                  <p className="text-gray-500 text-sm mt-2">
                    Gere sua primeira copy usando o Gerador de Copy de Criativo
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCopies.map((copy) => (
                <Card key={copy.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f]/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg line-clamp-2">{copy.product_name}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm mt-1 line-clamp-1">
                          {copy.headline}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{copy.style}</Badge>
                      <Badge variant="outline" className="text-xs">{copy.creative_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(copy.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCopy(copy)
                          setOpenCopyDialog(true)
                        }}
                        className="flex-1 border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCopy(copy.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upsells" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por produto principal, upsell ou texto..."
                value={searchUpsell}
                onChange={(e) => setSearchUpsell(e.target.value)}
                className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
            </div>
          ) : filteredUpsells.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchUpsell ? "Nenhum upsell encontrado" : "Nenhum upsell gerado ainda"}
                </p>
                {!searchUpsell && (
                  <p className="text-gray-500 text-sm mt-2">
                    Gere seu primeiro upsell usando o Gerador de Upsell
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUpsells.map((upsell) => (
                <Card key={upsell.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f]/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg line-clamp-2">{upsell.produto_principal}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm mt-1 line-clamp-1">
                          Upsell: {upsell.produto_upsell}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(upsell.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUpsell(upsell)
                          setOpenUpsellDialog(true)
                        }}
                        className="flex-1 border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUpsell(upsell.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transcricoes" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do arquivo ou conteúdo..."
                value={searchTranscricao}
                onChange={(e) => setSearchTranscricao(e.target.value)}
                className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f]" />
            </div>
          ) : filteredTranscricoes.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="py-12 text-center">
                <FileAudio className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTranscricao ? "Nenhuma transcrição encontrada" : "Nenhuma transcrição realizada ainda"}
                </p>
                {!searchTranscricao && (
                  <p className="text-gray-500 text-sm mt-2">
                    Transcreva seu primeiro áudio usando a ferramenta de Transcrição
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTranscricoes.map((transcricao) => (
                <Card key={transcricao.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f]/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg line-clamp-2">{transcricao.nome_arquivo}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm mt-1">
                          {transcricao.palavras_count} palavras • {formatTime(transcricao.duracao)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {(transcricao.confianca * 100).toFixed(0)}% confiança
                      </Badge>
                      <Badge variant="outline" className="text-xs">{transcricao.idioma}</Badge>
                      <Badge variant="outline" className="text-xs">{transcricao.modelo}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(transcricao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTranscricao(transcricao)
                          setOpenTranscricaoDialog(true)
                        }}
                        className="flex-1 border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTranscricao(transcricao)}
                        className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTranscricao(transcricao.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para visualizar Copy */}
      <Dialog open={openCopyDialog} onOpenChange={setOpenCopyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedCopy?.product_name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCopy?.style} • {selectedCopy?.creative_type}
            </DialogDescription>
          </DialogHeader>
          {selectedCopy && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-semibold">Headline</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(selectedCopy.headline, "Headline")}
                    className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                  >
                    <CopyIcon className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                  <p className="text-white text-lg font-semibold">{selectedCopy.headline}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-semibold">Subheadline</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(selectedCopy.subheadline, "Subheadline")}
                    className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                  >
                    <CopyIcon className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                  <p className="text-white">{selectedCopy.subheadline}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-semibold">Body (Texto Principal)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(selectedCopy.body, "Body")}
                    className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                  >
                    <CopyIcon className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                  <p className="text-white whitespace-pre-wrap">{selectedCopy.body}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-semibold">CTA (Call to Action)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(selectedCopy.cta, "CTA")}
                    className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                  >
                    <CopyIcon className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                  <p className="text-white font-medium">{selectedCopy.cta}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mecanismo</p>
                    <p className="text-white">{selectedCopy.mechanism}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Idade do Público</p>
                    <p className="text-white">{selectedCopy.audience_age} anos</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Criado em</p>
                    <p className="text-white">
                      {format(new Date(selectedCopy.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar Transcrição */}
      <Dialog open={openTranscricaoDialog} onOpenChange={setOpenTranscricaoDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedTranscricao?.nome_arquivo}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTranscricao && (
                <>
                  {selectedTranscricao.palavras_count} palavras • {formatTime(selectedTranscricao.duracao)} • 
                  {(selectedTranscricao.confianca * 100).toFixed(1)}% confiança
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedTranscricao && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyToClipboard(selectedTranscricao.texto_transcrito, "Transcrição")}
                  className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copiar Texto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadTranscricao(selectedTranscricao)}
                  className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 min-h-[200px] max-h-[500px] overflow-y-auto">
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                  {selectedTranscricao.texto_transcrito}
                </p>
              </div>
              <div className="pt-4 border-t border-[#2a2a2a]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Idioma</p>
                    <p className="text-white">{selectedTranscricao.idioma}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Modelo</p>
                    <p className="text-white">{selectedTranscricao.modelo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Criado em</p>
                    <p className="text-white">
                      {format(new Date(selectedTranscricao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar Upsell */}
      <Dialog open={openUpsellDialog} onOpenChange={setOpenUpsellDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedUpsell?.produto_principal}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upsell: {selectedUpsell?.produto_upsell}
            </DialogDescription>
          </DialogHeader>
          {selectedUpsell && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyToClipboard(selectedUpsell.texto, "Upsell")}
                  className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copiar Texto
                </Button>
              </div>
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 min-h-[200px] max-h-[500px] overflow-y-auto">
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                  {selectedUpsell.texto}
                </p>
              </div>
              <div className="pt-4 border-t border-[#2a2a2a]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Produto Principal</p>
                    <p className="text-white">{selectedUpsell.produto_principal}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Produto de Upsell</p>
                    <p className="text-white">{selectedUpsell.produto_upsell}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Criado em</p>
                    <p className="text-white">
                      {format(new Date(selectedUpsell.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

