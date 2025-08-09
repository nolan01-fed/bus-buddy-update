import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusRoute, Stop, formatTimeAgo } from "@/state/store";

type Props = {
  bus: BusRoute;
  stops: Stop[];
  onBoard: (stopId: string) => void;
};

export const BusStatusCard = ({ bus, stops, onBoard }: Props) => {
  const [stopId, setStopId] = useState<string>(bus.lastDepartedStopId ?? stops[0]?.id);

  const statusText = useMemo(() => {
    if (!bus.lastDepartedStopId) return "Awaiting first departure";
    const idx = stops.findIndex((s) => s.id === bus.lastDepartedStopId);
    const from = stops[idx]?.name ?? "Unknown";
    const to = stops[idx + 1]?.name ?? "Route End";
    return `Between ${from} and ${to}`;
  }, [bus.lastDepartedStopId, stops]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{bus.name}</span>
          <span className="text-sm font-normal text-muted-foreground">{formatTimeAgo(bus.lastDepartureTime)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{statusText}</p>
        <div className="flex gap-2">
          <Select value={stopId} onValueChange={setStopId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your stop" />
            </SelectTrigger>
            <SelectContent>
              {stops.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.sequence}. {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => stopId && onBoard(stopId)}>Boarded</Button>
        </div>
      </CardContent>
    </Card>
  );
};
