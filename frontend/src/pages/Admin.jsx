import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { Lock, Plus, Trash2, LogOut, Star, Eye, EyeOff, Check, X, Clock, MousePointerClick, Fingerprint, Gauge, ShieldCheck, Mail } from "lucide-react";
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
  const [stats, setStats] = useState(null);
  const [cost, setCost] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [betaTesters, setBetaTesters] = useState([]);
  const [optInLink, setOptInLink] = useState(() => {
    try { return localStorage.getItem("ff_optin_link") || "https://play.google.com/apps/testing/com.fork_fate.twa"; }
    catch (e) { return "https://play.google.com/apps/testing/com.fork_fate.twa"; }
  });

  const emailAllTesters = () => {
    if (betaTesters.length === 0) return;
    const bcc = betaTesters.map((x) => x.email).join(",");
    const subject = "You're invited to test Fork·Fate on Android 🎲";
    const body =
      "Hi! Thanks for signing up to test Fork·Fate on Android.\n\n" +
      "To join (takes ~1 min):\n" +
      "1) Open this link on your Android phone: " + optInLink + "\n" +
      "2) Tap \"Become a tester,\" then install Fork·Fate from Google Play\n" +
      "3) Please keep it installed for ~2 weeks — that's what unlocks our public launch!\n\n" +
      "Shuffle the deck and let fate pick your next spot. Thanks so much for the help! 🙏\n\n— Fork·Fate";
    window.location.href =
      `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [passkeyAvail, setPasskeyAvail] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [emailing, setEmailing] = useState(false);

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

  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/sponsors/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [token, logout]);

  const loadCost = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/cost-status`, { headers: { Authorization: `Bearer ${token}` } });
      setCost(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
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

  const deleteBeta = async (email) => {
    try {
      await axios.delete(`${API}/admin/beta-testers`, { params: { email }, headers: { Authorization: `Bearer ${token}` } });
      setBetaTesters((prev) => prev.filter((x) => x.email !== email));
      toast.success("Tester removed");
    } catch (e) {
      toast.error("Could not remove tester");
    }
  };

  const loadBeta = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/beta-testers`, { headers: { Authorization: `Bearer ${token}` } });
      setBetaTesters(data.testers || []);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) { loadSponsors(); loadSubmissions(); loadStats(); loadCost(); loadBeta(); }
  }, [token, loadSponsors, loadSubmissions, loadStats, loadCost, loadBeta]);

  // Show the passkey button on the login screen only when one is registered.
  useEffect(() => {
    if (token) return;
    axios.get(`${API}/auth/passkey/available`)
      .then(({ data }) => setPasskeyAvail(!!data.available))
      .catch(() => setPasskeyAvail(false));
  }, [token]);

  // Load passkey registration status once logged in.
  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/admin/passkey/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setPasskeyRegistered(!!data.registered))
      .catch(() => {});
  }, [token]);

  const loginWithPasskey = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      const { data: optionsJSON } = await axios.get(`${API}/auth/passkey/login-options`);
      const asseResp = await startAuthentication({ optionsJSON });
      const { data } = await axios.post(`${API}/auth/passkey/login-verify`, { response: asseResp });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      toast.success("Unlocked with passkey");
    } catch (e) {
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") return; // user cancelled
      toast.error(e.response?.data?.detail || "Passkey login failed");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const registerPasskey = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      const { data: optionsJSON } = await axios.get(`${API}/admin/passkey/register-options`, { headers: { Authorization: `Bearer ${token}` } });
      const attResp = await startRegistration({ optionsJSON });
      await axios.post(`${API}/admin/passkey/register-verify`, { response: attResp }, { headers: { Authorization: `Bearer ${token}` } });
      setPasskeyRegistered(true);
      toast.success("Passkey saved — use your fingerprint or Face ID next time");
    } catch (e) {
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") return;
      toast.error(e.response?.data?.detail || "Couldn't register passkey");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const removePasskey = async () => {
    if (!window.confirm("Remove the saved passkey from this admin account?")) return;
    try {
      await axios.delete(`${API}/admin/passkey`, { headers: { Authorization: `Bearer ${token}` } });
      setPasskeyRegistered(false);
      toast.success("Passkey removed");
    } catch {
      toast.error("Couldn't remove passkey");
    }
  };

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
      loadStats();
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
      loadStats();
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
      loadStats();
    } catch {
      toast.error("Could not remove");
    }
  };

  const sendSummaryEmail = async () => {
    setEmailing(true);
    try {
      await axios.post(`${API}/admin/email-summary`, {}, authHeaders);
      toast.success("Sponsor summary email sent");
    } catch (e) {
      toast.error(
        e.response?.data?.detail === "email-not-configured-or-failed"
          ? "Email not configured — check Resend keys"
          : "Could not send summary email"
      );
    } finally {
      setEmailing(false);
    }
  };

  const approveSubmission = async (r) => {    try {
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
          {passkeyAvail && (
            <>
              <div className="relative my-5 text-center">
                <span className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
                <span className="relative bg-[#141414] px-3 text-xs font-semibold uppercase tracking-widest text-[#6B7075]">or</span>
              </div>
              <button
                onClick={loginWithPasskey}
                disabled={passkeyBusy}
                data-testid="admin-passkey-login-button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                <Fingerprint className="h-4 w-4" /> {passkeyBusy ? "Waiting for device…" : "Unlock with fingerprint / Face ID"}
              </button>
            </>
          )}
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
              <img src="/logo-mark.png" alt="" className="h-9 w-9 scale-110 object-contain" />
            </span>
            <span className="font-serif text-xl font-semibold text-white">Fork·Fate Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={passkeyRegistered ? removePasskey : registerPasskey}
              disabled={passkeyBusy}
              data-testid="admin-passkey-manage-button"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${passkeyRegistered ? "border-[#4ADE80]/40 text-[#4ADE80] hover:bg-[#4ADE80]/10" : "border-white/25 text-white hover:bg-white/10"}`}
            >
              <Fingerprint className="h-4 w-4" />
              {passkeyBusy ? "Working…" : passkeyRegistered ? "Passkey on" : "Add passkey"}
            </button>
            <button
              onClick={logout}
              data-testid="admin-logout-button"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 pt-8 md:grid-cols-[360px_1fr]">
        {/* Revenue / subscriber overview */}
        <section className="md:col-span-2" data-testid="mrr-overview">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E4E7] bg-[#0E0E0E] p-5 text-white" data-testid="stat-mrr">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#E01E26]">MRR</p>
              <p className="mt-1 font-serif text-3xl font-semibold" data-testid="stat-mrr-value">${(stats?.mrr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">${(stats?.arr ?? 0).toLocaleString()} / yr</p>
            </div>
            <div className="rounded-2xl border border-[#E2E4E7] bg-white p-5" data-testid="stat-subscribers">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Paying subs</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="stat-subscribers-value">{stats?.paying_subscribers ?? 0}</p>
              <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">${(stats?.price ?? 29).toFixed(0)}/mo each</p>
            </div>
            <div className="rounded-2xl border border-[#E2E4E7] bg-white p-5" data-testid="stat-active">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Active spots</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="stat-active-value">{stats?.active_sponsors ?? 0}</p>
              <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">of {stats?.total_sponsors ?? 0} total</p>
            </div>
            <div className="rounded-2xl border border-[#E2E4E7] bg-white p-5" data-testid="stat-engagement">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Engagement</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="stat-engagement-value">{(stats?.total_clicks ?? 0).toLocaleString()}</p>
              <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">clicks · {(stats?.total_impressions ?? 0).toLocaleString()} views</p>
            </div>
          </div>
        </section>

        {/* Security & cost — today's Google API usage vs the daily cap */}
        <section className="md:col-span-2" data-testid="cost-overview">
          {(() => {
            const used = cost?.used ?? 0;
            const cap = cost?.cap ?? 160;
            const pct = cost?.pct ?? (cap ? Math.round((used / cap) * 100) : 0);
            const warn = pct >= 90;
            const caution = pct >= 70 && pct < 90;
            const barColor = warn ? "#E01E26" : caution ? "#E0A21E" : "#22A559";
            const statusLabel = warn ? "Near cap" : caution ? "Watch" : "Healthy";
            return (
              <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="cost-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E0E0E]">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl text-[#0E0E0E]">Security &amp; cost</h2>
                      <p className="font-sans text-xs text-[#6B7075]">Live Google Places usage vs the daily safety cap</p>
                    </div>
                  </div>
                  <span
                    data-testid="cost-status-pill"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: `${barColor}1A`, color: barColor }}
                  >
                    <Gauge className="h-3.5 w-3.5" /> {statusLabel}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between">
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Today's searches</p>
                    <p className="font-sans text-xs text-[#8A8F95]" data-testid="cost-remaining">{cost?.remaining ?? cap} left</p>
                  </div>
                  <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]">
                    <span data-testid="cost-used">{used.toLocaleString()}</span>
                    <span className="text-lg text-[#8A8F95]"> / {cap.toLocaleString()}</span>
                  </p>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EDEEF0]">
                    <div
                      data-testid="cost-progress-bar"
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <p className="mt-1.5 font-sans text-xs text-[#8A8F95]" data-testid="cost-pct">{pct}% of daily cap used</p>
                </div>

                {cost?.history?.length > 1 && (
                  <div className="mt-5 border-t border-[#EDEEF0] pt-4" data-testid="cost-history">
                    <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Recent days</p>
                    <div className="space-y-1.5">
                      {cost.history.map((h) => (
                        <div key={h.date} className="flex items-center justify-between font-sans text-xs" data-testid={`cost-day-${h.date}`}>
                          <span className="text-[#6B7075]">{h.date}</span>
                          <span className="font-semibold text-[#0E0E0E]">{h.searches.toLocaleString()} searches</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDEEF0] pt-4" data-testid="sponsor-summary-email">
                  <div>
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Sponsor revenue summary</p>
                    <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">Auto-sent on the 1st monthly · send an up-to-the-minute digest now</p>
                  </div>
                  <button
                    onClick={sendSummaryEmail}
                    disabled={emailing}
                    data-testid="send-summary-email-button"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#0E0E0E] bg-[#0E0E0E] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:opacity-60"
                  >
                    <Mail className="h-4 w-4" /> {emailing ? "Sending…" : "Send summary now"}
                  </button>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Android beta testers */}
        <section className="md:col-span-2" data-testid="beta-testers-section">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl text-[#0E0E0E]">Android beta testers</h2>
            <span data-testid="beta-count-badge" className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${betaTesters.length >= 12 ? "bg-[#1AA85B]" : "bg-[#E01E26]"}`}>
              {betaTesters.length}/12
            </span>
            {betaTesters.length > 0 && (
              <button
                data-testid="copy-beta-emails-btn"
                onClick={() => {
                  navigator.clipboard?.writeText(betaTesters.map((x) => x.email).join(", "));
                  toast.success("All tester emails copied");
                }}
                className="ml-auto rounded-full border border-[#E2E4E7] bg-white px-3 py-1 text-xs font-bold text-[#0E0E0E] hover:bg-[#F5F6F7]"
              >
                Copy all emails
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-[#6B7075]">
            Paste these Gmail addresses into Play Console → Closed testing → Testers. You need 12+ for 14 days.
          </p>
          {betaTesters.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-[#E2E4E7] bg-[#FAFAFB] p-3 sm:flex-row sm:items-center">
              <input
                data-testid="optin-link-input"
                value={optInLink}
                onChange={(e) => { setOptInLink(e.target.value); try { localStorage.setItem("ff_optin_link", e.target.value); } catch (er) {} }}
                placeholder="Paste your Play opt-in link"
                className="min-w-0 flex-1 rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 text-xs text-[#0E0E0E] outline-none focus:ring-2 focus:ring-[#E01E26]/30"
              />
              <button
                data-testid="email-all-testers-btn"
                onClick={emailAllTesters}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3141A]"
              >
                <Mail className="h-3.5 w-3.5" /> Email all testers the invite
              </button>
            </div>
          )}
          <div className="mt-4 space-y-2" data-testid="beta-testers-list">
            {betaTesters.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[#E2E4E7] bg-white px-4 py-6 text-center text-sm text-[#6B7075]">
                No sign-ups yet — share the app so visitors can join the beta.
              </p>
            )}
            {betaTesters.map((x) => (
              <div key={x.email} className="flex items-center justify-between rounded-2xl border border-[#E2E4E7] bg-white px-4 py-2.5">
                <span className="font-mono text-sm text-[#0E0E0E]">{x.email}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#9AA0A6]">{(x.created_at || "").slice(0, 10)}</span>
                  <button
                    data-testid={`delete-beta-${x.email}`}
                    onClick={() => deleteBeta(x.email)}
                    aria-label="Remove tester"
                    className="rounded-full p-1.5 text-[#B01015] transition-colors hover:bg-[#FCE9EA]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

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
          {sponsors.length > 0 && (() => {
            const imp = sponsors.reduce((a, s) => a + (s.impressions || 0), 0);
            const clk = sponsors.reduce((a, s) => a + (s.clicks || 0), 0);
            const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) : "0.0";
            return (
              <div data-testid="sponsor-analytics-summary" className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#E2E4E7] bg-white px-3 py-2 text-center">
                  <p className="font-serif text-2xl text-[#0E0E0E]" data-testid="total-impressions">{imp.toLocaleString()}</p>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#6B7075]">Impressions</p>
                </div>
                <div className="rounded-xl border border-[#E2E4E7] bg-white px-3 py-2 text-center">
                  <p className="font-serif text-2xl text-[#0E0E0E]" data-testid="total-clicks">{clk.toLocaleString()}</p>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#6B7075]">Clicks</p>
                </div>
                <div className="rounded-xl border border-[#E2E4E7] bg-white px-3 py-2 text-center">
                  <p className="font-serif text-2xl text-[#E01E26]" data-testid="total-ctr">{ctr}%</p>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#6B7075]">CTR</p>
                </div>
              </div>
            );
          })()}
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
                  <div className="mt-1 flex items-center gap-3 font-sans text-xs text-[#6B7075]" data-testid={`sponsor-stats-${s.id}`}>
                    <span className="inline-flex items-center gap-1" title="Impressions"><Eye className="h-3.5 w-3.5" />{(s.impressions || 0).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1" title="Clicks"><MousePointerClick className="h-3.5 w-3.5" />{(s.clicks || 0).toLocaleString()}</span>
                    <span className="font-semibold text-[#E01E26]" title="Click-through rate">{(s.impressions || 0) > 0 ? (((s.clicks || 0) / s.impressions) * 100).toFixed(1) : "0.0"}% CTR</span>
                  </div>
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
