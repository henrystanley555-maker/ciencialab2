import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import mammoth from 'mammoth';
import { generateEducationalMaterialFromWord } from './server/geminiService.ts';
import { streamMaterialPdf } from './server/pdfGenerator.ts';
import { LEGACY_RETIRED_MATERIAL_IDS, SEED_MATERIALS, SEED_WORD_DOCS } from './server/seedData.ts';
import { buildStructuredDraftFromWordText } from './server/wordParser.ts';
import { extractZipEntryNames } from './server/zipInspector.ts';
import type {
  AcademicLevel,
  GradeLevel,
  MaterialAdmin,
  MaterialCategory,
  MaterialPublic,
  MaterialSection,
  OrderRecord,
  PaymentGatewayConfig,
  WordDocType,
  WordDocumentRecord
} from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const UPLOAD_DIR = path.resolve(DATA_DIR, 'uploads');
const TEXT_DIR = path.resolve(DATA_DIR, 'word-texts');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'auth.json');

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const GRADE_PACK_PRICE_USD = 15;

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.pptx', '.xlsx', '.zip', '.md', '.txt', '.html']);
const ALLOWED_WORD_EXTENSIONS = new Set(['.docx', '.txt', '.md', '.html']);
const ALLOWED_CATEGORIES = new Set<MaterialCategory>(['folletos', 'practicas', 'apuntes', 'planificaciones']);
const ALLOWED_LEVELS = new Set<AcademicLevel>([
  'Primaria II',
  'Secundaria',
  'Bachillerato',
  'Gestión Académica',
  'Docentes'
]);
const ALLOWED_GRADES = new Set<GradeLevel>([
  '4° Grado',
  '5° Grado',
  '6° Grado',
  '7° Grado',
  '8° Grado',
  '9° Grado',
  '1° Año Bachillerato',
  '2° Año Bachillerato',
  'Gestión Académica'
]);
const ALLOWED_DOC_TYPES = new Set<WordDocType>(['manual_practica', 'apuntes_clase', 'programa_estudio', 'otro']);

const CATEGORY_DEFAULT_IMAGES: Record<MaterialCategory, string> = {
  folletos: '/src/assets/images/cat_folletos_chemistry_1795526711774.jpg',
  practicas: '/src/assets/images/cat_practicas_microscope_1795526712665.jpg',
  apuntes: '/src/assets/images/cat_apuntes_biotech_1795526713277.jpg',
  planificaciones: '/src/assets/images/cat_planificaciones_robotics_1795526713198.jpg'
};

interface StoreData {
  materials: MaterialAdmin[];
  orders: OrderRecord[];
  wordDocs: WordDocumentRecord[];
}

interface AuthData {
  salt: string;
  hash: string;
  createdAt: string;
}

interface PendingPaypalOrder {
  paypalOrderId: string;
  materialIds: string[];
  unlockedGrades: GradeLevel[];
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  mode: 'live' | 'sandbox';
  createdAt: number;
}

const pendingPaypalOrders = new Map<string, PendingPaypalOrder>();

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEXT_DIR)) {
    fs.mkdirSync(TEXT_DIR, { recursive: true });
  }
}

function inferGradeFromLevel(level: AcademicLevel): GradeLevel {
  if (level === 'Primaria II') return '4° Grado';
  if (level === 'Secundaria') return '8° Grado';
  if (level === 'Bachillerato') return '1° Año Bachillerato';
  return 'Gestión Académica';
}

function readStore(): StoreData {
  ensureDataDirs();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreData = {
      materials: SEED_MATERIALS,
      orders: [],
      wordDocs: SEED_WORD_DOCS
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const existingOrders = Array.isArray(parsed.orders) ? parsed.orders : [];
    const orderedMaterialIds = new Set(
      existingOrders.flatMap((o) => (Array.isArray(o.items) ? o.items.map((i) => i.materialId) : []))
    );

    const seedById = new Map(SEED_MATERIALS.map((s) => [s.id, s]));
    let storeMutated = false;

    const rawMaterials = Array.isArray(parsed.materials) ? parsed.materials : [...SEED_MATERIALS];
    const migratedMaterials: MaterialAdmin[] = [];

    for (const m of rawMaterials) {
      if (LEGACY_RETIRED_MATERIAL_IDS.has(m.id) && !orderedMaterialIds.has(m.id)) {
        storeMutated = true;
        continue;
      }

      const normalizedGrade: GradeLevel =
        m.grade && ALLOWED_GRADES.has(m.grade) ? m.grade : inferGradeFromLevel(m.level);
      const seedMatch = seedById.get(m.id);

      if (seedMatch) {
        const updatedSeed: MaterialAdmin = {
          ...seedMatch,
          downloadCount: typeof m.downloadCount === 'number' ? m.downloadCount : seedMatch.downloadCount
        };
        if (
          m.price !== updatedSeed.price ||
          m.pages !== updatedSeed.pages ||
          m.title !== updatedSeed.title ||
          m.grade !== updatedSeed.grade ||
          m.previewExcerpt !== updatedSeed.previewExcerpt ||
          JSON.stringify(m.contentSections) !== JSON.stringify(updatedSeed.contentSections) ||
          !Array.isArray(m.generalOverviewPoints)
        ) {
          storeMutated = true;
        }
        migratedMaterials.push(updatedSeed);
      } else {
        if (normalizedGrade !== m.grade) storeMutated = true;
        migratedMaterials.push({
          ...m,
          grade: normalizedGrade
        });
      }
    }

    const presentIds = new Set(migratedMaterials.map((m) => m.id));
    for (const seed of SEED_MATERIALS) {
      if (!presentIds.has(seed.id)) {
        migratedMaterials.push(seed);
        storeMutated = true;
      }
    }

    const rawWordDocs = Array.isArray(parsed.wordDocs) ? [...parsed.wordDocs] : [];
    const seedWordById = new Map(SEED_WORD_DOCS.map((w) => [w.id, w]));
    const existingWordDocs = rawWordDocs.map((w) => {
      const seedMatch = seedWordById.get(w.id);
      if (seedMatch) {
        if (JSON.stringify(w.generatedMaterialIds) !== JSON.stringify(seedMatch.generatedMaterialIds)) {
          storeMutated = true;
        }
        return seedMatch;
      }
      return w;
    });
    const existingWordIds = new Set(existingWordDocs.map((w) => w.id));
    for (const seedWord of SEED_WORD_DOCS) {
      if (!existingWordIds.has(seedWord.id)) {
        existingWordDocs.push(seedWord);
        storeMutated = true;
      }
    }

    const store: StoreData = {
      materials: migratedMaterials,
      orders: existingOrders,
      wordDocs: existingWordDocs
    };

    if (storeMutated || !Array.isArray(parsed.wordDocs)) {
      writeStore(store);
    }

    return store;
  } catch {
    if (fs.existsSync(STORE_FILE)) {
      try {
        fs.copyFileSync(STORE_FILE, `${STORE_FILE}.corrupt-${Date.now()}.bak`);
      } catch {
        // ignore backup error
      }
    }
    return { materials: SEED_MATERIALS, orders: [], wordDocs: SEED_WORD_DOCS };
  }
}

