"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/layout/logo"
import { supabase } from "@/lib/supabase/client"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Verificar se há um token de hash na URL (Supabase envia assim)
    const hash = window.location.hash
    if (hash) {
      // Extrair o access_token do hash
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const type = params.get('type')
      
      if (type === 'recovery' && accessToken) {
        setIsValidToken(true)
      } else {
        setIsValidToken(false)
      }
    } else {
      setIsValidToken(false)
    }
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      const hash = window.location.hash
      if (!hash) {
        throw new Error('Token de recuperação não encontrado. Por favor, solicite um novo link.')
      }

      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken) {
        throw new Error('Token inválido. Por favor, solicite um novo link de recuperação.')
      }

      // Atualizar senha usando o token
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      })

      if (error) {
        throw error
      }

      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        throw updateError
      }

      setIsSuccess(true)
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Você pode fazer login agora.",
      })

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao redefinir sua senha. O link pode ter expirado.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link...</p>
        </div>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-lg max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white">
              Link Inválido
            </CardTitle>
            <CardDescription>
              Este link de recuperação é inválido ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
                Solicitar novo link
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="w-full mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-[#ff5a1f] p-4 rounded-lg">
            <Logo href="/" className="text-white" />
          </div>
        </div>

        {/* Card de Redefinição */}
        <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white">
              {isSuccess ? "Senha Redefinida!" : "Redefinir Senha"}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {isSuccess 
                ? "Sua senha foi alterada com sucesso"
                : "Digite sua nova senha"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Redirecionando para login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0b0c10] dark:text-white">
                    Nova Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#ff5a1f]"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-[#ff5a1f]">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#0b0c10] dark:text-white">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#ff5a1f]"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-[#ff5a1f]">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="text-sm text-[#ff5a1f] hover:underline inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

