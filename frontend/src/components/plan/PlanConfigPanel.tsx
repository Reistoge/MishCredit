import RangeSlider from 'react-range-slider-input';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../ui/SortableItem';

type PlanConfigPanelProps = {
  tope: number;
  onTopeChange: (value: number) => void;
  creditRange: [number, number];
  onCreditRangeChange: (value: [number, number]) => void;
  maximizarCreditos: boolean;
  onMaximizarCreditosChange: (value: boolean) => void;
  priorizarReprobados: boolean;
  onPriorizarReprobadosChange: (value: boolean) => void;
  prioritarios: string[];
  showPicker: boolean;
  onOpenPicker: () => void;
  onResetPrioritarios: () => void;
  etiquetasBase: string[];
  etiquetasExtras: string[];
  ordenEtiquetas: string[];
  onOrdenEtiquetasChange: (next: string[]) => void;
};

export function PlanConfigPanel({
  tope,
  onTopeChange,
  creditRange,
  onCreditRangeChange,
  maximizarCreditos,
  onMaximizarCreditosChange,
  priorizarReprobados,
  onPriorizarReprobadosChange,
  prioritarios,
  showPicker,
  onOpenPicker,
  onResetPrioritarios,
  etiquetasBase,
  etiquetasExtras,
  ordenEtiquetas,
  onOrdenEtiquetasChange,
}: PlanConfigPanelProps) {
  const safeBase = Array.isArray(etiquetasBase) ? etiquetasBase : [];
  const safeExtras = Array.isArray(etiquetasExtras) ? etiquetasExtras : [];
  const etiquetasVisibles = [...safeExtras, ...safeBase];
  const showSidebar = etiquetasExtras.length > 0;

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordenEtiquetas.indexOf(active.id);
    const newIndex = ordenEtiquetas.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = ordenEtiquetas.slice();
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onOrdenEtiquetasChange(next);
  }

  return (
    <section className={`grid gap-3 ${showSidebar ? 'grid-cols-5' : 'grid-cols-4'}`}>
      {/* area de parámetros */}
      <div className="col-span-4">
        <div className="grid gap-3 grid-cols-2">
          <div className="grid gap-3 grid-cols-8">
            {/* Tope de créditos */}
            <Card className="grid p-4 col-span-3">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tope de créditos
              </div>
              <div className="mt-2 flex items-start gap-2">
                <input
                  type="number"
                  min={12}
                  max={30}
                  value={tope}
                  onChange={(e) => onTopeChange(Number(e.target.value))}
                  className="w-[50%] max-w-20 min-w-14 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <span className="mb-2 self-end text-sm text-slate-600 dark:text-slate-300">
                  SCT
                </span>
              </div>
            </Card>

            {/* Rango créditos por ramo */}
            <Card className="group grid p-4 col-span-5">
              <div className="items-start">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Creditos por Ramo
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1
                opacity-100 group-hover:opacity-0 transition-opacity">
                  Limita el rango de creditos por ramo.
                </div>

                <div className="relative mt-4">
                  <RangeSlider
                    id='range-slider-credits'
                    // className="mt-4"
                    min={0}
                    max={8}
                    step={1}
                    onInput={(value) => onCreditRangeChange(value as [number, number])}
                    defaultValue={creditRange}
                  />
                  {/* Display the current values only when hovering */}
                  <div className="absolute bottom-5 left-0 right-0 flex justify-between text-xs font-semibold text-teal-700 mt-3.5 mx-0.5
                  opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{creditRange[0]} SCT</span>
                    <span>{creditRange[1]} SCT</span>
                  </div>

                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-3 grid-cols-2">
            {/* Maximizar créditos */}
            <Card className="grid p-4 col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Maximizar créditos
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Intenta usar el máximo posible del tope definido.
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-start ml-1">
                  <input
                    type="checkbox"
                    checked={maximizarCreditos}
                    onChange={(e) => onMaximizarCreditosChange(e.target.checked)}
                    className="h-5 w-5 accent-teal-600"
                  />
                </div>
              </div>
            </Card>

            {/* Priorizar reprobados */}
            <Card className="grid p-4 col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Priorizar reprobados
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Da preferencia a cursos reprobados.
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-start ml-1">
                  <input
                    type="checkbox"
                    checked={priorizarReprobados}
                    onChange={(e) => onPriorizarReprobadosChange(e.target.checked)}
                    className="h-5 w-5 accent-teal-600"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Prioritarios personalizados */}
          <Card className="grid p-4 col-span-2">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prioritarios personalizados
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-100">
                {prioritarios.length} cursos
              </span>
              <Button size="sm" variant="secondary" onClick={onOpenPicker}>
                {showPicker ? 'Cerrar selector' : 'Elegir ramos'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onResetPrioritarios}>
                Limpiar
              </Button>
            </div>
            {prioritarios.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {prioritarios.map((code) => (
                  <span
                    key={code}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {code}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Sidebar de etiquetas */}
      {showSidebar && (
        <aside className="col-span-1">
          <Card className="h-full sticky top-6 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ordenar prioridades
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Elige el orden de las prioridades seleccionadas.
            </div>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={etiquetasVisibles} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {ordenEtiquetas.map((etiqueta) => (
                    <SortableItem key={etiqueta} id={etiqueta} label={etiqueta} className="group" />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Card>
        </aside>
      )}
    </section>
  );
}
