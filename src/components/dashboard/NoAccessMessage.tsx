import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface NoAccessMessageProps {
  section: string;
  roleLabel?: string;
  showBackButton?: boolean;
}

export function NoAccessMessage({ section, roleLabel, showBackButton = true }: NoAccessMessageProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
        <p className="text-muted-foreground text-center max-w-md mb-2">
          No tienes permisos para acceder a la sección de <strong>{section}</strong>.
        </p>
        {roleLabel && (
          <p className="text-sm text-muted-foreground mb-4">
            Tu rol actual: <span className="font-medium">{roleLabel}</span>
          </p>
        )}
        {showBackButton && (
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
