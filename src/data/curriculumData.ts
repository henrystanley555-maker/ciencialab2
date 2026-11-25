import type { MaterialAdmin, MaterialPublic, MaterialSection, WordDocumentRecord } from '../types.ts';
import { COMPLEMENTARY_PRACTICE_GUIDES } from './generatedGuides.ts';

function guideIdsForSlug(slug: string): string[] {
  return COMPLEMENTARY_PRACTICE_GUIDES.filter((g) => g.id.startsWith(`mat-guia-${slug}-`)).map((g) => g.id);
}

function buildManualSectionsForGrade(grade: MaterialAdmin['grade']): MaterialSection[] {
  const guides = COMPLEMENTARY_PRACTICE_GUIDES.filter((g) => g.grade === grade);
  if (guides.length === 0) return [];

  const byUnit = new Map<string, string[]>();
  for (const g of guides) {
    const unit = g.durationOrScope.split('·')[0]?.trim() || 'Prácticas de Laboratorio';
    const list = byUnit.get(unit) || [];
    const objective = g.objectives[0] ? ` — ${g.objectives[0]}` : '';
    list.push(`${g.title.replace(/^Guion\s+/i, '')}${objective}`);
    byUnit.set(unit, list);
  }

  return Array.from(byUnit.entries()).map(([unit, practices]) => ({
    heading: unit,
    body: `Experiencias experimentales integradas en el manual de ${grade} (${practices.length} ${
      practices.length === 1 ? 'práctica' : 'prácticas'
    }).`,
    bullets: practices
  }));
}

export const UPLOADED_WORD_DOCS: WordDocumentRecord[] = [
  {
    id: 'word-manual-4to-2026',
    title: 'Manual de Prácticas de Laboratorio — 4.º Grado (Ciencia y Tecnología)',
    fileName: 'Manual_Practicas_4to_Grado_Ciencia_y_Tecnologia.docx',
    grade: '4° Grado',
    subjectArea: 'Ciencia y Tecnología',
    docType: 'manual_practica',
    extractedText:
      'MANUAL DE PRÁCTICAS DE LABORATORIO 4° GRADO: Unidad 1 Máquinas y Energía; Unidad 2 Nutrición; Unidad 3 Naturaleza y Ecosistemas; Unidad 4 Sistema Solar; Unidad 5 Cuerpo Humano; Unidad 6 Movimiento y Sistema Nervioso (19 prácticas).',
    wordCount: 3180,
    storedFilePath: 'word-ff881bd2-8a5c-43f2-b1e2-81a729382c29.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-4to-grado', ...guideIdsForSlug('4to')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-5to-2026',
    title: 'Manual de Prácticas de Laboratorio — 5.º Grado (Ciencia y Tecnología)',
    fileName: 'Manual_Practicas_5to_Grado_Ciencia_y_Tecnologia.docx',
    grade: '5° Grado',
    subjectArea: 'Ciencia y Tecnología',
    docType: 'manual_practica',
    extractedText:
      'MANUAL DE PRÁCTICAS DE LABORATORIO 5° GRADO: Unidad 1 Magnitudes Físicas; Unidad 2 Mecánica; Unidad 3 Estructura Atómica; Unidad 4 Tabla Periódica; Unidad 5 Ciencias del Espacio; Unidad 6 Ciencia de la Tierra (20 prácticas).',
    wordCount: 4920,
    storedFilePath: 'word-2eeab737-73f6-40bf-93d6-794d760a3c3c.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-5to-grado', ...guideIdsForSlug('5to')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-6to-2026',
    title: 'Manual de Prácticas de Laboratorio — 6.º Grado (Ciencia y Tecnología)',
    fileName: 'Manual_Practicas_6to_Grado_Ciencia_y_Tecnologia.docx',
    grade: '6° Grado',
    subjectArea: 'Ciencia y Tecnología',
    docType: 'manual_practica',
    extractedText:
      'MANUAL DE PRÁCTICAS DE LABORATORIO 6° GRADO: Unidad 1 Fluidos; Unidad 2 Calor y Temperatura; Unidad 3 Electricidad y Magnetismo; Unidad 4 Interacciones Químicas; Unidad 5 La Célula; Unidad 6 Biología del Desarrollo (24 prácticas).',
    wordCount: 5140,
    storedFilePath: 'word-a6cc2203-af97-4c43-a60e-dd35f65af262.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-6to-grado', ...guideIdsForSlug('6to')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-7mo-2027',
    title: 'Manual de Prácticas de Laboratorio — 7.º Grado (Ciencia y Tecnología)',
    fileName: 'Manual_Practicas_7mo_Grado_Ciencia_y_Tecnologia.docx',
    grade: '7° Grado',
    subjectArea: 'Ciencia y Tecnología',
    docType: 'manual_practica',
    extractedText:
      'MANUAL DE PRÁCTICAS DE LABORATORIO 7° GRADO: Unidad 1 Compuestos Inorgánicos; Unidad 2 Genética y Evolución; Unidad 3 Biodiversidad; Unidad 4 Ecología; Unidad 5 Recurso Hídrico; Unidad 6 Ambiente y Energía (24 prácticas).',
    wordCount: 7420,
    storedFilePath: 'word-17997560-bf84-4159-9eb8-ac0b1b657ff7.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-7mo-grado', ...guideIdsForSlug('7mo')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-8vo-2027',
    title: 'Manual de Prácticas de Laboratorio — 8.º Grado (Ciencia y Tecnología)',
    fileName: 'Manual_Practicas_8vo_Grado_Ciencia_y_Tecnologia.docx',
    grade: '8° Grado',
    subjectArea: 'Ciencia y Tecnología',
    docType: 'manual_practica',
    extractedText:
      'MANUAL DE PRÁCTICAS DE LABORATORIO 8° GRADO: Unidad 1 Mecánica; Unidad 2 Energía; Unidad 3 Ondas Mecánicas; Unidad 4 Estequiometría y Dispersiones; Unidad 5 Minerales; Unidad 6 Anatomía y Fisiología Vegetal; Unidad 7 Anatomía y Fisiología Animal (28 prácticas).',
    wordCount: 10340,
    storedFilePath: 'word-c43cf9ca-cea7-458a-abe5-4f71ab348106.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-8vo-grado', ...guideIdsForSlug('8vo')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-9no-2027',
    title: 'Manual de Prácticas de Laboratorio — 9.º Grado (Ciencia y Tecnología)',
    fileName: 'Manual_Practicas_9no_Grado_Ciencia_y_Tecnologia.docx',
    grade: '9° Grado',
    subjectArea: 'Ciencia y Tecnología',
    docType: 'manual_practica',
    extractedText:
      'MANUAL DE PRÁCTICAS DE LABORATORIO 9° GRADO: Unidad 1 Mecánica de Fluidos; Unidad 2 Calor y Temperatura; Unidad 3 Equilibrio Químico; Unidad 4 Oceanografía; Unidad 5 Geología de El Salvador; Unidad 6 Electricidad; Unidad 7 Magnetismo Aplicado (28 prácticas).',
    wordCount: 9580,
    storedFilePath: 'word-2b54aed0-37aa-4c9b-abf5-05a89d6566af.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-9no-grado', ...guideIdsForSlug('9no')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-1ro-bach-2027',
    title: 'Manual General de Prácticas de Laboratorio — 1.º Año de Bachillerato',
    fileName: 'Manual_General_Practicas_1er_Ano_Bachillerato.docx',
    grade: '1° Año Bachillerato',
    subjectArea: 'Ciencia y Tecnología (Educación Media)',
    docType: 'manual_practica',
    extractedText:
      'MANUAL GENERAL DE PRÁCTICAS 1° AÑO BACHILLERATO: Unidad 1 Electroquímica; Unidad 2 Electromagnetismo; Unidad 3 Óptica; Unidad 4 Introducción a la Química Orgánica; Unidad 5 Compuestos Orgánicos; Unidad 6 Biomoléculas; Unidad 7 Biología Celular; Unidad 8 Anatomía y Fisiología Humana (20 prácticas).',
    wordCount: 8420,
    storedFilePath: 'word-0d7be3aa-742c-4543-9853-fe023e6c44f9.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-1ro-bach', ...guideIdsForSlug('1ro-bach')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  },
  {
    id: 'word-manual-2do-bach-2027',
    title: 'Manual General de Prácticas de Laboratorio — 2.º Año de Bachillerato',
    fileName: 'Manual_General_Practicas_2do_Ano_Bachillerato.docx',
    grade: '2° Año Bachillerato',
    subjectArea: 'Ciencia y Tecnología (Educación Media)',
    docType: 'manual_practica',
    extractedText:
      'MANUAL GENERAL DE PRÁCTICAS 2° AÑO BACHILLERATO: Unidad 1 Ciencias del Espacio; Unidad 2 Introducción a la Física Moderna; Unidad 3 Bases Genéticas de la Evolución; Unidad 4 Análisis de Biodiversidad; Unidad 5 Biotecnología Microbiana; Unidad 6 Biotecnología Vegetal y Agroindustria; Unidad 7 Ciencia de Materiales; Unidad 8 Ecología y Ambiente (20 prácticas).',
    wordCount: 8290,
    storedFilePath: 'word-ff8f6fa0-e875-4532-8c61-dc69bb5e4a5b.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    generatedMaterialIds: ['mat-plan-docente-2do-bach', ...guideIdsForSlug('2do-bach')],
    uploadedAt: '2026-11-24T14:41:00.000Z'
  }
];

