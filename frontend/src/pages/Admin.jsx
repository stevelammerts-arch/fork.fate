import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { LogOut, Fingerprint } from "lucide-react";
import { AdminLogin } from "../components/admin/AdminLogin";
import { StatsPanel } from "../components/admin/StatsPanel";
import { BetaTesters } from "../components/admin/BetaTesters";
import { MerchInterest } from "../components/admin/MerchInterest";
import { SubmissionsQueue } from "../components/admin/SubmissionsQueue";
import { SponsorForm } from "../components/admin/SponsorForm";
import { SponsorList } from "../components/admin/SponsorList";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
// Admin session lives in an HttpOnly cookie set by the backend; send it on every request.
const WC = { withCredentials: true };
const EMPTY = { name: "", cuisine: "", price: "$$", category: "food", address: "", description: "", image: "", active: true };

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [stats, setStats] = useState(null);
  const [cost, setCost] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [betaTesters, setBetaTesters] = useState([]);
  const [merch, setMerch] = useState({ signups: [], count: 0, by_design: {} });
  const [optInLink, setOptInLink] = useState(() => {
    try { return localStorage.getItem("ff_optin_link") || "https://play.google.com/apps/testing/com.fork_fate.twa"; }
    catch (e) { return "https://play.google.com/apps/testing/com.fork_fate.twa"; }
  });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [passkeyAvail, setPasskeyAvail] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [emailing, setEmailing] = useState(false);

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

  const logout = useCallback(async () => {
    try { await axios.post(`${API}/admin/logout`, {}, WC); } catch (e) { /* ignore */ }
    setAuthed(false);
    setSponsors([]);
    setSubmissions([]);
  }, []);

  const loadSponsors = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/sponsors`, WC);
      setSponsors(data);
    } catch (e) {
      if (e.response?.status === 401) {
        toast.error("Session expired, please log in again");
        logout();
      }
    }
  }, [logout]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/sponsors/stats`, WC);
      setStats(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [logout]);

  const loadCost = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/cost-status`, WC);
      setCost(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [logout]);

  const loadSubmissions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/submissions`, WC);
      setSubmissions(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [logout]);

  const deleteBeta = async (email) => {
    try {
      await axios.delete(`${API}/admin/beta-testers`, { params: { email }, ...WC });
      setBetaTesters((prev) => prev.filter((x) => x.email !== email));
      toast.success("Tester removed");
    } catch (e) {
      toast.error("Could not remove tester");
    }
  };

  const loadBeta = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/beta-testers`, WC);
      setBetaTesters(data.testers || []);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [logout]);

  const loadMerch = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/merch-interest`, WC);
      setMerch(data || { signups: [], count: 0, by_design: {} });
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  }, [logout]);

  // Check for an existing admin session (HttpOnly cookie) on mount.
  useEffect(() => {
    axios.get(`${API}/admin/verify`, WC)
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (authed) { loadSponsors(); loadSubmissions(); loadStats(); loadCost(); loadBeta(); loadMerch(); }
  }, [authed, loadSponsors, loadSubmissions, loadStats, loadCost, loadBeta, loadMerch]);

  // Show the passkey button on the login screen only when one is registered.
  useEffect(() => {
    if (authed) return;
    axios.get(`${API}/auth/passkey/available`)
      .then(({ data }) => setPasskeyAvail(!!data.available))
      .catch(() => setPasskeyAvail(false));
  }, [authed]);

  // Load passkey registration status once logged in.
  useEffect(() => {
    if (!authed) return;
    axios.get(`${API}/admin/passkey/status`, WC)
      .then(({ data }) => setPasskeyRegistered(!!data.registered))
      .catch(() => {});
  }, [authed]);

  const loginWithPasskey = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      const { data: optionsJSON } = await axios.get(`${API}/auth/passkey/login-options`);
      const asseResp = await startAuthentication({ optionsJSON });
      await axios.post(`${API}/auth/passkey/login-verify`, { response: asseResp }, WC);
      setAuthed(true);
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
      const { data: optionsJSON } = await axios.get(`${API}/admin/passkey/register-options`, WC);
      const attResp = await startRegistration({ optionsJSON });
      await axios.post(`${API}/admin/passkey/register-verify`, { response: attResp }, WC);
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
      await axios.delete(`${API}/admin/passkey`, WC);
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
      await axios.post(`${API}/admin/login`, { password }, WC);
      setAuthed(true);
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
      await axios.post(`${API}/admin/sponsors`, form, WC);
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
      await axios.patch(`${API}/admin/sponsors/${s.id}`, { active: !s.active }, WC);
      loadSponsors();
      loadStats();
    } catch {
      toast.error("Could not update");
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.name} from sponsors?`)) return;
    try {
      await axios.delete(`${API}/admin/sponsors/${s.id}`, WC);
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
      await axios.post(`${API}/admin/email-summary`, {}, WC);
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

  const approveSubmission = async (r) => {
    try {
      await axios.post(`${API}/admin/submissions/${r.id}/approve`, {}, WC);
      toast.success(`${r.name} approved — now live in the pool`);
      loadSubmissions();
    } catch {
      toast.error("Could not approve");
    }
  };

  const rejectSubmission = async (r) => {
    if (!window.confirm(`Reject and delete "${r.name}"?`)) return;
    try {
      await axios.delete(`${API}/admin/submissions/${r.id}`, WC);
      toast.success("Submission rejected");
      loadSubmissions();
    } catch {
      toast.error("Could not reject");
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0E0E]" data-testid="admin-checking">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#E01E26]" />
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLogin
        password={password}
        setPassword={setPassword}
        showPw={showPw}
        setShowPw={setShowPw}
        authLoading={authLoading}
        login={login}
        passkeyAvail={passkeyAvail}
        passkeyBusy={passkeyBusy}
        loginWithPasskey={loginWithPasskey}
      />
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
        <StatsPanel stats={stats} cost={cost} emailing={emailing} sendSummaryEmail={sendSummaryEmail} />
        <BetaTesters
          betaTesters={betaTesters}
          optInLink={optInLink}
          setOptInLink={setOptInLink}
          emailAllTesters={emailAllTesters}
          deleteBeta={deleteBeta}
        />
        <SubmissionsQueue submissions={submissions} approveSubmission={approveSubmission} rejectSubmission={rejectSubmission} />
        <MerchInterest data={merch} />
        <SponsorForm form={form} set={set} saving={saving} addSponsor={addSponsor} />
        <SponsorList sponsors={sponsors} toggleActive={toggleActive} remove={remove} />
      </main>
    </div>
  );
}