function writeStore(data: StoreData) {
  ensureDataDirs();
  const tmpFile = `${STORE_FILE}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

function readAuth(): AuthData | null {
  ensureDataDirs();
  if (!fs.existsSync(AUTH_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as AuthData;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeAuth(authData: AuthData) {
  ensureDataDirs();
  const tmpFile = `${AUTH_FILE}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(authData, null, 2), 'utf8');
  fs.renameSync(tmpFile, AUTH_FILE);
}

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function timingSafeTextMatch(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'creator',
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 12
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (!timingSafeTextMatch(sig, expectedSig)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'creator' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return undefined;
  return header.slice(7).trim();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Sesión de creador no válida o expirada.' });
    return;
  }
  next();
}

function toPublicMaterial(m: MaterialAdmin): MaterialPublic {
  return {
    id: m.id,
    title: m.title,
    subtitle: m.subtitle,
    category: m.category,
    subjectArea: m.subjectArea,
    level: m.level,
    grade: m.grade,
    price: m.price,
    currency: m.currency,
    format: m.format,
    pages: m.pages,
    durationOrScope: m.durationOrScope,
    coverImage: m.coverImage,
    previewExcerpt: m.previewExcerpt,
    generalOverviewPoints: m.generalOverviewPoints,
    zipEntries: m.zipEntries,
    objectives: m.objectives,
    tableOfContents: m.tableOfContents,
    featured: m.featured,
    published: m.published,
    hasCustomFile: m.hasCustomFile,
    customFileName: m.customFileName,
    isComplementaryGuide: m.isComplementaryGuide,
    sourceWordId: m.sourceWordId,
    downloadCount: m.downloadCount,
    createdAt: m.createdAt
  };
}

function getPaymentConfig(): PaymentGatewayConfig {
  const paypalClientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const paypalClientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  const paypalMode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();

  const paypalConfigured = Boolean(paypalClientId && paypalClientSecret);
  const stripeConfigured = Boolean(stripeSecret);

  return {
    paypalConfigured,
    paypalClientId: paypalConfigured ? paypalClientId : null,
    paypalMode,
    stripeConfigured,
    sandboxFallbackActive: !paypalConfigured || !stripeConfigured
  };
}

