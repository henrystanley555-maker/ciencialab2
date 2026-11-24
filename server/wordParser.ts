import type { GeneratedMaterialDraft, GradeLevel, MaterialSection, WordDocType } from '../src/types.ts';

function gradeToLevel(grade: GradeLevel): GeneratedMaterialDraft['level'] {
  if (grade === '4° Grado' || grade === '5° Grado' || grade === '6° Grado') return 'Primaria II';
  if (grade === '7° Grado' || grade === '8° Grado' || grade === '9° Grado') return 'Secundaria';
  if (grade === '1° Año Bachillerato' || grade === '2° Año Bachillerato') return 'Bachillerato';
  return 'Gestión Académica';
}

export function buildStructuredDraftFromWordText(params: {
  mode: 'guia_facil' | 'planificacion';
  sourceTitle: string;
  grade: GradeLevel;
  subjectArea: string;
  docType: WordDocType;
  extractedText: string;
}): GeneratedMaterialDraft {
  const lines = params.extractedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const unitHeadings: string[] = [];
  const practiceHeadings: string[] = [];
  const objectiveLines: string[] = [];
  const theorySnippets: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^unidad\s+\d+/i.test(line) && line.length < 120) {
      if (!unitHeadings.includes(line)) unitHeadings.push(line);
    } else if (/^pr[áa]ctica\s+\d+/i.test(line) && line.length < 150) {
      if (!practiceHeadings.includes(line)) practiceHeadings.push(line);
    } else if (/^objetivo/i.test(line)) {
      const cleaned = line.replace(/^objetivo(s)?(\s+de\s+la\s+pr[áa]ctica)?\s*[:\-–]?\s*/i, '').trim();
      if (cleaned.length > 12) {
        objectiveLines.push(cleaned);
      } else if (lines[i + 1] && lines[i + 1].length > 12) {
        objectiveLines.push(lines[i + 1]);
      }
    } else if (/^fundamento\s+te[óo]rico|^ii\.\s*fundamento/i.test(line)) {
      const inline = line.replace(/^(ii\.\s*)?fundamento\s+te[óo]rico[^:]*:\s*/i, '').trim();
      const candidate = inline.length > 25 ? inline : lines[i + 1] || '';
      if (candidate.length > 25) {
        theorySnippets.push(candidate);
      }
    }
  }

  const topUnits = unitHeadings.slice(0, 6);
  const topPractices = practiceHeadings.slice(0, 10);
  const topObjectives = Array.from(new Set(objectiveLines)).slice(0, 3);

  const isGuide = params.mode === 'guia_facil';

  if (isGuide) {
    // 1-page complementary class script (Inicio · Desarrollo · Culminación)
    const contentSections: MaterialSection[] = [
      {
        heading: '1. Inicio (Activación y Propósito)',
        body: `Activar conocimientos previos del grupo en relación con "${params.sourceTitle}" (${params.grade}) y presentar el objetivo de aprendizaje antes de iniciar la experiencia.`,
        bullets:
          topUnits.length > 0
            ? [`Tiempo sugerido: 10 min · Tema base: ${topUnits[0]}`]
            : ['Tiempo sugerido: 10 min · Verificación de materiales y medidas de seguridad.']
      },
      {
        heading: '2. Desarrollo (Base Teórica y Orientación)',
        body:
          theorySnippets.length > 0
            ? theorySnippets[0].slice(0, 280)
            : `Síntesis teórica esencial de "${params.sourceTitle}": identifica variables, leyes científicas asociadas y pauta de observación experimental guiada.`,
        bullets: [
          'Tiempo sugerido: 25 min · Contraste entre fundamento teórico y observaciones del experimento.'
        ]
      },
      {
        heading: '3. Culminación (Síntesis y Cierre)',
        body: `Consolidar las conclusiones científicas obtenidas en ${params.grade} y verificar la comprensión conceptual mediante puesta en común breve.`,
        bullets: [
          'Cierre (10 min): ¿Qué principio científico explican los resultados observados?',
          'Cierre (10 min): Menciona una aplicación cotidiana del fenómeno estudiado.'
        ]
      }
    ];

    return {
      mode: 'guia_facil',
      title: `Guion Complementario — ${params.sourceTitle} (${params.grade})`,
      subtitle: `Guion breve de 1 página (Inicio, Desarrollo y Culminación) derivado de "${params.sourceTitle}".`,
      category: 'apuntes',
      subjectArea: params.subjectArea,
      level: gradeToLevel(params.grade),
      grade: params.grade,
      suggestedPrice: 15,
      pages: 1,
      durationOrScope: `Guion breve de 1 página · ${params.grade}`,
      previewExcerpt: `Guion complementario breve de 1 página para ${params.grade} basado en "${params.sourceTitle}", estructurado en Inicio, Desarrollo y Culminación.`,
      objectives:
        topObjectives.length > 0
          ? topObjectives
          : [
              `Comprender en una hoja práctica los fundamentos teóricos de las experiencias de ${params.grade}.`,
              'Desarrollar la secuencia Inicio, Desarrollo y Culminación en una hoja práctica de 1 página.'
            ],
      tableOfContents: [
        '1. Inicio: Activación de saberes previos y propósito de la práctica',
        '2. Desarrollo: Base teórica esencial y orientación experimental',
        '3. Culminación: Síntesis conceptual y preguntas de cierre'
      ],
      contentSections
    };
  }

  // Lesson Plan mode ('planificacion')
  const contentSections: MaterialSection[] = [
    {
      heading: `1. Organización Curricular para el Docente — ${params.grade}`,
      body: `Planificación didáctica de contenidos basada en "${params.sourceTitle}". Articula la teoría de aula con las sesiones experimentales de laboratorio mediante evaluación formativa.`,
      bullets:
        topUnits.length > 0
          ? topUnits
          : ['Organización por unidades temáticas', 'Secuencia de clases teórico-prácticas']
    },
    {
      heading: '2. Secuencia de Prácticas y Contenidos Asociados',
      body: 'Distribución anual sugerida para vincular cada contenido programático con su experiencia de laboratorio correspondiente y su guía teórica de refuerzo.',
      bullets:
        topPractices.length > 0
          ? topPractices.slice(0, 8)
          : ['Sesión de inducción teórica', 'Desarrollo experimental guiado', 'Socialización de resultados']
    },
    {
      heading: '3. Evaluación y Criterios Docentes',
      body: 'Integración de ciclos de indagación científica: hipótesis previa, ejecución en equipo, análisis de resultados y reporte final.',
      bullets: [
        '40% Desempeño experimental, seguridad y bitácora de laboratorio.',
        '35% Comprensión teórica mediante la guía complementaria.',
        '25% Reporte científico final y discusión de conclusiones.'
      ]
    }
  ];

  return {
    mode: 'planificacion',
    title: `Planificación Docente de Contenidos (${params.grade})`,
    subtitle: `Jornalización, secuencia didáctica y material extra para el docente de ${params.grade}.`,
    category: 'planificaciones',
    subjectArea: params.subjectArea,
    level: 'Docentes',
    grade: params.grade,
    suggestedPrice: 15,
    pages: Math.max(10, topUnits.length * 2 + 4),
    durationOrScope: `Planificación Anual · ${params.grade}`,
    previewExcerpt: `Planificación para el docente de ${params.grade}: articula contenidos teóricos, secuencia de prácticas de laboratorio, orientaciones metodológicas y evaluación.`,
    objectives:
      topObjectives.length > 0
        ? topObjectives
        : [
            `Planificar de forma ordenada el desarrollo teórico y experimental de ${params.grade}.`,
            'Integrar prácticas de laboratorio con evaluación por competencias científicas.'
          ],
    tableOfContents: [
      '1. Enfoque pedagógico e indicadores de logro por unidad',
      ...(topUnits.length > 0 ? topUnits.slice(0, 4) : ['2. Secuencia de contenidos y prácticas']),
      '3. Criterios de evaluación y recursos docentes'
    ],
    contentSections
  };
}
