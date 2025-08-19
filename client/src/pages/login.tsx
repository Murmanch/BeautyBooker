import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Load Firebase Web SDK lazily to keep bundle small
async function ensureFirebase() {
  const [{ initializeApp }, { getAuth, RecaptchaVerifier, signInWithPhoneNumber }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  } as const;

  const app = initializeApp(config);
  const auth = getAuth(app);
  return { auth, RecaptchaVerifier, signInWithPhoneNumber };
}

export default function Login() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("+7");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // prepare recaptcha container
    const container = document.getElementById("recaptcha-container");
    if (container) container.innerHTML = "";
  }, []);

  const startLogin = async () => {
    try {
      setLoading(true);
      const { auth, RecaptchaVerifier, signInWithPhoneNumber } = await ensureFirebase();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const verifier: any = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(confirmationResult);
      toast({ title: "Код отправлен", description: "Введите код из SMS" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Ошибка", description: e.message || "Не удалось отправить код", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    try {
      setLoading(true);
      const cred = await confirmation.confirm(otp);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error(await res.text());

      window.location.href = "/home";
    } catch (e: any) {
      console.error(e);
      toast({ title: "Ошибка", description: e.message || "Неверный код", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход по номеру телефона</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-700">Номер телефона</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 9XX XXX-XX-XX" />
          </div>

          {!confirmation ? (
            <Button className="w-full bg-rose-gold" onClick={startLogin} disabled={loading}>
              Отправить код
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Код из SMS</label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
              </div>
              <Button className="w-full bg-rose-gold" onClick={verifyOtp} disabled={loading}>
                Войти
              </Button>
            </>
          )}

          <div id="recaptcha-container" />
        </CardContent>
      </Card>
    </div>
  );
}
