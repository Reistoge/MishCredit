import type { AvanceItem } from '../../avance/entities/avance.entity';
import type { Course } from '../entities/course.entity';
import { ProjectionInput, ProjectionResult, ProjectionCourse } from '../entities/projection.entity';

export class ProjectionService {
  
  static build(input: ProjectionInput): ProjectionResult {
    const { malla, avance, topeCreditos, creditRange, ordenPrioridades, prioritarios, priorizarReprobados, maximizarCreditos } = input;

    const tope = Number.isFinite(topeCreditos) && topeCreditos! > 0 ? topeCreditos! : 22;

    // --- Build sets for statuses ---
    const { cursos, order } = ProjectionService.prepareCourses(input);

    // --- Select courses ---
    let seleccion: ProjectionCourse[] = [];
    let totalCreditos = 0;

    if (maximizarCreditos) {
      ({ seleccion, totalCreditos } = ProjectionService.pickCoursesMaximizedCredits(cursos, tope));
    } else {
      ({ seleccion, totalCreditos } = ProjectionService.pickCoursesUntilCap(cursos, tope));
    }

    return {
      seleccion,
      totalCreditos,
      reglas: {
        topeCreditos: tope,
        // verificaPrereq: true,
        creditRange,
        priorizarReprobados,
        maximizarCreditos,
        prioritarios,
        ordenPrioridades: ordenPrioridades || [],
      },
    };
  }
  

  static buildOptions(input: ProjectionInput, maxOptions): ProjectionResult[] {
    const { malla, avance, topeCreditos, creditRange, ordenPrioridades, prioritarios, priorizarReprobados, maximizarCreditos } = input;
    
    const tope = Number.isFinite(topeCreditos) && topeCreditos! > 0 ? topeCreditos! : 22;

    // --- Build sets for statuses ---
    const { cursos, order } = ProjectionService.prepareCourses(input);

    // --- Generate multiple best projections ---
    const options: ProjectionResult[] = [];

    // --- Select courses ---
    let seleccion: ProjectionCourse[] = [];
    let totalCreditos = 0;

    if (maximizarCreditos) {
    // 1. Generate the first (optimal) selection
      ({ seleccion, totalCreditos } = ProjectionService.pickCoursesMaximizedCredits(cursos, tope));

      options.push(
        ProjectionService.makeProjectionResult(
          seleccion,
          totalCreditos,
          tope,
          creditRange,
          priorizarReprobados,
          maximizarCreditos,
          prioritarios,
          order,
        ),
      );
    // 2. Generate next lexicographically smaller (maxOptions - 1) alternatives
      let previousIndices = ProjectionService.getIndicesFromSelection(seleccion, cursos);
      for (let i = 1; i < maxOptions; i++) {
        const nextIndices = ProjectionService.nextSmallerCombination(previousIndices, cursos, tope);
        if (!nextIndices) break;

        const nextSeleccion = nextIndices.map((idx) => {
          const { _isReprob, _isPrio, ...rest } = cursos[idx];
          return rest;
        });

        const nextTotal = nextSeleccion.reduce((s, c) => s + c.creditos, 0);

        options.push(
          ProjectionService.makeProjectionResult(
            nextSeleccion,
            nextTotal,
            tope,
            creditRange,
            priorizarReprobados,
            maximizarCreditos,
            prioritarios,
            order,
          ),
        );

        previousIndices = nextIndices;
      }
    } else {
    // --- 1. Generate first projection (greedy fill until cap) ---
      ({ seleccion, totalCreditos } = ProjectionService.pickCoursesUntilCap(cursos, tope));
      
      options.push(
        ProjectionService.makeProjectionResult(
          seleccion,
          totalCreditos,
          tope,
          creditRange,
          priorizarReprobados,
          maximizarCreditos,
          prioritarios,
          order,
        ),
      );

    // --- Build next lexicographically smaller combos ---
      let indices = ProjectionService.getIndicesFromSelection(seleccion, cursos);
      const k = indices.length;
      const n = cursos.length;

      for (let i = 1; i < maxOptions; i++) {
        const nextIndices = ProjectionService.nextSmallerCombinationSameSize(indices, n);
        if (!nextIndices) break;

        // Try to fill after last one
        const filledIndices = [...nextIndices];
        let total = filledIndices.reduce((s, idx) => s + cursos[idx].creditos, 0);

        for (let j = filledIndices[filledIndices.length - 1] + 1; j < n; j++) {
          const c = cursos[j];
          if (total + c.creditos <= tope) {
            filledIndices.push(j);
            total += c.creditos;
          } else break;
        }

        // Skip if exceeds credit cap
        if (total > tope) continue;

        const nextSeleccion = filledIndices.map((idx) => {
          const { _isReprob, _isPrio, ...rest } = cursos[idx];
          return rest;
        });

        options.push(
          ProjectionService.makeProjectionResult(
            nextSeleccion,
            total,
            tope,
            creditRange,
            priorizarReprobados,
            maximizarCreditos,
            prioritarios,
            order,
          ),
        );

        indices = nextIndices;
      }

    }

    return options;
  }


