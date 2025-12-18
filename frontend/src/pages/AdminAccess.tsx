import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/appStore';
import { useToast } from '../components/Toast';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function AdminAccess() {
  const { adminKey, setAdminKey } = useApp();
  const toast = useToast();
  const nav = useNavigate();

  function save() {
    // if (!adminKey.trim()) {
    //   toast({ type: 'error', message: 'Debes ingresar una clave valida' });
    //   return;
    // }
    toast({ type: 'success', message: 'Clave guardada' });
    nav('/Avance');
  }

  function clear() {
    setAdminKey('');
    toast({ type: 'info', message: 'Clave eliminada' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-900 to-teal-700 px-6 py-12 text-slate-100">
      <main className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card className="mx-auto max-w-lg">
          <CardHeader
            title="Acceso administrador"
            description="Requerido para cargar oferta, respaldos y acciones sensibles."
          />
          <CardContent className="space-y-4">
            <Input
              label="X-ADMIN-KEY"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="clave"
            />
            <div className="flex gap-2">
              <Button onClick={save}>Guardar</Button>
              <Button variant="secondary" onClick={clear}>
                Limpiar
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              La clave se almacena en tu navegador y se usa para firmar las solicitudes a los endpoints protegidos.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

