"use client"

import { useState } from "react"
import Link from "next/link"
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
import { ArrowLeft, Mail, Loader2 } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      })
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao enviar o email de recuperação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

        {/* Card de Recuperação */}
        <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#0b0c10] dark:text-white">
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {emailSent 
                ? "Verifique sua caixa de entrada para redefinir sua senha"
                : "Digite seu email para receber um link de recuperação"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enviamos um email com instruções para redefinir sua senha.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se não encontrar o email, verifique sua pasta de spam.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setEmailSent(false)}
                  >
                    Enviar novamente
                  </Button>
                  <Link href="/login">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0b0c10] dark:text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-[#0b0c10] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#ff5a1f]"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-[#ff5a1f]">{errors.email.message}</p>
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
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
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

