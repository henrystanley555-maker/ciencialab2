import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { MaterialAdmin } from '../src/types.ts';

const CATEGORY_LABELS: Record<MaterialAdmin['category'], string> = {
  folletos: 'Gestión Académica / Documento',
  practicas: 'Manual de Laboratorio Completo',
  apuntes: 'Guía Teórica Complementaria',
  planificaciones: 'Planificación Curricular'
};

export function streamMaterialPdf(res: Response, material: MaterialAdmin, orderCode?: string) {
  const safeSlug = material.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="CienciaLab-${safeSlug || material.id}.pdf"`);

  const isSinglePageGuide = material.pages === 1;

  const doc = new PDFDocument({
    size: 'A4',
    margins: isSinglePageGuide
      ? { top: 36, bottom: 20, left: 46, right: 46 }
      : { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: material.title,
      Author: 'CienciaLab Editorial',
      Subject: `${CATEGORY_LABELS[material.category]} - ${material.grade}`
    }
  });

  doc.pipe(res);

  if (isSinglePageGuide) {
    // Crisp 1-page A4 sheet layout for complementary practice scripts (Inicio · Desarrollo · Culminación)
    const contentWidth = doc.page.width - 92;
    const footerY = doc.page.height - 38;
    const maxBodyY = footerY - 24;

    doc.rect(0, 0, doc.page.width, 76).fill('#0F172A');
    doc
      .fillColor('#5EEAD4')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `CIENCIALAB  |  GUION COMPLEMENTARIO DE CLASE (1 PÁGINA)  |  ${material.grade.toUpperCase()}`,
        46,
        18,
        { width: contentWidth, lineBreak: false }
      );

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(material.title, 46, 34, { width: contentWidth, height: 34, ellipsis: true });

    doc.y = 86;

    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        `Grado: ${material.grade}  ·  ${material.durationOrScope}${
          orderCode ? `  ·  Licencia: ${orderCode}` : ''
        }`,
        46,
        doc.y,
        { width: contentWidth }
      );

    doc.moveDown(0.4);
    doc.moveTo(46, doc.y).lineTo(doc.page.width - 46, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
    doc.moveDown(0.5);

    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text('Propósito del Guion', 46, doc.y, {
      width: contentWidth
    });
    doc.moveDown(0.15);
    doc.fillColor('#334155').font('Helvetica').fontSize(9.2).text(material.previewExcerpt, 46, doc.y, {
      width: contentWidth,
      lineGap: 1.8
    });
    doc.moveDown(0.55);

    for (const section of material.contentSections) {
      if (doc.y > maxBodyY - 40) break;
      doc.fillColor('#0F766E').font('Helvetica-Bold').fontSize(10.5).text(section.heading, 46, doc.y, {
        width: contentWidth
      });
      doc.moveDown(0.15);

      const remainingBody = Math.max(24, maxBodyY - doc.y);
      doc.fillColor('#1E293B').font('Helvetica').fontSize(9.3).text(section.body, 46, doc.y, {
        width: contentWidth,
        height: remainingBody,
        lineGap: 2,
        ellipsis: true
      });
      doc.moveDown(0.2);

      if (section.bullets && section.bullets.length > 0) {
        for (const bullet of section.bullets) {
          if (doc.y > maxBodyY - 14) break;
          doc
            .fillColor('#334155')
            .font('Helvetica')
            .fontSize(8.8)
            .text(`•  ${bullet}`, 56, doc.y, {
              width: contentWidth - 10,
              height: Math.max(12, maxBodyY - doc.y),
              lineGap: 1.5,
              ellipsis: true
            });
          doc.moveDown(0.12);
        }
      }
      doc.moveDown(0.45);
    }

    doc.moveTo(46, footerY - 8).lineTo(doc.page.width - 46, footerY - 8).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(8)
      .text(
        'CIENCIALAB — Guion breve de 1 página (Inicio · Desarrollo · Culminación) complementario al Manual de Prácticas.',
        46,
        footerY,
        { width: contentWidth, align: 'center', lineBreak: false }
      );

    doc.end();
    return;
  }

  // Multi-page standard layout
  doc.rect(0, 0, doc.page.width, 96).fill('#0F172A');
  doc
    .fillColor('#5EEAD4')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`CIENCIALAB EDITORIAL  |  ${CATEGORY_LABELS[material.category].toUpperCase()}`, 54, 28);

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(material.title, 54, 48, { width: doc.page.width - 108 });

  doc.y = 116;

  doc
    .fillColor('#475569')
    .font('Helvetica')
    .fontSize(10)
    .text(
      `Grado: ${material.grade || material.level}   ·   Área: ${material.subjectArea}   ·   Alcance: ${material.durationOrScope}   ·   Formato: ${material.format}`,
      54,
      doc.y,
      { width: doc.page.width - 108 }
    );

  if (orderCode) {
    doc.moveDown(0.35);
    doc
      .fillColor('#0F766E')
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(`Licencia de uso educativo verificada · Comprobante: ${orderCode}`);
  }

  doc.moveDown(0.8);
  doc.moveTo(54, doc.y).lineTo(doc.page.width - 54, doc.y).strokeColor('#CBD5E1').lineWidth(1).stroke();
  doc.moveDown(1);

  doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Descripción General');
  doc.moveDown(0.3);
  doc.fillColor('#334155').font('Helvetica').fontSize(10.5).text(material.subtitle, { lineGap: 3 });
  doc.moveDown(0.4);
  doc.fillColor('#334155').font('Helvetica').fontSize(10.5).text(material.previewExcerpt, { lineGap: 3 });
  doc.moveDown(1);

  if (material.objectives.length > 0) {
    doc.fillColor('#0F766E').font('Helvetica-Bold').fontSize(12).text('Objetivos de Aprendizaje');
    doc.moveDown(0.4);
    for (const obj of material.objectives) {
      doc.fillColor('#1E293B').font('Helvetica').fontSize(10.5).text(`•  ${obj}`, { indent: 8, lineGap: 2 });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.8);
  }

  if (material.tableOfContents.length > 0) {
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Índice de Contenidos');
    doc.moveDown(0.4);
    for (const item of material.tableOfContents) {
      doc.fillColor('#475569').font('Helvetica').fontSize(10).text(item, { indent: 8, lineGap: 2 });
      doc.moveDown(0.15);
    }
    doc.moveDown(1);
  }

  for (const section of material.contentSections) {
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text(section.heading);
    doc.moveDown(0.35);
    doc.fillColor('#1E293B').font('Helvetica').fontSize(10.5).text(section.body, { lineGap: 3.5 });
    doc.moveDown(0.4);

    if (section.bullets && section.bullets.length > 0) {
      for (const bullet of section.bullets) {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
        }
        doc.fillColor('#334155').font('Helvetica').fontSize(10).text(`–  ${bullet}`, { indent: 12, lineGap: 2.5 });
        doc.moveDown(0.25);
      }
    }
    doc.moveDown(0.8);
  }

  if (doc.y > doc.page.height - 100) {
    doc.addPage();
  }
  doc.moveDown(0.5);
  doc.moveTo(54, doc.y).lineTo(doc.page.width - 54, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
  doc.moveDown(0.6);
  doc
    .fillColor('#64748B')
    .font('Helvetica')
    .fontSize(9)
    .text(
      'CienciaLab Editorial — Material educativo de Ciencia y Tecnología. Uso autorizado para docentes y estudiantes.',
      { align: 'center' }
    );

  doc.end();
}
