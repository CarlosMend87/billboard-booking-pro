import { useState } from "react";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ScreenCardProps {
  id: string;
  nombre: string;
  ubicacion: string;
  ciudad: string;
  precio: number;
  rating: number;
  impactos: number;
  imagenes: string[];
  badge?: "alta-demanda" | "disponible" | "premium";
  onFavorite?: (id: string) => void;
  onClick?: () => void;
}

const badgeConfig = {
  "alta-demanda": { label: "Alta demanda", className: "bg-rose-500 text-white" },
  "disponible": { label: "Disponible", className: "bg-green-500 text-white" },
  "premium": { label: "Premium", className: "bg-amber-500 text-white" },
};

export function ScreenCard({
  id,
  nombre,
  ubicacion,
  ciudad,
  precio,
  rating,
  impactos,
  imagenes,
  badge,
  onFavorite,
  onClick,
}: ScreenCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavorite?.(id);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Carousel */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
        <img
          src={imagenes[currentImageIndex] || "/placeholder.svg"}
          alt={nombre}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 z-10 p-2 rounded-full transition-transform hover:scale-110"
        >
          <Heart
            className={cn(
              "h-6 w-6 transition-colors",
              isFavorite 
                ? "fill-rose-500 text-rose-500" 
                : "text-white fill-black/30 hover:fill-black/50"
            )}
          />
        </button>

        {/* Badge */}
        {badge && (
          <Badge className={cn("absolute top-3 left-3 z-10", badgeConfig[badge].className)}>
            {badgeConfig[badge].label}
          </Badge>
        )}

        {/* Navigation Arrows */}
        {imagenes.length > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {imagenes.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagenes.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentImageIndex 
                    ? "bg-white" 
                    : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{nombre}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-4 w-4 fill-foreground text-foreground" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground truncate">
          {ubicacion}, {ciudad}
        </p>
        
        <p className="text-sm text-muted-foreground">
          {formatNumber(impactos)} impactos/mes
        </p>
        
        <p className="text-sm pt-1">
          <span className="font-semibold">${precio.toLocaleString("es-MX")} MXN</span>
          <span className="text-muted-foreground"> / mes</span>
        </p>
      </div>
    </div>
  );
}
