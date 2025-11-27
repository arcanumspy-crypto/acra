"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PLANS } from "@/lib/constants"
import { Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Planos</h1>
        <p className="text-muted-foreground">
          Configure os planos de assinatura
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">
                  R$ {plan.priceMonthly}/mês
                </p>
                <p className="text-sm text-muted-foreground">
                  ou R$ {plan.priceYearly}/ano
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Limites:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Ofertas: {plan.limits.offersVisible === -1 ? "Ilimitado" : plan.limits.offersVisible}</li>
                  <li>Favoritos: {plan.limits.favorites === -1 ? "Ilimitado" : plan.limits.favorites}</li>
                  <li>Categorias: {plan.limits.categories.length}</li>
                  <li>Análise completa: {plan.limits.fullAnalysis ? "Sim" : "Não"}</li>
                </ul>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Plano: {plan.name}</DialogTitle>
                    <DialogDescription>
                      Atualize as configurações do plano
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Preço Mensal</Label>
                      <Input type="number" defaultValue={plan.priceMonthly} />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço Anual</Label>
                      <Input type="number" defaultValue={plan.priceYearly} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancelar</Button>
                    <Button>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

