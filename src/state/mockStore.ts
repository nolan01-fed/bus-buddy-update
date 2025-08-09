// Lightweight local storage-backed store for MVP without backend.
// Once Supabase is connected, replace implementations here with real calls.

export type Stop = { id: string; name: string; sequence: number };
export type BusRoute = {
  id: string;
  name: string;
  stopIds: string[];
  lastDepartedStopId?: string;
  lastDepartureTime?: string; // ISO string
};
export type CheckIn = {
  id: string;
  studentId: string;
  busId: string;
  stopId: string;
  timestamp: string; // ISO
};
export type User = {
  id: string; // university ID or email
  name?: string;
  isAdmin?: boolean;
};

const LS_KEYS = {
  stops: "cbt_stops",
  buses: "cbt_buses",
  checkIns: "cbt_checkins",
  currentUser: "cbt_current_user",
} as const;

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed initial data if empty
(function seed() {
  const hasStops = read<Stop[]>(LS_KEYS.stops, []).length > 0;
  const hasBuses = read<BusRoute[]>(LS_KEYS.buses, []).length > 0;
  if (!hasStops) {
    const stops: Stop[] = [
      { id: "s1", name: "Main Gate", sequence: 1 },
      { id: "s2", name: "Library", sequence: 2 },
      { id: "s3", name: "Science Block", sequence: 3 },
      { id: "s4", name: "Dorms", sequence: 4 },
    ];
    write(LS_KEYS.stops, stops);
  }
  if (!hasBuses) {
    const stops = read<Stop[]>(LS_KEYS.stops, []);
    const buses: BusRoute[] = [
      { id: "b1", name: "Route A", stopIds: stops.map((s) => s.id) },
      { id: "b2", name: "Route B", stopIds: stops.map((s) => s.id).reverse() },
    ];
    write(LS_KEYS.buses, buses);
  }
})();

export const store = {
  // Auth (mock)
  getCurrentUser(): User | null {
    return read<User | null>(LS_KEYS.currentUser, null);
  },
  login(id: string, name?: string, isAdmin?: boolean) {
    const user: User = { id, name, isAdmin };
    write(LS_KEYS.currentUser, user);
    dispatchStoragePing();
    return user;
  },
  logout() {
    localStorage.removeItem(LS_KEYS.currentUser);
    dispatchStoragePing();
  },

  // Stops
  getStops(): Stop[] {
    return read<Stop[]>(LS_KEYS.stops, []).sort((a, b) => a.sequence - b.sequence);
  },
  addStop(name: string) {
    const stops = this.getStops();
    const newStop: Stop = { id: uid("stop"), name, sequence: stops.length + 1 };
    write(LS_KEYS.stops, [...stops, newStop]);
    dispatchStoragePing();
    return newStop;
  },
  updateStop(id: string, name: string) {
    const stops = this.getStops().map((s) => (s.id === id ? { ...s, name } : s));
    write(LS_KEYS.stops, stops);
    dispatchStoragePing();
  },

  // Buses
  getBuses(): BusRoute[] {
    return read<BusRoute[]>(LS_KEYS.buses, []);
  },
  setBusPosition(busId: string, stopId: string, time = new Date().toISOString()) {
    const buses = this.getBuses().map((b) =>
      b.id === busId ? { ...b, lastDepartedStopId: stopId, lastDepartureTime: time } : b
    );
    write(LS_KEYS.buses, buses);
    dispatchStoragePing();
  },

  // Check-ins
  getCheckIns(): CheckIn[] {
    return read<CheckIn[]>(LS_KEYS.checkIns, []);
  },
  addCheckIn(studentId: string, busId: string, stopId: string) {
    const checkIns = this.getCheckIns();
    const entry: CheckIn = {
      id: uid("chk"),
      studentId,
      busId,
      stopId,
      timestamp: new Date().toISOString(),
    };
    write(LS_KEYS.checkIns, [entry, ...checkIns]);
    this.setBusPosition(busId, stopId, entry.timestamp);
    dispatchStoragePing();
    return entry;
  },
};

// Broadcast a dummy storage change so other tabs update immediately
function dispatchStoragePing() {
  localStorage.setItem("cbt_ping", Date.now().toString());
}

export function onRealtimeUpdate(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (!e.key) return;
    if (e.key.startsWith("cbt_")) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function formatTimeAgo(iso?: string): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export function exportCheckInsCsv(rows: CheckIn[], buses: BusRoute[], stops: Stop[]) {
  const busById = new Map(buses.map((b) => [b.id, b] as const));
  const stopById = new Map(stops.map((s) => [s.id, s] as const));
  const header = ["checkin_id", "student_id", "bus", "stop", "timestamp"];
  const lines = rows.map((r) => {
    const bus = busById.get(r.busId)?.name || r.busId;
    const stop = stopById.get(r.stopId)?.name || r.stopId;
    return [r.id, r.studentId, bus, stop, r.timestamp].map(csvEscape).join(",");
  });
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `checkins_${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
