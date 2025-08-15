import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Calendar, DollarSign, Eye } from "lucide-react"

const stats = [
  {
    title: "Vallas Fijas",
    value: "3",
    description: "Tradicionales con lona",
    icon: Building2,
    color: "text-primary"
  },
  {
    title: "Vallas Digitales",
    value: "3",
    description: "DOOH con múltiples clientes",
    icon: Eye,
    color: "text-blue-600"
  },
  {
    title: "Slots Disponibles",
    value: "23",
    description: "Entre todas las pantallas",
    icon: Calendar,
    color: "text-status-available"
  },
  {
    title: "Ingresos Mensuales",
    value: "$52,400",
    description: "+18% vs mes anterior",
    icon: DollarSign,
    color: "text-primary"
  }
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}