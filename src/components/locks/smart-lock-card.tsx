import { Battery, KeyRound, Wifi, WifiOff } from "lucide-react";
import type { SmartLock } from "@/types";
import { propertyName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SmartLockCard({ lock }: { lock: SmartLock }) {
  return (
    <article className="card-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{lock.name}</h3>
          <p className="text-sm text-muted-foreground">{propertyName(lock.propertyId)}</p>
        </div>
        <Badge variant={lock.online ? "success" : "danger"}>
          {lock.online ? (
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3" /> En línea
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Sin conexión
            </span>
          )}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="flex items-center gap-1 text-muted-foreground">
            <Battery className="h-4 w-4" /> Batería
          </p>
          <p
            className={cn(
              "font-medium",
              lock.battery < 20 ? "text-danger" : "text-foreground"
            )}
          >
            {lock.battery}%
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-muted-foreground">
            <KeyRound className="h-4 w-4" /> Código actual
          </p>
          <p className="font-mono font-medium">{lock.currentCode ?? "—"}</p>
        </div>
      </div>
      {lock.currentGuest && (
        <p className="mt-3 text-sm text-muted-foreground">
          Huésped: <span className="text-foreground">{lock.currentGuest}</span>
          {lock.validUntil && ` · hasta ${lock.validUntil}`}
        </p>
      )}
      <Button className="mt-4 w-full" size="sm">
        Generar código temporal
      </Button>
    </article>
  );
}
