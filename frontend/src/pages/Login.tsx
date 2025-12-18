import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useApp } from '../store/appStore';
import { useToast } from '../components/Toast';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import AccessibilityToggles from '../layouts/AccessibilityToggles';

type Carrera = { codigo: string; nombre: string; catalogo: string };

export default function Login() {
  const toast = useToast();
  const navigate = useNavigate();
  const { setRut, setCarreras, setSeleccion } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ rut: string; carreras: Carrera[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setRut(res.rut);
      setCarreras(res.carreras);
      if (res.carreras[0]) {
        setSeleccion({ codCarrera: res.carreras[0].codigo, catalogo: res.carreras[0].catalogo });
      }
      toast({ type: 'success', message: 'Bienvenido a Planificador UCN Optimish' });
      navigate('/avance');
    } catch (err) {
      const msg = (err as Error).message || 'No pudimos iniciar sesion';
      setError(msg);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-600 px-6 py-12 text-slate-100">
      <main className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">Bienvenido a Planificador UCN Optimish</h1>
          <p className="mt-2 text-sm text-slate-200/90">
            Ingresa tus credenciales de Online UCN para continuar.
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardHeader
            title="Inicio de sesion"
            description="Tus datos permanecen en tu navegador. Para pruebas puedes usar las credenciales demo."
          />
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                label="Email"
                // type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ucn.cl"
                required
              />
              <Input
                label="Contrasena"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
              {error && <Alert variant="error" description={error} />}
              <Button type="submit" isLoading={loading} className="w-full">
                Iniciar sesion
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/forgot')}
                className="w-full text-sm"
              >
                Olvide mi contrasena
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardHeader title="Acceso administrador" description="Carga de oferta, respaldos y configuraciones avanzadas." />
          <CardContent className="flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-200">
            <p>Debes ingresar la clave de administrador para acceder a herramientas avanzadas.</p>
            <Button variant="secondary" onClick={() => navigate('/admin')} className="self-center">
              Ir a administrador
            </Button>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-slate-200/70">
          © 2025 Optimish — Proyecto academico UCN
        </footer>
      </main>
      <AccessibilityToggles />
    </div>
  );
}

