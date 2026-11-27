import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendEmailCode, verifyEmailCode } from "./backend";
import { haptic } from "./haptics";
import { useSession } from "./session";
import { fmt } from "./strings";
import { useAuthM } from "./strings-store";
import { useM } from "./use-m";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Huawei build only: sign in with a 6-digit code sent by Supabase Auth
 * (fallback for users who don't want Google in the browser).
 */
export function EmailSignIn() {
  const a = useAuthM();
  const m = useM();
  const { busy, signIn } = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [working, setWorking] = useState(false);

  const fail = (err: unknown) => {
    haptic("error");
    const msg = err instanceof Error ? err.message : String(err);
    toast.error(/network|timeout|connect|fetch/i.test(msg) ? m.offline : msg);
  };

  const send = async () => {
    if (!EMAIL.test(email.trim())) return toast.error(a.invalidEmail);
    setWorking(true);
    try {
      await sendEmailCode(email);
      setSentTo(email.trim());
      setCode("");
    } catch (err) {
      fail(err);
    } finally {
      setWorking(false);
    }
  };

  const verify = async () => {
    if (!sentTo) return;
    setWorking(true);
    try {
      await signIn(() => verifyEmailCode(sentTo, code));
      haptic("success");
    } catch (err) {
      fail(err);
    } finally {
      setWorking(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" className="h-12 w-full gap-2.5 rounded-xl" disabled={busy} onClick={() => setOpen(true)}>
        <Mail className="size-4" />
        {a.emailSignIn}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-bg-subtle p-3">
      {!sentTo ? (
        <>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={a.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
          />
          <Button className="w-full" disabled={working || busy || !email.trim()} onClick={() => void send()}>
            {a.sendCode}
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted">{fmt(a.codeSent, { email: sentTo })}</p>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder={a.codePlaceholder}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && void verify()}
          />
          <Button className="w-full" disabled={working || busy || code.length < 6} onClick={() => void verify()}>
            {a.verifyCode}
          </Button>
          <button type="button" className="block w-full text-center text-[11px] text-subtle underline" onClick={() => setSentTo(null)}>
            {a.changeEmail}
          </button>
        </>
      )}
    </div>
  );
}
