import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings, User, Plus } from "lucide-react"
import { Link } from "react-router-dom"

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OOH</span>
              </div>
              <h1 className="text-xl font-bold">CRM Vallas Publicitarias</h1>
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Panel Propietario
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link to="/add-billboard">
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Anuncio
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-status-reserved rounded-full"></span>
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}