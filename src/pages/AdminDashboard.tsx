import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusRoute, CheckIn, Stop, exportCheckInsCsv, onRealtimeUpdate, store } from "@/state/store";
import { toast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stops, setStops] = useState<Stop[]>(store.getStops());
  const [buses, setBuses] = useState<BusRoute[]>(store.getBuses());
  const [checkIns, setCheckIns] = useState<CheckIn[]>(store.getCheckIns());
  const [newStop, setNewStop] = useState("");
  const [override, setOverride] = useState<Record<string, string>>({});

  const user = store.getCurrentUser();
  if (!user || !user.isAdmin) return <Navigate to="/login" replace />;

  useEffect(() => {
    const off = onRealtimeUpdate(() => {
      setStops(store.getStops());
      setBuses(store.getBuses());
      setCheckIns(store.getCheckIns());
    });
    return off;
  }, []);

  const addStop = () => {
    if (!newStop.trim()) return;
    store.addStop(newStop.trim());
    toast({ title: "Stop added" });
    setNewStop("");
  };

  const renameStop = (stop: Stop) => {
    const name = prompt("Rename stop", stop.name);
    if (name && name.trim()) {
      store.updateStop(stop.id, name.trim());
      toast({ title: "Stop updated" });
    }
  };

  const applyOverride = (busId: string) => {
    const stopId = override[busId];
    if (!stopId) return;
    store.setBusPosition(busId, stopId);
    toast({ title: "Bus position updated" });
  };

  const stopsById = useMemo(() => new Map(stops.map((s) => [s.id, s] as const)), [stops]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage stops, view check-ins, and override bus positions.</p>
        </header>
        <Tabs defaultValue="checkins">
          <TabsList>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
            <TabsTrigger value="stops">Stops</TabsTrigger>
            <TabsTrigger value="buses">Bus Status</TabsTrigger>
          </TabsList>
          <TabsContent value="checkins" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Check-ins</CardTitle>
                <Button variant="secondary" onClick={() => exportCheckInsCsv(checkIns, buses, stops)}>Export CSV</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Stop</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkIns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{c.studentId}</TableCell>
                        <TableCell>{buses.find((b) => b.id === c.busId)?.name ?? c.busId}</TableCell>
                        <TableCell>{stopsById.get(c.stopId)?.name ?? c.stopId}</TableCell>
                      </TableRow>
                    ))}
                    {checkIns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No check-ins yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stops" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Stops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input placeholder="New stop name" value={newStop} onChange={(e) => setNewStop(e.target.value)} />
                  <Button onClick={addStop}>Add</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stops.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.sequence}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" onClick={() => renameStop(s)}>Rename</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="buses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bus Status & Overrides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {buses.map((b) => (
                  <div key={b.id} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border rounded-md p-3">
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last departed: {b.lastDepartedStopId ? (stopsById.get(b.lastDepartedStopId)?.name ?? b.lastDepartedStopId) : "—"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={override[b.id]} onValueChange={(v) => setOverride((o) => ({ ...o, [b.id]: v }))}>
                        <SelectTrigger className="min-w-[200px]">
                          <SelectValue placeholder="Select stop" />
                        </SelectTrigger>
                        <SelectContent>
                          {stops.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.sequence}. {s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => applyOverride(b.id)}>Update</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
