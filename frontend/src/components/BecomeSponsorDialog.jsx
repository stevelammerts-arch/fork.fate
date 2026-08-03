import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Megaphone, Loader2, Store, ArrowRight, Upload, Image as ImageIcon, Ticket } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLang } from "../i18n/i18n";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMAIL = "steve@fork-fate.com";
// Must cover every tab a sponsor could appear under, since sponsored results are
// injected into the matching category's shuffle. "fuel" was missing before Explore/Stay
// were added, so a gas station could never buy placement at all.
const CATEGORIES = ["food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay"];
const PRICES = ["$", "$$", "$$$", "$$$$"];
const EMPTY = { name: "", category: "food", cuisine: "", price: "$$", address: "", website: "", image: "", contact_email: "" };
const EMPTY_COUPON = { code: "", description: "", terms: "" };

export default function BecomeSponsorDialog({ variant = "primary", open: openProp, onOpenChange, hideTrigger = false, tier = "local" }) {
  const [openState, setOpenState] = useState(false);
  const { t } = useLang();
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const setOpen = (v) => { if (isControlled) onOpenChange?.(v); else setOpenState(v); };
  const [form, setForm] = useState(EMPTY);
  const [coupon, setCoupon] = useState(EMPTY_COUPON);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("monthly");
  const [uploading, setUploading] = useState(false);
  // Tier is switchable in-dialog so every prospect sees both offerings;
  // the prop only sets which one is preselected (e.g. /sponsor/chains).
  const [tierState, setTierState] = useState(tier);
  const chain = tierState === "chain_coupon_only";
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setC = (k, v) => setCoupon((c) => ({ ...c, [k]: v }));

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("Please upload a JPG, PNG or WEBP image"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("Image too large (max 5 MB)"));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await axios.post(`${API}/sponsors/upload-photo`, fd);
      set("image", `${API}/files/${data.path}`);
      toast.success(t("Photo uploaded"));
    } catch (e) {
      toast.error(e.response?.data?.detail || t("Upload failed, please try again"));
    } finally {
      setUploading(false);
    }
  };

  const subscribe = async () => {
    if (!form.name.trim() || !form.cuisine.trim() || !form.contact_email.trim()) {
      toast.error(t("Business name, cuisine/type and email are required"));
      return;
    }
    if (chain && (!coupon.code.trim() || !coupon.description.trim())) {
      toast.error(t("Chain sponsorships require a coupon code and offer description"));
      return;
    }
    // Local coupons are optional (FREE founder perk) — but if a code is
    // entered it needs a description so the offer can actually render.
    if (!chain && coupon.code.trim() && !coupon.description.trim()) {
      toast.error(t("Add a short offer description for your coupon"));
      return;
    }
    const includeCoupon = chain || !!coupon.code.trim();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/sponsors/subscribe`, {
        ...form,
        plan,
        tier: tierState,
        coupon: includeCoupon ? { code: coupon.code.trim(), description: coupon.description.trim(), terms: coupon.terms.trim(), discount_type: "custom" } : undefined,
        origin: window.location.origin,
      });
      window.location.href = data.approval_url;
    } catch (e) {
      const detail = e.response?.data?.detail || t("Could not start checkout");
      toast.error(typeof detail === "string" ? detail : t("Could not start checkout"));
      setLoading(false);
    }
  };

  const triggers = {
    primary: (
      <button
        data-testid="become-sponsor-button"
        className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-5 py-2.5 font-sans text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A]"
      >
        <Megaphone className="h-4 w-4" /> {t("Become a sponsor")}
      </button>
    ),
    link: (
      <button
        data-testid="header-sponsor-link"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-transparent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        <Store className="h-4 w-4 text-[#E01E26]" /> {t("Sponsor your spot")}
      </button>
    ),
    card: (
      <button
        data-testid="featured-sponsor-cta"
        className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#E01E26]/40 bg-[#FCF4F4] p-4 text-left transition-colors hover:bg-[#F9E9E9]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E01E26] text-white">
          <Store className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-lg font-medium leading-tight text-[#0E0E0E]">{t("Own a spot like this?")}</span>
          <span className="block font-sans text-sm text-[#6B7075]">{t("Get featured on every matching shuffle — first month free.")}</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-[#E01E26] transition-transform group-hover:translate-x-1" />
      </button>
    ),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {triggers[variant] || triggers.primary}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-[#E2E4E7] bg-white sm:max-w-md" data-testid="sponsor-dialog" data-ff-dialog>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#0E0E0E]">
            {chain ? t("Chain sponsorship on Fork·Fate") : t("Sponsor your spot on Fork·Fate")}
          </DialogTitle>
          <DialogDescription className="text-[#6B7075]">
            {chain
              ? t("Your coupon appears beside the winning local spot on matching reveals — every single spin.")
              : t("Get pinned to the top of every matching shuffle with a Sponsored badge.")}
          </DialogDescription>
        </DialogHeader>

        {/* Tier picker: every prospect sees both the local and chain-coupon offers */}
        <div className="grid grid-cols-2 gap-2" data-testid="sponsor-tier-picker">
          <button
            type="button"
            onClick={() => setTierState("local")}
            data-testid="sponsor-tier-local"
            aria-pressed={!chain}
            className={`rounded-2xl border p-3 text-left transition-colors ${!chain ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
          >
            <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-[#0E0E0E]"><Store className="h-3.5 w-3.5 text-[#E01E26]" /> {t("Local spot")}</span>
            <span className="mt-0.5 block font-serif text-lg font-semibold text-[#0E0E0E]">$19<span className="text-xs font-normal text-[#6B7075]">/{t("mo")}</span></span>
            <span className="block font-sans text-[10px] leading-tight text-[#6B7075]">{t("Pinned in matching shuffles")} · <span className="font-bold text-[#2F8F46]">{t("+ FREE coupon")}</span></span>
          </button>
          <button
            type="button"
            onClick={() => setTierState("chain_coupon_only")}
            data-testid="sponsor-tier-chain"
            aria-pressed={chain}
            className={`rounded-2xl border p-3 text-left transition-colors ${chain ? "border-[#E6B23A] bg-[#E6B23A]/10 ring-1 ring-[#E6B23A]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
          >
            <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-[#0E0E0E]"><Ticket className="h-3.5 w-3.5 text-[#B8860B]" /> {t("Chain coupon")}</span>
            <span className="mt-0.5 block font-serif text-lg font-semibold text-[#0E0E0E]">$99<span className="text-xs font-normal text-[#6B7075]">/{t("mo")}</span></span>
            <span className="block font-sans text-[10px] leading-tight text-[#6B7075]">{t("Your coupon on every matching reveal")}</span>
          </button>
        </div>
        {chain && (
          <Link
            to="/sponsor/chains"
            onClick={() => setOpen(false)}
            data-testid="sponsor-chain-learn-more"
            className="-mt-1 text-center font-sans text-xs font-bold text-[#B8860B] underline underline-offset-2 hover:text-[#8A6D1F]"
          >
            {t("See how chain coupons work")} →
          </Link>
        )}

        {chain ? (
          <>
            <div className="grid grid-cols-2 gap-2" data-testid="sponsor-plan-toggle">
              <button
                type="button"
                onClick={() => setPlan("monthly")}
                data-testid="sponsor-plan-monthly"
                aria-pressed={plan === "monthly"}
                className={`relative rounded-2xl border p-4 text-center transition-colors ${plan === "monthly" ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
              >
                <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#6B7075]">{t("Monthly")}</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#0E0E0E]">$99<span className="text-sm text-[#6B7075]">/{t("mo")}</span></p>
                <p className="mt-1 font-sans text-[11px] font-semibold text-[#6B7075]">{t("Cancel anytime")}</p>
              </button>
              <button
                type="button"
                onClick={() => setPlan("yearly")}
                data-testid="sponsor-plan-yearly"
                aria-pressed={plan === "yearly"}
                className={`relative rounded-2xl border p-4 text-center transition-colors ${plan === "yearly" ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-[#E01E26] px-2 py-0.5 font-sans text-[10px] font-bold text-white" data-testid="sponsor-yearly-savings">{t("2 months free")}</span>
                <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#6B7075]">{t("Yearly")}</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#0E0E0E]">$990<span className="text-sm text-[#6B7075]">/{t("yr")}</span></p>
                <p className="mt-1 font-sans text-[11px] font-semibold text-[#6B7075]">{t("Billed annually")}</p>
              </button>
            </div>
            <p className="text-center font-sans text-xs text-[#8A8F95]" data-testid="sponsor-plan-note">
              {plan === "yearly" ? t("Billed $990 today, then annually · cancel anytime") : t("$99/month · cancel anytime")}
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2" data-testid="sponsor-plan-toggle">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            data-testid="sponsor-plan-monthly"
            aria-pressed={plan === "monthly"}
            className={`relative rounded-2xl border p-4 text-center transition-colors ${plan === "monthly" ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
          >
            <span className="absolute -top-2 left-2 rounded-full bg-[#E6B23A] px-2 py-0.5 font-sans text-[10px] font-bold text-black" data-testid="sponsor-monthly-founder">{t("Founder")}</span>
            <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#6B7075]">{t("Monthly")}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#0E0E0E]">$19<span className="text-sm text-[#6B7075]">/{t("mo")}</span> <span className="ml-1 align-middle text-xs text-[#8A8F95] line-through">$29</span></p>
            <p className="mt-1 font-sans text-[11px] font-semibold text-[#E01E26]">{t("First month FREE")}</p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("yearly")}
            data-testid="sponsor-plan-yearly"
            aria-pressed={plan === "yearly"}
            className={`relative rounded-2xl border p-4 text-center transition-colors ${plan === "yearly" ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
          >
            <span className="absolute -top-2 right-2 rounded-full bg-[#E01E26] px-2 py-0.5 font-sans text-[10px] font-bold text-white" data-testid="sponsor-yearly-savings">{t("Save $38/yr")}</span>
            <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#6B7075]">{t("Yearly")}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#0E0E0E]">$190<span className="text-sm text-[#6B7075]">/{t("yr")}</span> <span className="ml-1 align-middle text-xs text-[#8A8F95] line-through">$290</span></p>
            <p className="mt-1 font-sans text-[11px] font-semibold text-[#E01E26]">{t("2 months free")}</p>
          </button>
        </div>
        <p className="text-center font-sans text-xs text-[#8A8F95]" data-testid="sponsor-plan-note">
          {plan === "yearly" ? t("Billed $190 today, then annually · cancel anytime") : t("Free first month, then $19/month · cancel anytime")}
        </p>
          </>
        )}

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">{t("Business name *")}</Label>
            <Input id="sp-name" data-testid="sponsor-form-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={chain ? "e.g. Burrito Bandito (National)" : "e.g. Olive & Ember"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("Category")}</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger data-testid="sponsor-form-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(c[0].toUpperCase() + c.slice(1))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Price")}</Label>
              <Select value={form.price} onValueChange={(v) => set("price", v)}>
                <SelectTrigger data-testid="sponsor-form-price"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-cuisine">{t("Cuisine / type *")}</Label>
            <Input id="sp-cuisine" data-testid="sponsor-form-cuisine" value={form.cuisine} onChange={(e) => set("cuisine", e.target.value)} placeholder="e.g. Italian, Cocktails, Ice Cream" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-addr">{t("Address")}</Label>
            <Input id="sp-addr" data-testid="sponsor-form-address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-web">{t("Website / Instagram")} <span className="text-[#B8BCC2]">{t("(optional)")}</span></Label>
            <Input id="sp-web" data-testid="sponsor-form-website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Business photo")} <span className="text-[#B8BCC2]">{t("(optional, recommended)")}</span></Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E2E4E7] bg-[#F5F6F7]">
                {form.image
                  ? <img src={form.image} alt="" className="h-full w-full object-cover" data-testid="sponsor-photo-preview" />
                  : <div className="grid h-full w-full place-items-center text-[#B9AC95]"><ImageIcon className="h-6 w-6" /></div>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  data-testid="sponsor-photo-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#0E0E0E] px-3 py-1.5 text-xs font-bold text-[#0E0E0E] transition-colors hover:bg-[#0E0E0E] hover:text-white"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? t("Uploading…") : (form.image ? t("Replace photo") : t("Upload photo"))}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading}
                    onChange={(e) => { uploadPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                {form.image && (
                  <button type="button" data-testid="sponsor-photo-remove" onClick={() => set("image", "")}
                    className="text-left text-[11px] font-semibold text-[#B3141A] hover:underline">
                    {t("Remove photo")}
                  </button>
                )}
              </div>
            </div>
            <Input id="sp-img" data-testid="sponsor-form-image" value={form.image} onChange={(e) => set("image", e.target.value)} placeholder={t("…or paste an image URL")} className="text-xs" />
            <p className="text-[11px] text-[#8A8F95]">{t("No photo? We'll show a tasteful image matched to your cuisine.")}</p>
          </div>
          {chain ? (
            <div className="space-y-3 rounded-2xl border border-[#E6B23A]/50 bg-[#FDF8EC] p-3" data-testid="sponsor-coupon-section">
              <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#8A6D1F]">{t("Your coupon offer *")}</p>
              <div className="space-y-1.5">
                <Label htmlFor="sp-coupon-code">{t("Coupon code *")}</Label>
                <Input id="sp-coupon-code" data-testid="sponsor-coupon-code" value={coupon.code} onChange={(e) => setC("code", e.target.value.toUpperCase())} placeholder="e.g. FORKFATE20" maxLength={32} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-coupon-desc">{t("Offer description *")}</Label>
                <Input id="sp-coupon-desc" data-testid="sponsor-coupon-description" value={coupon.description} onChange={(e) => setC("description", e.target.value)} placeholder={t("e.g. 20% off any combo meal")} maxLength={140} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-coupon-terms">{t("Terms")} <span className="text-[#B8BCC2]">{t("(optional)")}</span></Label>
                <Input id="sp-coupon-terms" data-testid="sponsor-coupon-terms" value={coupon.terms} onChange={(e) => setC("terms", e.target.value)} placeholder={t("e.g. One per customer, participating locations")} maxLength={500} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-[#4F9F62]/50 bg-[#F0F9F1] p-3" data-testid="sponsor-local-coupon-section">
              <p className="flex flex-wrap items-center gap-2 font-sans text-xs font-bold uppercase tracking-wide text-[#2F6E3E]">
                {t("Add a coupon offer")}
                <span className="rounded-full bg-[#2F8F46] px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-white" data-testid="local-coupon-free-badge">{t("FREE — founder perk")}</span>
              </p>
              <p className="font-sans text-[11px] leading-snug text-[#4A6B52]">
                {t("Optional: your deal shows on your winning card and rides beside matching reveals nearby — included free while we're in our founder period.")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="sp-coupon-code">{t("Coupon code")}</Label>
                <Input id="sp-coupon-code" data-testid="sponsor-coupon-code" value={coupon.code} onChange={(e) => setC("code", e.target.value.toUpperCase())} placeholder="e.g. FORKFATE20" maxLength={32} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-coupon-desc">{t("Offer description")}</Label>
                <Input id="sp-coupon-desc" data-testid="sponsor-coupon-description" value={coupon.description} onChange={(e) => setC("description", e.target.value)} placeholder={t("e.g. 20% off any combo meal")} maxLength={140} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-coupon-terms">{t("Terms")} <span className="text-[#B8BCC2]">{t("(optional)")}</span></Label>
                <Input id="sp-coupon-terms" data-testid="sponsor-coupon-terms" value={coupon.terms} onChange={(e) => setC("terms", e.target.value)} placeholder={t("e.g. One per customer, participating locations")} maxLength={500} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="sp-email">{t("Contact email *")}</Label>
            <Input id="sp-email" type="email" data-testid="sponsor-form-email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="you@business.com" />
          </div>

          <button
            onClick={subscribe}
            disabled={loading}
            data-testid="sponsor-subscribe-button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0070BA] px-5 py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#005a99] disabled:opacity-70"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("Redirecting to PayPal…")}</> : <>{t("Subscribe with PayPal")}</>}
          </button>
          <p className="text-center font-sans text-xs text-[#8A8F95]">
            {t("Secure checkout on PayPal. Your spot goes live automatically once your subscription is confirmed.")}{" "}
            {t("Prefer to talk first?")} <a href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Sponsorship`} data-testid="sponsor-email-fallback" className="font-bold text-[#E01E26] underline underline-offset-2 hover:text-[#0E0E0E]">{t("Email us")}</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
