import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Lock, Plus, Trash2, LogOut, Star, Eye, EyeOff, Check, X, Clock } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "ff_admin_token";
const CATEGORIES = ["food", "drinks", "bars", "desserts"];
const PRICES = ["$", "$$", "$$$", "$$$$"];
const EMPTY = { name: "", cuisine: "", price: "$$", category: "food", address: "", description: "", image: "", active: true };

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setSponsors([]);
    setSubmissions([]);
  }, []);

  const loadSponsors = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/sponsors`, { headers: { Authorization: `Bearer ${token}` } });
      setSponsors(data);
    } catch (e) {
      if (e.response?.status === 401) {
        toast.error("Session expired, please log in again");
        logout();
      }
    }
  }, [token, logout]);

  const loadSubmissions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/submissions`, { headers: { Authorization: `Bearer ${token}` } });
      setSubmissions(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) { loadSponsors(); loadSubmissions(); }
  }, [token, loadSponsors, loadSubmissions]);

  const login = async () => {
    if (!password) return;
    setAuthLoading(true);
    try {
      const { data } = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
      toast.success("Welcome back, admin");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addSponsor = async () => {
    if (!form.name.trim() || !form.cuisine.trim()) {
      toast.error("Name and cuisine are required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/admin/sponsors`, form, authHeaders);
      toast.success(`${form.name} added as a sponsor`);
      setForm(EMPTY);
      loadSponsors();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not add sponsor");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await axios.patch(`${API}/admin/sponsors/${s.id}`, { active: !s.active }, authHeaders);
      loadSponsors();
    } catch {
      toast.error("Could not update");
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.name} from sponsors?`)) return;
    try {
      await axios.delete(`${API}/admin/sponsors/${s.id}`, authHeaders);
      toast.success("Sponsor removed");
      loadSponsors();
    } catch {
      toast.error("Could not remove");
    }
  };

  const approveSubmission = async (r) => {
    try {
      await axios.post(`${API}/admin/submissions/${r.id}/approve`, {}, authHeaders);
      toast.success(`${r.name} approved — now live in the pool`);
      loadSubmissions();
    } catch {
      toast.error("Could not approve");
    }
  };

  const rejectSubmission = async (r) => {
    if (!window.confirm(`Reject and delete "${r.name}"?`)) return;
    try {
      await axios.delete(`${API}/admin/submissions/${r.id}`, authHeaders);
      toast.success("Submission rejected");
      loadSubmissions();
    } catch {
      toast.error("Could not reject");
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141414] p-8" data-testid="admin-login-card">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E01E26]">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-white">Admin</h1>
              <p className="font-sans text-xs text-[#8A8F95]">Fork·Fate sponsor manager</p>
            </div>
          </div>
          <Label htmlFor="pw" className="text-white">Password</Label>
          <div className="mt-1.5 flex items-center gap-2 rounded-full border border-white/15 bg-[#0E0E0E] px-4">
            <Input
              id="pw"
              type={showPw ? "text" : "password"}
              data-testid="admin-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Enter admin password"
              className="border-0 bg-transparent text-white shadow-none focus-visible:ring-0"
            />
            <button onClick={() => setShowPw((v) => !v)} className="text-[#8A8F95] hover:text-white" data-testid="toggle-password-visibility">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={login}
            disabled={authLoading}
            data-testid="admin-login-button"
            className="mt-5 w-full rounded-full bg-[#E01E26] py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-70"
          >
            {authLoading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] pb-20">
      <header className="border-b border-[#E2E4E7] bg-[#0E0E0E]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative block h-9 w-9 overflow-hidden rounded-full bg-black">
              <img src="/logo-icon.png" alt="" className="h-9 w-9 scale-[1.6] object-contain" />
            </span>
            <span className="font-serif text-xl font-semibold text-white">Fork·Fate Admin</span>
          </div>
          <button
            onClick={logout}
            data-testid="admin-logout-button"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 pt-8 md:grid-cols-[360px_1fr]">
        {/* Pending community submissions */}
        <section className="md:col-span-2" data-testid="submissions-queue">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#E01E26]" />
            <h2 className="font-serif text-xl text-[#0E0E0E]">Pending submissions</h2>
            {submissions.length > 0 && (
              <span data-testid="pending-count-badge" className="rounded-full bg-[#E01E26] px-2.5 py-0.5 text-xs font-bold text-white">{submissions.length}</span>
            )}
          </div>
          <p className="mt-1 font-sans text-sm text-[#6B7075]">Community-added spots awaiting review. Approve to add them to the roulette pool, or reject to discard.</p>
          <div className="mt-4 space-y-3" data-testid="submissions-list">
            {submissions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D5D8DC] bg-white p-6 text-center font-sans text-sm text-[#6B7075]">
                No pending submissions — you're all caught up.
              </div>
            )}
            {submissions.map((r) => (
              <div key={r.id} data-testid={`submission-row-${r.id}`} className="flex items-center gap-4 rounded-2xl border border-[#E2E4E7] bg-white p-3">
                <img src={r.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <span className="truncate font-serif text-lg text-[#0E0E0E]">{r.name}</span>
                  <p className="font-sans text-xs text-[#6B7075]">
                    {r.category} · {r.cuisine} · {r.price}
                    {r.address ? ` · ${r.address}` : ""}
                  </p>
                  {r.description && <p className="mt-0.5 truncate font-sans text-xs text-[#8A8F95]">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveSubmission(r)}
                    data-testid={`submission-approve-${r.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0E0E] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A]"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => rejectSubmission(r)}
                    data-testid={`submission-reject-${r.id}`}
                    className="rounded-full p-2 text-[#6B7075] transition-colors hover:bg-[#FCF4F4] hover:text-[#E01E26]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add sponsor */}
        <section className="h-fit rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="add-sponsor-form">
          <h2 className="font-serif text-xl text-[#0E0E0E]">Add a sponsor</h2>
          <p className="mt-1 font-sans text-sm text-[#6B7075]">Sponsored spots are pinned to the top of every matching search with a badge.</p>
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Business name</Label>
              <Input id="s-name" data-testid="sponsor-name-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Olive & Ember" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger data-testid="sponsor-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Select value={form.price} onValueChange={(v) => set("price", v)}>
                  <SelectTrigger data-testid="sponsor-price-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cuisine">Cuisine / type</Label>
              <Input id="s-cuisine" data-testid="sponsor-cuisine-input" value={form.cuisine} onChange={(e) => set("cuisine", e.target.value)} placeholder="e.g. Italian, Cocktails, Ice Cream" />
              <p className="text-xs text-[#8A8F95]">Tip: match a cuisine chip name so it shows when that filter is on.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-addr">Address</Label>
              <Input id="s-addr" data-testid="sponsor-address-input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-img">Image URL <span className="text-[#B8BCC2]">(optional)</span></Label>
              <Input id="s-img" data-testid="sponsor-image-input" value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea id="s-desc" data-testid="sponsor-description-input" value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Short tagline shown on the card" />
            </div>
            <button
              onClick={addSponsor}
              disabled={saving}
              data-testid="add-sponsor-button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] py-3 text-sm font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-70"
            >
              <Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add sponsor"}
            </button>
          </div>
        </section>

        {/* Sponsor list */}
        <section>
          <h2 className="font-serif text-xl text-[#0E0E0E]">Current sponsors ({sponsors.length})</h2>
          <div className="mt-4 space-y-3" data-testid="sponsor-list">
            {sponsors.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#D5D8DC] bg-white p-8 text-center font-sans text-sm text-[#6B7075]">
                No sponsors yet. Add your first paying customer on the left.
              </div>
            )}
            {sponsors.map((s) => (
              <div key={s.id} data-testid={`sponsor-row-${s.id}`} className="flex items-center gap-4 rounded-2xl border border-[#E2E4E7] bg-white p-3">
                <img src={s.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-lg text-[#0E0E0E]">{s.name}</span>
                    {!s.active && <span className="rounded-full bg-[#EDEEF0] px-2 py-0.5 text-xs font-bold text-[#6B7075]">Paused</span>}
                  </div>
                  <p className="font-sans text-xs text-[#6B7075]">
                    {s.category} · {s.cuisine} · {s.price}
                    <span className="ml-2 inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{Number(s.rating).toFixed(1)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} data-testid={`sponsor-active-toggle-${s.id}`} />
                    <span className="font-sans text-xs font-semibold text-[#6B7075]">{s.active ? "Live" : "Off"}</span>
                  </div>
                  <button onClick={() => remove(s)} data-testid={`sponsor-delete-${s.id}`} className="rounded-full p-2 text-[#6B7075] transition-colors hover:bg-[#FCF4F4] hover:text-[#E01E26]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