const MANUALS_AND_PLANS: MaterialAdmin[] = [
  // =========================================================================
  // 4° GRADO: Manual Completo + Planificación Curricular ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-4to',
    title: 'Manual Completo de Prácticas de Laboratorio — 4° Grado',
    subtitle: 'Documento completo sin desglosar en Word (.docx) con jornalización anual y 19 prácticas guiadas.',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Primaria II',
    grade: '4° Grado',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 26,
    durationOrScope: '6 Unidades · 19 Prácticas',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 4° Grado sin desglosar listo para imprimir o editar. Incluye 19 experiencias prácticas sobre máquinas simples, nutrición y almidón, ecosistemas y lluvia, Sistema Solar y eclipses, digestión, capacidad pulmonar, brazo articulado y sentidos.',
    generalOverviewPoints: [
      'Unidades 1 y 2: Palanca, plano inclinado, liga elástica, prueba de almidón y nutrición.',
      'Unidades 3 y 4: Mini ecosistema, cadena alimenticia, lluvia artificial, fases lunares y eclipses.',
      'Unidades 5 y 6: Sistema digestivo, ritmo cardíaco, pulmones, brazo articulado y percepción.'
    ],
    objectives: [
      'Ejecutar 19 prácticas seguras con materiales escolares y cotidianos en Segundo Ciclo.',
      'Disponer del manual completo editable en Word para docente y estudiantes.'
    ],
    tableOfContents: [
      '1. Jornalización anual de prácticas (4° Grado)',
      '2. Unidades 1 a 3: Máquinas y energía, nutrición y naturaleza',
      '3. Unidades 4 a 6: Sistema Solar, cuerpo humano y coordinación'
    ],
    featured: true,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-ff881bd2-8a5c-43f2-b1e2-81a729382c29.docx',
    customFileName: 'Manual_Practicas_4to_Grado_Ciencia_y_Tecnologia.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-4to-2026',
    downloadCount: 0,
    createdAt: '2026-11-24T15:00:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-4to-grado',
    title: 'Planificación Curricular Docente — 4° Grado',
    subtitle: 'Secuencia anual de contenidos, jornalización de las 19 prácticas y enlace con guiones Inicio-Desarrollo-Culminación.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Docentes',
    grade: '4° Grado',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Año Lectivo · 6 Unidades (19 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación anual para 4° Grado que coordina las 6 unidades del programa con las 19 prácticas del manual completo y sus 19 guiones breves de 1 página (Inicio, Desarrollo y Culminación).',
    generalOverviewPoints: [
      'Jornalización anual de febrero a octubre alineada a los 19 guiones complementarios.',
      'Secuencia por trimestre: Física inicial y nutrición; Naturaleza y Universo; Cuerpo Humano.',
      'Rúbrica sencilla de observación, bitácora ilustrada y participación en equipo.'
    ],
    objectives: [
      'Organizar semanalmente las clases de 4° Grado integrando los 19 guiones de 1 página.',
      'Fomentar habilidades de registro en tablas simples y formulación de conclusiones en primaria.'
    ],
    tableOfContents: [
      '1. Enfoque pedagógico y uso de los 19 guiones (Inicio · Desarrollo · Culminación)',
      '2. Trimestre I: Máquinas, Energía y Nutrición (Unidades 1 y 2)',
      '3. Trimestre II: Ecosistemas y Sistema Solar (Unidades 3 y 4)',
      '4. Trimestre III: Cuerpo Humano, Movimiento y Sentidos (Unidades 5 y 6)'
    ],
    featured: true,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-4to-2026',
    downloadCount: 0,
    createdAt: '2026-11-24T15:05:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Pedagógico y Uso de los 19 Guiones Breves (4° Grado)',
        body: 'Esta planificación dosifica las 19 prácticas de 4° Grado entre febrero y octubre. Cada sesión utiliza primero el guion complementario de 1 página correspondiente para dirigir los momentos de Inicio, Desarrollo y Culminación.',
        bullets: [
          'Inicio (10 min): Pregunta detonadora cotidiana del guion y verificación de materiales.',
          'Desarrollo (25 min): Explicación base sencilla y montaje guiado en equipos de 3 a 4 estudiantes.',
          'Culminación (10 min): Puesta en común de la tabla de datos y preguntas breves de cierre.'
        ]
      },
      {
        heading: '2. Trimestre I: Unidades 1 y 2 (Prácticas 1 a 6)',
        body: 'Introduce la mecánica cotidiana y los hábitos alimenticios saludables.',
        bullets: [
          'Unidad 1 (Máquinas y Energía): Palanca con regla y fulcro, plano inclinado casero y liga con carrito.',
          'Unidad 2 (Nutrición y Salud): Detección de almidón con yodo, calorías en etiquetas y control de peso/talla.'
        ]
      },
      {
        heading: '3. Trimestre II: Unidades 3 y 4 (Prácticas 7 a 12)',
        body: 'Conecta interacciones ecológicas cercanas con modelos astronómicos básicos.',
        bullets: [
          'Unidad 3 (Naturaleza): Mini ecosistema en botella, cadena alimenticia y modelo de lluvia.',
          'Unidad 4 (Sistema Solar): Fases de la Luna con galletas, maqueta planetaria y simulación de eclipses.'
        ]
      },
      {
        heading: '4. Trimestre III: Unidades 5 y 6 (Prácticas 13 a 19) y Evaluación',
        body: 'Explora anatomía funcional y coordinación neuro-motora con evaluación formativa continua.',
        bullets: [
          'Unidad 5 (Cuerpo Humano): Digestión en bolsa, frecuencia cardíaca y capacidad pulmonar con globos.',
          'Unidad 6 (Movimiento y Sentidos): Brazo articulado, tiempo de reacción con regla, equilibrio y sentidos.',
          'Evaluación sugerida: 45% bitácora y tablas · 30% participación y trabajo en equipo · 25% cierre oral/escrito.'
        ]
      }
    ]
  },

  // =========================================================================
  // 5° GRADO: Manual Completo + Planificación Curricular ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-5to',
    title: 'Manual Completo de Prácticas de Laboratorio — 5° Grado',
    subtitle: 'Documento completo sin desglosar en Word (.docx) con programación anual y 20 prácticas.',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Primaria II',
    grade: '5° Grado',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 30,
    durationOrScope: '6 Unidades · 20 Prácticas',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 5° Grado sin desglosar en formato Word editable. Cubre Magnitudes Físicas, Mecánica, Estructura Atómica, Tabla Periódica, Ciencias del Espacio y Ciencia de la Tierra a través de 20 prácticas estructuradas.',
    generalOverviewPoints: [
      'Unidades 1 y 2: Volumen de sólidos, densidad, movimiento rectilíneo, velocidad, fuerza y palanca.',
      'Unidades 3 y 4: Modelo atómico, protones/electrones, número atómico Z y tabla periódica.',
      'Unidades 5 y 6: Sistema Solar, rotación/traslación, fases lunares, capas terrestres y ciclo del agua.'
    ],
    objectives: [
      'Desarrollar 20 experiencias de medición física, química introductoria y geociencias.',
      'Disponer del manual completo editable listo para imprimir y entregar al grupo.'
    ],
    tableOfContents: [
      '1. Programación anual de prácticas 2026 (Prácticas 1 a 20)',
      '2. Unidades 1 a 3: Magnitudes físicas, mecánica y estructura atómica',
      '3. Unidades 4 a 6: Tabla periódica, espacio y ciencia de la Tierra'
    ],
    featured: true,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-2eeab737-73f6-40bf-93d6-794d760a3c3c.docx',
    customFileName: 'Manual_Practicas_5to_Grado_Ciencia_y_Tecnologia.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-5to-2026',
    downloadCount: 0,
    createdAt: '2026-11-24T15:00:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-5to-grado',
    title: 'Planificación Curricular Docente — 5° Grado',
    subtitle: 'Secuencia anual, jornalización quincenal y orientación para las 20 prácticas y sus 20 guiones breves.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Docentes',
    grade: '5° Grado',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Año Lectivo · 6 Unidades (20 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación anual para el docente de 5° Grado que integra las 6 unidades curriculares con las 20 prácticas del manual y sus 20 guiones complementarios de 1 página (Inicio, Desarrollo y Culminación).',
    generalOverviewPoints: [
      'Calendario de febrero a noviembre distribuyendo las 20 prácticas de forma quincenal.',
      'Integración de fórmulas sencillas (volumen, densidad, velocidad y número atómico Z).',
      'Criterios de evaluación para modelos atómicos, tablas periódicas y maquetas terrestres.'
    ],
    objectives: [
      'Articular cada contenido teórico de 5° Grado con su guion breve de 1 página.',
      'Introducir el cálculo básico cuantitativo y la modelación química/astronómica en primaria.'
    ],
    tableOfContents: [
      '1. Enfoque curricular y dinámica con los 20 guiones (Inicio · Desarrollo · Culminación)',
      '2. Bloque Físico: Magnitudes Físicas y Mecánica (Prácticas 1 a 6)',
      '3. Bloque Químico: Estructura Atómica y Tabla Periódica (Prácticas 7 a 14)',
      '4. Bloque Tierra y Espacio: Astronomía y Geología (Prácticas 15 a 20)'
    ],
    featured: true,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-5to-2026',
    downloadCount: 0,
    createdAt: '2026-11-24T15:05:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Metodológico y Uso de los 20 Guiones (5° Grado)',
        body: 'Organiza el año escolar en tres bloques de febrero a noviembre. Cada una de las 20 prácticas cuenta con un guion complementario de 1 página diseñado bajo el esquema Inicio, Desarrollo y Culminación.',
        bullets: [
          'Antes de experimentar: lectura rápida del bloque Inicio del guion para conectar saberes previos.',
          'Durante el desarrollo: registro de mediciones (cm³, g/cm³, m/s) o armado de modelos concretos.'
        ]
      },
      {
        heading: '2. Bloque I: Magnitudes Físicas y Mecánica (Prácticas 1 a 6)',
        body: 'Desarrolla destrezas de medición geométrica y comprensión inicial del movimiento.',
        bullets: [
          'Unidad 1 (Magnitudes): Volumen de prismas regulares (V = l×a×h) y densidad de sólidos (D = m/V).',
          'Unidad 2 (Mecánica): Movimiento rectilíneo, velocidad promedio, efectos de fuerza y construcción de palanca.'
        ]
      },
      {
        heading: '3. Bloque II: Estructura Atómica y Tabla Periódica (Prácticas 7 a 14)',
        body: 'Introduce la materia desde sus partículas fundamentales hasta la organización periódica.',
        bullets: [
          'Unidad 3 (Átomo): Maqueta atómica, protones/neutrones/electrones, cálculo de Z y distribución electrónica.',
          'Unidad 4 (Tabla Periódica): Ubicación por grupos/periodos, metales vs no metales, propiedades y usos diarios.'
        ]
      },
      {
        heading: '4. Bloque III: Ciencias del Espacio y de la Tierra (Prácticas 15 a 20)',
        body: 'Culmina con modelado astronómico y dinámica terrestre más evaluación formativa.',
        bullets: [
          'Unidades 5 y 6: Sistema Solar, rotación y traslación, fases lunares, capas de la Tierra, rocas y ciclo del agua.',
          'Evaluación sugerida: 40% ejecución y tablas de cálculo · 35% comprensión de guiones · 25% modelos y cierre.'
        ]
      }
    ]
  },

  // =========================================================================
  // 6° GRADO: Manual Completo + Planificación Curricular ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-6to',
    title: 'Manual Completo de Prácticas de Laboratorio — 6° Grado',
    subtitle: 'Documento completo sin desglosar en Word (.docx) con jornalización anual y 24 prácticas.',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Primaria II',
    grade: '6° Grado',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 34,
    durationOrScope: '6 Unidades · 24 Prácticas',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 6° Grado sin desglosar en formato Word editable. Abarca Fluidos, Calor y Temperatura, Electricidad y Magnetismo, Interacciones Químicas, La Célula y Biología del Desarrollo con proyectos integradores.',
    generalOverviewPoints: [
      'Unidades 1 y 2: Presión en líquidos, flotación, acueducto casero, calor/temperatura y dilatación.',
      'Unidades 3 y 4: Electrostática, circuito eléctrico simple, enlaces químicos, solubilidad y reacciones.',
      'Unidades 5 y 6: Biomoléculas, células vegetales, organelos, modelo de ADN, ciclo celular y plantas.'
    ],
    objectives: [
      'Realizar las 24 prácticas y proyectos integradores de transición hacia Tercer Ciclo.',
      'Contar con el manual completo editable en Word para imprimir o adaptar en aula.'
    ],
    tableOfContents: [
      '1. Jornalización anual de prácticas (Prácticas 1 a 24)',
      '2. Unidades 1 a 3: Fluidos, Calor y Electricidad/Magnetismo',
      '3. Unidades 4 a 6: Interacciones Químicas, Célula y Biología del Desarrollo'
    ],
    featured: true,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-a6cc2203-af97-4c43-a60e-dd35f65af262.docx',
    customFileName: 'Manual_Practicas_6to_Grado_Ciencia_y_Tecnologia.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-6to-2026',
    downloadCount: 0,
    createdAt: '2026-11-24T15:00:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-6to-grado',
    title: 'Planificación Curricular Docente — 6° Grado',
    subtitle: 'Secuencia anual y dosificación por proyectos para las 24 prácticas y sus 24 guiones breves.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Docentes',
    grade: '6° Grado',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Año Lectivo · 6 Unidades (24 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación anual para el docente de 6° Grado que organiza las 6 unidades, 24 prácticas (incluidos proyectos integradores) y sus 24 guiones complementarios de 1 página bajo Inicio, Desarrollo y Culminación.',
    generalOverviewPoints: [
      'Progresión completa de las 6 unidades con proyecto integrador al cierre de cada unidad.',
      'Integración directa de los 24 guiones de 1 página previos al trabajo de laboratorio.',
      'Criterios de evaluación por proyectos y manejo seguro de agua, pilas y circuitos.'
    ],
    objectives: [
      'Coordinar el cierre de Segundo Ciclo enlazando teoría y práctica en las 24 sesiones.',
      'Preparar al estudiante para Tercer Ciclo mediante proyectos integradores y análisis causal.'
    ],
    tableOfContents: [
      '1. Metodología por proyectos y uso de los 24 guiones de 1 página',
      '2. Trimestre I: Fluidos y Calor/Temperatura (Prácticas 1 a 8)',
      '3. Trimestre II: Electricidad/Magnetismo e Interacciones Químicas (Prácticas 9 a 16)',
      '4. Trimestre III: La Célula y Biología del Desarrollo (Prácticas 17 a 24)'
    ],
    featured: true,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-6to-2026',
    downloadCount: 0,
    createdAt: '2026-11-24T15:05:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque por Proyectos y Uso de los 24 Guiones (6° Grado)',
        body: 'Cada unidad de 6° Grado consta de tres experiencias experimentales más un Proyecto Integrador. Los 24 guiones breves de 1 página orientan cada sesión con la secuencia Inicio, Desarrollo y Culminación.',
        bullets: [
          'Inicio (10 min): Activación con fenómeno cercano del hogar y objetivo de la práctica.',
          'Desarrollo (25 min): Fundamento físico, químico o biológico + experimento y tabla de datos.',
          'Culminación (10 min): Socialización de resultados y preguntas clave de consolidación.'
        ]
      },
      {
        heading: '2. Trimestre I: Fluidos y Calor/Temperatura (Prácticas 1 a 8)',
        body: 'Estudia propiedades de fluidos en reposo/movimiento y fenómenos térmicos cotidianos.',
        bullets: [
          'Unidad 1 (Fluidos, Prácticas 1–4): Presión hidrostática, flotación, flujo en tubos y acueducto casero.',
          'Unidad 2 (Calor y Temperatura, Prácticas 5–8): Diferencia calor-temperatura, transmisión y cambios térmicos.'
        ]
      },
      {
        heading: '3. Trimestre II: Electricidad e Interacciones Químicas (Prácticas 9 a 16)',
        body: 'Aborda circuitos básicos de bajo voltaje y transformaciones de la materia.',
        bullets: [
          'Unidad 3 (Electricidad, Prácticas 9–12): Electrostática, cargas, circuito simple y conductores/aislantes.',
          'Unidad 4 (Química, Prácticas 13–16): Enlaces químicos, solubilidad, evidencias de reacción y rally químico.'
        ]
      },
      {
        heading: '4. Trimestre III: La Célula y Biología del Desarrollo (Prácticas 17 a 24)',
        body: 'Cierra el año explorando biomoléculas, organización celular y herencia vegetal con evaluación integral.',
        bullets: [
          'Unidad 5 (La Célula, Prácticas 17–20): Biomoléculas, células vegetales, maqueta reciclada y organelos.',
          'Unidad 6 (Desarrollo, Prácticas 21–24): Modelo de ADN, ciclo celular, germinación y ciclo de vida vegetal.',
          'Evaluación sugerida: 40% prácticas y registro · 30% proyectos integradores · 30% guiones y cierre.'
        ]
      }
    ]
  },

  // =========================================================================
  // 7° GRADO: Manual Completo + Planificación Curricular ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-7mo',
    title: 'Manual Completo de Prácticas de Laboratorio — 7° Grado',
    subtitle: 'Documento completo sin desglosar en Word (.docx) con jornalización anual y 24 prácticas de laboratorio.',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Secundaria',
    grade: '7° Grado',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 32,
    durationOrScope: '6 Unidades · 24 Prácticas',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 7° Grado sin desglosar. Integra experiencias con materiales accesibles sobre compuestos inorgánicos, herencia y evolución, biodiversidad, ecosistemas, purificación de agua y energías renovables.',
    generalOverviewPoints: [
      'Unidad 1: Indicadores naturales de pH, ácidos, bases y formación de sales.',
      'Unidad 2 y 3: Herencia familiar, fósiles, clasificación de especies y conservación.',
      'Unidad 4 a 6: Ecosistema en botella, filtros de agua, horno solar y celda de limón.'
    ],
    objectives: [
      'Ejecutar 24 prácticas seguras y accesibles alineadas al programa de 7° Grado.',
      'Disponer del manual completo editable sin desglosar listo para imprimir o adaptar.'
    ],
    tableOfContents: [
      '1. Jornalización anual propuesta (7° Grado)',
      '2. Unidades 1 a 3: Química inorgánica, genética y biodiversidad',
      '3. Unidades 4 a 6: Ecología, recurso hídrico y energía'
    ],
    featured: true,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-17997560-bf84-4159-9eb8-ac0b1b657ff7.docx',
    customFileName: 'Manual_Practicas_7mo_Grado_Ciencia_y_Tecnologia.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-7mo-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:41:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-7mo-grado',
    title: 'Planificación Curricular Docente — 7° Grado',
    subtitle: 'Secuencia anual de contenidos, jornalización de prácticas e indicadores para los 24 guiones de 7° Grado.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Docentes',
    grade: '7° Grado',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Año Lectivo · 6 Unidades (24 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación completa para el docente de 7° Grado que articula las 6 unidades oficiales (Compuestos Inorgánicos, Genética, Biodiversidad, Ecología, Recurso Hídrico y Energía) con las 24 prácticas del manual y sus 24 guiones breves.',
    generalOverviewPoints: [
      'Distribución en 3 trimestres cubriendo las 6 unidades del manual completo.',
      'Vinculación directa de cada clase teórica con las 24 prácticas y sus guiones de 1 página.',
      'Indicadores de logro y rúbricas de bitácora, debate y feria científica.'
    ],
    objectives: [
      'Dosificar semanalmente la teoría y las 24 actividades del manual de 7° Grado.',
      'Integrar el Guion Complementario de 1 página (Inicio, Desarrollo y Culminación) en cada sesión.',
      'Evaluar competencias científicas y trabajo colaborativo con criterios objetivos.'
    ],
    tableOfContents: [
      '1. Dosificación trimestral de las 6 unidades (febrero – noviembre)',
      '2. Secuencia didáctica: Compuestos Inorgánicos, Genética y Biodiversidad',
      '3. Secuencia didáctica: Ecología, Recurso Hídrico y Energía',
      '4. Estrategia de evaluación y rúbrica de laboratorio'
    ],
    featured: true,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-7mo-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:44:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Metodológico y Dosificación Anual (7° Grado)',
        body: 'Esta planificación organiza el ciclo lectivo de 7° Grado en tres trimestres, enlazando el contenido teórico del programa oficial con las 24 prácticas del Manual Completo y sus 24 guiones breves.',
        bullets: [
          'Inicio de cada sesión: aplicar el Guion Complementario de 1 página correspondiente para fijar vocabulario y propósito.',
          'Durante el laboratorio: trabajo en equipos de 3 a 4 estudiantes con registro ordenado de hipótesis y observaciones.',
          'Culminación: socialización de resultados y aplicación cotidiana con enfoque ambiental.'
        ]
      },
      {
        heading: '2. Trimestre I: Unidades 1 y 2 (Febrero – Abril)',
        body: 'Introduce la química experimental cotidiana y los principios fundamentales de herencia biológica y evolución.',
        bullets: [
          'Unidad 1 (Compuestos Inorgánicos, Prácticas 1–4): Ácidos/bases caseros, reacciones y sales, clasificación y usos cotidianos.',
          'Unidad 2 (Genética y Evolución, Prácticas 5–8): Rasgos heredados, herencia mendeliana con fichas, fósiles y debate evolutivo.'
        ]
      },
      {
        heading: '3. Trimestre II: Unidades 3 y 4 (Mayo – Agosto)',
        body: 'Fortalece el análisis taxonómico local y la comprensión dinámica de cadenas alimentarias y equilibrio ecológico.',
        bullets: [
          'Unidad 3 (Biodiversidad, Prácticas 9–12): Especies locales, vertebrados/invertebrados, pérdida y campaña de protección.',
          'Unidad 4 (Ecología, Prácticas 13–16): Ecosistema en botella, cadena alimentaria, impacto humano y conservación.'
        ]
      },
      {
        heading: '4. Trimestre III: Unidades 5 y 6 (Septiembre – Noviembre) y Evaluación',
        body: 'Cierra el año con gestión responsable del agua y transformaciones energéticas limpias.',
        bullets: [
          'Unidad 5 (Recurso Hídrico, Prácticas 17–20): Purificación casera, ciclo en modelo cerrado, ahorro y contaminación.',
          'Unidad 6 (Ambiente y Energía, Prácticas 21–24): Horno solar casero, pila de limón, energías renovables y feria final.',
          'Ponderación sugerida: 40% ejecución experimental y bitácora · 35% dominio teórico · 25% debates y proyecto final.'
        ]
      }
    ]
  },

  // =========================================================================
  // 8° GRADO: Manual Completo + Planificación Curricular ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-8vo',
    title: 'Manual Completo de Prácticas de Laboratorio — 8° Grado',
    subtitle: 'Documento completo sin desglosar en Word (.docx) con jornalización anual y 28 prácticas.',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Secundaria',
    grade: '8° Grado',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 38,
    durationOrScope: '7 Unidades · 28 Prácticas',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 8° Grado sin desglosar en formato Word editable. Cubre Mecánica, Energía, Ondas Mecánicas, Estequiometría y Dispersiones, Minerales, Anatomía Vegetal y Anatomía Animal.',
    generalOverviewPoints: [
      'Unidades 1 a 3: Leyes de Newton, péndulo, energía mecánica y ondas sonoras.',
      'Unidades 4 y 5: Dispersiones, estequiometría inicial y dureza mineral de Mohs.',
      'Unidades 6 y 7: Capilaridad, germinación, respiración y sistema circulatorio.'
    ],
    objectives: [
      'Desarrollar 28 experiencias prácticas de física, química, mineralogía y biología.',
      'Contar con el manual completo en Word listo para adaptar o imprimir.'
    ],
    tableOfContents: [
      '1. Jornalización anual de prácticas (8° Grado)',
      '2. Unidades 1 a 4: Mecánica, Energía, Ondas y Dispersiones',
      '3. Unidades 5 a 7: Minerales, Fisiología Vegetal y Fisiología Animal'
    ],
    featured: false,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-c43cf9ca-cea7-458a-abe5-4f71ab348106.docx',
    customFileName: 'Manual_Practicas_8vo_Grado_Ciencia_y_Tecnologia.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-8vo-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:41:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-8vo-grado',
    title: 'Planificación Curricular Docente — 8° Grado',
    subtitle: 'Secuencia didáctica anual, jornalización y evaluación para las 28 prácticas y sus 28 guiones de 8° Grado.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Docentes',
    grade: '8° Grado',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Año Lectivo · 7 Unidades (28 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación anual estructurada para el docente de 8° Grado: integra las 28 prácticas de Mecánica, Energía, Ondas, Estequiometría y Dispersiones, Minerales, Anatomía Vegetal y Animal junto con sus 28 guiones de 1 página.',
    generalOverviewPoints: [
      'Secuenciación trimestral de las 7 unidades y 28 prácticas del programa de 8° Grado.',
      'Guía metodológica para conectar fórmulas físicas y químicas con los 28 guiones breves.',
      'Criterios de evaluación para tablas de medición, gráficos y reportes.'
    ],
    objectives: [
      'Coordinar las clases teóricas de 8° Grado con las 28 sesiones de laboratorio.',
      'Estandarizar el uso de unidades del Sistema Internacional (SI) y análisis de datos.',
      'Integrar el Guion Complementario de 1 página (Inicio, Desarrollo y Culminación) en cada sesión.'
    ],
    tableOfContents: [
      '1. Enfoque curricular y dosificación anual (8° Grado)',
      '2. Trimestre I: Mecánica y Energía (Unidades 1 y 2)',
      '3. Trimestre II: Ondas, Estequiometría/Dispersiones y Minerales (Unidades 3 a 5)',
      '4. Trimestre III: Anatomía Vegetal y Animal (Unidades 6 y 7) + Evaluación'
    ],
    featured: false,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-8vo-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:44:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Metodológico Anual (8° Grado)',
        body: 'Estructura el año lectivo combinando experimentación guiada con análisis cuantitativo sencillo para 28 prácticas con insumos accesibles y sus 28 guiones de 1 página.',
        bullets: [
          'Inicio de cada sesión: apertura mediante el Guion Complementario correspondiente a la práctica del día.',
          'Durante la práctica: medición sistemática de tiempo, distancia, masa o volumen en unidades SI.'
        ]
      },
      {
        heading: '2. Trimestre I: Unidades 1 y 2 (Mecánica y Energía)',
        body: 'Consolida las bases de cinemática, dinámica de fuerzas y transformaciones energéticas cotidianas.',
        bullets: [
          'Unidad 1 (Mecánica, Prácticas 1–4): Fuerzas con globos, velocidad en rampa, fricción en superficies y 3.ª ley de Newton.',
          'Unidad 2 (Energía, Prácticas 5–8): Energías en el hogar, péndulo simple, cálculo de Ep y conservación mecánica.'
        ]
      },
      {
        heading: '3. Trimestre II: Unidades 3, 4 y 5 (Ondas, Química y Minerales)',
        body: 'Conecta fenómenos vibratorios, separación de mezclas, proporciones químicas y propiedades físicas de minerales.',
        bullets: [
          'Unidad 3 (Ondas Mecánicas, Prácticas 9–12): Ondas en cuerda, vibración sonora con arroz, frecuencia y ondas en agua.',
          'Unidad 4 (Estequiometría y Dispersiones, Prácticas 13–16): Mezclas, solubilidad, soluciones y reacción vinagre-bicarbonato.',
          'Unidad 5 (Minerales, Prácticas 17–20): Identificación visual, dureza Mohs, minerales en el hogar y rocas locales.'
        ]
      },
      {
        heading: '4. Trimestre III: Unidades 6 y 7 (Fisiología Viva) y Evaluación',
        body: 'Explora estructura-función en plantas y sistemas vitales animales con criterios de evaluación balanceados.',
        bullets: [
          'Unidad 6 (Anatomía Vegetal, Prácticas 21–24): Disección floral, fotosíntesis, capilaridad y germinación.',
          'Unidad 7 (Anatomía Animal, Prácticas 25–28): Pulmones con globos, corazón, digestión mecánica y etiquetas.',
          'Evaluación sugerida: 40% laboratorio y tablas de datos · 35% dominio teórico · 25% conclusiones escritas.'
        ]
      }
    ]
  },

  // =========================================================================
  // 9° GRADO: Manual Completo + Planificación Curricular ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-9no',
    title: 'Manual Completo de Prácticas de Laboratorio — 9° Grado',
    subtitle: 'Documento completo sin desglosar en Word (.docx) con jornalización anual y 28 prácticas.',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Secundaria',
    grade: '9° Grado',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 40,
    durationOrScope: '7 Unidades · 28 Prácticas',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 9° Grado sin desglosar en formato Word editable. Abarca Mecánica de Fluidos, Calor y Temperatura, Equilibrio Químico, Oceanografía, Geología de El Salvador, Electricidad y Magnetismo.',
    generalOverviewPoints: [
      'Unidades 1 a 3: Densidad, Pascal, Arquímedes, dilatación térmica y equilibrio químico.',
      'Unidades 4 y 5: Corrientes oceánicas, salinidad, rocas y geología volcánica local.',
      'Unidades 6 y 7: Carga eléctrica, circuitos serie/paralelo, electroimanes e inducción.'
    ],
    objectives: [
      'Aplicar principios de fluidos, termodinámica, equilibrio y electromagnetismo en 28 prácticas.',
      'Editar e imprimir las guías completas de 9° Grado directamente desde Word.'
    ],
    tableOfContents: [
      '1. Jornalización anual de prácticas (9° Grado)',
      '2. Unidades 1 a 4: Fluidos, Calor, Equilibrio y Oceanografía',
      '3. Unidades 5 a 7: Geología local, Electricidad y Magnetismo'
    ],
    featured: false,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-2b54aed0-37aa-4c9b-abf5-05a89d6566af.docx',
    customFileName: 'Manual_Practicas_9no_Grado_Ciencia_y_Tecnologia.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-9no-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:41:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-9no-grado',
    title: 'Planificación Curricular Docente — 9° Grado',
    subtitle: 'Programación anual y secuencia didáctica para las 28 prácticas y sus 28 guiones de 9° Grado.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología',
    level: 'Docentes',
    grade: '9° Grado',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Año Lectivo · 7 Unidades (28 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación docente de 9° Grado que enlaza las sesiones teóricas con las 28 prácticas de Fluidos, Calor, Equilibrio Químico, Oceanografía, Geología de El Salvador, Electricidad y Magnetismo más sus 28 guiones breves.',
    generalOverviewPoints: [
      'Jornalización anual ordenada de las 7 unidades y 28 prácticas de cierre de Tercer Ciclo.',
      'Orientaciones de seguridad eléctrica y térmica en el laboratorio escolar.',
      'Instrumentos de evaluación formativa y sumativa vinculados a cada guion de 1 página.'
    ],
    objectives: [
      'Planificar la progresión conceptual y experimental de cierre de Tercer Ciclo.',
      'Garantizar manejo seguro de circuitos eléctricos y fuentes de calor en clase.',
      'Vincular cada Guion Complementario de 1 página (Inicio, Desarrollo y Culminación) con su práctica.'
    ],
    tableOfContents: [
      '1. Enfoque curricular de 9° Grado y seguridad en laboratorio',
      '2. Trimestre I: Mecánica de Fluidos y Calor (Unidades 1 y 2)',
      '3. Trimestre II: Equilibrio Químico, Oceanografía y Geología (Unidades 3 a 5)',
      '4. Trimestre III: Electricidad y Magnetismo (Unidades 6 y 7) + Evaluación'
    ],
    featured: false,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-9no-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:44:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Curricular y Normas de Seguridad (9° Grado)',
        body: 'Prepara al estudiantado para Educación Media articulando las 7 unidades oficiales mediante 28 prácticas cuantitativas controladas y sus 28 guiones breves.',
        bullets: [
          'Antes de cada práctica: estudio breve del Guion Complementario de 1 página correspondiente.',
          'Seguridad térmica y eléctrica: manipular agua caliente bajo supervisión y emplear pilas de bajo voltaje (1.5V–9V).'
        ]
      },
      {
        heading: '2. Trimestre I: Unidades 1 y 2 (Fluidos y Termodinámica Inicial)',
        body: 'Desarrolla el estudio de fluidos en reposo y fenómenos térmicos mediante montajes escolares reproducibles.',
        bullets: [
          'Unidad 1 (Mecánica de Fluidos, Prácticas 1–4): Viscosidad comparada, presión hidrostática, Pascal y Arquímedes.',
          'Unidad 2 (Calor y Temperatura, Prácticas 5–8): Dilatación térmica, conducción/convección/radiación, termómetro y aislantes.'
        ]
      },
      {
        heading: '3. Trimestre II: Unidades 3, 4 y 5 (Equilibrio, Océanos y Geología)',
        body: 'Conecta la reversibilidad química con la dinámica oceánica y el relieve volcánico y sísmico regional.',
        bullets: [
          'Unidad 3 (Equilibrio Químico, Prácticas 9–12): Reacciones reversibles, temperatura, concentración y presión en gases.',
          'Unidad 4 (Oceanografía, Prácticas 13–16): Corrientes marinas, densidad y salinidad, olas y sedimentación.',
          'Unidad 5 (Geología de El Salvador, Prácticas 17–20): Rocas locales, erupción volcánica, placas tectónicas y erosión.'
        ]
      },
      {
        heading: '4. Trimestre III: Unidades 6 y 7 (Electricidad y Magnetismo) y Evaluación',
        body: 'Integra análisis de circuitos con electromagnetismo aplicado y criterios de valoración equilibrados.',
        bullets: [
          'Unidad 6 (Electricidad, Prácticas 21–24): Circuito simple, conductores/aislantes, serie/paralelo e interruptor casero.',
          'Unidad 7 (Magnetismo Aplicado, Prácticas 25–28): Imantación, líneas de campo, brújula y electroimán casero.',
          'Ponderación sugerida: 40% montaje experimental y seguridad · 35% dominio teórico · 25% análisis gráfico.'
        ]
      }
    ]
  },

  // =========================================================================
  // 1° AÑO BACHILLERATO: Manual Completo + Planificación ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-1ro-bach',
    title: 'Manual Completo de Prácticas de Laboratorio — 1° Año Bachillerato',
    subtitle: 'Manual MINED completo sin desglosar en Word (.docx) con 20 prácticas quincenales (2027).',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología (Educación Media)',
    level: 'Bachillerato',
    grade: '1° Año Bachillerato',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 42,
    durationOrScope: '8 Unidades · 20 Prácticas Quincenales',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 1° Año de Bachillerato sin desglosar en formato Word editable. Incluye Electroquímica, Electromagnetismo, Óptica, Química Orgánica, Biomoléculas, Biología Celular y Fisiología Humana.',
    generalOverviewPoints: [
      'Unidades 1 a 3: Celdas galvánicas, inducción de Faraday-Lenz, espectroscopio y lentes.',
      'Unidades 4 a 6: Hibridación del carbono, grupos funcionales, ADN y almidón.',
      'Unidades 7 y 8: Enzima catalasa, fermentación, cromatografía y fisiología humana.'
    ],
    objectives: [
      'Desarrollar las 20 prácticas quincenales de Educación Media con notación SI/IUPAC.',
      'Contar con el documento completo editable en Word para docente y estudiantes.'
    ],
    tableOfContents: [
      '1. Jornalización quincenal 2027 (Prácticas 1 a 20)',
      '2. Unidades 1 a 4: Electroquímica, Electromagnetismo, Óptica y Química Orgánica',
      '3. Unidades 5 a 8: Compuestos Orgánicos, Biomoléculas, Célula y Fisiología'
    ],
    featured: true,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-0d7be3aa-742c-4543-9853-fe023e6c44f9.docx',
    customFileName: 'Manual_General_Practicas_1er_Ano_Bachillerato.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-1ro-bach-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:41:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-1ro-bach',
    title: 'Planificación Curricular Docente — 1° Año Bachillerato',
    subtitle: 'Jornalización quincenal docente 2027 para las 8 unidades y 20 guiones breves de 1° Año.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología (Educación Media)',
    level: 'Docentes',
    grade: '1° Año Bachillerato',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Jornalización Quincenal 2027 · 8 Unidades (20 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación docente de Educación Media alineada al Manual 2027 (enero–octubre): coordina las 8 unidades MINED, 20 prácticas quincenales, 20 guiones breves de 1 página, normas SI/IUPAC y evaluación auténtica.',
    generalOverviewPoints: [
      'Calendario quincenal enero–octubre 2027 vinculado al manual de prácticas.',
      'Secuenciación de Electroquímica, Electromagnetismo, Óptica, Orgánica y Biología.',
      'Rúbricas de evaluación auténtica integradas con los 20 guiones Inicio-Desarrollo-Culminación.'
    ],
    objectives: [
      'Sincronizar la teoría de aula con las 20 prácticas quincenales de 1° Año.',
      'Aplicar criterios uniformes de medición, nomenclatura IUPAC, seguridad y análisis.',
      'Integrar cada Guion Complementario de 1 página antes y después del trabajo experimental.'
    ],
    tableOfContents: [
      '1. Enfoque ICC+I y cronograma quincenal 2027',
      '2. Trimestre I: Electroquímica, Electromagnetismo y Óptica (Unidades 1 a 3)',
      '3. Trimestre II: Química Orgánica y Grupos Funcionales (Unidades 4 y 5)',
      '4. Trimestre III: Biomoléculas, Célula y Fisiología (Unidades 6 a 8) + Evaluación'
    ],
    featured: false,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-1ro-bach-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:44:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Pedagógico y Jornalización Quincenal 2027',
        body: 'Coordina cada 15 días las 20 prácticas oficiales (enero–octubre 2027) con el programa oficial de Ciencia y Tecnología bajo el enfoque ICC+I y sus 20 guiones breves.',
        bullets: [
          'Inicio con guion de 1 página: revisión teórica previa y notación SI/IUPAC.',
          'Sesión experimental: ejecución por equipos, registro cuantitativo y cálculo de error porcentual.'
        ]
      },
      {
        heading: '2. Bloque Físico-Químico: Unidades 1 a 3 (Enero – Abril)',
        body: 'Integra electroquímica cuantitativa, inducción electromagnética, ondas y óptica geométrica y física.',
        bullets: [
          'Unidad 1 (Electroquímica, Prácticas 1–2): Conductividad de electrolitos, celda galvánica (E°celda) y electrólisis del agua.',
          'Unidad 2 (Electromagnetismo, Prácticas 3–4): Ley de Faraday-Lenz, generador escolar y propagación/atenuación RF.',
          'Unidad 3 (Óptica, Prácticas 5–7): Espectroscopio de difracción, Ley de Snell y banco óptico de lentes delgadas.'
        ]
      },
      {
        heading: '3. Bloque Orgánico: Unidades 4 y 5 (Mayo – Julio)',
        body: 'Introduce la química del carbono desde su geometría de enlace hasta la identificación analítica de grupos funcionales.',
        bullets: [
          'Unidad 4 (Introducción Orgánica, Prácticas 8–9): Hibridación sp³/sp²/sp, hidrocarburos saturados/insaturados y combustión.',
          'Unidad 5 (Compuestos Orgánicos, Prácticas 10–12): Alcoholes, fenoles, carbonilos/carboxilos e isomería estereoquímica.'
        ]
      },
      {
        heading: '4. Bloque Bioquímico y Fisiológico: Unidades 6 a 8 (Julio – Octubre)',
        body: 'Articula biomoléculas, metabolismo celular y fisiología humana con evaluación experimental auténtica.',
        bullets: [
          'Unidad 6 (Biomoléculas, Prácticas 13–15): Proteínas, carbohidratos, lípidos y extracción de ADN.',
          'Unidad 7 (Biología Celular, Prácticas 16–18): Actividad enzimática de catalasa, fermentación y cromatografía (Rf).',
          'Unidad 8 (Fisiología Humana, Prácticas 19–20): Respuesta cardiovascular, respiratoria y evaluación final (40/35/25%).'
        ]
      }
    ]
  },

  // =========================================================================
  // 2° AÑO BACHILLERATO: Manual Completo + Planificación ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-manual-practicas-2do-bach',
    title: 'Manual Completo de Prácticas de Laboratorio — 2° Año Bachillerato',
    subtitle: 'Manual MINED completo sin desglosar en Word (.docx) con 20 prácticas quincenales (2027).',
    category: 'practicas',
    subjectArea: 'Ciencia y Tecnología (Educación Media)',
    level: 'Bachillerato',
    grade: '2° Año Bachillerato',
    price: 15,
    currency: 'USD',
    format: 'DOCX Completo (Editable)',
    pages: 44,
    durationOrScope: '8 Unidades · 20 Prácticas Quincenales',
    coverImage: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
    previewExcerpt:
      'Manual íntegro de 2° Año de Bachillerato sin desglosar en Word editable. Cubre Ciencias del Espacio, Física Moderna, Genética Evolutiva, Biodiversidad, Biotecnología Microbiana y Vegetal, Ciencia de Materiales y Ecología.',
    generalOverviewPoints: [
      'Unidades 1 y 2: Masa de la Tierra, tránsito de exoplanetas, constante de Planck y vida media.',
      'Unidades 3 y 4: Mitosis, prueba Chi-cuadrado, similitud Jaccard/Sørensen y UPGMA.',
      'Unidades 5 a 8: Microbiología estéril, hidroponía, bioplásticos, DBO y calidad del agua.'
    ],
    objectives: [
      'Ejecutar las 20 prácticas preuniversitarias de 2° Año con enfoque investigativo.',
      'Contar con el manual íntegro editable en Word listo para clase.'
    ],
    tableOfContents: [
      '1. Jornalización anual quincenal 2027',
      '2. Unidades 1 a 4: Astrofísica, Física Moderna, Genética y Biodiversidad',
      '3. Unidades 5 a 8: Biotecnología Microbiana, Vegetal, Materiales y Ecología'
    ],
    featured: false,
    published: true,
    hasCustomFile: true,
    customFilePath: 'word-ff8f6fa0-e875-4532-8c61-dc69bb5e4a5b.docx',
    customFileName: 'Manual_General_Practicas_2do_Ano_Bachillerato.docx',
    customFileMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sourceWordId: 'word-manual-2do-bach-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:41:00.000Z',
    contentSections: []
  },
  {
    id: 'mat-plan-docente-2do-bach',
    title: 'Planificación Curricular Docente — 2° Año Bachillerato',
    subtitle: 'Jornalización quincenal docente 2027 para las 8 unidades y 20 guiones breves de 2° Año.',
    category: 'planificaciones',
    subjectArea: 'Ciencia y Tecnología (Educación Media)',
    level: 'Docentes',
    grade: '2° Año Bachillerato',
    price: 15,
    currency: 'USD',
    format: 'PDF Imprimible · Planificación',
    pages: 2,
    durationOrScope: 'Jornalización Quincenal 2027 · 8 Unidades (20 Prácticas)',
    coverImage: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg',
    previewExcerpt:
      'Planificación docente de cierre de Educación Media (enero–octubre 2027): articula las 8 unidades MINED de 2° Año, 20 prácticas cuantitativas, 20 guiones breves de 1 página, bioseguridad microbiológica y evaluación.',
    generalOverviewPoints: [
      'Programación quincenal de las 20 prácticas avanzadas (27 ene – oct 2027).',
      'Protocolos de bioseguridad en prácticas de cultivo microbiano y polímeros.',
      'Criterios de evaluación estadística (χ², regresiones, Jaccard e ICA) junto a cada guion.'
    ],
    objectives: [
      'Organizar el último año de bachillerato conectando laboratorio cuantitativo y análisis de datos.',
      'Garantizar prácticas microbiológicas seguras con esterilización escolar e inactivación final.',
      'Apoyar la apertura y cierre de cada práctica con su Guion Complementario de 1 página.'
    ],
    tableOfContents: [
      '1. Enfoque investigativo y jornalización anual quincenal 2027',
      '2. Unidades 1 a 4: Espacio, Física Moderna, Genética y Biodiversidad',
      '3. Unidades 5 a 8: Biotecnología Microbiana, Vegetal, Materiales y Ecología',
      '4. Bioseguridad y rúbrica de evaluación estadística'
    ],
    featured: false,
    published: true,
    hasCustomFile: false,
    sourceWordId: 'word-manual-2do-bach-2027',
    downloadCount: 0,
    createdAt: '2026-11-24T14:44:00.000Z',
    contentSections: [
      {
        heading: '1. Enfoque Preuniversitario y Jornalización Quincenal 2027',
        body: 'Calendariza las 20 sesiones experimentales (enero–octubre 2027) integrando modelado matemático, estadística biológica, sostenibilidad ambiental y sus 20 guiones de 1 página.',
        bullets: [
          'Inicio de cada sesión: síntesis conceptual mediante el Guion Complementario correspondiente.',
          'Durante la sesión: tratamiento estadístico de datos en tablas y cálculo de incertidumbres.'
        ]
      },
      {
        heading: '2. Bloque Físico-Astronómico y Evolutivo: Unidades 1 a 4 (Enero – Junio)',
        body: 'Conecta astrofísica observacional, cuantización de la energía, genética molecular y análisis matemático de comunidades.',
        bullets: [
          'Unidad 1 (Ciencias del Espacio, Prácticas 1–2): Gravedad local/masa terrestre y fotometría de tránsito de exoplanetas.',
          'Unidad 2 (Física Moderna, Prácticas 3–4): Constante de Planck con LEDs y modelado de vida media (T1/2).',
          'Unidad 3 (Genética Evolutiva, Prácticas 5–7): ADN según ploidía, índice mitótico y simulación de selección.',
          'Unidad 4 (Análisis de Biodiversidad, Prácticas 8–10): Cruces dihíbridos con χ², índices Jaccard/Sørensen y UPGMA.'
        ]
      },
      {
        heading: '3. Bloque Biotecnológico, Materiales y Ambiente: Unidades 5 a 8 (Junio – Octubre)',
        body: 'Aplica biotecnología segura, ciencia de polímeros y monitoreo fisicoquímico ambiental.',
        bullets: [
          'Unidad 5 (Biotecnología Microbiana, Prácticas 11–12): Medio sólido estéril, conteo de colonias (UFC) y antagonismo.',
          'Unidad 6 (Biotecnología Vegetal, Prácticas 13–16): Fitohormonas, hidroponía y manejo agroindustrial.',
          'Unidad 7 (Ciencia de Materiales, Prácticas 17–18): Síntesis de bioplásticos, elasticidad y biodegradación.',
          'Unidad 8 (Ecología y Ambiente, Prácticas 19–20): Microplásticos, DBO e Índice de Calidad del Agua (ICA).'
        ]
      },
      {
        heading: '4. Bioseguridad y Evaluación Estadística',
        body: 'Exige sellado e inactivación de cultivos microbianos con hipoclorito tras el conteo de UFC.',
        bullets: [
          '40% Ejecución experimental rigurosa y cumplimiento de bioseguridad.',
          '35% Procesamiento matemático/estadístico (χ², regresiones, índices) y dominio del guion.',
          '25% Discusión científica y proyecto integrador.'
        ]
      }
    ]
  },

  // =========================================================================
  // GESTIÓN ACADÉMICA: Recursos Institucionales y Formatos ($15 USD pack)
  // =========================================================================
  {
    id: 'mat-gestion-academica-pack-docente',
    title: 'Carpeta Integral de Gestión Académica y Formatos de Laboratorio (.ZIP / PDF)',
    subtitle: 'Colección institucional de jornalizaciones, actas de laboratorio, rúbricas y registros de evaluación.',
    category: 'folletos',
    subjectArea: 'Gestión Académica',
    level: 'Gestión Académica',
    grade: 'Gestión Académica',
    price: 15,
    currency: 'USD',
    format: 'Archivo ZIP · Gestión Académica',
    pages: 6,
    durationOrScope: 'Colección Institucional Completa · 8 Documentos Maestros',
    coverImage: '/src/assets/images/cat_folletos_chemistry_1795526711774.jpg',
    previewExcerpt:
      'Compilación administrativa y pedagógica para docentes de Ciencia y Tecnología: plantillas de jornalización anual, actas de entrega de equipo, fichas de inventario químico, control de asistencia y rúbricas de evaluación experimental.',
    generalOverviewPoints: [
      'Formatos estandarizados para 4° Grado a 2° Año de Bachillerato.',
      'Actas de préstamo de cristalería, inventario de reactivos y reporte de incidentes.',
      'Rúbricas listas para evaluar bitácoras, ferias científicas y prácticas guiadas.'
    ],
    zipEntries: [
      '01_Jornalizacion_Anual_Ciencia_y_Tecnologia.docx',
      '02_Acta_Uso_y_Responsabilidad_Laboratorio.pdf',
      '03_Inventario_Reactivos_y_Materiales_SI.xlsx',
      '04_Rubrica_Evaluacion_Practicas_40_35_25.pdf',
      '05_Lista_Cotejo_Bioseguridad_Escolar.pdf',
      '06_Control_Asistencia_y_Equipos_Trabajo.xlsx',
      '07_Formato_Informe_Cientifico_Estudiante.docx',
      '08_Carta_Autorizacion_Salidas_y_Proyectos.pdf'
    ],
    objectives: [
      'Estandarizar la documentación administrativa del departamento o área de Ciencia y Tecnología.',
      'Agilizar el control de inventario, préstamos de laboratorio y evaluación por competencias.'
    ],
    tableOfContents: [
      '1. Control administrativo y jornalizaciones anuales',
      '2. Inventario de materiales, reactivos y actas de laboratorio',
      '3. Rúbricas de evaluación experimental e informes estudiantiles'
    ],
    featured: true,
    published: true,
    hasCustomFile: false,
    downloadCount: 0,
    createdAt: '2026-11-24T14:50:00.000Z',
    contentSections: [
      {
        heading: '1. Formatos de Planificación y Jornalización Institucional',
        body: 'Incluye plantillas organizadas por trimestre y unidad para registrar avances semanales, indicadores de logro y fechas de prácticas de laboratorio desde 4° Grado hasta 2° Año de Bachillerato.',
        bullets: [
          'Matriz anual por trimestre y calendario quincenal de sesiones experimentales.',
          'Registro de adecuaciones curriculares y seguimiento de equipos estudiantiles.'
        ]
      },
      {
        heading: '2. Inventario, Actas de Uso y Protocolos de Bioseguridad',
        body: 'Documentación lista para control interno del laboratorio escolar: entradas y salidas de materiales, verificación de etiquetas y listas de cotejo de seguridad.',
        bullets: [
          'Acta de asignación de mesas, cristalería e instrumentos por equipo de trabajo.',
          'Lista de chequeo previo (bata, ventilación, extintor, botiquín y manejo de residuos).'
        ]
      },
      {
        heading: '3. Instrumentos de Evaluación y Formatos Estudiantiles',
        body: 'Modelos descargables de informe científico breve, rúbrica analítica 40/35/25% y guía de evaluación para ferias científicas escolares.',
        bullets: [
          'Estructura unificada: Hipótesis, Materiales, Observaciones, Tabla de datos y Conclusión.',
          'Lista de cotejo para exposición oral y defensa de proyectos trimestrales.'
        ]
      }
    ]
  }
];

const ENRICHED_MANUALS_AND_PLANS: MaterialAdmin[] = MANUALS_AND_PLANS.map((item) => {
  if (item.category === 'practicas' && item.contentSections.length === 0) {
    return {
      ...item,
      contentSections: buildManualSectionsForGrade(item.grade)
    };
  }
  return item;
});

export const GENERATED_COMPLEMENTARY_MATERIALS: MaterialAdmin[] = [
  ...ENRICHED_MANUALS_AND_PLANS,
  ...COMPLEMENTARY_PRACTICE_GUIDES
];

export function toPublicSeedMaterial(m: MaterialAdmin): MaterialPublic {
  const { contentSections: _sections, customFilePath: _path, customFileMime: _mime, ...publicFields } = m;
  return publicFields;
}

export const PUBLIC_SEED_MATERIALS: MaterialPublic[] = GENERATED_COMPLEMENTARY_MATERIALS.filter(
  (m) => m.published
).map(toPublicSeedMaterial);
