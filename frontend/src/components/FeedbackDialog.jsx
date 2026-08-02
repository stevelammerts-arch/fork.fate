import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MessageSquarePlus, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/** In-app feedback: stores to the backend (works inside the Android TWA where
 * mailto links often dead-end without a mail client). */
export default function FeedbackDialog({ light = false }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (message.trim().length < 3) { toast.error(t("Tell us a little more first.")); return; }
    setSending(true);
    try {
      await axios.post(`${API}/feedback`, { message: message.trim(), email: email.trim(), page: window.location.pathname });
      toast.success(t("Thank you — your feedback reached the Reaper. ☠️"));
      setMessage(""); setEmail(""); setOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || t("Couldn't send feedback — please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="feedback-link"
        className={`inline-flex items-center gap-1.5 font-sans text-xs font-bold underline-offset-4 transition-colors hover:underline ${light ? "text-[#2A2118] hover:text-[#4F6F47]" : "text-white hover:text-[#E01E26]"}`}
      >
        <MessageSquarePlus className="h-3.5 w-3.5" /> {t("Suggest an improvement")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-[#2A2A2A] bg-[#0B0B0B] text-white" data-testid="feedback-dialog" data-ff-dialog>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{t("Suggest an improvement")}</DialogTitle>
            <DialogDescription className="text-sm text-[#A0A0A0]">
              {t("Found a bug or have an idea? It lands straight on the owner's desk.")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder={t("What happened, or what would make Fork·Fate better?")}
            data-testid="feedback-message-input"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            type="email"
            placeholder={t("Email (optional — only if you'd like a reply)")}
            data-testid="feedback-email-input"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
          />
          <button
            onClick={submit}
            disabled={sending || message.trim().length < 3}
            data-testid="feedback-submit-button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] py-3 text-sm font-bold text-white transition-colors hover:bg-[#C0161D] disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {sending ? t("Sending…") : t("Send feedback")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
