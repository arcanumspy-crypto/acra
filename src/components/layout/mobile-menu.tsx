"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  const closeMenu = () => setOpen(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-background border-r shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-semibold text-foreground/80">
                Menu
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closeMenu}
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <Sidebar
                className="!flex !w-full md:hidden border-0 bg-transparent"
                onNavigate={closeMenu}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

