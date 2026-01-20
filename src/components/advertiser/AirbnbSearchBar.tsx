import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Monitor, Building2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocationSuggestions } from "@/hooks/useLocationSuggestions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
const SCREEN_TYPES = [
  { value: "", label: "Todos" },
  { value: "led", label: "LED" },
  { value: "espectacular", label: "Espectacular" },
  { value: "mupi", label: "Mupi" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "digital", label: "Digital" },
];

export interface SearchFilters {
  location: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  screenType: string;
}

interface AirbnbSearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export function AirbnbSearchBar({ onSearch, initialFilters }: AirbnbSearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [location, setLocation] = useState(initialFilters?.location || "");
  const [locationQuery, setLocationQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(initialFilters?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialFilters?.endDate);
  const [screenType, setScreenType] = useState(initialFilters?.screenType || "");
  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get location suggestions from real database
  const { getSuggestions, loading: locationsLoading } = useLocationSuggestions();
  const suggestions = getSuggestions(locationQuery || location);

  // Fetch active campaigns count
  useEffect(() => {
    const fetchActiveCampaigns = async () => {
      if (!user) {
        setActiveCampaignsCount(0);
        return;
      }
      
      const { count, error } = await supabase
        .from('campañas')
        .select('*', { count: 'exact', head: true })
        .eq('advertiser_id', user.id)
        .eq('status', 'active');
      
      if (!error && count !== null) {
        setActiveCampaignsCount(count);
      }
    };

    fetchActiveCampaigns();
  }, [user]);

  // Sync with URL params on mount
  useEffect(() => {
    const loc = searchParams.get("location");
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    const type = searchParams.get("type");

    if (loc) setLocation(loc);
    if (start) setStartDate(new Date(start));
    if (end) setEndDate(new Date(end));
    if (type) setScreenType(type);
  }, [searchParams]);

  // Focus input when location field opens
  useEffect(() => {
    if (activeField === "location" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeField]);

  const handleSearch = () => {
    const filters: SearchFilters = {
      location,
      startDate,
      endDate,
      screenType,
    };

    // If callback provided, use it (for in-page filtering)
    if (onSearch) {
      onSearch(filters);
      return;
    }

    // Otherwise, navigate with query params
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (startDate) params.set("startDate", startDate.toISOString());
    if (endDate) params.set("endDate", endDate.toISOString());
    if (screenType) params.set("type", screenType);
    
    navigate(`/explorar?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocation("");
    setLocationQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setScreenType("");
    if (onSearch) {
      onSearch({ location: "", startDate: undefined, endDate: undefined, screenType: "" });
    }
  };

  const handleLocationSelect = (value: string) => {
    setLocation(value);
    setLocationQuery("");
    setActiveField(null);
  };

  const hasActiveFilters = location || startDate || endDate || screenType;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full max-w-[950px] mx-auto">
        <div className="flex items-center gap-3">
          {/* Campaigns Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                className="h-14 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-md relative"
              >
                <Link to="/progreso-campaña">
                  <Megaphone className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Campañas</span>
                  {activeCampaignsCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold"
                    >
                      {activeCampaignsCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Ver y gestionar tus campañas activas</p>
            </TooltipContent>
          </Tooltip>

          {/* Search Bar */}
          <div className="flex-1 bg-background rounded-full border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              {/* START DATE FIELD - Now First */}
              <Popover open={activeField === "startDate"} onOpenChange={(open) => setActiveField(open ? "startDate" : null)}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 text-left px-6 py-4 rounded-full transition-all min-w-[130px]",
                          "hover:bg-muted",
                          activeField === "startDate" && "bg-muted"
                        )}
                      >
                        <div className="text-xs font-semibold text-foreground">Fecha Inicio</div>
                        <div className="text-sm text-muted-foreground">
                          {startDate ? format(startDate, "d MMM yyyy", { locale: es }) : "Agregar fecha"}
                        </div>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Selecciona cuándo inicia tu campaña</p>
                  </TooltipContent>
                </Tooltip>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                  setActiveField("endDate");
                }}
                disabled={(date) => date < new Date()}
                className="rounded-2xl"
              />
            </PopoverContent>
              </Popover>

              <div className="w-px h-8 bg-border" />

              {/* END DATE FIELD - Now Second */}
              <Popover open={activeField === "endDate"} onOpenChange={(open) => setActiveField(open ? "endDate" : null)}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 text-left px-6 py-4 rounded-full transition-all min-w-[130px]",
                          "hover:bg-muted",
                          activeField === "endDate" && "bg-muted"
                        )}
                      >
                        <div className="text-xs font-semibold text-foreground">Fecha Fin</div>
                        <div className="text-sm text-muted-foreground">
                          {endDate ? format(endDate, "d MMM yyyy", { locale: es }) : "Agregar fecha"}
                        </div>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Selecciona cuándo termina tu campaña</p>
                  </TooltipContent>
                </Tooltip>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="center">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                  setActiveField("location");
                }}
                disabled={(date) => date < (startDate || new Date())}
                className="rounded-2xl"
              />
            </PopoverContent>
              </Popover>

              <div className="w-px h-8 bg-border" />

              {/* LOCATION FIELD - Now Third */}
              <Popover 
                open={activeField === "location"} 
                onOpenChange={(open) => {
                  setActiveField(open ? "location" : null);
                  if (!open) setLocationQuery("");
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 text-left px-6 py-4 rounded-full transition-all",
                          "hover:bg-muted",
                          activeField === "location" && "bg-muted"
                        )}
                      >
                        <div className="text-xs font-semibold text-foreground">Ubicación</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {location || "Ciudad o zona"}
                        </div>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Filtra por ciudad o zona específica</p>
                  </TooltipContent>
                </Tooltip>
            <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl" align="center">
              <div className="p-4">
                {/* Search Input */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Buscar ciudad o zona..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  {locationQuery && (
                    <button 
                      onClick={() => setLocationQuery("")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <span className="sr-only">Limpiar</span>
                      ×
                    </button>
                  )}
                </div>

                {/* Suggestions List */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {locationsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.value}`}
                        onClick={() => handleLocationSelect(suggestion.value)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className={cn(
                          "rounded-lg p-2",
                          suggestion.type === "ciudad" 
                            ? "bg-primary/10" 
                            : "bg-muted-foreground/10"
                        )}>
                          {suggestion.type === "ciudad" ? (
                            <Building2 className="h-4 w-4 text-primary" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">
                            {suggestion.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.count} pantalla{suggestion.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {suggestion.type === "ciudad" && (
                          <Badge variant="secondary" className="text-xs">
                            Ciudad
                          </Badge>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No se encontraron ubicaciones
                    </div>
                  )}
                </div>

                {/* Clear selection */}
                {location && (
                  <div className="pt-3 mt-3 border-t border-border">
                    <button
                      onClick={() => handleLocationSelect("")}
                      className="text-sm text-muted-foreground hover:text-foreground w-full text-left px-3 py-2 rounded-lg hover:bg-muted"
                    >
                      Mostrar todas las ubicaciones
                    </button>
                  </div>
                )}
              </div>
            </PopoverContent>
              </Popover>

              <div className="w-px h-8 bg-border" />

              {/* SCREEN TYPE FIELD - Now Fourth (Last) */}
              <Popover open={activeField === "screenType"} onOpenChange={(open) => setActiveField(open ? "screenType" : null)}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 text-left px-6 py-4 rounded-full transition-all",
                          "hover:bg-muted",
                          activeField === "screenType" && "bg-muted"
                        )}
                      >
                        <div className="text-xs font-semibold text-foreground">Formato</div>
                        <div className="text-sm text-muted-foreground">
                          {screenType ? SCREEN_TYPES.find(t => t.value === screenType)?.label : "Tipo de pantalla"}
                        </div>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Elige el tipo de pantalla que necesitas</p>
                  </TooltipContent>
                </Tooltip>
            <PopoverContent className="w-64 p-2 rounded-2xl shadow-xl" align="end">
              <div className="space-y-1">
                {SCREEN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setScreenType(type.value);
                      setActiveField(null);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors",
                      screenType === type.value 
                        ? "bg-muted font-medium" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
              </Popover>

              {/* Search Button */}
              <div className="pr-2 flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpiar
                  </Button>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSearch}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-md"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Buscar pantallas disponibles</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
