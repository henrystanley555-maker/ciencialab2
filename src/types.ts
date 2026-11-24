export type MaterialCategory =
  | 'folletos'
  | 'practicas'
  | 'apuntes'
  | 'planificaciones';

export type AcademicLevel =
  | 'Primaria II'
  | 'Secundaria'
  | 'Bachillerato'
  | 'Gestión Académica'
  | 'Docentes';

export type GradeLevel =
  | '4° Grado'
  | '5° Grado'
  | '6° Grado'
  | '7° Grado'
  | '8° Grado'
  | '9° Grado'
  | '1° Año Bachillerato'
  | '2° Año Bachillerato'
  | 'Gestión Académica';

export type WordDocType =
  | 'manual_practica'
  | 'apuntes_clase'
  | 'programa_estudio'
  | 'otro';

export interface MaterialSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface MaterialPublic {
  id: string;
  title: string;
  subtitle: string;
  category: MaterialCategory;
  subjectArea: string;
  level: AcademicLevel;
  grade: GradeLevel;
  price: number;
  currency: 'USD';
  format: string;
  pages: number;
  durationOrScope: string;
  coverImage: string;
  previewExcerpt: string;
  generalOverviewPoints?: string[];
  zipEntries?: string[];
  objectives: string[];
  tableOfContents: string[];
  featured: boolean;
  published: boolean;
  hasCustomFile: boolean;
  customFileName?: string;
  isComplementaryGuide?: boolean;
  sourceWordId?: string;
  downloadCount: number;
  createdAt: string;
}

export interface MaterialAdmin extends MaterialPublic {
  contentSections: MaterialSection[];
  customFilePath?: string;
  customFileMime?: string;
}

export interface WordDocumentRecord {
  id: string;
  title: string;
  fileName: string;
  grade: GradeLevel;
  subjectArea: string;
  docType: WordDocType;
  extractedText: string;
  wordCount: number;
  storedFilePath?: string;
  mimeType: string;
  generatedMaterialIds: string[];
  uploadedAt: string;
}

export interface GeneratedMaterialDraft {
  mode: 'guia_facil' | 'planificacion';
  title: string;
  subtitle: string;
  category: MaterialCategory;
  subjectArea: string;
  level: AcademicLevel;
  grade: GradeLevel;
  suggestedPrice: number;
  pages: number;
  durationOrScope: string;
  previewExcerpt: string;
  objectives: string[];
  tableOfContents: string[];
  contentSections: MaterialSection[];
}

export interface GradePackCartItem {
  grade: GradeLevel;
  title: string;
  price: number;
  materials: MaterialPublic[];
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  receiptToken: string;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: 'paypal' | 'card';
  paymentMode: 'live' | 'sandbox';
  externalTransactionId: string;
  unlockedGrades?: GradeLevel[];
  items: {
    materialId: string;
    title: string;
    grade?: GradeLevel;
    category: MaterialCategory;
    price: number;
    format: string;
  }[];
  totalAmount: number;
  currency: 'USD';
  status: 'completed';
  createdAt: string;
}

export interface PaymentGatewayConfig {
  paypalConfigured: boolean;
  paypalClientId: string | null;
  paypalMode: 'sandbox' | 'live';
  stripeConfigured: boolean;
  sandboxFallbackActive: boolean;
}

export interface AdminAuthStatus {
  configured: boolean;
  envManaged: boolean;
  authenticated: boolean;
}
