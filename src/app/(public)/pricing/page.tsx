import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check } from "lucide-react"

const medicalPlans = [
  {
    id: "resident",
    name: "Resident",
    description: "Para médicos solos, pequenos consultórios",
    priceMonthly: 27,
    priceYearly: 270,
    features: [
      "Até 50 ofertas liberadas",
      "Acesso a categorias: Medical, Nutra, Beauty",
      "Download limitado de assets (20/mês)",
      "Sem análise avançada das ofertas",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    id: "specialist",
    name: "Specialist",
    description: "Para clínicas e agências que atendem médicos",
    priceMonthly: 57,
    priceYearly: 570,
    features: [
      "Até 200 ofertas",
      "Todas categorias incluídas",
      "Acesso completo às categorias Medical e Nutra Premium",
      "Downloads ilimitados de Scripts, Copies e Creatives",
      "Análise curta de cada oferta",
      "1 login adicional (time pequeno)",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    id: "chief",
    name: "Chief",
    description: "Para redes de clínicas e grandes players",
    priceMonthly: 97,
    priceYearly: 970,
    features: [
      "Acesso TOTAL à biblioteca",
      "Ofertas marcadas como 🔥 Médicas de alta conversão",
      "Relatórios de quais nichos médicos performam melhor",
      "Consultoria/treino gravado (aulas)",
      "5 logins de equipe",
      "Suporte 24/7",
      "Atualizações semanais prioritárias",
    ],
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="container py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Planos para Profissionais da Saúde 🩺</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Escolha o plano certo para sua clínica ou agência
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {medicalPlans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.popular ? "border-primary border-2 relative" : ""}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Mais Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">R$ {plan.priceMonthly}</span>
                <span className="text-muted-foreground">/mês</span>
                <div className="text-sm text-muted-foreground mt-2">
                  ou R$ {plan.priceYearly}/ano (economize {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%)
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/signup?plan=${plan.id}`}>
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Começar agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Perguntas sobre Preços</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Posso mudar de plano depois?</AccordionTrigger>
            <AccordionContent>
              Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças são aplicadas imediatamente.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Há desconto para pagamento anual?</AccordionTrigger>
            <AccordionContent>
              Sim! Ao pagar anualmente, você economiza significativamente comparado ao pagamento mensal.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Os planos são específicos para área médica?</AccordionTrigger>
            <AccordionContent>
              Sim! Todos os planos incluem acesso prioritário a ofertas da categoria Medical, além de outras categorias relevantes para profissionais da saúde.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
