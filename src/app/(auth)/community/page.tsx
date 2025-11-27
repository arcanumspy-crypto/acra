"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users, MessageSquare, TrendingUp, Clock, ArrowRight, Heart } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveCommunitiesForUser } from "@/lib/db/communities"

interface Community {
  id: string
  name: string
  description: string | null
  is_paid: boolean
  join_link: string
  is_active: boolean
  created_at: string
  members_count?: number
  posts_count?: number
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadCommunities = async () => {
      const startTime = Date.now()
      console.log('⏱️ [Community Page] Iniciando carregamento de comunidades...')
      
      try {
        setLoading(true)
        
        // Usar função que já tem tratamento de erro
        const communitiesData = await getActiveCommunitiesForUser()
        
        const totalTime = Date.now() - startTime
        console.log(`✅ [Community Page] ${communitiesData.length} comunidades carregadas em ${totalTime}ms`)

        // Mapear para o formato esperado pela página
        const mappedCommunities = communitiesData.map(community => ({
          id: community.id,
          name: community.name,
          description: community.description,
          is_paid: community.is_paid,
          join_link: community.join_link,
          is_active: community.is_active,
          created_at: community.created_at,
          members_count: community.member_count || 0,
          posts_count: 0, // Por enquanto, não há tabela de posts
        }))

        setCommunities(mappedCommunities)
      } catch (error: any) {
        console.error('❌ [Community Page] Erro ao carregar comunidades:', error)
        // Se a tabela não existir, apenas mostrar array vazio (não quebrar a página)
        if (error?.code === '42P01' || error?.code === 'PGRST202' || error?.message?.includes('does not exist')) {
          console.warn('⚠️ [Community Page] Tabela communities não existe ainda. Execute a migration 025_create_communities_tables.sql')
        }
        setCommunities([])
      } finally {
        setLoading(false)
      }
    }

    loadCommunities()
  }, [])

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalMembers = communities.reduce((sum, c) => sum + (c.members_count || 0), 0)
  const totalPosts = communities.reduce((sum, c) => sum + (c.posts_count || 0), 0)
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          <Users className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          Comunidade
        </h1>
        <p className="text-muted-foreground text-lg">
          Conecte-se com outros afiliados e compartilhe estratégias
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar comunidades, posts ou membros..."
          className="pl-10 h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comunidades</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{communities.length}</div>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total de membros</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPosts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total de posts</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communities Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Comunidades Disponíveis</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map((community) => (
              <Card key={community.id} className="hover:shadow-xl transition-all border-2 hover:border-primary/50 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-background via-background to-muted/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">👥</div>
                      <div>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        {community.is_paid && (
                          <Badge variant="secondary" className="mt-1">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {community.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {community.members_count?.toLocaleString() || 0} membros
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {community.posts_count || 0} posts
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    asChild
                  >
                    <a href={community.join_link} target="_blank" rel="noopener noreferrer">
                      Entrar na Comunidade
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhuma comunidade encontrada' : 'Nenhuma comunidade disponível no momento'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Posts - Por enquanto desabilitado até ter tabela de posts */}
      {/* <div>
        <h2 className="text-2xl font-bold mb-4">Posts Recentes</h2>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Sistema de posts em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}

