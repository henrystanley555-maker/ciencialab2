import { GoogleGenAI, Type } from '@google/genai';
import type { GeneratedMaterialDraft, GradeLevel, WordDocType } from '../src/types.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Falta configurar GEMINI_API_KEY en el panel Settings > Secrets para generar guías automáticas con IA.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function gradeToLevel(grade: GradeLevel): GeneratedMaterialDraft['level'] {
  if (grade === '4° Grado' || grade === '5° Grado' || grade === '6° Grado') return 'Primaria II';
  if (grade === '7° Grado' || grade === '8° Grado' || grade === '9° Grado') return 'Secundaria';
  if (grade === '1° Año Bachillerato' || grade === '2° Año Bachillerato') return 'Bachillerato';
  return 'Gestión Académica';
}

export async function generateEducationalMaterialFromWord(params: {
  mode: 'guia_facil' | 'planificacion';
  sourceTitle: string;
  grade: GradeLevel;
  subjectArea: string;
  docType: WordDocType;
  extractedText: string;
  customInstructions?: string;
}): Promise<GeneratedMaterialDraft> {
  const ai = getGeminiClient();
  const truncatedText = params.extractedText.slice(0, 28000);

  const isGuide = params.mode === 'guia_facil';

  const systemInstruction = isGuide
    ? `Eres un especialista en didáctica de Ciencia y Tecnología. Tu tarea es crear un "Guion Complementario Breve" de EXACTAMENTE UNA PÁGINA (1 hoja A4) en base al manual de prácticas de ${params.grade}.
Debe usar estrictamente el esquema de 3 secciones cortas:
1. Inicio (Activación y Propósito)
2. Desarrollo (Base Teórica y Orientación)
3. Culminación (Síntesis y Cierre)
Redacta en lenguaje sencillo y conciso para que quepa holgadamente en 1 sola página imprimible.`
    : `Eres un coordinador pedagógico experto en Ciencia y Tecnología. Tu tarea es crear una "Planificación Docente por Grado" completa y lista para implementar en el aula a partir del manual proporcionado para ${params.grade}.
Incluye competencias e indicadores de logro, secuencia didáctica estructurada por unidades o sesiones, recursos de laboratorio y criterios de evaluación.`;

  const prompt = [
    `Documento fuente: "${params.sourceTitle}"`,
    `Grado / Nivel objetivo: ${params.grade}`,
    `Área científica / tecnológica: ${params.subjectArea}`,
    `Tipo de documento original: ${params.docType}`,
    params.customInstructions ? `Indicaciones adicionales del docente: ${params.customInstructions}` : '',
    '',
    'CONTENIDO EXTRAÍDO DEL ARCHIVO WORD:',
    '---',
    truncatedText,
    '---',
    '',
    isGuide
      ? 'Genera el Guion Complementario breve de 1 PÁGINA con exactamente 3 secciones ("1. Inicio (Activación y Propósito)", "2. Desarrollo (Base Teórica y Orientación)", "3. Culminación (Síntesis y Cierre)") en JSON siguiendo el esquema (pages: 1).'
      : 'Genera la Planificación Didáctica por Grado en JSON siguiendo el esquema (3 a 4 secciones bien estructuradas).'
  ]
    .filter(Boolean)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Título claro del material generado en español.'
          },
          subtitle: {
            type: Type.STRING,
            description: 'Subtítulo descriptivo breve de 1 oración.'
          },
          durationOrScope: {
            type: Type.STRING,
            description: 'Ej. "Guía general de 1 página" o "Planificación Anual".'
          },
          pages: {
            type: Type.INTEGER,
            description: '1 para guía general de una página, o entre 8 y 24 para planificación.'
          },
          suggestedPrice: {
            type: Type.NUMBER,
            description: 'Precio fijo del paquete por grado: 15'
          },
          previewExcerpt: {
            type: Type.STRING,
            description: 'Resumen general de 2 oraciones para visualización pública sin descarga.'
          },
          objectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de 2 a 4 objetivos de aprendizaje concretos.'
          },
          tableOfContents: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista numerada de apartados incluidos.'
          },
          contentSections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                body: { type: Type.STRING },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['heading', 'body']
            },
            description: 'Secciones del documento en español claro.'
          }
        },
        required: [
          'title',
          'subtitle',
          'durationOrScope',
          'pages',
          'suggestedPrice',
          'previewExcerpt',
          'objectives',
          'tableOfContents',
          'contentSections'
        ]
      }
    }
  });

  const rawText = (response.text ?? '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  if (!rawText) {
    throw new Error('El modelo no devolvió contenido legible. Intenta nuevamente.');
  }

  let parsed: {
    title: string;
    subtitle: string;
    durationOrScope: string;
    pages: number;
    suggestedPrice: number;
    previewExcerpt: string;
    objectives: string[];
    tableOfContents: string[];
    contentSections: { heading: string; body: string; bullets?: string[] }[];
  };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('La respuesta generada no tuvo el formato esperado. Intenta nuevamente.');
  }

  return {
    mode: params.mode,
    title: parsed.title,
    subtitle: parsed.subtitle,
    category: isGuide ? 'apuntes' : 'planificaciones',
    subjectArea: params.subjectArea,
    level: isGuide ? gradeToLevel(params.grade) : 'Docentes',
    grade: params.grade,
    suggestedPrice: 15,
    pages: isGuide ? 1 : Math.max(6, Math.min(40, Math.round(Number(parsed.pages) || 16))),
    durationOrScope:
      parsed.durationOrScope || (isGuide ? `Guion breve de 1 página · ${params.grade}` : `Planificación · ${params.grade}`),
    previewExcerpt: parsed.previewExcerpt,
    objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
    tableOfContents: Array.isArray(parsed.tableOfContents) ? parsed.tableOfContents : [],
    contentSections: Array.isArray(parsed.contentSections) ? parsed.contentSections : []
  };
}
