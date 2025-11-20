import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Search } from "lucide-react";

const LOCATION_KEYWORDS = [
  "Bares",
  "Restaurantes", 
  "McDonalds",
  "Starbucks",
  "Hospitales",
  "Concesionarios de Autos",
  "Tiendas de Conveniencia",
  "Supermercados",
  "Centros Comerciales",
  "Universidades",
  "Bancos",
  "Gasolineras",
  "Farmacias",
  "Gimnasios",
  "Cines"
];

interface LocationKeywordFilterProps {
  selectedKeywords: string[];
  onKeywordChange: (keywords: string[]) => void;
}

export function LocationKeywordFilter({ selectedKeywords, onKeywordChange }: LocationKeywordFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const filteredKeywords = LOCATION_KEYWORDS.filter(keyword =>
    keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeywordToggle = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      onKeywordChange(selectedKeywords.filter(k => k !== keyword));
    } else {
      onKeywordChange([...selectedKeywords, keyword]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          Ubicaciones
          {selectedKeywords.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedKeywords.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Ubicaciones Cercanas</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredKeywords.map((keyword) => (
              <div key={keyword} className="flex items-center space-x-2">
                <Checkbox
                  id={keyword}
                  checked={selectedKeywords.includes(keyword)}
                  onCheckedChange={() => handleKeywordToggle(keyword)}
                />
                <label
                  htmlFor={keyword}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {keyword}
                </label>
              </div>
            ))}
          </div>

          {selectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t">
              {selectedKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleKeywordToggle(keyword)}
                >
                  {keyword} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}