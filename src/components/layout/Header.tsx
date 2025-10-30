import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/ui/logo"
import { Settings, User, LogOut, ShoppingCart } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useUserRole } from "@/hooks/useUserRole"
import { useCartContext } from "@/context/CartContext"
import { OwnerNav } from "@/components/layout/OwnerNav"
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { cart } = useCartContext();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Logo size={28} className="transition-transform hover:scale-105" />
              <h1 className="text-xl font-bold">AdAvailable</h1>
            </Link>
            {role === 'owner' && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Panel Propietario
              </Badge>
            )}
            {role === 'advertiser' && (
              <Badge variant="default" className="hidden sm:inline-flex">
                Anunciante
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {role === 'owner' && (
              <OwnerNav />
            )}
            
            {role === 'advertiser' && cart && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/booking-wizard" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cart.items.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {cart.items.length}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
            
            <NotificationsDropdown />
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
