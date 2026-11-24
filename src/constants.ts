import type { AcademicLevel, GradeLevel, MaterialCategory, WordDocType } from './types.ts';

export const GRADE_PACK_PRICE_USD = 15;

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  practicas: 'Manual de Laboratorio Completo',
  planificaciones: 'Planificación del Grado',
  apuntes: 'Guion Complementario (1 pág.)',
  folletos: 'Documento / Paquete ZIP'
};

export const CATEGORY_DESCRIPTIONS: Record<MaterialCategory, string> = {
  practicas: 'Manuales de prácticas de laboratorio completos sin desglosar listos para imprimir o editar.',
  planificaciones: 'Secuencias didácticas, jornalización e indicadores de logro por grado.',
  apuntes: 'Guiones breves de 1 página por práctica con esquema Inicio, Desarrollo y Culminación.',
  folletos: 'Archivos complementarios y paquetes ZIP administrativos en Gestión Académica.'
};

export const CATEGORY_IMAGES: Record<MaterialCategory, string> = {
  folletos: '/src/assets/images/cat_folletos_chemistry_1795526711774.jpg',
  practicas: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
  apuntes: '/src/assets/images/cat_apuntes_biotech_1795526713277.jpg',
  planificaciones: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg'
};

export const HERO_IMAGE = '/src/assets/images/hero_science_lab_1795526711039.jpg';

export const CURRICULUM_GRADES: GradeLevel[] = [
  '4° Grado',
  '5° Grado',
  '6° Grado',
  '7° Grado',
  '8° Grado',
  '9° Grado',
  '1° Año Bachillerato',
  '2° Año Bachillerato'
];

export const GRADE_LEVELS: GradeLevel[] = [
  ...CURRICULUM_GRADES,
  'Gestión Académica'
];

export const GRADE_SUMMARIES: Record<GradeLevel, { stage: string; focus: string }> = {
  '4° Grado': {
    stage: 'Segundo Ciclo · Primaria',
    focus: 'Exploración del entorno natural, estados de la materia, seres vivos y experiencias iniciales.'
  },
  '5° Grado': {
    stage: 'Segundo Ciclo · Primaria',
    focus: 'Mezclas cotidianas, energía, ecosistemas y método científico guiado para quinto grado.'
  },
  '6° Grado': {
    stage: 'Segundo Ciclo · Primaria',
    focus: 'Sistemas del cuerpo humano, electricidad básica, materia y preparación para tercer ciclo.'
  },
  '7° Grado': {
    stage: 'Tercer Ciclo · Secundaria',
    focus: 'Compuestos inorgánicos, genética y evolución, biodiversidad, ecología, agua y energía.'
  },
  '8° Grado': {
    stage: 'Tercer Ciclo · Secundaria',
    focus: 'Mecánica, energía, ondas, estequiometría y dispersiones, minerales y fisiología vegetal/animal.'
  },
  '9° Grado': {
    stage: 'Tercer Ciclo · Secundaria',
    focus: 'Fluidos, calor y temperatura, equilibrio químico, oceanografía, geología, electricidad y magnetismo.'
  },
  '1° Año Bachillerato': {
    stage: 'Educación Media I',
    focus: 'Electroquímica, electromagnetismo, óptica, química orgánica, biomoléculas, célula y fisiología.'
  },
  '2° Año Bachillerato': {
    stage: 'Educación Media II',
    focus: 'Astrofísica, física moderna, genética evolutiva, biodiversidad, biotecnología, materiales y ecología.'
  },
  'Gestión Académica': {
    stage: 'Archivo Institucional · ZIP',
    focus: 'Espacio reservado para paquetes comprimidos (.zip), formatos docentes, jornalizaciones y documentación académica.'
  }
};

export const WORD_DOC_TYPE_LABELS: Record<WordDocType, string> = {
  manual_practica: 'Manual de Práctica Completo',
  apuntes_clase: 'Guía Teórica / Apuntes',
  programa_estudio: 'Planificación / Programa',
  otro: 'Documento General'
};

export function gradeToAcademicLevel(grade: GradeLevel): AcademicLevel {
  if (grade === '4° Grado' || grade === '5° Grado' || grade === '6° Grado') return 'Primaria II';
  if (grade === '7° Grado' || grade === '8° Grado' || grade === '9° Grado') return 'Secundaria';
  if (grade === '1° Año Bachillerato' || grade === '2° Año Bachillerato') return 'Bachillerato';
  return 'Gestión Académica';
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)} USD`;
}
