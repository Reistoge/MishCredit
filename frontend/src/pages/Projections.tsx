import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useRequireRut } from '../hooks/useRequireRut';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useApp } from '../store/appStore';

type ProjectionSaved = {
  _id: string;
  nombre?: string;
  isFavorite?: boolean;
  totalCreditos: number;
  createdAt: string;
  codCarrera?: string;
  catalogo?: string;
  items: Array<{
    codigo: string;
    asignatura: string;
    creditos: number;
    nivel: number;
    motivo?: 'REPROBADO' | 'PENDIENTE';
    nrc?: string;
  }>;
};

export default function Projections() {
  const rut = useRequireRut();
  const toast = useToast();
  const confirm = useConfirm();
   const { seleccion, setSeleccion, carreras } = useApp();

  const [list, setList] = useState<ProjectionSaved[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<{ id: string; message: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [careerFilter, setCareerFilter] = useState(() =>
    seleccion ? `${seleccion.codCarrera}-${seleccion.catalogo}` : 'all',
  );
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllKeepFavorite, setDeleteAllKeepFavorite] = useState(true);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  async function load() {
    if (!rut) return;
    setLoading(true);
    try {
      const data = await api<ProjectionSaved[]>(`/proyecciones/mias?rut=${encodeURIComponent(rut)}`);
      setList(Array.isArray(data) ? data : []);
      setFavoriteError(null);
      setFavoriteLoading(null);
    } catch (err) {
      toast({ type: 'error', message: (err as Error).message || 'No pudimos cargar tus proyecciones' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [rut]);

  useEffect(() => {
    if (seleccion) {
      setCareerFilter(`${seleccion.codCarrera}-${seleccion.catalogo}`);
    } else {
      setCareerFilter('all');
    }
  }, [seleccion?.codCarrera, seleccion?.catalogo]);

  const availableCarreras = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();

    carreras.forEach((c) => {
      const key = `${c.codigo}-${c.catalogo}`;
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${c.nombre} (${c.codigo}-${c.catalogo})`,
        });
      }
    });

    list.forEach((p) => {
      if (!p.codCarrera || !p.catalogo) return;
      const key = `${p.codCarrera}-${p.catalogo}`;
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${p.codCarrera}-${p.catalogo}`,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [carreras, list]);

  const filteredList = useMemo(() => {
    if (careerFilter === 'all') return list;
    const [cod, catalogo] = careerFilter.split('-', 2);
    return list.filter((p) => {
      if (!p.codCarrera || !p.catalogo) return true;
      return p.codCarrera === cod && p.catalogo === catalogo;
    });
  }, [careerFilter, list]);

  const resumen = useMemo(() => {
    const favorita = filteredList.find((p) => p.isFavorite);
    const totalCreditos = filteredList.reduce((acc, p) => acc + p.totalCreditos, 0);
    return {
      favorita: favorita?.nombre || favorita?._id || 'Sin favorita',
      total: filteredList.length,
      creditos: totalCreditos,
    };
  }, [filteredList]);

  // ensure favorite projection appears first in the grid
  const sortedList = useMemo(() => {
    if (!filteredList.length) return filteredList;
    const favorite = filteredList.find((p) => p.isFavorite);
    if (!favorite) return filteredList;
    return [favorite, ...filteredList.filter((p) => p._id !== favorite._id)];
  }, [filteredList]);

  async function marcarFavorita(id: string, opts?: { skipConfirm?: boolean }) {
    if (!opts?.skipConfirm) {
      const ok = await confirm({
        title: 'Marcar como favorita',
        description: 'Reemplaza la proyeccion favorita actual. Continuar?',
      });
      if (!ok) return;
    }
    setFavoriteLoading(id);
    setFavoriteError(null);
    try {
      await api(`/proyecciones/favorita/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rut }),
      });
      toast({ type: 'success', message: 'Favorita actualizada' });
      setFavoriteError(null);
      await load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err ?? '');
      const detail = raw.trim();
      const fallback = 'No se pudo marcar favorita. Reintenta.';
      const composed = detail && detail !== fallback ? fallback + ' Detalle: ' + detail : fallback;
      setFavoriteError({ id, message: composed });
      toast({ type: 'error', message: composed });
    } finally {
      setFavoriteLoading((current) => (current === id ? null : current));
    }
  }


  async function eliminar(id: string) {
    const ok = await confirm({
      title: 'Eliminar proyeccion',
      description: 'Esta accion no se puede deshacer. Confirmas?',
    });
    if (!ok) return;
    await api(`/proyecciones/${id}?rut=${encodeURIComponent(rut)}`, { method: 'DELETE' });
    toast({ type: 'success', message: 'Proyeccion eliminada' });
    void load();
  }

  async function guardarNombre(id: string) {
    const nombre = editing[id]?.trim();
    if (!nombre) {
      toast({ type: 'error', message: 'Ingresa un nombre valido' });
      return;
    }
    await api(`/proyecciones/${id}/nombre`, {
      method: 'PATCH',
      body: JSON.stringify({ rut, nombre }),
    });
    toast({ type: 'success', message: 'Nombre actualizado' });
    setEditing((prev) => ({ ...prev, [id]: nombre }));
    void load();
  }

  function openDeleteAllDialog() {
    if (!list.length) return;
    setDeleteAllKeepFavorite(true);
    setDeleteAllOpen(true);
  }

  async function handleConfirmDeleteAll() {
    if (!rut) return;

    const base =
      careerFilter === 'all'
        ? list
        : filteredList;

    if (!base.length) {
      setDeleteAllOpen(false);
      return;
    }

    const idsToDelete = base
      .filter((p) => !(deleteAllKeepFavorite && p.isFavorite))
      .map((p) => p._id);

    if (!idsToDelete.length) {
      toast({
        type: 'info',
        message: 'No hay proyecciones para eliminar segun tu seleccion',
      });
      setDeleteAllOpen(false);
      return;
    }

    setDeleteAllLoading(true);
    try {
      for (const id of idsToDelete) {
        await api(`/proyecciones/${id}?rut=${encodeURIComponent(rut)}`, {
          method: 'DELETE',
        });
      }
      toast({ type: 'success', message: 'Proyecciones eliminadas' });
      setDeleteAllOpen(false);
      await load();
    } catch (err) {
      toast({
        type: 'error',
        message:
          (err as Error).message ||
          'No pudimos eliminar todas las proyecciones. Intentalo nuevamente.',
      });
    } finally {
      setDeleteAllLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mis proyecciones</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Administra tus combinaciones guardadas, marca favoritas y mantente al dia con tus variantes.
        </p>
      </header>

      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Carrera
          </p>
          <select
            className="mt-1 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={careerFilter}
            onChange={(e) => {
              const value = e.target.value;
              setCareerFilter(value);
              if (value !== 'all') {
                const [codCarrera, catalogo] = value.split('-', 2);
                setSeleccion({ codCarrera, catalogo });
              }
            }}
          >
            <option value="all">Todas las carreras</option>
            {availableCarreras.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Puedes cambiar la carrera tambien desde el encabezado del panel.
          </p>
        </div>

        {list.length > 0 && (
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={openDeleteAllDialog}
              disabled={loading}
            >
              Eliminar todas las proyecciones
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Puedes mantener tu proyeccion favorita en el siguiente paso.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Favorita actual</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{resumen.favorita}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Proyecciones guardadas</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{resumen.total}</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Creditos planificados</p>
          <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{resumen.creditos} SCT</p>
        </Card>
      </section>

      {loading && <LoadingState message="Cargando tus proyecciones..." rows={4} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedList.map((proj) => {
          const isExpanded = Boolean(expanded[proj._id]);
          const nameValue = editing[proj._id] ?? proj.nombre ?? '';
          const totalCursos = proj.items.length;
          const reprobados = proj.items.filter((item) => item.motivo === 'REPROBADO').length;
          const niveles = proj.items
            .map((item) => item.nivel)
            .filter((n) => typeof n === 'number');
          const nivelMin = niveles.length ? Math.min(...niveles) : null;
          const nivelMax = niveles.length ? Math.max(...niveles) : null;
          const nivelPromedio =
            niveles.length ? niveles.reduce((acc, n) => acc + n, 0) / niveles.length : null;

          return (
            <Card
              key={proj._id}
              className={proj.isFavorite ? 'border-teal-500 shadow-md dark:border-teal-500/60' : ''}
            >
              <CardHeader
                title={
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{nameValue || 'Sin nombre'}</span>
                    {proj.isFavorite && (
                      <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-100">
                        favorita
                      </span>
                    )}
                  </div>
                }
                description={new Date(proj.createdAt).toLocaleString()}
              />
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={nameValue}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [proj._id]: e.target.value,
                      }))
                    }
                    placeholder="Nombre de proyeccion"
                  />
                  <Button variant="secondary" size="sm" onClick={() => guardarNombre(proj._id)}>
                    Guardar nombre
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setExpanded((prev) => ({ ...prev, [proj._id]: !isExpanded }))}>
                    {isExpanded ? 'Ocultar ramos' : 'Ver ramos'}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                  <span>Total creditos</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-100">{proj.totalCreditos} SCT</span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {totalCursos} ramos
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {reprobados} reprobados
                  </span>
                  {nivelMin != null && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      Niveles{' '}
                      {nivelMin === nivelMax ? nivelMin : `${nivelMin}–${nivelMax}`}
                      {nivelPromedio != null && (
                        <span className="ml-1 text-[11px] font-normal text-slate-500 dark:text-slate-300">
                          (prom. {nivelPromedio.toFixed(1)})
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <ul className="thin-scroll max-h-60 space-y-2 overflow-y-auto">
                    {proj.items.map((item) => (
                      <li
                        key={item.codigo}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                      >
                        <div className="font-semibold text-slate-700 dark:text-slate-100">{item.codigo}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.asignatura} · {item.creditos} SCT · Nivel {item.nivel}
                          {item.nrc ? ` · NRC ${item.nrc}` : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {!proj.isFavorite && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void marcarFavorita(proj._id)}
                      isLoading={favoriteLoading === proj._id}
                    >
                      Marcar favorita
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => eliminar(proj._id)} className="ml-auto">
                    Eliminar
                  </Button>
                </div>
                {favoriteError?.id === proj._id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100">
                    <span>{favoriteError.message}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void marcarFavorita(proj._id, { skipConfirm: true })}
                      isLoading={favoriteLoading === proj._id}
                    >
                      Reintentar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && list.length === 0 && (
        <EmptyState
          title="Aun no tienes proyecciones guardadas"
          description="Genera desde la vista Crear proyeccion, luego guardalas y las veras en este panel."
        />
      )}

      {!loading && list.length > 0 && filteredList.length === 0 && (
        <EmptyState
          title="Sin proyecciones para esta carrera"
          description="Cambia la carrera seleccionada o crea una nueva proyeccion desde Crear proyeccion para esta carrera."
        />
      )}

      {deleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={deleteAllLoading ? undefined : () => setDeleteAllOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Eliminar proyecciones
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              ¿Seguro que quieres eliminar todas las proyecciones visibles en esta vista?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Se usara el filtro de carrera actual para determinar cuales proyecciones se eliminan.
            </p>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={deleteAllKeepFavorite}
                onChange={(e) => setDeleteAllKeepFavorite(e.target.checked)}
                disabled={deleteAllLoading}
              />
              <span>Mantener la proyeccion marcada como favorita (si existe)</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteAllOpen(false)}
                disabled={deleteAllLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => void handleConfirmDeleteAll()}
                isLoading={deleteAllLoading}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

