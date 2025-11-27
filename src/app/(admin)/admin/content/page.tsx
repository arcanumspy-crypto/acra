"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Conteúdo</h1>
        <p className="text-muted-foreground">
          Edite o conteúdo da landing page
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="social">Prova Social</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Seção Hero</CardTitle>
              <CardDescription>Texto principal da landing page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input defaultValue="Crie Ofertas que Convertem de Verdade" />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Textarea defaultValue="Acesse milhares de ofertas testadas e analisadas..." />
              </div>
              <div className="space-y-2">
                <Label>Texto do CTA</Label>
                <Input defaultValue="Começar Grátis" />
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Prova Social</CardTitle>
              <CardDescription>Números e estatísticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure os números de prova social exibidos na landing page
              </p>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios</CardTitle>
              <CardDescription>Lista de benefícios do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gerencie a lista de benefícios exibidos na landing page
              </p>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Perguntas frequentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adicione, edite ou remova perguntas frequentes
              </p>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

