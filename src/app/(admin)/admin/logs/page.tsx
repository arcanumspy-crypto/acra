"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockLogs } from "@/lib/mock-data"
import { Download } from "lucide-react"

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs e Auditoria</h1>
          <p className="text-muted-foreground">
            Histórico de ações do sistema
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.userEmail || "Sistema"}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.ipAddress || "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