  // --- Course preparation/filtering logic ---
  private static prepareCourses(input: ProjectionInput): {
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[];
    order: string[];
  } {
    const { malla, avance, ordenPrioridades, prioritarios, creditRange } = input;

    // --- Build sets for statuses ---
    const aprobados = new Set<string>(
      avance.filter((a) => a.status === 'APROBADO').map((a) => a.course),
    );
    const reprobados = new Set<string>(
      avance.filter((a) => a.status === 'REPROBADO').map((a) => a.course),
    );
    const prios = new Set<string>(
      (prioritarios || []).map((s) => (s || '').trim()).filter(Boolean),
    );

    // --- Get pending courses (not approved yet) ---
    const pendientes = malla.filter((c) => !aprobados.has(c.codigo));

    // --- Keep only courses that can be taken (passed prereqs or reprobado) ---
    const disponibles = pendientes.filter(
      (c) => reprobados.has(c.codigo) || ProjectionService.hasPrereqs(c, aprobados),
    );

    // --- Filter by credit range (inclusive) ---
    const enRango = disponibles.filter(
      (c) => c.creditos >= creditRange.min && c.creditos <= creditRange.max,
    );

    // --- Compute fields for ordering ---
    const cursos: (ProjectionCourse & {
      _isReprob: boolean;
      _isPrio: boolean;
    })[] = enRango.map((c) => ({
      codigo: c.codigo,
      asignatura: c.asignatura,
      creditos: c.creditos,
      nivel: c.nivel,
      motivo: reprobados.has(c.codigo) ? 'REPROBADO' : 'PENDIENTE',
      _isReprob: reprobados.has(c.codigo),
      _isPrio: prios.has(c.codigo),
    }));
    // --- Sort dynamically using ordenPrioridades ---
    const order = ordenPrioridades || [];
    cursos.sort((a, b) => ProjectionService.compareByTags(a, b, order));

    return { cursos, order };
  }

  // --- Pick courses until credit limit ---
  private static pickCoursesUntilCap(
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[],
    tope: number,
  ): { seleccion: ProjectionCourse[]; totalCreditos: number } {
    const seleccion: ProjectionCourse[] = [];
    let totalCreditos = 0;

    for (const c of cursos) {
      if (totalCreditos + c.creditos <= tope) {
        const { _isReprob, _isPrio, ...rest } = c;
        seleccion.push(rest);
        totalCreditos += c.creditos;
      }
      if (totalCreditos >= tope) break;
    }

    return { seleccion, totalCreditos };
  }

  // --- Find next lexicographically smaller combination of same size ---
  private static nextSmallerCombinationSameSize(
    indices: number[],
    n: number,
  ): number[] | null {
    const k = indices.length;
    const next = [...indices];
    let i = k - 1;
    while (i >= 0 && next[i] === i + (n - k)) i--;
    if (i < 0) return null; // no more combos

    next[i]++;
    for (let j = i + 1; j < k; j++) next[j] = next[j - 1] + 1;
    return next;
  }

