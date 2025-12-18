import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class GenerarProyeccionDto {
  @IsString() @IsNotEmpty() rut!: string;
  @IsString() @IsNotEmpty() codCarrera!: string;
  @IsString() @IsNotEmpty() catalogo!: string;
  @Type(() => Number) @IsNumber() @Min(1) topeCreditos!: number;
  @IsOptional() @Type(() => String) prioritarios?: string[];
  @IsOptional() @Type(() => Object) creditRange?: { min: number; max: number };
  @IsBoolean() maximizarCreditos?: boolean;
  @IsBoolean() priorizarReprobados?: boolean;
  // Transform ordenPrioridades into array of strings
  @Transform(({ value }) => (Array.isArray(value) ? value.map(String) : []))
  @IsString({ each: true }) ordenPrioridades!: string[];
}

export class GuardarProyeccionDto extends GenerarProyeccionDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsBoolean() favorite?: boolean;
}

export class FavoritaDto {
  @IsString() @IsNotEmpty() rut!: string;
}

export class DemandaQueryDto {
  @IsOptional() @IsString() codCarrera?: string;
  @IsOptional() @IsString() @IsIn(['codigo', 'nrc']) por?: 'codigo' | 'nrc';
  @IsOptional() @IsString() @IsIn(['favoritas', 'total']) modo?: 'favoritas' | 'total';
}
