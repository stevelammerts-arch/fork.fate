import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RequestSponsorshipDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ business_name: "", contact_email: "", category: "food", message: "" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.business_name.trim() || !form.contact_email.trim()) {
      toast.error("Business name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/sponsorship-requests`, form);
      toast.success("Thanks! We'll be in touch about sponsorship soon.");
      setForm({ business_name: "", contact_email: "", category: "food", message: "" });
      setOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="request-sponsorship-link"
          className="inline-flex items-center gap-2 font-sans text-sm font-bold text-white underline-offset-4 transition-colors hover:text-[#E01E26] hover:underline"
        >
          <Megaphone className="h-4 w-4" /> Request sponsorship
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-[#E2E4E7] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#0E0E0E]">Request sponsorship</DialogTitle>
          <DialogDescription className="text-[#6B7075]">
            Want your spot featured as a Sponsored pick on Fork·Fate? Tell us about your business and we'll reach out.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">Business name</Label>
            <Input
              id="sp-name"
              data-testid="sponsorship-business-name"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              placeholder="e.g. Olive & Ember"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-email">Contact email</Label>
            <Input
              id="sp-email"
              type="email"
              data-testid="sponsorship-email"
              value={form.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
              placeholder="you@business.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-msg">Message <span className="text-[#B8BCC2]">(optional)</span></Label>
            <Textarea
              id="sp-msg"
              data-testid="sponsorship-message"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Tell us about your business and goals…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={submit}
            disabled={submitting}
            data-testid="sponsorship-submit-button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-70"
          >
            {submitting ? "Sending…" : "Send request"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
