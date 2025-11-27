"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, User, CreditCard, LogOut, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, initialize, isLoading, profile } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      await initialize()
      
      // Aguardar um pouco para garantir que o perfil foi carregado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Se o perfil não foi carregado, forçar refresh
      const currentState = useAuthStore.getState()
      if (currentState.isAuthenticated && !currentState.profile) {
        console.log('🔄 [Admin Layout] Perfil não carregado, forçando refresh...')
        await currentState.refreshProfile()
      }
      
      setMounted(true)
    }
    initAuth()
  }, [initialize])

  useEffect(() => {
    if (mounted && !isLoading) {
      const currentState = useAuthStore.getState()
      const currentProfile = currentState.profile
      
      console.log('🔍 [Admin Layout] Verificação de acesso:', {
        isAuthenticated,
        profileRole: currentProfile?.role,
        profileId: currentProfile?.id,
        userEmail: user?.email,
        hasProfile: !!currentProfile
      })
      
      if (!isAuthenticated) {
        console.log('❌ [Admin Layout] Não autenticado, redirecionando para login')
        router.push("/login")
        return
      }
      
      // Se não tem perfil, tentar carregar novamente (com timeout para evitar loops)
      if (!currentProfile) {
        console.log('⏳ [Admin Layout] Perfil ainda não carregado, aguardando carregamento...')
        
        // Aguardar um pouco antes de tentar novamente (evitar múltiplas chamadas)
        const timeoutId = setTimeout(async () => {
          const stateBeforeRefresh = useAuthStore.getState()
          if (!stateBeforeRefresh.profile) {
            await stateBeforeRefresh.refreshProfile()
            
            // Aguardar um pouco após refresh
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const updatedState = useAuthStore.getState()
            if (updatedState.profile?.role !== 'admin') {
              console.log('❌ [Admin Layout] Não é admin após refresh, redirecionando. Role:', updatedState.profile?.role)
              router.push("/dashboard")
            } else {
              console.log('✅ [Admin Layout] Admin confirmado após refresh!')
            }
          }
        }, 1000) // Aguardar 1 segundo antes de tentar
        
        return () => clearTimeout(timeoutId)
      }
      
      if (currentProfile.role !== 'admin') {
        console.log('❌ [Admin Layout] Não é admin, redirecionando para dashboard. Role:', currentProfile.role)
        router.push("/dashboard")
      } else {
        console.log('✅ [Admin Layout] Acesso admin concedido!')
      }
    }
  }, [mounted, isAuthenticated, isLoading, profile, router, user])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top Navigation Bar (App Bar) fixa no topo */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 safe-area-pt">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          {/* Logo à esquerda */}
          <div className="flex items-center gap-3">
            <Logo href="/admin/dashboard" />
            <Badge variant="secondary" className="hidden sm:flex">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          
          {/* Controles à direita */}
          <div className="flex items-center gap-2 md:gap-4">
            <ProfileDropdown />
          </div>
        </div>
      </header>
      
      {/* Espaçamento para compensar header fixo */}
      <div className="h-14 md:h-16" />

      {/* Layout principal: Sidebar + Conteúdo */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Área de conteúdo */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function ProfileDropdown() {
  const { user, profile, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  return (
    <div className="flex items-center gap-2">
      {/* Toggle de tema */}
      {mounted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Escuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {/* Avatar e dropdown do usuário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 md:px-3">
            <User className="h-4 w-4" />
            <span className="hidden md:inline text-sm font-medium">{profile?.name || user?.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Dashboard Admin
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={async () => {
              await logout()
              router.push('/login')
            }}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
