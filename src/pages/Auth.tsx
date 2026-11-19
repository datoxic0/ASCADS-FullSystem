import { useState } from "react";
import { Cpu, Loader2, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your inbox to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-200 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.4)]">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">ASCADS</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.25em]">Advanced EDA Suite</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {mode === "signin"
            ? "Access your synced projects across devices."
            : "Your projects sync securely to the cloud."}
        </p>

        <button
          onClick={google}
          disabled={busy}
          className="w-full mb-5 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-60 transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
            <path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38Z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4 text-[10px] text-slate-600 uppercase tracking-widest">
          <div className="flex-1 h-px bg-slate-800" />
          or
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                placeholder="Jane Doe"
              />
            </label>
          )}
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Email</span>
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-cyan-500 outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Password</span>
            <div className="mt-1 relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-cyan-500 outline-none"
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button className="text-cyan-400 hover:underline" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button className="text-cyan-400 hover:underline" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
