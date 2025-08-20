import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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
  // email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email/Password Auth
  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      const { auth } = await ensureFirebase();
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Успешная регистрация", description: "Теперь войдите в аккаунт" });
        setIsRegister(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "/home";
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isRegister ? 'Регистрация по email' : 'Вход по email'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-700">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-700">Пароль</label>
            <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" />
          </div>
          <Button className="w-full bg-rose-gold" onClick={handleEmailAuth} disabled={loading}>
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </Button>
          <div className="text-center mt-2">
            <button
              className="text-rose-gold underline text-sm"
              type="button"
              onClick={() => setIsRegister(r => !r)}
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
