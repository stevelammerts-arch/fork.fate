import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, ArrowLeft, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SponsorStatus({ cancelled = false }) {
  const [params] = useSearchParams();
  const subscriptionId = params.get("subscription_id");
  const [status, setStatus] = useState(cancelled ? "cancelled" : "checking");
  const [name, setName] = useState("");

  useEffect(() => {
    if (cancelled || !subscriptionId) {
      if (!subscriptionId && !cancelled) setStatus("pending");
      return;
    }
    let tries = 0;
    let timer;
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/sponsors/subscription-status`, { params: { subscription_id: subscriptionId } });
        if (data.found) {
          setName(data.name || "");
          if (data.active) { setStatus("active"); return; }
        }
      } catch (e) {
        console.debug("status poll failed", e);
      }
      tries += 1;
      if (tries < 6) timer = setTimeout(poll, 2500);
      else setStatus("pending");
    };
    poll();
    return () => clearTimeout(timer);
  }, [subscriptionId, cancelled]);

  const config = {
    checking: { icon: Loader2, spin: true, color: "#0070BA", title: "Confirming your subscription…", body: "Hang tight while PayPal confirms your payment. This usually takes a few seconds." },
    active: { icon: CheckCircle2, color: "#1DA35A", title: "You're live! 🎉", body: `${name || "Your spot"} is now a Fork·Fate sponsor — pinned to the top of every matching shuffle with a Sponsored badge. We'll email you your receipt.` },
    pending: { icon: Clock, color: "#E01E26", title: "Almost there", body: "Your subscription is being processed. Your spot will go live automatically as soon as PayPal confirms the first payment — no further action needed." },
    cancelled: { icon: XCircle, color: "#6B7075", title: "Checkout cancelled", body: "No charge was made. You can start your sponsorship anytime from the homepage." },
  }[status];

  const Icon = config.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] p-8 text-center" data-testid="sponsor-status-card">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ backgroundColor: `${config.color}1A` }}>
          <Icon className={`h-8 w-8 ${config.spin ? "animate-spin" : ""}`} style={{ color: config.color }} />
        </span>
        <h1 className="mt-5 font-serif text-3xl text-white" data-testid="sponsor-status-title">{config.title}</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#B8BCC2]">{config.body}</p>
        <Link
          to="/"
          data-testid="sponsor-status-home-link"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-6 py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Fork·Fate
        </Link>
      </div>
    </div>
  );
}
