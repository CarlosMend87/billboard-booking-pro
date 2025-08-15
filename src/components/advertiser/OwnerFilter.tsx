import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search } from "lucide-react";

const BILLBOARD_OWNERS = [
  "JCDecaux",
  "Rentable", 
  "Grupo Vallas",
  "Visual Shot",
  "IMU",
  "Global",
  "G8",
  "Grupo Pol",
  "ATM",
  "Memije",
  "Mepexa"
];

interface OwnerFilterProps {
  selectedOwners: string[];
  onOwnerChange: (owners: string[]) => void;
}

export function OwnerFilter({ selectedOwners, onOwnerChange }: OwnerFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOwners = BILLBOARD_OWNERS.filter(owner =>
    owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOwnerToggle = (owner: string) => {
    if (selectedOwners.includes(owner)) {
      onOwnerChange(selectedOwners.filter(o => o !== owner));
    } else {
      onOwnerChange([...selectedOwners, owner]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        <h3 className="font-medium">Propietarios</h3>
        {selectedOwners.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedOwners.length} seleccionados
          </Badge>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar propietario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredOwners.map((owner) => (
          <div key={owner} className="flex items-center space-x-2">
            <Checkbox
              id={owner}
              checked={selectedOwners.includes(owner)}
              onCheckedChange={() => handleOwnerToggle(owner)}
            />
            <label
              htmlFor={owner}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {owner}
            </label>
          </div>
        ))}
      </div>

      {selectedOwners.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOwners.map((owner) => (
            <Badge
              key={owner}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleOwnerToggle(owner)}
            >
              {owner} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}