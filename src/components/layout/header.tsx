"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { Logo } from "@/components/layout/logo"
import { Moon, Sun, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { user, profile, isAuthenticated, initialize, isLoading } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      await initialize()
      setMounted(true)
    }
    initAuth()
  }, [initialize])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Logo href="/" />

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Preços
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
            Sobre
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
            Contato
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
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

          {mounted && !isLoading ? (
            isAuthenticated ? (
              <Link href={profile?.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                <Button>Dashboard</Button>
              </Link>
            ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/signup">
                <Button>Começar Grátis</Button>
              </Link>
            </>
          )
          ) : (
            <div className="w-24 h-10" />
          )}
        </div>
      </div>
    </header>
  )
}

