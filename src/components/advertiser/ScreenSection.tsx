import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenCard, ScreenCardProps } from "./ScreenCard";
import { cn } from "@/lib/utils";

interface ScreenSectionProps {
  title: string;
  screens: ScreenCardProps[];
  onScreenClick?: (screenId: string) => void;
  onFavorite?: (screenId: string) => void;
  onCompare?: (screenId: string) => void;
  favoriteIds?: string[];
  compareIds?: string[];
}

export function ScreenSection({ 
  title, 
  screens, 
  onScreenClick,
  onFavorite,
  onCompare,
  favoriteIds = [],
  compareIds = [],
}: ScreenSectionProps) {
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
  }, [screens]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320 * 2;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (screens.length === 0) return null;

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full h-8 w-8 border-border",
              !canScrollLeft && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full h-8 w-8 border-border",
              !canScrollRight && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {screens.map((screen) => (
          <div key={screen.id} className="flex-shrink-0 w-[280px] md:w-[300px]">
            <ScreenCard
              {...screen}
              isFavorite={favoriteIds.includes(screen.id)}
              isInCompare={compareIds.includes(screen.id)}
              onClick={() => onScreenClick?.(screen.id)}
              onFavorite={onFavorite}
              onCompare={onCompare}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
