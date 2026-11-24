import type { MaterialAdmin, WordDocumentRecord } from '../src/types.ts';
import { GENERATED_COMPLEMENTARY_MATERIALS, UPLOADED_WORD_DOCS } from './curriculumData.ts';

export const LEGACY_RETIRED_MATERIAL_IDS = new Set([
  'mat-folleto-seguridad-laboratorio',
  'mat-planificacion-7mo-grado',
  'mat-folleto-tabla-periodica',
  'mat-planificacion-8vo-grado',
  'mat-guia-facil-circuitos',
  'mat-planificacion-9no-grado',
  'mat-practica-adn-microscopia',
  'mat-planificacion-1ro-bachillerato',
  'mat-apuntes-biotecnologia-crispr',
  'mat-planificacion-2do-bachillerato',
  'mat-practica-circuitos-ley-ohm',
  'mat-planificacion-robotica-stem',
  'mat-guia-teoria-7mo-grado',
  'mat-guia-teoria-8vo-grado',
  'mat-guia-teoria-9no-grado',
  'mat-guia-teoria-1ro-bach',
  'mat-guia-teoria-2do-bach'
]);

export const SEED_MATERIALS: MaterialAdmin[] = GENERATED_COMPLEMENTARY_MATERIALS;

export const SEED_WORD_DOCS: WordDocumentRecord[] = UPLOADED_WORD_DOCS;
