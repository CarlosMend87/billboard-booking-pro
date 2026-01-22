import { useState } from "react";
import { Heart, ChevronLeft, ChevronRight, Scale, ShoppingCart, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import defaultBillboard from "@/assets/default-billboard.avif";

export interface ScreenCardProps {
  id: string;
  nombre: string;
  ubicacion: string;
  ciudad: string;
  precio: number | null;
  impactos: number | null;
  imagenes: string[];
  badge?: "alta-demanda" | "disponible" | "premium";
  tipo?: string;
  hasComputerVision?: boolean;
  lat?: number;
  lng?: number;
  // Extended data for cart/booking
  owner_id?: string;
  medidas?: { ancho?: number; alto?: number };
  foto?: string;
  // UI state
  isFavorite?: boolean;
  isInCompare?: boolean;
  isInCart?: boolean;
  onFavorite?: (id: string) => void;
  onCompare?: (id: string) => void;
  onAddToCart?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onClick?: () => void;
  canAddToCart?: boolean;
  addToCartDisabledReason?: string;
}

const badgeConfig = {
  "alta-demanda": { label: "Alta demanda", className: "bg-destructive text-destructive-foreground" },
  disponible: { label: "Disponible", className: "bg-green-600 text-white" },
  premium: { label: "Premium", className: "bg-amber-500 text-white" },
};

export function ScreenCard({
  id, nombre, ubicacion, ciudad, precio, impactos, imagenes, badge, tipo, hasComputerVision, 
  isFavorite: isFavoriteProp, isInCompare, isInCart, onFavorite, onCompare, onAddToCart, onClick,
  canAddToCart = true, addToCartDisabledReason,
}: ScreenCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localFavorite, setLocalFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedSuccess, setShowAddedSuccess] = useState(false);

  // Use external favorite state if provided, otherwise use local state
  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : localFavorite;

  const displayImages = imagenes.length > 0 && !imageError ? imagenes : [defaultBillboard];
  const currentImage = displayImages[currentImageIndex] || defaultBillboard;

  const handlePrevImage = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setCurrentImageIndex((prev) => prev === 0 ? displayImages.length - 1 : prev - 1); 
  };
  
  const handleNextImage = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    setCurrentImageIndex((prev) => prev === displayImages.length - 1 ? 0 : prev + 1); 
  };
  
  const handleFavorite = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    if (onFavorite) {
      onFavorite(id);
    } else {
      setLocalFavorite(!localFavorite);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(id);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCart || isAddingToCart || isInCart || !canAddToCart) return;

    setIsAddingToCart(true);
    try {
      const result = await onAddToCart(id);
      if (result.success) {
        setShowAddedSuccess(true);
        setTimeout(() => setShowAddedSuccess(false), 2000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatNumber = (num: number) => num >= 1000000 ? (num / 1000000).toFixed(1) + "M" : num >= 1000 ? (num / 1000).toFixed(0) + "K" : num.toString();
  const formatPrice = (price: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(price);

  const getButtonState = () => {
    if (isAddingToCart) return { text: "Validando...", icon: Loader2, disabled: true, animateIcon: true };
    if (showAddedSuccess) return { text: "¡Agregado!", icon: Check, disabled: true, className: "bg-green-600 hover:bg-green-600" };
    if (isInCart) return { text: "En carrito", icon: Check, disabled: true, className: "bg-muted text-muted-foreground" };
    if (!canAddToCart) return { text: addToCartDisabledReason || "Selecciona fechas", icon: ShoppingCart, disabled: true };
    return { text: "Agregar al carrito", icon: ShoppingCart, disabled: false };
  };

  const buttonState = getButtonState();
  const IconComponent = buttonState.icon;

  return (
    <div className="group cursor-pointer" onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
        <img 
          src={currentImage} 
          alt={nombre} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          onError={() => setImageError(true)} 
        />
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          {onCompare && (
            <button 
              onClick={handleCompare} 
              className={cn(
                "p-2 transition-all hover:scale-110 rounded-full",
                isInCompare ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground hover:bg-background"
              )}
            >
              <Scale className="h-5 w-5 drop-shadow-md" />
            </button>
          )}
          <button 
            onClick={handleFavorite} 
            className="p-2 transition-transform hover:scale-110"
          >
            <Heart className={cn(
              "h-6 w-6 drop-shadow-md transition-colors", 
              isFavorite ? "fill-destructive text-destructive" : "fill-black/30 text-white hover:fill-black/50"
            )} />
          </button>
        </div>
        
        {badge && (
          <div className={cn(
            "absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm", 
            badgeConfig[badge].className
          )}>
            {badgeConfig[badge].label}
          </div>
        )}
        
        {hasComputerVision && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-violet-600 text-white shadow-sm">
            AI Vision
          </div>
        )}
        
        {displayImages.length > 1 && isHovered && (
          <>
            <button 
              onClick={handlePrevImage} 
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/90 rounded-full shadow-md hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button 
              onClick={handleNextImage} 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/90 rounded-full shadow-md hover:bg-background"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </>
        )}
        
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {displayImages.slice(0, 5).map((_, index) => (
              <div 
                key={index} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors", 
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                )} 
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{nombre}</h3>
          {tipo && <span className="text-xs text-muted-foreground capitalize shrink-0">{tipo}</span>}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{ubicacion}, {ciudad}</p>
        {impactos !== null && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatNumber(impactos)}</span> impactos/mes
          </p>
        )}
        <p className="text-sm">
          {precio !== null ? (
            <>
              <span className="font-semibold text-foreground">{formatPrice(precio)}</span>
              <span className="text-muted-foreground"> /mes</span>
            </>
          ) : (
            <span className="text-muted-foreground">Consultar precio</span>
          )}
        </p>
        
        {/* Add to Cart Button */}
        {onAddToCart && (
          <Button
            size="sm"
            className={cn(
              "w-full mt-2 font-semibold transition-all duration-200",
              buttonState.className
            )}
            disabled={buttonState.disabled}
            onClick={handleAddToCart}
          >
            <IconComponent className={cn("h-4 w-4 mr-2", buttonState.animateIcon && "animate-spin")} />
            {buttonState.text}
          </Button>
        )}
      </div>
    </div>
  );
}
