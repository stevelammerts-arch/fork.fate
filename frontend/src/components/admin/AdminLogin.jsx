import { Lock, Eye, EyeOff, Fingerprint } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AdminLogin({ password, setPassword, showPw, setShowPw, authLoading, login, passkeyAvail, passkeyBusy, loginWithPasskey }) {
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
