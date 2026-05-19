"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type IntegrationRequiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: string;
  description?: string;
};

export function IntegrationRequiredDialog({
  open,
  onOpenChange,
  service,
  description,
}: IntegrationRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conexión requerida</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {description ??
            `Esta función requiere conectar ${service} desde Integraciones.`}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button asChild onClick={() => onOpenChange(false)}>
            <Link href="/app/configuracion">Ir a integraciones</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
