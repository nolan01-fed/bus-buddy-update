import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store } from "@/state/store";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [universityId, setUniversityId] = useState("");
  const [name, setName] = useState("");
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId) {
      toast({ title: "Enter your University ID" });
      return;
    }
    store.login(universityId, name || undefined, admin);
    toast({ title: "Logged in", description: admin ? "Admin mode enabled" : undefined });
    navigate(admin ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Login</h1>
        </header>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign in to Campus Bus Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="uid">University ID or Email</Label>
                <Input id="uid" value={universityId} onChange={(e) => setUniversityId(e.target.value)} placeholder="e.g. S1234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="flex items-center gap-2">
                <input id="admin" type="checkbox" className="h-4 w-4" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
                <Label htmlFor="admin">Admin mode</Label>
              </div>
              <Button type="submit" className="w-full">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;
