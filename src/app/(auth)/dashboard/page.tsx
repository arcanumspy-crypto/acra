"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { ArrowRight, Search, Heart, Clock, TrendingUp, Zap, Eye, Star, FolderTree, Crown, Flame, Sparkles, Globe, Shield } from "lucide-react"
import { getAllCategories } from "@/lib/db/categories"
import { getDashboardStats, getRecommendedOffers, getRecentSearches, getRecentActivities, type RecentActivity } from "@/lib/db/dashboard"
import { getHotOffers, getNewOffers, getScaledOffers } from "@/lib/db/offers"
import { OfferWithCategory } from "@/lib/db/offers"
import { Skeleton } from "@/components/ui/skeleton"
import { COUNTRIES } from "@/lib/constants"

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    offersViewed: 0,
    offersViewedTotal: 0,
    favoritesCount: 0,
    categoriesAccessed: 0,
    creditsUsed: 0,
    creditsUsedTotal: 0,
  })
  const [scaledOffers, setScaledOffers] = useState<OfferWithCategory[]>([])
  const [hotOffers, setHotOffers] = useState<OfferWithCategory[]>([])
  const [newOffers, setNewOffers] = useState<OfferWithCategory[]>([])
  const [recommendedOffers, setRecommendedOffers] = useState<OfferWithCategory[]>([])
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  // Garantir que o perfil está carregado (apenas uma vez)
  useEffect(() => {
    if (user && !profile) {
      refreshProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Remover profile?.id para evitar múltiplas chamadas

  useEffect(() => {
    const loadData = async () => {
      const startTime = Date.now()
      console.log('⏱️ [Dashboard] Iniciando carregamento de dados...')
      
      setLoading(true)
      try {
        // OTIMIZAÇÃO: Carregar dados críticos primeiro, depois os secundários
        const loadStartTime = Date.now()
        
        // Carregar dados críticos em paralelo
        const [statsData, cats] = await Promise.all([
          getDashboardStats(),
          getAllCategories(),
        ])
        
        // Carregar dados secundários em paralelo (mas depois dos críticos)
        const [scaled, hot, newOff, recommended, searches, activities] = await Promise.all([
          getScaledOffers(4),
          getHotOffers(6),
          getNewOffers(3),
          getRecommendedOffers(6),
          getRecentSearches(5),
          getRecentActivities(10),
        ])
        
        const loadTime = Date.now() - loadStartTime
        console.log(`⏱️ [Dashboard] Dados carregados em ${loadTime}ms`)
        
        // Atualizar estado
        setStats(statsData)
        setCategories(cats.slice(0, 6))
        setScaledOffers(scaled)
        setHotOffers(hot)
        setNewOffers(newOff)
        setRecommendedOffers(recommended)
        setRecentSearches(searches)
        setRecentActivities(activities)
        
        const totalTime = Date.now() - startTime
        console.log(`✅ [Dashboard] Carregamento completo em ${totalTime}ms`)
      } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar dados:', error)
        // Não quebrar a página, apenas mostrar dados vazios
        setStats({
          offersViewed: 0,
          offersViewedTotal: 0,
          favoritesCount: 0,
          categoriesAccessed: 0,
          creditsUsed: 0,
          creditsUsedTotal: 0,
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const getCountryIcon = (country: string | { code?: string; name?: string; flag?: string } | null | undefined) => {
    if (!country) return <Globe className="h-3 w-3 inline" />
    // Se for objeto, extrair código
    const countryCode = typeof country === 'string' ? country : country.code
    if (!countryCode) return <Globe className="h-3 w-3 inline" />
    
    // Buscar país no array COUNTRIES
    const countryObj = COUNTRIES.find(c => c.code === countryCode)
    return countryObj ? <span>{countryObj.flag}</span> : <Globe className="h-3 w-3 inline" />
  }

  const getCountryName = (country: string | { code?: string; name?: string; flag?: string } | null | undefined): string => {
    if (!country) return 'N/A'
    // Se for objeto, extrair código ou nome
    if (typeof country === 'object' && country !== null) {
      if (country.name) return country.name
      if (country.code) {
        const countryObj = COUNTRIES.find(c => c.code === country.code)
        return countryObj?.name || country.code
      }
      return 'N/A'
    }
    // Se for string, buscar nome
    const countryObj = COUNTRIES.find(c => c.code === country)
    return countryObj?.name || country
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/library?search=${encodeURIComponent(searchQuery)}`
    } else {
      window.location.href = '/library'
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Bem-vindo de volta, <span className="font-bold text-foreground">{user?.name}</span>!
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/admin/dashboard">
              <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
                <Shield className="h-4 w-4 mr-2" />
                Área Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por oferta, nicho, país ou tipo de página…"
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Link href="/library">
          <Button size="lg" className="h-12">
            Ver biblioteca completa <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ofertas Vistas</CardTitle>
            <Eye className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {stats.offersViewed}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês • {stats.offersViewedTotal} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {stats.favoritesCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <FolderTree className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {stats.categoriesAccessed}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Acessadas</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Usados</CardTitle>
            <Zap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {stats.creditsUsed}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês • {stats.creditsUsedTotal} total
                </p>
              </>
            )}
            <Link href="/credits">
              <Button variant="outline" size="sm" className="w-full mt-2 border-primary/50 hover:bg-primary/10">
                Ver Créditos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Ofertas Quentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Ofertas Quentes para você
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecionadas com base nas conversões e nicho que você mais vê
            </p>
          </div>
          <Link href="/library">
            <Button variant="ghost">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-xl transition-all border-2 hover:border-primary/50 bg-gradient-to-br from-background via-background to-muted/30 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {offer.title}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {offer.category?.name || 'Sem categoria'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{offer.short_description || offer.big_idea || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {offer.niche_id && (
                    <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                      Nicho
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {offer.funnel_type || 'VSL'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getCountryIcon(offer.country)} {getCountryName(offer.country)}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {offer.conversion_rate && offer.conversion_rate > 2 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-green-600">Conversão alta: {offer.conversion_rate}%</span>
                    </div>
                  )}
                  {offer.temperature && (
                    <div>Temperatura: {offer.temperature}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/offer/${offer.id}`} className="flex-1">
                    <Button className="w-full">Ver detalhes</Button>
                  </Link>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ofertas Escalando */}
      {scaledOffers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                Ofertas Escalando Agora
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ofertas com alta performance e crescimento no momento
              </p>
            </div>
            <Link href="/library?temperature=hot">
              <Button variant="ghost">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scaledOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {offer.title}
                    </CardTitle>
                    <Badge className="bg-yellow-500 text-white">Escalando</Badge>
                  </div>
                <CardDescription className="line-clamp-2 text-xs">{offer.short_description || offer.big_idea || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {offer.niche_id && (
                    <Badge variant="outline" className="text-xs">Nicho</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {getCountryIcon(offer.country)} {getCountryName(offer.country)}
                  </Badge>
                </div>
                {offer.conversion_rate && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    {offer.conversion_rate}% conversão
                  </div>
                )}
                  <Link href={`/offer/${offer.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Ver detalhes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Novas Ofertas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Novas Ofertas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adicionadas nos últimos 7 dias
            </p>
          </div>
          <Link href="/library">
            <Button variant="ghost">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {newOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow border-dashed border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{offer.title}</CardTitle>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Novo
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{offer.short_description || offer.big_idea || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{offer.funnel_type || 'VSL'}</span>
                  <span>{getCountryIcon(offer.country)} {getCountryName(offer.country)}</span>
                </div>
                <Link href={`/offer/${offer.id}`}>
                  <Button variant="outline" className="w-full">Ver Detalhes</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Explorar por Nicho */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Explorar por Nicho</h2>
        {loading ? (
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="min-w-[140px]">
                <CardContent className="p-4 text-center">
                  <Skeleton className="h-10 w-10 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.length > 0 ? categories.map((category) => (
              <Link
                key={category.id}
                href={`/library?category=${category.slug}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] hover:scale-105 transition-transform">
                  <CardContent className="p-4 text-center">
                    <FolderTree className="h-8 w-8 mb-2 mx-auto text-muted-foreground" />
                    <div className="font-semibold text-sm">{category.name}</div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <Card className="w-full">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma categoria disponível
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Atividade Recente */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          Atividade Recente <Clock className="h-5 w-5" />
        </h2>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => {
                  const getActivityIcon = () => {
                    switch (activity.activity_type) {
                      case 'favorite_added':
                        return <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      case 'offer_viewed':
                        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      case 'search_performed':
                        return <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      default:
                        return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    }
                  }

                  const getActivityBgColor = () => {
                    switch (activity.activity_type) {
                      case 'favorite_added':
                        return 'bg-blue-100 dark:bg-blue-900'
                      case 'offer_viewed':
                        return 'bg-green-100 dark:bg-green-900'
                      case 'search_performed':
                        return 'bg-purple-100 dark:bg-purple-900'
                      default:
                        return 'bg-gray-100 dark:bg-gray-900'
                    }
                  }

                  const getActivityMessage = () => {
                    switch (activity.activity_type) {
                      case 'favorite_added':
                        return `Você adicionou "${activity.offer?.title || activity.activity_data?.offer_title || 'uma oferta'}" aos favoritos`
                      case 'offer_viewed':
                        return `Você visualizou "${activity.offer?.title || activity.activity_data?.offer_title || 'uma oferta'}"`
                      case 'search_performed':
                        return `Você pesquisou por "${activity.activity_data?.query || 'algo'}"`
                      default:
                        return activity.activity_data?.message || 'Atividade recente'
                    }
                  }

                  const formatTimeAgo = (date: string) => {
                    const now = new Date()
                    const activityDate = new Date(date)
                    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)
                    
                    if (diffInSeconds < 60) return 'Agora'
                    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`
                    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`
                    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`
                    return activityDate.toLocaleDateString('pt-BR')
                  }

                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 ${getActivityBgColor()} rounded-full`}>
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{getActivityMessage()}</p>
                        {activity.offer && (
                          <p className="text-sm text-muted-foreground">
                            {activity.offer.title}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma atividade recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pesquisa */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Seu histórico de pesquisa
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Continue de onde parou
            </p>
          </div>
          <Link href="/library">
            <Button variant="ghost">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border">
                <CardContent className="p-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentSearches.length > 0 ? recentSearches.map((search) => (
              <Card key={search.id} className="hover:bg-accent transition-colors border shadow-sm hover:shadow-md hover:border-primary/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{search.query}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(search.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Link href={`/library?search=${encodeURIComponent(search.query)}`}>
                      <Button variant="ghost" size="xs">
                        Ver <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="border">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma pesquisa recente
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
