import { Injectable, Logger } from "@nestjs/common";
import { max } from "class-validator";
import { AvanceService } from "src/avance/avance.service";
import { AvanceItem } from "src/avance/entities/avance.entity";
import { MallaService } from "src/malla/malla.service";
import { Course } from "src/projection/entities/course.entity";
import { ProjectionInput, ProjectionResult } from "src/projection/entities/projection.entity";
import { ProjectionService } from "src/projection/service/projection.service";


// ----------------- helpers -----------------
function s(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}
function n(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return 0;
}
function b(v: unknown): boolean {
  return v === true || v === 'true';
}

function parseMalla(data: unknown): Course[] {
  if (!Array.isArray(data)) return [];
  return data.map((x) => {
    const obj = x as Record<string, unknown>;
    return {
      codigo: s(obj.codigo),
      asignatura: s(obj.asignatura),
      creditos: n(obj.creditos),
      nivel: n(obj.nivel),
      prereq: s(obj.prereq),
    };
  });
}

function parseAvance(data: unknown): AvanceItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((x) => {
    const obj = x as Record<string, unknown>;
    return {
      nrc: s(obj.nrc),
      period: s(obj.period),
      student: s(obj.student),
      course: s(obj.course),
      excluded: b(obj.excluded),
      inscriptionType: s(obj.inscriptionType),
      status: s(obj.status),
    };
  });
}
 
// ----------------- main use case -----------------
@Injectable()
export class GenerateProjectionOptionsUseCase {
  private readonly logger = new Logger(GenerateProjectionOptionsUseCase.name);

  constructor(
    private readonly mallaService: MallaService,
    private readonly avanceService: AvanceService,
  ) {}

  async exec(params: {
    rut: string;
    codCarrera: string;
    catalogo: string;
    topeCreditos: number;
    prioritarios?: string[];
    creditRange?: { min: number; max: number };
    maximizarCreditos?: boolean;
    priorizarReprobados?: boolean;
    ordenPrioridades: string[];
    maxOptions?: number;
  }): Promise<{ opciones: ProjectionResult[] }> {

   this.logger.log(`Iniciando proyección con opciones`);

    const mallaRaw = await this.mallaService.getMalla(params.codCarrera, params.catalogo);
    const avanceRaw = await this.avanceService.getAvance(params.rut, params.codCarrera);

    const malla = parseMalla(mallaRaw);
    const avance = parseAvance(avanceRaw);

    // --- Diagnóstico para debug ---
    this.logger.log('diag.proyeccion', {
      mallaLen: malla.length,
      avanceLen: avance.length,
      aprobados: avance.filter(a => a.status === 'APROBADO').length,
      reprobados: avance.filter(a => a.status === 'REPROBADO').length,
      ejemploMalla: malla.slice(0, 3).map(c => c.codigo),
      ejemploReprob: avance
        .filter(a => a.status === 'REPROBADO')
        .slice(0, 5)
        .map(a => a.course),
      tope: params.topeCreditos,
      maximizar: params.maximizarCreditos,
      priorizarReprobados: params.priorizarReprobados,
      ordenPrioridades: params.ordenPrioridades,
      maxOptions: params.maxOptions,
    });

    // --- Construir ProjectionInput ---
    const input: ProjectionInput = {
      malla,
      avance,
      topeCreditos: params.topeCreditos,
      prioritarios: params.prioritarios ?? [],
      creditRange: params.creditRange ?? { min: 0, max: 10 },
      maximizarCreditos: params.maximizarCreditos ?? false,
      priorizarReprobados: params.priorizarReprobados ?? false,
      ordenPrioridades: params.ordenPrioridades ?? ['NIVEL MAS BAJO'],
    };

    // --- Ejecutar lógica de proyección ---
    const opciones: ProjectionResult[] = ProjectionService.buildOptions(input, params.maxOptions ?? 5);

    /*/ --- Placeholder for return ---
    const opciones: ProjectionResult[] = [
      {
        seleccion: [
          { codigo: 'MAT101', asignatura: 'Cálculo I', creditos: 6, nivel: 1, motivo: 'PENDIENTE' },
        ],
        totalCreditos: 6,
        reglas: {
          topeCreditos: params.topeCreditos,
          // verificaPrereq: true,
          priorizarReprobados: params.priorizarReprobados ?? false,
          maximizarCreditos: params.maximizarCreditos ?? false,
          prioritarios: params.prioritarios ?? [],
          ordenPrioridades: params.ordenPrioridades ?? ['NIVEL MAS BAJO'],
        },
      },
    ]; */

    return { opciones };

  }
}

/*
@Injectable()
export class GenerateProjectionOptionsUseCase {
  constructor(
    private readonly mallaService: MallaService,
    private readonly avanceService: AvanceService,
  ) {}

  private readonly logger = new Logger(GenerateProjectionOptionsUseCase.name);

  async exec(params: {
    rut: string;
    codCarrera: string;
    catalogo: string;
    topeCreditos: number;
    prioritarios?: string[];
    nivelObjetivo?: number;
    maxOptions?: number;
  }): Promise<{ opciones: ProjectionResult[] }> {

  this.logger.log(`Iniciando proyección con opciones`);
    
    const mallaRaw = await this.mallaService.getMalla(
      params.codCarrera,
      params.catalogo,
    );
    const avanceRaw = await this.avanceService.getAvance(
      params.rut,
      params.codCarrera,
    );

    // parse functions from generate-projection.usecase
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const s = (v: unknown) => (typeof v === 'string' ? v : String(v ?? ''));
    const n = (v: unknown) => {
      const x = Number(v);
      return Number.isFinite(x) ? x : 0;
    };
    const parseMalla = (data: unknown) =>
      Array.isArray(data)
        ? data.map((x) => {
            const obj = x as Record<string, unknown>;
            return {
              codigo: s(obj.codigo),
              asignatura: s(obj.asignatura),
              creditos: n(obj.creditos),
              nivel: n(obj.nivel),
              prereq: s(obj.prereq || ''),
            };
          })
        : [];
    const parseAvance = (data: unknown) =>
      Array.isArray(data)
        ? data.map((x) => {
            const obj = x as Record<string, unknown>;
            return {
              nrc: s(obj.nrc),
              period: s(obj.period),
              student: s(obj.student),
              course: s(obj.course),
              excluded: Boolean(obj.excluded),
              inscriptionType: s(obj.inscriptionType),
              status: s(obj.status),
            };
          })
        : [];

    const malla = parseMalla(mallaRaw);
    const avance = parseAvance(avanceRaw);

    const opciones = ProjectionService.buildOptions(
      {
        malla,
        avance,
        topeCreditos: params.topeCreditos,
        // nivelObjetivo: params.nivelObjetivo,
        prioritarios: params.prioritarios,
      },
      params.maxOptions ?? 5,
    );
    return { opciones };
  }
}

*/