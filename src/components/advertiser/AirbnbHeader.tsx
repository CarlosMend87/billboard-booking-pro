import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { User, Globe, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navTabs = [
  { label: "Pantallas", href: "/disponibilidad-anuncios" },
  { label: "Campañas", href: "/progreso-campaña" },
  { label: "Reportes", href: "/reportes" },
  { label: "Servicios", href: "/servicios" },
];

export function AirbnbHeader() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 lg:px-20">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size={32} className="text-primary" />
            <span className="text-xl font-bold text-primary hidden sm:block">AdScreen</span>
          </Link>

          {/* Centered Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-full transition-all duration-200",
                  "hover:bg-gray-100 hover:text-foreground",
                  location.pathname === tab.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="hidden md:flex rounded-full text-sm font-medium hover:bg-gray-100"
            >
              <Link to="/booking-wizard">Publicar campaña</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100"
            >
              <Globe className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-full border-gray-300 hover:shadow-md transition-shadow py-2 px-3 h-auto"
                >
                  <Menu className="h-4 w-4" />
                  <div className="bg-gray-500 text-white rounded-full p-1">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                {user ? (
                  <>
                    <DropdownMenuItem className="font-medium">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/progreso-campaña">Mis campañas</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/disponibilidad-anuncios">Explorar pantallas</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Cerrar sesión
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="font-medium">Iniciar sesión</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth">Registrarse</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
