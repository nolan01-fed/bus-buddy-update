import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { store, onRealtimeUpdate, User } from "@/state/store";

const TopNav = () => {
  const [user, setUser] = useState<User | null>(store.getCurrentUser());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const off = onRealtimeUpdate(() => setUser(store.getCurrentUser()));
    return off;
  }, []);

  const logout = () => {
    store.logout();
    if (location.pathname.startsWith("/admin")) navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav className="container mx-auto flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          Campus Bus Tracker
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm hover:opacity-80 transition-opacity">Student</Link>
          <Link to="/admin" className="text-sm hover:opacity-80 transition-opacity">Admin</Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.id}</span>
              <Button variant="secondary" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default TopNav;
