"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  FolderTree,
  Settings,
  CreditCard,
  LogOut,
  Shield,
  Users,
  Mic,
  ChevronDown,
  ChevronRight,
  History,
  Plus,
  FileText,
  Sparkles,
  DollarSign,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { VoiceClone } from "@/lib/types"

type SidebarProps = {
  className?: string
  onNavigate?: () => void
}

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Biblioteca", icon: BookOpen },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/voices", label: "Vozes IA", icon: Mic, hasSubmenu: true },
  { href: "/copy-ia", label: "Copy IA", icon: FileText, hasSubmenu: true },
  { href: "/categories", label: "Categorias", icon: FolderTree },
  { href: "/community", label: "Comunidade", icon: Users },
  { href: "/credits", label: "Créditos", icon: DollarSign },
  { href: "/account", label: "Conta", icon: Settings },
  { href: "/billing", label: "Cobrança", icon: CreditCard },
]

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: Shield },
  { href: "/admin/offers", label: "Ofertas", icon: BookOpen },
  { href: "/admin/categories", label: "Categorias", icon: FolderTree },
  { href: "/admin/communities", label: "Comunidades", icon: Users },
  { href: "/admin/plans", label: "Planos", icon: CreditCard },
  { href: "/admin/credits", label: "Créditos", icon: DollarSign },
  { href: "/admin/financial", label: "Financeiro", icon: DollarSign },
  { href: "/admin/content", label: "Conteúdo", icon: Settings },
  { href: "/admin/logs", label: "Logs", icon: Shield },
  { href: "/admin/support", label: "Suporte", icon: Heart },
]

export function Sidebar({ className, onNavigate }: SidebarProps = {}) {
  const pathname = usePathname()
  const { profile, isAuthenticated } = useAuthStore()
  const isAdminArea = pathname?.startsWith("/admin")
  const isAdmin = profile?.role === "admin"
  const navItems = isAdminArea ? adminNavItems : userNavItems
  
  const [voicesExpanded, setVoicesExpanded] = useState(pathname?.startsWith("/voices") || false)
  const [copyIaExpanded, setCopyIaExpanded] = useState(pathname?.startsWith("/copy-ia") || false)
  const [voices, setVoices] = useState<VoiceClone[]>([])

  // Carregar vozes quando a sidebar estiver visível e usuário autenticado
  useEffect(() => {
    if (isAuthenticated && !isAdminArea) {
      loadVoices()
    }
  }, [isAuthenticated, isAdminArea])

  const loadVoices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/voices/list', {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVoices(data.voices || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar vozes na sidebar:', error)
    }
  }

  const handleNavigate = () => {
    onNavigate?.()
  }

  return (
    <aside className={cn("hidden md:flex flex-col w-64 border-r bg-background/50", className)}>
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const hasSubmenu = 'hasSubmenu' in item && item.hasSubmenu
          
          if (hasSubmenu && item.href === "/voices") {
            return (
              <div key={item.href} className="space-y-1">
                <button
                  onClick={() => setVoicesExpanded(!voicesExpanded)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary shadow-sm"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm flex-1 text-left">{item.label}</span>
                  {voicesExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {isActive && (
                    <div className="absolute right-8 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
                
                {voicesExpanded && (
                  <div className="ml-4 space-y-1 pl-4 border-l-2 border-border">
                    <Link
                      href="/voices/list"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                        pathname === "/voices/list"
                          ? "bg-primary/5 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setVoicesExpanded(true)
                        handleNavigate()
                      }}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Minhas Vozes</span>
                      {voices.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                          {voices.length}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/voices"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                        pathname === "/voices" && !pathname.match(/\/voices\/(list|history|[^\/]+)/)
                          ? "bg-primary/5 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setVoicesExpanded(true)
                        handleNavigate()
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Construir Voz</span>
                    </Link>
                    <Link
                      href="/voices/history"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                        pathname === "/voices/history"
                          ? "bg-primary/5 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setVoicesExpanded(true)
                        handleNavigate()
                      }}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Histórico de Gerações</span>
                    </Link>
                  </div>
                )}
              </div>
            )
          }

          if (hasSubmenu && item.href === "/copy-ia") {
            return (
              <div key={item.href} className="space-y-1">
                <button
                  onClick={() => setCopyIaExpanded(!copyIaExpanded)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary shadow-sm"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm flex-1 text-left">{item.label}</span>
                  {copyIaExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {isActive && (
                    <div className="absolute right-8 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
                
                {copyIaExpanded && (
                  <div className="ml-4 space-y-1 pl-4 border-l-2 border-border">
                    <Link
                      href="/copy-ia/gerar"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                        pathname === "/copy-ia/gerar"
                          ? "bg-primary/5 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setCopyIaExpanded(true)
                        handleNavigate()
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Gerar Copy</span>
                    </Link>
                    <Link
                      href="/copy-ia/historico"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                        pathname === "/copy-ia/historico"
                          ? "bg-primary/5 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setCopyIaExpanded(true)
                        handleNavigate()
                      }}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Histórico</span>
                    </Link>
                    <Link
                      href="/copy-ia/modelos"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                        pathname === "/copy-ia/modelos"
                          ? "bg-primary/5 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        setCopyIaExpanded(true)
                        handleNavigate()
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Modelos</span>
                    </Link>
                  </div>
                )}
              </div>
            )
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                isActive
                  ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary shadow-sm"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              onClick={handleNavigate}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
