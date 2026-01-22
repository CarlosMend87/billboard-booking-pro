import { useState } from "react";
import { ShoppingCart, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  onAddToCart: () => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  disabledReason?: string;
  isInCart?: boolean;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "card" | "modal";
  className?: string;
}

export function AddToCartButton({
  onAddToCart,
  disabled = false,
  disabledReason,
  isInCart = false,
  size = "default",
  variant = "default",
  className,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading || isInCart) return;

    setIsLoading(true);
    try {
      const result = await onAddToCart();
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Button states
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Validando...
        </>
      );
    }
    
    if (showSuccess) {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          ¡Agregado!
        </>
      );
    }
    
    if (isInCart) {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          En el carrito
        </>
      );
    }
    
    if (disabled && disabledReason) {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          {disabledReason}
        </>
      );
    }
    
    return (
      <>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Agregar al carrito
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass = "font-semibold transition-all duration-200";
    
    if (showSuccess) {
      return cn(baseClass, "bg-green-600 hover:bg-green-600 text-white");
    }
    
    if (isInCart) {
      return cn(baseClass, "bg-muted text-muted-foreground cursor-default");
    }
    
    if (variant === "card") {
      return cn(baseClass, "w-full");
    }
    
    if (variant === "modal") {
      return cn(baseClass, "w-full h-12 text-base");
    }
    
    return baseClass;
  };

  const sizeMap = {
    sm: "sm" as const,
    default: "default" as const,
    lg: "lg" as const,
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      size={sizeMap[size]}
      className={cn(getButtonClass(), className)}
      title={disabled && disabledReason ? disabledReason : undefined}
    >
      {getButtonContent()}
    </Button>
  );
}
