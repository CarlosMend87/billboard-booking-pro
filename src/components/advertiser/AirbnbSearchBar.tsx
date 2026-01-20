import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const SCREEN_TYPES = [
  { value: "led", label: "LED" },
  { value: "espectacular", label: "Espectacular" },
  { value: "mupi", label: "Mupi" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
];

const LOCATIONS = [
  "CDMX",
  "Monterrey",
  "Guadalajara",
  "Querétaro",
  "Puebla",
  "Cancún",
  "Mérida",
  "Tijuana",
];

export function AirbnbSearchBar() {
  const navigate = useNavigate();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [screenType, setScreenType] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (startDate) params.set("startDate", startDate.toISOString());
    if (endDate) params.set("endDate", endDate.toISOString());
    if (screenType) params.set("type", screenType);
    
    navigate(`/disponibilidad-anuncios?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-[850px] mx-auto">
      <div className="bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center">
          {/* Location Field */}
          <Popover open={activeField === "location"} onOpenChange={(open) => setActiveField(open ? "location" : null)}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all",
                  "hover:bg-gray-100",
                  activeField === "location" && "bg-gray-100"
                )}
              >
                <div className="text-xs font-semibold text-foreground">Ubicación</div>
                <div className="text-sm text-muted-foreground truncate">
                  {location || "Ciudad, colonia o punto de interés"}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl" align="start">
              <div className="p-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Buscar ubicación..."
                    className="flex-1 bg-transparent text-sm outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  {LOCATIONS.filter(loc => 
                    loc.toLowerCase().includes(location.toLowerCase())
                  ).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocation(loc);
                        setActiveField(null);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="bg-gray-200 rounded-lg p-2">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{loc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-gray-300" />

          {/* Start Date Field */}
          <Popover open={activeField === "startDate"} onOpenChange={(open) => setActiveField(open ? "startDate" : null)}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all min-w-[130px]",
                  "hover:bg-gray-100",
                  activeField === "startDate" && "bg-gray-100"
                )}
              >
                <div className="text-xs font-semibold text-foreground">Inicio</div>
                <div className="text-sm text-muted-foreground">
                  {startDate ? format(startDate, "d MMM", { locale: es }) : "Agregar fecha"}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="center">
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

          <div className="w-px h-8 bg-gray-300" />

          {/* End Date Field */}
          <Popover open={activeField === "endDate"} onOpenChange={(open) => setActiveField(open ? "endDate" : null)}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all min-w-[130px]",
                  "hover:bg-gray-100",
                  activeField === "endDate" && "bg-gray-100"
                )}
              >
                <div className="text-xs font-semibold text-foreground">Fin</div>
                <div className="text-sm text-muted-foreground">
                  {endDate ? format(endDate, "d MMM", { locale: es }) : "Agregar fecha"}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="center">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                  setActiveField(null);
                }}
                disabled={(date) => date < (startDate || new Date())}
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-gray-300" />

          {/* Screen Type Field */}
          <Popover open={activeField === "screenType"} onOpenChange={(open) => setActiveField(open ? "screenType" : null)}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 text-left px-6 py-4 rounded-full transition-all",
                  "hover:bg-gray-100",
                  activeField === "screenType" && "bg-gray-100"
                )}
              >
                <div className="text-xs font-semibold text-foreground">Formato</div>
                <div className="text-sm text-muted-foreground">
                  {screenType ? SCREEN_TYPES.find(t => t.value === screenType)?.label : "Tipo de pantalla"}
                </div>
              </button>
            </PopoverTrigger>
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
                        ? "bg-gray-100 font-medium" 
                        : "hover:bg-gray-50"
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
          <div className="pr-2">
            <Button
              onClick={handleSearch}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-md"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
