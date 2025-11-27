import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-xl">
            Página não encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            A página que você está procurando não existe.
          </p>
          <Link href="/">
            <Button>Voltar para Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

