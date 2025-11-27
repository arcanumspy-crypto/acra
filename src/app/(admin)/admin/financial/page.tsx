"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, FileText, Mic, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { FinancialStats, CreditPurchase, ToolStats } from "@/lib/db/admin/financial"

export default function AdminFinancialPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [purchases, setPurchases] = useState<CreditPurchase[]>([])
  const [toolStats, setToolStats] = useState<ToolStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/admin/financial', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {
          totalCreditsLoaded: 0,
          totalCreditsConsumed: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalPurchases: 0,
          monthlyPurchases: 0,
        })
        setPurchases(data.purchases || [])
        setToolStats(data.toolStats || null)
      }
    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Área Financeira</h1>
        <p className="text-muted-foreground">
          Visão geral das receitas e histórico de créditos
        </p>
      </div>

      {/* Estatísticas Financeiras */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Carregados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalCreditsLoaded)}</div>
              <p className="text-xs text-muted-foreground">
                Total de créditos adicionados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Consumidos</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalCreditsConsumed)}</div>
              <p className="text-xs text-muted-foreground">
                Total de créditos gastos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Todas as compras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Este mês ({stats.monthlyPurchases} compras)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estatísticas por Ferramenta */}
      {toolStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerador de Copy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{formatNumber(toolStats.copyGeneration.totalCredits)}</div>
                <p className="text-xs text-muted-foreground">Créditos gastos</p>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatNumber(toolStats.copyGeneration.totalGenerations)}</div>
                <p className="text-xs text-muted-foreground">Copies geradas</p>
              </div>
              <div>
                <div className="text-lg font-medium">{toolStats.copyGeneration.averageCreditsPerGeneration}</div>
                <p className="text-xs text-muted-foreground">Média de créditos por copy</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Clonador de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{formatNumber(toolStats.voiceGeneration.totalCredits)}</div>
                <p className="text-xs text-muted-foreground">Créditos gastos</p>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatNumber(toolStats.voiceGeneration.totalGenerations)}</div>
                <p className="text-xs text-muted-foreground">Vozes geradas</p>
              </div>
              <div>
                <div className="text-lg font-medium">{toolStats.voiceGeneration.averageCreditsPerGeneration}</div>
                <p className="text-xs text-muted-foreground">Média de créditos por voz</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visualizações de Ofertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{formatNumber(toolStats.offerViews.totalCredits)}</div>
                <p className="text-xs text-muted-foreground">Créditos gastos</p>
              </div>
              <div>
                <div className="text-xl font-semibold">{formatNumber(toolStats.offerViews.totalViews)}</div>
                <p className="text-xs text-muted-foreground">Total de visualizações</p>
              </div>
              <div>
                <div className="text-lg font-medium">{formatNumber(toolStats.offerViews.uniqueOffers)}</div>
                <p className="text-xs text-muted-foreground">Ofertas únicas visualizadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Compras de Créditos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Compras de Créditos</CardTitle>
          <CardDescription>
            Lista de todas as compras de créditos realizadas pelos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : purchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Saldo Após</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{purchase.user_name}</div>
                        <div className="text-sm text-muted-foreground">{purchase.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(purchase.amount)} créditos
                    </TableCell>
                    <TableCell>
                      {formatNumber(purchase.balance_after)} créditos
                    </TableCell>
                    <TableCell>
                      <Badge variant={purchase.payment_id ? 'default' : 'secondary'}>
                        {purchase.payment_id ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma compra encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