  // --- Pick courses aiming for exact credit limit ---
  // 0 1 2 3 4 5 6 7 8 9 
  // - -       - 6 2
  //   - - - 6 2
  //     -   - 6 3   
  //   - -       - 9 3
  //     - - - 9 3   
  //       -   - 8 4   
  private static pickCoursesMaximizedCredits(
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[],
    tope: number,
  ): { seleccion: ProjectionCourse[]; totalCreditos: number } {
    const n = cursos.length;

    // dp[sum] = { totalCredits, indicesUsed }
    // keep best combination for each credit total up to tope
    const dp = Array<(number[] | null)>(tope + 1).fill(null);
    dp[0] = [];

    for (let i = 0; i < n; i++) {
      const c = cursos[i];
      for (let t = tope; t >= c.creditos; t--) {
        const prev = dp[t - c.creditos];
        if (prev) {
          const candidate = [...prev, i];
          if (!dp[t] || ProjectionService.isBetterCombination(candidate, dp[t]!)) {
            dp[t] = candidate;
          }
        }
      }
    }

    // --- Choose best total ---
    let bestTotal = -1;
    for (let t = tope; t >= 0; t--) {
      if (dp[t]) {
        bestTotal = t;
        break;
      }
    }

    const indices = dp[bestTotal] || [];
    const seleccion = indices.map((i) => {
      const { _isReprob, _isPrio, ...rest } = cursos[i];
      return rest;
    });

    return { seleccion, totalCreditos: bestTotal };
  }

  // --- Find next lexicographically smaller combination under credit limit ---
  private static nextSmallerCombination(
    indices: number[],
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[],
    tope: number,
  ): number[] | null {
    const n = cursos.length;
    const k = indices.length;
    const currentTotal = indices.reduce((s, i) => s + cursos[i].creditos, 0);

    // Generate next lexicographically smaller combination
    const next = [...indices];
    let i = k - 1;
    while (i >= 0 && next[i] === i + (n - k)) i--;
    if (i < 0) return null; // no more combinations

    next[i]++;
    for (let j = i + 1; j < k; j++) next[j] = next[j - 1] + 1;

    // Recalculate credits
    const total = next.reduce((s, idx) => s + cursos[idx].creditos, 0);

    // if it exceeds tope, find best smaller one recursively
    if (total > tope) return ProjectionService.nextSmallerCombination(next, cursos, tope);

    return next;
  }


// --- Helpers ---

  // --- Choose lexicographically "earlier" course combination ---
  private static isBetterCombination(a: number[], b: number[]): boolean {
    // both have same total credits, so prefer lower average index
    if (a.length !== b.length) return a.length > b.length; // prefer using more courses
    const avgA = a.reduce((s, x) => s + x, 0) / a.length;
    const avgB = b.reduce((s, x) => s + x, 0) / b.length;
    return avgA < avgB;
  }
  // --- Prerequisite check ---
  static hasPrereqs(course: Course, aprobados: Set<string>): boolean {
    const p = (course.prereq || '').trim();
    if (!p) return true;
    const reqs = p.split(',').map((s) => s.trim()).filter(Boolean);
    return reqs.every((code) => aprobados.has(code));
  }

  // --- Dynamic comparison using tag order ---
  private static compareByTags(
    a: ProjectionCourse & { _isReprob: boolean; _isPrio: boolean },
    b: ProjectionCourse & { _isReprob: boolean; _isPrio: boolean },
    orden: string[],
  ): number {
    for (const tag of orden) {
      switch (tag.toUpperCase()) {
        case 'REPROBADOS':
          if (a._isReprob !== b._isReprob) return a._isReprob ? -1 : 1;
          break;
        case 'PRIORITARIOS':
          if (a._isPrio !== b._isPrio) return a._isPrio ? -1 : 1;
          break;
        case 'NIVEL MAS BAJO':
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          break;
        default:
          break; // ignore unknown tags
      }
    }

    // fallback: sort by level
    return a.nivel - b.nivel;
  }

  private static makeProjectionResult(
    seleccion: ProjectionCourse[],
    totalCreditos: number,
    tope: number,
    creditRange: { min: number; max: number },
    priorizarReprobados: boolean,
    maximizarCreditos: boolean,
    prioritarios: string[] | undefined,
    ordenPrioridades: string[],
  ): ProjectionResult {
    return {
      seleccion,
      totalCreditos,
      reglas: {
        topeCreditos: tope,
        creditRange,
        priorizarReprobados,
        maximizarCreditos,
        prioritarios,
        ordenPrioridades,
      },
    };
  }

  private static getIndicesFromSelection(
    seleccion: ProjectionCourse[],
    cursos: (ProjectionCourse & { _isReprob: boolean; _isPrio: boolean })[],
  ): number[] {
    return seleccion
      .map((s) => cursos.findIndex((c) => c.codigo === s.codigo))
      .filter((i) => i >= 0);
  }

}
