import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Tv, Building2, Store, MapPin, Wifi, Zap, Eye, Target, Megaphone, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "Todos", icon: LayoutGrid },
  { id: "led", label: "LED", icon: Tv },
  { id: "espectacular", label: "Espectaculares", icon: Building2 },
  { id: "mupi", label: "Mupis", icon: Store },
  { id: "indoor", label: "Indoor", icon: MapPin },
  { id: "digital", label: "Digitales", icon: Wifi },
  { id: "carreteras", label: "Carreteras", icon: Target },
  { id: "premium", label: "Premium", icon: Zap },
  { id: "alta-visibilidad", label: "Alta Visibilidad", icon: Eye },
  { id: "branding", label: "Branding", icon: Megaphone },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", checkScroll);
      return () => element.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative border-b border-border bg-background">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {/* Left Arrow */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 z-10 rounded-full h-7 w-7 bg-background border-border shadow-md"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Categories */}
          <div
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto scrollbar-hide py-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selected === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => onSelect(category.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 min-w-fit pb-2 border-b-2 transition-all",
                    isSelected
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium whitespace-nowrap">{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 z-10 rounded-full h-7 w-7 bg-background border-border shadow-md"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