async function getPaypalAccessToken(): Promise<string> {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  const baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('No se pudo autenticar con PayPal API.');
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Respuesta inválida de PayPal OAuth.');
  }
  return data.access_token;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resolveSafeUploadPath(relativeFileName: string): string | null {
  const safeBase = path.basename(relativeFileName);
  const resolved = path.resolve(UPLOAD_DIR, safeBase);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

function resolveSafeTextPath(relativeFileName: string): string | null {
  const safeBase = path.basename(relativeFileName);
  const resolved = path.resolve(TEXT_DIR, safeBase);
  if (!resolved.startsWith(TEXT_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

async function loadFullWordText(docRecord: WordDocumentRecord): Promise<string> {
  const txtPath = resolveSafeTextPath(`${docRecord.id}.txt`);
  if (txtPath && fs.existsSync(txtPath)) {
    try {
      const content = fs.readFileSync(txtPath, 'utf8').trim();
      if (content.length >= 20) return content;
    } catch {
      // fall through
    }
  }

  if (docRecord.storedFilePath) {
    const resolved = resolveSafeUploadPath(docRecord.storedFilePath);
    if (resolved && fs.existsSync(resolved)) {
      try {
        const ext = path.extname(resolved).toLowerCase();
        let text = '';
        if (ext === '.docx') {
          const result = await mammoth.extractRawText({ path: resolved });
          text = (result.value || '').trim();
        } else {
          text = fs.readFileSync(resolved, 'utf8').trim();
        }
        if (text.length >= 20) {
          if (txtPath) {
            try {
              fs.writeFileSync(txtPath, text, 'utf8');
            } catch {
              // ignore cache write failure
            }
          }
          return text;
        }
      } catch {
        // fall through
      }
    }
  }

  return docRecord.extractedText || '';
}

function resolveCheckoutSelection(
  store: StoreData,
  body: { gradePacks?: unknown; materialIds?: unknown }
): { unlockedGrades: GradeLevel[]; selectedMaterials: MaterialAdmin[]; totalAmount: number } {
  const gradeSet = new Set<GradeLevel>();

  if (Array.isArray(body.gradePacks)) {
    for (const g of body.gradePacks) {
      if (typeof g === 'string' && ALLOWED_GRADES.has(g as GradeLevel)) {
        gradeSet.add(g as GradeLevel);
      }
    }
  }

  if (gradeSet.size === 0 && Array.isArray(body.materialIds)) {
    for (const id of body.materialIds) {
      if (typeof id === 'string') {
        const found = store.materials.find((m) => m.id === id && m.published);
        if (found) gradeSet.add(found.grade);
      }
    }
  }

  const unlockedGrades: GradeLevel[] = [];
  const selectedMap = new Map<string, MaterialAdmin>();

  for (const grade of gradeSet) {
    const gradeMaterials = store.materials.filter((m) => m.published && m.grade === grade);
    if (gradeMaterials.length > 0) {
      unlockedGrades.push(grade);
      for (const m of gradeMaterials) {
        selectedMap.set(m.id, m);
      }
    }
  }

  const totalAmount = Number((unlockedGrades.length * GRADE_PACK_PRICE_USD).toFixed(2));
  return {
    unlockedGrades,
    selectedMaterials: Array.from(selectedMap.values()),
    totalAmount
  };
}

function createOrderRecord(params: {
  buyerName: string;
  buyerEmail: string;
  paymentMethod: 'paypal' | 'card';
  paymentMode: 'live' | 'sandbox';
  externalTransactionId: string;
  unlockedGrades: GradeLevel[];
  materials: MaterialAdmin[];
}): OrderRecord {
  const store = readStore();
  const totalAmount = Number((params.unlockedGrades.length * GRADE_PACK_PRICE_USD).toFixed(2));
  const orderCode = `CL-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const receiptToken = crypto.randomBytes(24).toString('hex');

  const order: OrderRecord = {
    id: crypto.randomUUID(),
    orderCode,
    receiptToken,
    buyerName: params.buyerName.trim(),
    buyerEmail: params.buyerEmail.trim().toLowerCase(),
    paymentMethod: params.paymentMethod,
    paymentMode: params.paymentMode,
    externalTransactionId: params.externalTransactionId,
    unlockedGrades: params.unlockedGrades,
    items: params.materials.map((m) => ({
      materialId: m.id,
      title: m.title,
      grade: m.grade,
      category: m.category,
      price: GRADE_PACK_PRICE_USD,
      format: m.format
    })),
    totalAmount,
    currency: 'USD',
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  store.orders.unshift(order);
  writeStore(store);
  return order;
}

async function startServer() {
  ensureDataDirs();
  const app = express();
  app.use(express.json({ limit: '55mb' }));

  // Public Catalog
  app.get('/api/materials', (_req, res) => {
    const store = readStore();
    const published = store.materials.filter((m) => m.published).map(toPublicMaterial);
    res.json({ materials: published });
  });

  app.get('/api/materials/:id', (req, res) => {
    const store = readStore();
    const found = store.materials.find((m) => m.id === req.params.id && m.published);
    if (!found) {
      res.status(404).json({ error: 'Material no encontrado.' });
      return;
    }
    res.json({ material: toPublicMaterial(found) });
  });

  app.get('/api/payments/config', (_req, res) => {
    res.json(getPaymentConfig());
  });

  // PayPal Create Order ($15 USD per Grade / Tab)
  app.post('/api/checkout/paypal/create', async (req, res) => {
    try {
      const { gradePacks, materialIds, buyerName, buyerEmail } = req.body as {
        gradePacks?: unknown;
        materialIds?: unknown;
        buyerName?: unknown;
        buyerEmail?: unknown;
      };

      if (typeof buyerName !== 'string' || buyerName.trim().length < 2) {
        res.status(400).json({ error: 'Ingresa tu nombre completo.' });
        return;
      }
      if (typeof buyerEmail !== 'string' || !isValidEmail(buyerEmail.trim())) {
        res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
        return;
      }

      const store = readStore();
      const { unlockedGrades, selectedMaterials, totalAmount } = resolveCheckoutSelection(store, {
        gradePacks,
        materialIds
      });

      if (unlockedGrades.length === 0 || selectedMaterials.length === 0) {
        res.status(400).json({ error: 'Selecciona al menos un grado o paquete disponible para adquirir.' });
        return;
      }

      const config = getPaymentConfig();

      if (config.paypalConfigured) {
        const accessToken = await getPaypalAccessToken();
        const baseUrl =
          config.paypalMode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
        const ppRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                description: `CIENCIALAB · ${unlockedGrades.join(', ')} ($${GRADE_PACK_PRICE_USD}/grado)`,
                amount: {
                  currency_code: 'USD',
                  value: totalAmount.toFixed(2)
                }
              }
            ],
            application_context: {
              brand_name: 'CIENCIALAB',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: `${appUrl}/?paypal_status=approved`,
              cancel_url: `${appUrl}/?paypal_status=cancelled`
            }
          })
        });

        if (!ppRes.ok) {
          res.status(502).json({ error: 'Error al crear la orden en PayPal.' });
          return;
        }
        const ppData = (await ppRes.json()) as {
          id: string;
          links?: { rel: string; href: string }[];
        };
        const approvalUrl = ppData.links?.find((l) => l.rel === 'approve')?.href || null;

        pendingPaypalOrders.set(ppData.id, {
          paypalOrderId: ppData.id,
          materialIds: selectedMaterials.map((m) => m.id),
          unlockedGrades,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim().toLowerCase(),
          totalAmount,
          mode: config.paypalMode,
          createdAt: Date.now()
        });

        res.json({
          paypalOrderId: ppData.id,
          approvalUrl,
          mode: config.paypalMode,
          totalAmount
        });
        return;
      }

      const sandboxOrderId = `PP-SBX-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      pendingPaypalOrders.set(sandboxOrderId, {
        paypalOrderId: sandboxOrderId,
        materialIds: selectedMaterials.map((m) => m.id),
        unlockedGrades,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim().toLowerCase(),
        totalAmount,
        mode: 'sandbox',
        createdAt: Date.now()
      });

      res.json({
        paypalOrderId: sandboxOrderId,
        approvalUrl: null,
        mode: 'sandbox',
        totalAmount
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Error creando orden de PayPal.' });
    }
  });

  // PayPal Capture Order
  app.post('/api/checkout/paypal/capture', async (req, res) => {
    try {
      const { paypalOrderId } = req.body as { paypalOrderId?: unknown };
      if (typeof paypalOrderId !== 'string' || !pendingPaypalOrders.has(paypalOrderId)) {
        res.status(404).json({ error: 'Orden de PayPal no encontrada o expirada.' });
        return;
      }

      const pending = pendingPaypalOrders.get(paypalOrderId)!;
      const store = readStore();
      const selected = pending.materialIds
        .map((id) => store.materials.find((m) => m.id === id && m.published))
        .filter((m): m is MaterialAdmin => Boolean(m));

      if (selected.length === 0) {
        res.status(404).json({ error: 'Materiales no disponibles.' });
        return;
      }

      const config = getPaymentConfig();
      let externalTx = paypalOrderId;

      if (config.paypalConfigured && !paypalOrderId.startsWith('PP-SBX-')) {
        const accessToken = await getPaypalAccessToken();
        const baseUrl =
          config.paypalMode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!captureRes.ok) {
          res.status(402).json({ error: 'PayPal no pudo confirmar la captura del pago.' });
          return;
        }
        const captureJson = (await captureRes.json()) as { id?: string; status?: string };
        if (captureJson.status !== 'COMPLETED') {
          res.status(402).json({ error: `Estado de pago PayPal: ${captureJson.status || 'pendiente'}.` });
          return;
        }
        externalTx = captureJson.id || paypalOrderId;
      }

      pendingPaypalOrders.delete(paypalOrderId);
      const order = createOrderRecord({
        buyerName: pending.buyerName,
        buyerEmail: pending.buyerEmail,
        paymentMethod: 'paypal',
        paymentMode: pending.mode,
        externalTransactionId: externalTx,
        unlockedGrades: pending.unlockedGrades,
        materials: selected
      });

      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Error confirmando pago PayPal.' });
    }
  });

  // Card Checkout (Stripe Checkout Session if configured, or Sandbox Card Validation) — $15 USD / Grade
  app.post('/api/checkout/card', async (req, res) => {
    try {
      const { gradePacks, materialIds, buyerName, buyerEmail, cardLast4 } = req.body as {
        gradePacks?: unknown;
        materialIds?: unknown;
        buyerName?: unknown;
        buyerEmail?: unknown;
        cardLast4?: unknown;
      };

      if (typeof buyerName !== 'string' || buyerName.trim().length < 2) {
        res.status(400).json({ error: 'Ingresa el nombre del titular.' });
        return;
      }
      if (typeof buyerEmail !== 'string' || !isValidEmail(buyerEmail.trim())) {
        res.status(400).json({ error: 'Ingresa un correo electrónico válido para tu comprobante.' });
        return;
      }

      const store = readStore();
      const { unlockedGrades, selectedMaterials } = resolveCheckoutSelection(store, {
        gradePacks,
        materialIds
      });

      if (unlockedGrades.length === 0 || selectedMaterials.length === 0) {
        res.status(400).json({ error: 'Selecciona al menos un grado o paquete disponible para adquirir.' });
        return;
      }

      const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();

      if (stripeSecret) {
        const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('customer_email', buyerEmail.trim().toLowerCase());
        params.append('success_url', `${appUrl}/?stripe_session_id={CHECKOUT_SESSION_ID}`);
        params.append('cancel_url', `${appUrl}/?stripe_cancelled=1`);
        params.append('metadata[buyerName]', buyerName.trim());
        params.append('metadata[unlockedGrades]', unlockedGrades.join('|'));
        params.append('metadata[materialIds]', selectedMaterials.map((m) => m.id).join(','));

        unlockedGrades.forEach((g, index) => {
          params.append(`line_items[${index}][price_data][currency]`, 'usd');
          params.append(`line_items[${index}][price_data][product_data][name]`, `Paquete Completo ${g} — CienciaLab`);
          params.append(`line_items[${index}][price_data][unit_amount]`, String(GRADE_PACK_PRICE_USD * 100));
          params.append(`line_items[${index}][quantity]`, '1');
        });

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeSecret}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        if (!stripeRes.ok) {
          res.status(502).json({ error: 'No se pudo iniciar la sesión de pago con tarjeta.' });
          return;
        }
        const sessionData = (await stripeRes.json()) as { id: string; url?: string };
        res.json({ checkoutUrl: sessionData.url, stripeSessionId: sessionData.id, mode: 'live' });
        return;
      }

      const cleanLast4 = typeof cardLast4 === 'string' && /^\d{4}$/.test(cardLast4) ? cardLast4 : '4242';
      const order = createOrderRecord({
        buyerName,
        buyerEmail,
        paymentMethod: 'card',
        paymentMode: 'sandbox',
        externalTransactionId: `CARD-${cleanLast4}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        unlockedGrades,
        materials: selectedMaterials
      });

      res.json({ order, mode: 'sandbox' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Error procesando pago con tarjeta.' });
    }
  });

  // Verify Stripe Session on return
  app.post('/api/checkout/stripe-verify', async (req, res) => {
    try {
      const { sessionId } = req.body as { sessionId?: unknown };
      const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
      if (!stripeSecret || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
        res.status(400).json({ error: 'Sesión de pago inválida.' });
        return;
      }

      const store = readStore();
      const existingOrder = store.orders.find((o) => o.externalTransactionId === sessionId);
      if (existingOrder) {
        res.json({ order: existingOrder });
        return;
      }

      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${stripeSecret}` }
      });
      if (!stripeRes.ok) {
        res.status(502).json({ error: 'No se pudo verificar la sesión en Stripe.' });
        return;
      }
      const session = (await stripeRes.json()) as {
        id: string;
        payment_status?: string;
        customer_email?: string;
        metadata?: { buyerName?: string; unlockedGrades?: string; materialIds?: string };
      };

      if (session.payment_status !== 'paid') {
        res.status(402).json({ error: 'El pago aún no figura como completado.' });
        return;
      }

      const grades = (session.metadata?.unlockedGrades || '')
        .split('|')
        .filter((g): g is GradeLevel => ALLOWED_GRADES.has(g as GradeLevel));
      const ids = (session.metadata?.materialIds || '').split(',').filter(Boolean);
      const { unlockedGrades, selectedMaterials } = resolveCheckoutSelection(store, {
        gradePacks: grades,
        materialIds: ids
      });

      if (selectedMaterials.length === 0) {
        res.status(404).json({ error: 'No se encontraron los materiales de esta compra.' });
        return;
      }

      const order = createOrderRecord({
        buyerName: session.metadata?.buyerName || 'Estudiante / Docente',
        buyerEmail: session.customer_email || 'comprador@ciencialab.edu',
        paymentMethod: 'card',
        paymentMode: 'live',
        externalTransactionId: session.id,
        unlockedGrades,
        materials: selectedMaterials
      });

      res.json({ order });
    } catch {
      res.status(500).json({ error: 'Error verificando pago.' });
    }
  });

  // Recover previous orders by orderCode + buyerEmail
  app.post('/api/orders/recover', (req, res) => {
    const { orderCode, buyerEmail } = req.body as { orderCode?: unknown; buyerEmail?: unknown };
    if (typeof orderCode !== 'string' || typeof buyerEmail !== 'string') {
      res.status(400).json({ error: 'Ingresa tu código de orden y correo electrónico.' });
      return;
    }

    const store = readStore();
    const match = store.orders.find(
      (o) =>
        o.orderCode.toUpperCase() === orderCode.trim().toUpperCase() &&
        o.buyerEmail.toLowerCase() === buyerEmail.trim().toLowerCase()
    );

    if (!match) {
      res.status(404).json({ error: 'No encontramos un comprobante que coincida con ese código y correo.' });
      return;
    }
    res.json({ order: match });
  });

  // Protected Automatic Download (Strictly requires paid $15/grade receipt token or authenticated creator)
  app.get('/api/download/:materialId', (req, res) => {
    const store = readStore();
    const materialIndex = store.materials.findIndex((m) => m.id === req.params.materialId);
    if (materialIndex === -1) {
      res.status(404).json({ error: 'Material no encontrado.' });
      return;
    }

    const material = store.materials[materialIndex];
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const isAdmin = verifyAdminToken(extractBearerToken(req));
    let matchedOrderCode: string | undefined;

    if (!isAdmin) {
      const order = store.orders.find(
        (o) =>
          o.receiptToken === token &&
          o.status === 'completed' &&
          (o.unlockedGrades?.includes(material.grade) ||
            o.items.some((item) => item.materialId === material.id))
      );
      if (!order) {
        res.status(403).json({
          error: `Acceso restringido. Adquiere el paquete de ${material.grade} ($${GRADE_PACK_PRICE_USD}.00 USD) para habilitar la descarga.`
        });
        return;
      }
      matchedOrderCode = order.orderCode;
    }

    store.materials[materialIndex].downloadCount += 1;
    writeStore(store);

    if (material.hasCustomFile && material.customFilePath) {
      const resolved = resolveSafeUploadPath(material.customFilePath);
      if (resolved && fs.existsSync(resolved)) {
        const downloadName = material.customFileName || `${material.id}.pdf`;
        res.setHeader('Content-Type', material.customFileMime || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName.replace(/"/g, '')}"`);
        fs.createReadStream(resolved).pipe(res);
        return;
      }
    }

    streamMaterialPdf(res, material, matchedOrderCode);
  });

  // Admin / Creator Auth Endpoints
  app.get('/api/admin/auth-status', (req, res) => {
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const savedAuth = readAuth();
    const configured = Boolean(envPasscode) || Boolean(savedAuth);
    const authenticated = verifyAdminToken(extractBearerToken(req));
    res.json({
      configured,
      envManaged: Boolean(envPasscode),
      authenticated
    });
  });

  app.post('/api/admin/setup', (req, res) => {
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    if (envPasscode || readAuth()) {
      res.status(403).json({ error: 'La contraseña del creador ya fue configurada.' });
      return;
    }

    const { password } = req.body as { password?: unknown };
    if (typeof password !== 'string' || password.trim().length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const { salt, hash } = hashPassword(password.trim());
    writeAuth({ salt, hash, createdAt: new Date().toISOString() });
    const token = signAdminToken();
    res.json({ token });
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body as { password?: unknown };
    if (typeof password !== 'string' || !password.trim()) {
      res.status(400).json({ error: 'Ingresa tu contraseña de creador.' });
      return;
    }

    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    if (envPasscode) {
      if (!timingSafeTextMatch(password.trim(), envPasscode)) {
        res.status(401).json({ error: 'Contraseña incorrecta.' });
        return;
      }
      res.json({ token: signAdminToken() });
      return;
    }

    const savedAuth = readAuth();
    if (!savedAuth) {
      res.status(400).json({ error: 'Configura primero la contraseña del espacio creador.' });
      return;
    }

    const { hash } = hashPassword(password.trim(), savedAuth.salt);
    if (!timingSafeTextMatch(hash, savedAuth.hash)) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }

    res.json({ token: signAdminToken() });
  });

  // Admin Overview & CRUD
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const store = readStore();
    const totalRevenue = Number(store.orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2));
    const totalDownloads = store.materials.reduce((sum, m) => sum + m.downloadCount, 0);
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiConfigured = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');
    res.json({
      materials: store.materials,
      orders: store.orders,
      wordDocs: store.wordDocs,
      stats: {
        totalRevenue,
        totalOrders: store.orders.length,
        totalDownloads,
        publishedCount: store.materials.filter((m) => m.published).length
      },
      paymentConfig: getPaymentConfig(),
      geminiConfigured
    });
  });

  // Word Repository Upload (.docx / .txt / .md / pasted text)
  app.post('/api/admin/word-docs', requireAdmin, async (req, res) => {
    try {
      const body = req.body as {
        title?: unknown;
        grade?: unknown;
        subjectArea?: unknown;
        docType?: unknown;
        pastedText?: unknown;
        fileUpload?: {
          fileName: string;
          mimeType: string;
          base64Data: string;
        };
      };

      const grade: GradeLevel =
        typeof body.grade === 'string' && ALLOWED_GRADES.has(body.grade as GradeLevel)
          ? (body.grade as GradeLevel)
          : '8° Grado';

      const docType: WordDocType =
        typeof body.docType === 'string' && ALLOWED_DOC_TYPES.has(body.docType as WordDocType)
          ? (body.docType as WordDocType)
          : 'manual_practica';

      const subjectArea =
        typeof body.subjectArea === 'string' && body.subjectArea.trim()
          ? body.subjectArea.trim()
          : 'Ciencia y Tecnología';

      let extractedText = '';
      let fileName = 'documento-pegado.txt';
      let mimeType = 'text/plain';
      let storedFilePath: string | undefined;

      if (body.fileUpload && typeof body.fileUpload.base64Data === 'string' && body.fileUpload.fileName) {
        fileName = path.basename(body.fileUpload.fileName).slice(0, 140);
        const ext = path.extname(fileName).toLowerCase();
        if (!ALLOWED_WORD_EXTENSIONS.has(ext)) {
          res.status(400).json({
            error:
              ext === '.doc'
                ? 'El formato antiguo .doc no permite extracción directa; guárdalo como .docx en Word o pega el texto.'
                : 'Formato no soportado para extracción automática. Usa archivos Word (.docx), .txt o .md.'
          });
          return;
        }

        const cleanBase64 = body.fileUpload.base64Data.includes(',')
          ? body.fileUpload.base64Data.split(',')[1]
          : body.fileUpload.base64Data;
        const buffer = Buffer.from(cleanBase64, 'base64');

        if (buffer.byteLength > 15 * 1024 * 1024) {
          res.status(400).json({ error: 'El archivo Word excede el límite de 15 MB.' });
          return;
        }

        const safeStoredName = `word-${crypto.randomUUID()}${ext}`;
        const resolved = resolveSafeUploadPath(safeStoredName);
        if (!resolved) {
          res.status(400).json({ error: 'Ruta de almacenamiento inválida.' });
          return;
        }

        fs.writeFileSync(resolved, buffer);
        storedFilePath = safeStoredName;
        mimeType = body.fileUpload.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        if (ext === '.docx') {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = (result.value || '').trim();
        } else {
          extractedText = buffer.toString('utf8').trim();
        }
      } else if (typeof body.pastedText === 'string' && body.pastedText.trim().length >= 20) {
        extractedText = body.pastedText.trim();
        fileName = `${typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 40) : 'manual'}.txt`;
      } else {
        res.status(400).json({ error: 'Adjunta un archivo Word (.docx) o pega el contenido del manual.' });
        return;
      }

      if (extractedText.length < 20) {
        res.status(400).json({
          error: 'No se pudo extraer suficiente texto del archivo. Verifica que el documento contenga texto editable.'
        });
        return;
      }

      const defaultTitle = path.basename(fileName, path.extname(fileName)).replace(/[-_]+/g, ' ');
      const title =
        typeof body.title === 'string' && body.title.trim().length >= 2 ? body.title.trim() : defaultTitle;

      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      const wordId = `word-${crypto.randomUUID().slice(0, 8)}`;
      const txtPath = resolveSafeTextPath(`${wordId}.txt`);
      if (txtPath) {
        fs.writeFileSync(txtPath, extractedText, 'utf8');
      }

      const record: WordDocumentRecord = {
        id: wordId,
        title,
        fileName,
        grade,
        subjectArea,
        docType,
        extractedText: extractedText.slice(0, 1500),
        wordCount,
        storedFilePath,
        mimeType,
        generatedMaterialIds: [],
        uploadedAt: new Date().toISOString()
      };

      const store = readStore();
      store.wordDocs.unshift(record);
      writeStore(store);

      res.status(201).json({ wordDoc: record });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error procesando el documento Word.'
      });
    }
  });

  app.get('/api/admin/word-docs/:id/download', requireAdmin, async (req, res) => {
    const store = readStore();
    const docRecord = store.wordDocs.find((w) => w.id === req.params.id);
    if (!docRecord) {
      res.status(404).json({ error: 'Documento no encontrado.' });
      return;
    }

    if (docRecord.storedFilePath) {
      const resolved = resolveSafeUploadPath(docRecord.storedFilePath);
      if (resolved && fs.existsSync(resolved)) {
        res.setHeader('Content-Type', docRecord.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${docRecord.fileName.replace(/"/g, '')}"`);
        fs.createReadStream(resolved).pipe(res);
        return;
      }
    }

    const fullText = await loadFullWordText(docRecord);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${docRecord.fileName.replace(/"/g, '')}"`);
    res.send(fullText);
  });

  app.delete('/api/admin/word-docs/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const index = store.wordDocs.findIndex((w) => w.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Documento no encontrado.' });
      return;
    }

    const [removed] = store.wordDocs.splice(index, 1);
    if (removed.storedFilePath) {
      const resolved = resolveSafeUploadPath(removed.storedFilePath);
      if (resolved && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }
    }
    const txtPath = resolveSafeTextPath(`${removed.id}.txt`);
    if (txtPath && fs.existsSync(txtPath)) {
      fs.unlinkSync(txtPath);
    }

    writeStore(store);
    res.json({ deletedId: removed.id });
  });

  // Deterministic Complementary Guide OR Grade Lesson Plan extraction directly from Word Document
  app.post('/api/admin/word-docs/:id/extract-draft', requireAdmin, async (req, res) => {
    try {
      const store = readStore();
      const docRecord = store.wordDocs.find((w) => w.id === req.params.id);
      if (!docRecord) {
        res.status(404).json({ error: 'Documento Word no encontrado.' });
        return;
      }

      const { mode } = req.body as { mode?: unknown };
      const targetMode: 'guia_facil' | 'planificacion' =
        mode === 'planificacion' ? 'planificacion' : 'guia_facil';

      const fullText = await loadFullWordText(docRecord);
      const draft = buildStructuredDraftFromWordText({
        mode: targetMode,
        sourceTitle: docRecord.title,
        grade: docRecord.grade,
        subjectArea: docRecord.subjectArea,
        docType: docRecord.docType,
        extractedText: fullText
      });

      res.json({ draft, sourceWordId: docRecord.id });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo estructurar el borrador desde el documento Word.'
      });
    }
  });

  // Generate Complementary Study Guide OR Grade Lesson Plan from Word Document via Gemini
  app.post('/api/admin/word-docs/:id/generate', requireAdmin, async (req, res) => {
    try {
      const store = readStore();
      const docRecord = store.wordDocs.find((w) => w.id === req.params.id);
      if (!docRecord) {
        res.status(404).json({ error: 'Documento Word no encontrado.' });
        return;
      }

      const { mode, customInstructions } = req.body as {
        mode?: unknown;
        customInstructions?: unknown;
      };

      const targetMode: 'guia_facil' | 'planificacion' =
        mode === 'planificacion' ? 'planificacion' : 'guia_facil';

      const fullText = await loadFullWordText(docRecord);

      const draft = await generateEducationalMaterialFromWord({
        mode: targetMode,
        sourceTitle: docRecord.title,
        grade: docRecord.grade,
        subjectArea: docRecord.subjectArea,
        docType: docRecord.docType,
        extractedText: fullText,
        customInstructions: typeof customInstructions === 'string' ? customInstructions.trim() : undefined
      });

      res.json({ draft, sourceWordId: docRecord.id });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el material complementario con IA.'
      });
    }
  });

  app.post('/api/admin/materials', requireAdmin, (req, res) => {
    try {
      const body = req.body as {
        title?: unknown;
        subtitle?: unknown;
        category?: unknown;
        subjectArea?: unknown;
        level?: unknown;
        grade?: unknown;
        price?: unknown;
        format?: unknown;
        pages?: unknown;
        durationOrScope?: unknown;
        previewExcerpt?: unknown;
        objectives?: unknown;
        tableOfContents?: unknown;
        contentSections?: unknown;
        featured?: unknown;
        published?: unknown;
        isComplementaryGuide?: unknown;
        sourceWordId?: unknown;
        fileUpload?: {
          fileName: string;
          mimeType: string;
          base64Data: string;
        };
      };

      if (typeof body.title !== 'string' || body.title.trim().length < 3) {
        res.status(400).json({ error: 'El título debe tener al menos 3 caracteres.' });
        return;
      }

      const category: MaterialCategory =
        typeof body.category === 'string' && ALLOWED_CATEGORIES.has(body.category as MaterialCategory)
          ? (body.category as MaterialCategory)
          : 'folletos';

      const grade: GradeLevel =
        typeof body.grade === 'string' && ALLOWED_GRADES.has(body.grade as GradeLevel)
          ? (body.grade as GradeLevel)
          : '8° Grado';

      const level: AcademicLevel =
        typeof body.level === 'string' && ALLOWED_LEVELS.has(body.level as AcademicLevel)
          ? (body.level as AcademicLevel)
          : grade === 'Gestión Académica'
            ? 'Gestión Académica'
            : category === 'planificaciones'
              ? 'Docentes'
              : grade === '4° Grado' || grade === '5° Grado' || grade === '6° Grado'
                ? 'Primaria II'
                : grade === '1° Año Bachillerato' || grade === '2° Año Bachillerato'
                  ? 'Bachillerato'
                  : 'Secundaria';

      const numericPages = Math.max(1, Math.min(500, Math.round(Number(body.pages) || (category === 'apuntes' ? 1 : 8))));

      let hasCustomFile = false;
      let customFilePath: string | undefined;
      let customFileName: string | undefined;
      let customFileMime: string | undefined;
      let zipEntries: string[] | undefined;

      if (body.fileUpload && typeof body.fileUpload.base64Data === 'string' && body.fileUpload.fileName) {
        const ext = path.extname(body.fileUpload.fileName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          res.status(400).json({
            error: 'Formato de archivo no permitido. Usa PDF, DOCX, DOC, PPTX, XLSX, ZIP, MD, TXT o HTML.'
          });
          return;
        }
        const cleanBase64 = body.fileUpload.base64Data.includes(',')
          ? body.fileUpload.base64Data.split(',')[1]
          : body.fileUpload.base64Data;
        const buffer = Buffer.from(cleanBase64, 'base64');
        if (buffer.byteLength > 40 * 1024 * 1024) {
          res.status(400).json({ error: 'El archivo excede el límite de 40 MB.' });
          return;
        }

        const storedFileName = `${crypto.randomUUID()}${ext}`;
        const resolved = resolveSafeUploadPath(storedFileName);
        if (!resolved) {
          res.status(400).json({ error: 'Ruta de almacenamiento inválida.' });
          return;
        }
        fs.writeFileSync(resolved, buffer);
        hasCustomFile = true;
        customFilePath = storedFileName;
        customFileName = path.basename(body.fileUpload.fileName).slice(0, 120);
        customFileMime = typeof body.fileUpload.mimeType === 'string' ? body.fileUpload.mimeType : 'application/octet-stream';

        if (ext === '.zip') {
          const parsedEntries = extractZipEntryNames(buffer);
          if (parsedEntries.length > 0) {
            zipEntries = parsedEntries;
          }
        }
      }

      const objectives = Array.isArray(body.objectives)
        ? body.objectives.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : ['Aplicar conceptos científicos y tecnológicos en situaciones reales de aula.'];

      const tableOfContents = Array.isArray(body.tableOfContents)
        ? body.tableOfContents.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : ['1. Introducción y marco teórico', '2. Desarrollo guiado', '3. Actividades y evaluación'];

      const contentSections: MaterialSection[] = Array.isArray(body.contentSections)
        ? body.contentSections
            .filter(
              (s): s is MaterialSection =>
                Boolean(s) && typeof s.heading === 'string' && typeof s.body === 'string'
            )
            .map((s) => ({
              heading: s.heading.trim(),
              body: s.body.trim(),
              bullets: Array.isArray(s.bullets)
                ? s.bullets.filter((b): b is string => typeof b === 'string')
                : undefined
            }))
        : [
            {
              heading: 'Contenido del Material',
              body:
                typeof body.previewExcerpt === 'string' && body.previewExcerpt.trim()
                  ? body.previewExcerpt.trim()
                  : 'Material educativo preparado en CienciaLab Editorial.'
            }
          ];

      const sourceWordId = typeof body.sourceWordId === 'string' ? body.sourceWordId : undefined;

      const newMaterial: MaterialAdmin = {
        id: `mat-${crypto.randomUUID().slice(0, 8)}`,
        title: body.title.trim(),
        subtitle:
          typeof body.subtitle === 'string' && body.subtitle.trim()
            ? body.subtitle.trim()
            : 'Recurso educativo de Ciencia y Tecnología incluido en el paquete del grado.',
        category,
        subjectArea:
          typeof body.subjectArea === 'string' && body.subjectArea.trim()
            ? body.subjectArea.trim()
            : 'Ciencia y Tecnología',
        level,
        grade,
        price: GRADE_PACK_PRICE_USD,
        currency: 'USD',
        format:
          typeof body.format === 'string' && body.format.trim()
            ? body.format.trim()
            : hasCustomFile && customFileName
              ? `${path.extname(customFileName).replace('.', '').toUpperCase()} Completo`
              : 'PDF Imprimible',
        pages: numericPages,
        durationOrScope:
          typeof body.durationOrScope === 'string' && body.durationOrScope.trim()
            ? body.durationOrScope.trim()
            : grade,
        coverImage: CATEGORY_DEFAULT_IMAGES[category],
        previewExcerpt:
          typeof body.previewExcerpt === 'string' && body.previewExcerpt.trim()
            ? body.previewExcerpt.trim()
            : 'Material estructurado para visualización general y descarga mediante el paquete del grado.',
        generalOverviewPoints: tableOfContents.slice(0, 4),
        zipEntries,
        objectives,
        tableOfContents,
        featured: Boolean(body.featured),
        published: body.published !== false,
        hasCustomFile,
        customFilePath,
        customFileName,
        customFileMime,
        isComplementaryGuide: Boolean(body.isComplementaryGuide),
        sourceWordId,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        contentSections
      };

      const store = readStore();
      store.materials.unshift(newMaterial);

      if (sourceWordId) {
        const wordIdx = store.wordDocs.findIndex((w) => w.id === sourceWordId);
        if (wordIdx !== -1) {
          store.wordDocs[wordIdx].generatedMaterialIds.push(newMaterial.id);
        }
      }

      writeStore(store);
      res.status(201).json({ material: newMaterial });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Error al guardar material.' });
    }
  });

  app.put('/api/admin/materials/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const index = store.materials.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Material no encontrado.' });
      return;
    }

    const existing = store.materials[index];
    const body = req.body as Partial<MaterialAdmin>;

    const updated: MaterialAdmin = {
      ...existing,
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : existing.title,
      subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : existing.subtitle,
      category:
        typeof body.category === 'string' && ALLOWED_CATEGORIES.has(body.category as MaterialCategory)
          ? (body.category as MaterialCategory)
          : existing.category,
      subjectArea: typeof body.subjectArea === 'string' ? body.subjectArea.trim() : existing.subjectArea,
      level:
        typeof body.level === 'string' && ALLOWED_LEVELS.has(body.level as AcademicLevel)
          ? (body.level as AcademicLevel)
          : existing.level,
      grade:
        typeof body.grade === 'string' && ALLOWED_GRADES.has(body.grade as GradeLevel)
          ? (body.grade as GradeLevel)
          : existing.grade,
      price:
        body.price !== undefined
          ? Number(Math.max(0, Math.min(999, Number(body.price) || 0)).toFixed(2))
          : existing.price,
      format: typeof body.format === 'string' ? body.format.trim() : existing.format,
      pages: body.pages !== undefined ? Math.max(1, Math.round(Number(body.pages) || existing.pages)) : existing.pages,
      durationOrScope:
        typeof body.durationOrScope === 'string' ? body.durationOrScope.trim() : existing.durationOrScope,
      previewExcerpt: typeof body.previewExcerpt === 'string' ? body.previewExcerpt.trim() : existing.previewExcerpt,
      published: typeof body.published === 'boolean' ? body.published : existing.published,
      featured: typeof body.featured === 'boolean' ? body.featured : existing.featured
    };

    store.materials[index] = updated;
    writeStore(store);
    res.json({ material: updated });
  });

  app.delete('/api/admin/materials/:id', requireAdmin, (req, res) => {
    const store = readStore();
    const index = store.materials.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Material no encontrado.' });
      return;
    }

    const [removed] = store.materials.splice(index, 1);
    if (removed.hasCustomFile && removed.customFilePath) {
      const resolved = resolveSafeUploadPath(removed.customFilePath);
      if (resolved && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }
    }

    writeStore(store);
    res.json({ deletedId: removed.id });
  });

  // Frontend middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Ruta API no encontrada.' });
        return;
      }
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CienciaLab Editorial running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
