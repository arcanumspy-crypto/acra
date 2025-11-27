import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">SwipeVault Pro</h3>
            <p className="text-sm text-muted-foreground">
              A maior biblioteca de ofertas de Direct Response do mercado.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/library" className="text-muted-foreground hover:text-primary">
                  Biblioteca
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-primary">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SwipeVault Pro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

