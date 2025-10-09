import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden bg-transparent">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-8">
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  Início
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  Vagas
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  Sobre
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  Contato
                </a>
              </nav>
            </SheetContent>
          </Sheet>

          <h1 className="text-xl md:text-2xl font-bold text-foreground">NEXJOB</h1>
        </div>

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
          Login / Usuário
        </Button>
      </div>
    </header>
  )
}
