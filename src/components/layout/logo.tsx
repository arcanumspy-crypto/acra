"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string
}

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link href={href} className={cn("flex items-center space-x-2 group", className)}>
      <span className="font-bold text-lg tracking-tight">
        SwipeVault <span className="text-primary">Pro</span>
      </span>
    </Link>
  )
}

