import TopNav from "@/components/TopNav";
import { useEffect, useMemo, useState } from "react";
import { store, onRealtimeUpdate, BusRoute, Stop } from "@/state/store";
import { BusStatusCard } from "@/components/BusStatusCard";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [stops, setStops] = useState<Stop[]>(store.getStops());
  const [buses, setBuses] = useState<BusRoute[]>(store.getBuses());
  const user = store.getCurrentUser();

  useEffect(() => {
    const off = onRealtimeUpdate(() => {
      setStops(store.getStops());
      setBuses(store.getBuses());
    });
    return off;
  }, []);

  const onBoard = (busId: string, stopId: string) => {
    if (!user) {
      toast({ title: "Please log in to check in" });
      return;
    }
    store.addCheckIn(user.id, busId, stopId);
    toast({ title: "Boarded!", description: "Thanks for keeping everyone updated." });
  };

  const stopsById = useMemo(() => new Map(stops.map((s) => [s.id, s] as const)), [stops]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Campus Bus Tracker</h1>
          <p className="text-muted-foreground">Check in when you board. Everyone sees live updates instantly.</p>
        </header>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buses.map((bus) => (
            <BusStatusCard
              key={bus.id}
              bus={bus}
              stops={bus.stopIds.map((id) => stopsById.get(id)).filter(Boolean) as Stop[]}
              onBoard={(stopId) => onBoard(bus.id, stopId)}
            />
          ))}
        </section>
      </main>
    </div>
  );
};

export default Index;
