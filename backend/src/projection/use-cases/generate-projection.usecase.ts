import { Injectable, Logger } from "@nestjs/common";
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
export class GenerateProjectionUseCase {
  private readonly logger = new Logger(GenerateProjectionUseCase.name);

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
  }): Promise<ProjectionResult> {

    this.logger.log(`Iniciando proyección con nuevas reglas`);

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
    return ProjectionService.build(input);
  }
}