import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Megaphone, Loader2, Store, ArrowRight, Upload, Image as ImageIcon } from "lucide-react";
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
const EMAIL = "stevelammerts@gmail.com";
const CATEGORIES = ["food", "drinks", "bars", "desserts"];
const PRICES = ["$", "$$", "$$$", "$$$$"];
const EMPTY = { name: "", category: "food", cuisine: "", price: "$$", address: "", website: "", image: "", contact_email: "" };

export default function BecomeSponsorDialog({ variant = "primary", open: openProp, onOpenChange, hideTrigger = false }) {
  const [openState, setOpenState] = useState(false);
  const { t } = useLang();
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const setOpen = (v) => { if (isControlled) onOpenChange?.(v); else setOpenState(v); };
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("monthly");
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/sponsors/subscribe`, {
        ...form,
        plan,
        origin: window.location.origin,
      });
      window.location.href = data.approval_url;
    } catch (e) {
      const detail = e.response?.data?.detail || t("Could not start checkout");
      toast.error(detail);
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
          <DialogTitle className="font-serif text-2xl text-[#0E0E0E]">{t("Sponsor your spot on Fork·Fate")}</DialogTitle>
          <DialogDescription className="text-[#6B7075]">
            {t("Get pinned to the top of every matching shuffle with a Sponsored badge.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2" data-testid="sponsor-plan-toggle">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            data-testid="sponsor-plan-monthly"
            aria-pressed={plan === "monthly"}
            className={`relative rounded-2xl border p-4 text-center transition-colors ${plan === "monthly" ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
          >
            <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#6B7075]">{t("Monthly")}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#0E0E0E]">$29<span className="text-sm text-[#6B7075]">/{t("mo")}</span></p>
            <p className="mt-1 font-sans text-[11px] font-semibold text-[#E01E26]">{t("First month FREE")}</p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("yearly")}
            data-testid="sponsor-plan-yearly"
            aria-pressed={plan === "yearly"}
            className={`relative rounded-2xl border p-4 text-center transition-colors ${plan === "yearly" ? "border-[#E01E26] bg-[#E01E26]/5 ring-1 ring-[#E01E26]" : "border-[#E2E4E7] bg-[#F5F6F7] hover:border-[#D5D8DC]"}`}
          >
            <span className="absolute -top-2 right-2 rounded-full bg-[#E01E26] px-2 py-0.5 font-sans text-[10px] font-bold text-white" data-testid="sponsor-yearly-savings">{t("Save $58/yr")}</span>
            <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#6B7075]">{t("Yearly")}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#0E0E0E]">$290<span className="text-sm text-[#6B7075]">/{t("yr")}</span></p>
            <p className="mt-1 font-sans text-[11px] font-semibold text-[#E01E26]">{t("2 months free")}</p>
          </button>
        </div>
        <p className="text-center font-sans text-xs text-[#8A8F95]" data-testid="sponsor-plan-note">
          {plan === "yearly" ? t("Billed $290 today, then annually · cancel anytime") : t("Free first month, then $29/month · cancel anytime")}
        </p>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">{t("Business name *")}</Label>
            <Input id="sp-name" data-testid="sponsor-form-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Olive & Ember" />
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
