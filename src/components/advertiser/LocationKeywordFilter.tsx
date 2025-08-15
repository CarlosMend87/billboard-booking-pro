import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search } from "lucide-react";

const LOCATION_KEYWORDS = [
  "Bars",
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <h3 className="font-medium">Ubicaciones Cercanas</h3>
        {selectedKeywords.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedKeywords.length} seleccionadas
          </Badge>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredKeywords.map((keyword) => (
          <div key={keyword} className="flex items-center space-x-2">
            <Checkbox
              id={keyword}
              checked={selectedKeywords.includes(keyword)}
              onCheckedChange={() => handleKeywordToggle(keyword)}
            />
            <label
              htmlFor={keyword}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {keyword}
            </label>
          </div>
        ))}
      </div>

      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
  );
}