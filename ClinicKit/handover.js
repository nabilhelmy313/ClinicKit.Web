const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, ExternalHyperlink,
  PageBreak
} = require('docx');
const fs = require('fs');

// ── Colours ────────────────────────────────────────────────────────────────────
const CLR = {
  navy:      '1B3A6B',
  teal:      '1D9E75',
  lightTeal: 'E1F5EE',
  blue:      '2E5FA3',
  lightBlue: 'E6F1FB',
  purple:    '5B4DA8',
  lightPurp: 'EEEDFE',
  amber:     'B36200',
  lightAmb:  'FAEEDA',
  grey:      '73726C',
  lightGrey: 'F5F4F0',
  midGrey:   'D0CEC5',
  white:     'FFFFFF',
  black:     '1A1A18',
  red:       'C0392B',
  lightRed:  'FDECEA',
};

// ── Border helpers ─────────────────────────────────────────────────────────────
const borderNone = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const border1    = (c) => ({ style: BorderStyle.SINGLE, size: 1, color: c || CLR.midGrey });
const border6    = (c) => ({ style: BorderStyle.SINGLE, size: 6, color: c || CLR.teal });
const allBorders = (c) => ({ top: border1(c), bottom: border1(c), left: border1(c), right: border1(c) });
const noBorders  = { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone };

// ── Text helpers ───────────────────────────────────────────────────────────────
const run  = (text, opts = {}) => new TextRun({ text, font: 'Arial', ...opts });
const bold = (text, opts = {}) => run(text, { bold: true, ...opts });
const code = (text) => new TextRun({ text, font: 'Courier New', size: 18, color: CLR.navy });

const para = (children, opts = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], ...opts });
const h1   = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: 'Arial', bold: true })] });
const h2   = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: 'Arial', bold: true })] });
const h3   = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font: 'Arial', bold: true })] });
const gap  = (n = 1) => Array.from({ length: n }, () => para(run('')));

// ── Bullet helper ──────────────────────────────────────────────────────────────
const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children: Array.isArray(text) ? text : [run(text)],
  spacing: { after: 80 },
});
const bullet2 = (children, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children,
  spacing: { after: 80 },
});

// ── Divider ────────────────────────────────────────────────────────────────────
const divider = (color = CLR.midGrey) => new Paragraph({
  border: { bottom: border6(color) },
  spacing: { after: 160 },
  children: [run('')],
});

// ── Section title banner ───────────────────────────────────────────────────────
const sectionBanner = (num, title, color, lightColor) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: noBorders,
  rows: [new TableRow({ children: [new TableCell({
    borders: noBorders,
    shading: { fill: lightColor, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 200, right: 200 },
    children: [new Paragraph({
      children: [
        bold(`${num}  `, { size: 28, color }),
        bold(title, { size: 28, color }),
      ],
      spacing: { before: 0, after: 0 },
    })],
  })]})],
});

// ── File card (filename + description) ────────────────────────────────────────
const fileCard = (path, description) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: noBorders,
  rows: [new TableRow({ children: [new TableCell({
    borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 12, color: CLR.teal } },
    shading: { fill: CLR.lightGrey, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    children: [
      new Paragraph({ children: [code(path)], spacing: { before: 0, after: 40 } }),
      new Paragraph({ children: [run(description, { color: CLR.grey, size: 20 })], spacing: { before: 0, after: 0 } }),
    ],
  })]})],
});

// ── Two-column info row ────────────────────────────────────────────────────────
const infoRow = (label, value, labelColor = CLR.navy) => new TableRow({
  children: [
    new TableCell({
      borders: allBorders(CLR.midGrey),
      shading: { fill: CLR.lightGrey, type: ShadingType.CLEAR },
      width: { size: 2500, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [para(bold(label, { size: 20, color: labelColor }))],
    }),
    new TableCell({
      borders: allBorders(CLR.midGrey),
      width: { size: 6860, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [para(Array.isArray(value) ? value : [run(value, { size: 20 })])],
    }),
  ],
});

const infoTable = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2500, 6860],
  rows,
});

// ── Code block ────────────────────────────────────────────────────────────────
const codeBlock = (lines) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: noBorders,
  rows: [new TableRow({ children: [new TableCell({
    borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 8, color: CLR.navy } },
    shading: { fill: '1E1E2E', type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    children: lines.map(l => new Paragraph({
      children: [new TextRun({ text: l, font: 'Courier New', size: 18, color: 'A6E3A1' })],
      spacing: { before: 0, after: 20 },
    })),
  })]})],
});

// ── Callout box ───────────────────────────────────────────────────────────────
const callout = (icon, label, text, fill, textColor) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  borders: noBorders,
  rows: [new TableRow({ children: [new TableCell({
    borders: noBorders,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    children: [new Paragraph({
      children: [bold(`${icon} ${label}: `, { color: textColor }), run(text, { color: CLR.black })],
      spacing: { before: 0, after: 0 },
    })],
  })]})],
});

// ── Header / Footer ────────────────────────────────────────────────────────────
const docHeader = () => new Header({
  children: [new Paragraph({
    border: { bottom: border1(CLR.teal) },
    children: [
      bold('ClinicKit — ', { size: 20, color: CLR.navy }),
      run('Backend Handover Document', { size: 20, color: CLR.grey }),
    ],
    tabStops: [{ type: 'right', position: 9360 }],
    spacing: { after: 80 },
  })],
});

const docFooter = () => new Footer({
  children: [new Paragraph({
    border: { top: border1(CLR.midGrey) },
    children: [
      run('Confidential — ClinicKit Project', { size: 18, color: CLR.grey }),
      run('   |   Page ', { size: 18, color: CLR.grey }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: CLR.grey }),
      run(' of ', { size: 18, color: CLR.grey }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: CLR.grey }),
    ],
    spacing: { before: 80 },
  })],
});

// ══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ══════════════════════════════════════════════════════════════════════════════

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: CLR.navy },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: CLR.blue },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: CLR.navy },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: { default: docHeader() },
    footers: { default: docFooter() },
    children: [

      // ── COVER ───────────────────────────────────────────────────────────────
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        borders: noBorders,
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: CLR.navy, type: ShadingType.CLEAR },
          margins: { top: 600, bottom: 600, left: 400, right: 400 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [bold('ClinicKit', { size: 72, color: CLR.white })], spacing: { after: 80 } }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Backend Handover Document', { size: 32, color: CLR.teal })], spacing: { after: 160 } }),
            divider(CLR.teal),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run('ASP.NET Core 9  |  Clean Architecture  |  Multi-Tenant Clinic System', { size: 22, color: CLR.lightGrey })], spacing: { after: 80 } }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Week 1 — Sprint Kit Complete', { size: 20, color: CLR.lightGrey })], spacing: { after: 0 } }),
          ],
        })]})],
      }),

      ...gap(2),

      // ── META TABLE ──────────────────────────────────────────────────────────
      infoTable([
        infoRow('Project',      'ClinicKit — Multi-Tenant Clinic Management System'),
        infoRow('Framework',    '.NET 9  |  ASP.NET Core 9  |  Entity Framework Core 9'),
        infoRow('Architecture', 'Clean Architecture (Domain / Application / Infrastructure / API)'),
        infoRow('Auth',         'ASP.NET Identity + JWT Bearer + Refresh Token Rotation'),
        infoRow('Database',     'SQL Server (Docker, port 1433)  —  EF Core Code-First Migrations'),
        infoRow('Sprint Status','Week 1 Tasks 2, 3, 5 complete  |  Task 4 (Roles seeder) pending'),
      ]),

      ...gap(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  1. ARCHITECTURE OVERVIEW
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('01', 'Architecture Overview', CLR.navy, CLR.lightBlue),
      ...gap(1),

      para([run('ClinicKit follows '), bold('Clean Architecture'), run(' with four projects that form a strict dependency chain:')]),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 3080, 4080],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.teal), shading: { fill: CLR.teal, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Layer', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.teal), shading: { fill: CLR.teal, type: ShadingType.CLEAR }, width: { size: 3080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Project', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.teal), shading: { fill: CLR.teal, type: ShadingType.CLEAR }, width: { size: 4080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Responsibility', { color: CLR.white, size: 20 }))] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightTeal, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold('Domain', { size: 20, color: CLR.teal })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 3080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('ClinicKit.Domain')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Entities, interfaces, domain events. No external dependencies.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightBlue, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold('Application', { size: 20, color: CLR.blue })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 3080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('ClinicKit.Application')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('MediatR commands/handlers, FluentValidation, interfaces. Depends only on Domain.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightPurp, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold('Infrastructure', { size: 20, color: CLR.purple })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 3080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('ClinicKit.Infrastructure')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('EF Core DbContext, Identity, JWT, services. Implements Application interfaces.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold('API', { size: 20, color: CLR.amber })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 3080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('ClinicKit.API')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4080, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Controllers, middleware, Program.cs. Entry point — knows all other layers.', { size: 20 })])] }),
          ]}),
        ],
      }),

      ...gap(1),
      para([bold('Dependency rule: '), run('outer layers depend on inner layers — never the other way. Application knows Domain. Infrastructure knows Application. API knows everything.')]),
      ...gap(1),

      h2('Key Design Decisions'),
      bullet2([bold('CQRS via MediatR: '), run('every write is a Command, every read will be a Query — handlers stay small and focused.')]),
      bullet2([bold('Pipeline Behaviours: '), run('LoggingBehaviour and ValidationBehaviour intercept every request before the handler runs — zero boilerplate per handler.')]),
      bullet2([bold('Single-session refresh policy: '), run('login revokes all existing refresh tokens — prevents token accumulation.')]),
      bullet2([bold('EF global filters: '), run('soft-delete and tenant isolation are transparent — handlers never write WHERE clauses manually.')]),
      bullet2([bold('RefreshToken is not a BaseEntity: '), run('intentionally skips tenant/soft-delete filters so tokens can always be found by their token string.')]),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  2. DOMAIN LAYER
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('02', 'Domain Layer', CLR.teal, CLR.lightTeal),
      ...gap(1),
      para([run('The Domain layer has '), bold('zero external dependencies'), run(' (only MediatR.Contracts for INotification). It defines the contracts that all other layers build on.')]),
      ...gap(1),

      h2('BaseEntity — the root of everything'),
      fileCard('Domain/Common/BaseEntity.cs', 'Abstract base class that every business entity must inherit.'),
      ...gap(1),

      para([run('Every entity that inherits '), code('BaseEntity'), run(' automatically gets:')]),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 2400, 4760],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.teal), shading: { fill: CLR.teal, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Concern', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.teal), shading: { fill: CLR.teal, type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Properties', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.teal), shading: { fill: CLR.teal, type: ShadingType.CLEAR }, width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('How it works', { color: CLR.white, size: 20 }))] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Identity', { size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('Id (Guid)')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Auto-generated GUID on creation. No sequential leak risk.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightTeal, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Multi-Tenancy', { size: 20, color: CLR.teal }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightTeal, type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('TenantId (Guid)')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightTeal, type: ShadingType.CLEAR }, width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Auto-stamped from JWT claim on SaveChanges. Never set manually.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Audit', { size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('CreatedAt/By\nUpdatedAt/By')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Auto-filled in ApplyAuditAndSoftDelete() on every SaveChanges call.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightRed, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Soft Delete', { size: 20, color: CLR.red }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightRed, type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('IsDeleted\nDeletedAt/By')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightRed, type: ShadingType.CLEAR }, width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Hard DELETE is intercepted and converted to IsDeleted=true. EF global filter hides deleted rows automatically.', { size: 20 })])] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Domain Events', { size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code('DomainEvents\nAddDomainEvent')])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run('Internal collection of INotification events. Ready for future use — dispatch via MediatR after SaveChanges.', { size: 20 })])] }),
          ]}),
        ],
      }),

      ...gap(1),
      h2('RefreshToken Entity'),
      fileCard('Domain/Entities/RefreshToken.cs', 'Security primitive for refresh token rotation. Does NOT inherit BaseEntity.'),
      ...gap(1),
      para([run('Refresh tokens are security primitives, not business records. They intentionally '), bold('skip BaseEntity'), run(' to avoid the tenant/soft-delete global query filters — a refresh token must always be findable by its token string, regardless of tenant.')]),
      ...gap(1),
      bullet2([bold('Token: '), run('64-byte cryptographically-random value, base64-encoded. Unique index in DB.')]),
      bullet2([bold('UserId: '), run('FK to AspNetUsers.Id (IdentityUser). Max 450 chars matching Identity column.')]),
      bullet2([bold('TenantId: '), run('Denormalised Guid — allows "revoke all for tenant" queries without joining users table.')]),
      bullet2([bold('IsActive (computed): '), run('returns !IsRevoked && !IsExpired. Not mapped to DB column.')]),

      ...gap(1),
      h2('Domain Interfaces'),
      fileCard('Domain/Common/ISoftDeletable.cs', 'IsDeleted, DeletedAt, DeletedBy — applied by EF global query filter.'),
      fileCard('Domain/Common/ITenantEntity.cs', 'TenantId (Guid) — applied by EF tenant global query filter.'),
      fileCard('Domain/Common/IAuditableEntity.cs', 'CreatedAt/By and UpdatedAt/By — filled automatically on SaveChanges.'),
      fileCard('Domain/Common/IDomainEvent.cs', 'Marker interface inheriting INotification. Used for future domain event dispatch.'),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  3. APPLICATION LAYER
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('03', 'Application Layer', CLR.blue, CLR.lightBlue),
      ...gap(1),
      para([run('The Application layer orchestrates use cases via '), bold('MediatR CQRS'), run('. It defines interfaces that Infrastructure must implement, keeping business logic free of database or HTTP details.')]),
      ...gap(1),

      h2('Dependency Injection'),
      fileCard('Application/DependencyInjection.cs', 'Registers MediatR, pipeline behaviours, and FluentValidation validators.'),
      ...gap(1),
      codeBlock([
        'services.AddMediatR(cfg => {',
        '  cfg.RegisterServicesFromAssembly(assembly);',
        '  cfg.AddBehavior<IPipelineBehavior<,>, LoggingBehaviour<,>>();',
        '  cfg.AddBehavior<IPipelineBehavior<,>, ValidationBehaviour<,>>();',
        '});',
        'services.AddValidatorsFromAssembly(assembly);',
      ]),

      ...gap(1),
      h2('Pipeline Behaviours'),
      para([run('Every MediatR command passes through both behaviours '), bold('before'), run(' the handler runs:')]),
      ...gap(1),

      fileCard('Application/Common/Behaviours/LoggingBehaviour.cs', 'Logs request name, elapsed time, and any exception for every command.'),
      ...gap(1),
      bullet2([bold('On success: '), run('"✓ LoginCommand completed in 45ms" — helps spot slow handlers.')]),
      bullet2([bold('On failure: '), run('"✗ LoginCommand failed after 12ms" + full exception — no handler needs its own try/catch.')]),

      ...gap(1),
      fileCard('Application/Common/Behaviours/ValidationBehaviour.cs', 'Runs all FluentValidation validators. Throws ValidationException on failure — caught by GlobalExceptionHandlerMiddleware as 422.'),
      ...gap(1),
      bullet2([bold('No validators registered: '), run('passes through immediately.')]),
      bullet2([bold('Validators fail: '), run('throws ValidationException with all field errors grouped by property name.')]),
      bullet2([bold('Handlers never validate: '), run('all validation happens here, automatically.')]),

      ...gap(1),
      h2('Application Interfaces'),

      fileCard('Application/Common/Interfaces/IApplicationDbContext.cs', 'Abstraction over EF DbContext — Application layer uses this, never the concrete class.'),
      ...gap(1),
      para([run('Currently exposes '), code('DbSet<RefreshToken> RefreshTokens'), run(' and '), code('SaveChangesAsync'), run('. Add a '), code('DbSet<T>'), run(' line here for every new aggregate (Patient, Appointment, etc.).')]),

      ...gap(1),
      fileCard('Application/Common/Interfaces/ICurrentUserService.cs', 'UserId, UserName, TenantId, IsAuthenticated — read from the JWT in the active HTTP request.'),
      fileCard('Application/Common/Interfaces/ITenantService.cs', 'TenantId and HasTenant — thin wrapper over ICurrentUserService, specific to tenant concerns.'),
      fileCard('Application/Common/Interfaces/IIdentityService.cs', 'ValidateUserAsync(email, password) for login. ValidateUserAsync(userId) for refresh — reloads user without re-checking password.'),
      fileCard('Application/Common/Interfaces/IJwtService.cs', 'GenerateAccessToken(userId, email, tenantId, roles) and GenerateRefreshToken(). RefreshTokenExpiryDays from settings.'),

      ...gap(1),
      h2('Auth Feature — CQRS Commands'),
      para([run('All three auth operations are MediatR commands under '), code('Application/Features/Auth/'), run('.')]),
      ...gap(1),

      h3('LoginCommand'),
      fileCard('Application/Features/Auth/LoginCommand.cs', 'Validates credentials, revokes old tokens (single-session), issues new access + refresh pair.'),
      ...gap(1),
      bullet2([bold('Validator: '), run('Email must be non-empty and valid format. Password minimum 6 characters.')]),
      bullet2([bold('Handler step 1: '), run('IIdentityService.ValidateUserAsync(email, password) — returns null on bad credentials → 401.')]),
      bullet2([bold('Handler step 2: '), run('Revokes all existing active refresh tokens for this user (single-session policy).')]),
      bullet2([bold('Handler step 3: '), run('Generates new JWT access token + 64-byte refresh token, persists refresh token to DB.')]),
      bullet2([bold('Returns: '), run('AuthResponse with both tokens and their expiry timestamps.')]),

      ...gap(1),
      h3('RefreshTokenCommand'),
      fileCard('Application/Features/Auth/RefreshTokenCommand.cs', 'Rotates a refresh token — old is revoked, new pair issued. Reloads user roles/tenant for up-to-date claims.'),
      ...gap(1),
      bullet2([bold('Step 1: '), run('Looks up the token in DB. 401 if not found.')]),
      bullet2([bold('Step 2: '), run('Checks IsActive. Returns 401 with specific message (expired vs revoked).')]),
      bullet2([bold('Step 3: '), run('Reloads user info by userId — catches role/tenant changes since last login.')]),
      bullet2([bold('Step 4: '), run('Revokes the old token, issues a new pair (rotation — prevents replay attacks).')]),

      ...gap(1),
      h3('RevokeTokenCommand'),
      fileCard('Application/Features/Auth/RevokeTokenCommand.cs', 'Marks a refresh token revoked. Security check: user can only revoke their own tokens. Idempotent.'),
      ...gap(1),
      bullet2([bold('Ownership check: '), run('token.UserId must match ICurrentUserService.UserId — prevents one user revoking another\'s token.')]),
      bullet2([bold('Idempotent: '), run('already-revoked tokens return success without throwing.')]),

      ...gap(1),
      fileCard('Application/Features/Auth/AuthResponse.cs', 'Record: AccessToken, RefreshToken, AccessTokenExpiresAt, RefreshTokenExpiresAt.'),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  4. INFRASTRUCTURE LAYER
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('04', 'Infrastructure Layer', CLR.purple, CLR.lightPurp),
      ...gap(1),
      para([run('Infrastructure implements every Application interface. It knows about SQL Server, ASP.NET Identity, JWT, and Serilog — Application and Domain never touch these.')]),
      ...gap(1),

      h2('Dependency Injection'),
      fileCard('Infrastructure/DependencyInjection.cs', 'Single extension method AddInfrastructure() that wires the entire Infrastructure layer.'),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3200, 6160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.purple), shading: { fill: CLR.purple, type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Registration', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.purple), shading: { fill: CLR.purple, type: ShadingType.CLEAR }, width: { size: 6160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('What it does', { color: CLR.white, size: 20 }))] }),
          ]}),
          ...[
            ['AddDbContext<ApplicationDbContext>', 'SQL Server via connection string. Migrations assembly set to Infrastructure.'],
            ['IApplicationDbContext (Scoped)', 'Resolves as the concrete ApplicationDbContext — Application layer never sees EF.'],
            ['AddIdentityCore<IdentityUser>', 'Pure API Identity — no cookie middleware. Password: digit + lowercase, min 6 chars. Unique email required.'],
            ['AddRoles<IdentityRole>', 'Role support: Admin, Doctor, Receptionist (seeded in Task 4).'],
            ['AddEntityFrameworkStores', 'Identity tables live in same ApplicationDbContext (same database).'],
            ['AddAuthentication(JwtBearer)', 'Validates issuer, audience, lifetime, signing key. ClockSkew = zero (no tolerance window).'],
            ['ICurrentUserService (Scoped)', 'CurrentUserService — reads claims from HttpContext.User.'],
            ['ITenantService (Scoped)', 'TenantService — wraps ICurrentUserService, exposes HasTenant.'],
            ['IJwtService (Scoped)', 'JwtService — generates signed JWT and random refresh tokens.'],
            ['IIdentityService (Scoped)', 'IdentityService — wraps UserManager<IdentityUser>.'],
          ].map(([reg, desc]) => new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightPurp, type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code(reg)])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), width: { size: 6160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run(desc, { size: 20 })])] }),
          ]})),
        ],
      }),

      ...gap(1),
      h2('ApplicationDbContext'),
      fileCard('Infrastructure/Persistence/ApplicationDbContext.cs', 'Main EF DbContext. Inherits IdentityDbContext — Identity tables live in the same database.'),
      ...gap(1),
      para([bold('Three automatic behaviours fire on every SaveChanges:')]),
      bullet2([bold('Audit: '), run('Added entities get CreatedAt=now, CreatedBy=currentUser. Modified entities get UpdatedAt/By.')]),
      bullet2([bold('Soft Delete: '), run('EntityState.Deleted is intercepted — State is changed to Modified, IsDeleted=true, DeletedAt/By are set. No actual DELETE ever reaches the DB.')]),
      bullet2([bold('TenantId auto-stamp: '), run('New entities with TenantId == Guid.Empty get the current user\'s TenantId from ICurrentUserService.')]),
      ...gap(1),
      para([bold('Global Query Filters (OnModelCreating):')]),
      bullet2([bold('EF Core rule: '), run('only ONE HasQueryFilter per entity type allowed.')]),
      bullet2([bold('Solution: '), run('TenantQueryExtension checks which interfaces the entity implements and applies the correct combined filter.')]),
      ...gap(1),
      codeBlock([
        '// Case A — BaseEntity descendants (most entities):',
        'e => !e.IsDeleted && (!CurrentTenantId.HasValue || e.TenantId == CurrentTenantId)',
        '',
        '// Case B — ISoftDeletable only:',
        'e => !e.IsDeleted',
        '',
        '// Case C — ITenantEntity only:',
        'e => !CurrentTenantId.HasValue || e.TenantId == CurrentTenantId',
      ]),

      ...gap(1),
      para([run('The filter captures '), code('this'), run(' (the DbContext instance). Because DbContext is Scoped (new instance per request), EF Core evaluates '), code('CurrentTenantId'), run(' freshly on every query — correct tenant isolation per request.')]),

      ...gap(1),
      h2('Services'),

      fileCard('Infrastructure/Services/JwtService.cs', 'Generates signed JWT access tokens and random refresh tokens.'),
      ...gap(1),
      para([bold('Access token claims:')]),
      bullet2([code('sub'), run(' — userId (IdentityUser.Id)')]),
      bullet2([code('email'), run(' — user email address')]),
      bullet2([code('tenant_id'), run(' — clinic GUID (read by CurrentUserService and TenantMiddleware)')]),
      bullet2([code('role'), run(' — one claim per role (Admin / Doctor / Receptionist)')]),
      bullet2([code('jti'), run(' — unique token ID (for future revocation by jti)')]),
      ...gap(1),
      para([run('Signed with '), bold('HMAC-SHA256'), run('. Expiry = AccessTokenExpiryMinutes from JwtSettings (default 60 min).')]),
      para([run('Refresh token = '), code('RandomNumberGenerator.GetBytes(64)'), run(' converted to Base64. 64 bytes = 512 bits of entropy.')]),

      ...gap(1),
      fileCard('Infrastructure/Services/IdentityService.cs', 'Wraps UserManager<IdentityUser>. Two overloads of ValidateUserAsync.'),
      ...gap(1),
      bullet2([bold('(email, password): '), run('FindByEmailAsync + CheckPasswordAsync. Returns null on any failure — caller throws 401.')]),
      bullet2([bold('(userId): '), run('FindByIdAsync only — used by Refresh to reload roles without re-checking password.')]),
      bullet2([bold('BuildResultAsync: '), run('reads roles via GetRolesAsync, reads tenant_id from user claims via GetClaimsAsync.')]),

      ...gap(1),
      callout('📌', 'How to assign a tenant to a user', 'The tenant_id is stored as an ASP.NET Identity user claim in AspNetUserClaims. When creating a user, call: userManager.AddClaimAsync(user, new Claim("tenant_id", tenantGuid.ToString()))', CLR.lightAmb, CLR.amber),

      ...gap(1),
      fileCard('Infrastructure/Services/CurrentUserService.cs', 'Reads identity info from ClaimsPrincipal (the parsed JWT) via IHttpContextAccessor.'),
      fileCard('Infrastructure/Services/TenantService.cs', 'Thin wrapper over ICurrentUserService — exposes TenantId and HasTenant for clarity.'),

      ...gap(1),
      h2('EF Query Filter Extensions'),

      fileCard('Infrastructure/Persistence/Extensions/SoftDeleteQueryExtension.cs', 'Dynamically builds HasQueryFilter(e => !e.IsDeleted) for any ISoftDeletable entity via reflection.'),
      fileCard('Infrastructure/Persistence/Extensions/TenantQueryExtension.cs', 'Dynamically builds the combined SoftDelete+Tenant filter (Case A), tenant-only (Case C). Uses reflection to handle any entity type generically.'),
      ...gap(1),
      para([run('Both extensions use '), code('MethodInfo.MakeGenericMethod(entityType.ClrType)'), run(' to create typed lambda expressions at runtime. This avoids duplicating filter code for every entity.')]),

      ...gap(1),
      fileCard('Infrastructure/Persistence/Configurations/RefreshTokenConfiguration.cs', 'IEntityTypeConfiguration mapping — table name, column constraints, and indexes.'),
      ...gap(1),
      bullet2([code('Token'), run(' — unique index. No two rows can share a token string.')]),
      bullet2([code('(UserId, IsRevoked, ExpiresAt)'), run(' — composite index. Optimises the login query that finds active tokens to revoke.')]),
      bullet2([run('Computed properties '), code('IsExpired'), run(' and '), code('IsActive'), run(' are ignored (not mapped to columns).')]),
      bullet2([run('No global query filter on RefreshTokens — tokens must always be findable by token string across all tenants.')]),

      ...gap(1),
      fileCard('Infrastructure/Settings/JwtSettings.cs', 'Options class bound from appsettings.json "JwtSettings" section via IOptions<JwtSettings>.'),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  5. API LAYER
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('05', 'API Layer', CLR.amber, CLR.lightAmb),
      ...gap(1),

      h2('Program.cs — Middleware Pipeline'),
      fileCard('API/Program.cs', 'Entry point. Configures all services and defines the exact middleware execution order.'),
      ...gap(1),
      para([bold('The order of middleware matters. This is the pipeline:')]),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [600, 3500, 5260],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [para(bold('#', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 3500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Middleware', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 5260, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Why here', { color: CLR.white, size: 20 }))] }),
          ]}),
          ...[
            ['1', 'UseSerilogRequestLogging()', 'Must be first — captures full request timing including all other middleware.'],
            ['2', 'UseGlobalExceptionHandler()', 'Must wrap everything — catches exceptions from any subsequent middleware.'],
            ['3', 'UseSwagger / UseSwaggerUI', 'Swagger UI served before auth checks so it is always accessible.'],
            ['4', 'UseCors()', 'CORS headers must be added before auth to allow preflight OPTIONS requests.'],
            ['5', 'UseHttpsRedirection()', 'Redirect before auth — no point authenticating a non-HTTPS request.'],
            ['6', 'UseAuthentication()', 'Parses JWT and sets HttpContext.User — must run before anything that reads User.'],
            ['7', 'UseTenantMiddleware()', 'Validates tenant_id claim — must run AFTER UseAuthentication (needs User.Identity.IsAuthenticated).'],
            ['8', 'UseAuthorization()', 'Enforces [Authorize] attributes — must run after Authentication and Tenant validation.'],
          ].map(([n, mw, why], i) => new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [para(bold(n, { size: 20, color: CLR.amber }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 3500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code(mw)])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 5260, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run(why, { size: 20 })])] }),
          ]})),
        ],
      }),

      ...gap(1),
      h2('AuthController'),
      fileCard('API/Controllers/AuthController.cs', 'Three endpoints under /api/auth. Delegates to MediatR — no business logic in the controller.'),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 1600, 2000, 3760],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Endpoint', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 1600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Auth', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Response', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.amber), shading: { fill: CLR.amber, type: ShadingType.CLEAR }, width: { size: 3760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Body', { color: CLR.white, size: 20 }))] }),
          ]}),
          ...[
            ['POST /api/auth/login', 'Anonymous', '200 AuthResponse\n401 Unauthorized\n422 Validation', '{ email, password }'],
            ['POST /api/auth/refresh', 'Anonymous', '200 AuthResponse\n401 Unauthorized', '{ refreshToken }'],
            ['POST /api/auth/revoke', '[Authorize]', '204 No Content\n401 Unauthorized', '{ refreshToken }'],
          ].map(([ep, auth, resp, body], i) => new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code(ep)])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 1600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run(auth, { size: 20 })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code(resp)])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightAmb, type: ShadingType.CLEAR }, width: { size: 3760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code(body)])] }),
          ]})),
        ],
      }),

      ...gap(1),
      h2('Global Exception Handler'),
      fileCard('API/Middleware/GlobalExceptionHandlerMiddleware.cs', 'Catches every unhandled exception. Returns RFC-7807 ProblemDetails with traceId and instance.'),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3200, 1400, 4760],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.red), shading: { fill: CLR.red, type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Exception', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.red), shading: { fill: CLR.red, type: ShadingType.CLEAR }, width: { size: 1400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('HTTP Code', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.red), shading: { fill: CLR.red, type: ShadingType.CLEAR }, width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Notes', { color: CLR.white, size: 20 }))] }),
          ]}),
          ...[
            ['ValidationException', '422', 'Errors grouped by property name under "errors" key in response.'],
            ['UnauthorizedAccessException', '401', 'Message from exception used as title if not empty.'],
            ['KeyNotFoundException', '404', 'Message from exception used as title if not empty.'],
            ['ArgumentException', '400', 'Bad input not covered by FluentValidation.'],
            ['OperationCanceledException', '499 (silent)', 'Client disconnected. No response body. Logged at Debug only.'],
            ['Everything else', '500', 'Generic message. Full exception logged at Error level with traceId.'],
          ].map(([ex, code_, note], i) => new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightRed, type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([code(ex)])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightRed, type: ShadingType.CLEAR }, width: { size: 1400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold(code_, { size: 20, color: CLR.red })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightRed, type: ShadingType.CLEAR }, width: { size: 4760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run(note, { size: 20 })])] }),
          ]})),
        ],
      }),

      ...gap(1),
      para([run('Every error response includes '), code('"traceId"'), run(' (W3C trace ID) and '), code('"instance"'), run(' (request path). Use the traceId to grep the Serilog log file for the exact request.')]),

      ...gap(1),
      h2('TenantMiddleware'),
      fileCard('API/Middleware/TenantMiddleware.cs', 'Validates tenant_id claim on authenticated requests. Must run AFTER UseAuthentication().'),
      ...gap(1),
      bullet2([bold('Unauthenticated requests: '), run('passed through — allows /api/auth/login and Swagger to work without a token.')]),
      bullet2([bold('Authenticated + has tenant_id: '), run('passed through to the next middleware.')]),
      bullet2([bold('Authenticated + missing tenant_id: '), run('returns 400 with JSON ProblemDetails body. Request is blocked.')]),

      ...gap(1),
      h2('Configuration Files'),

      fileCard('API/appsettings.json', 'Production configuration: connection string, JWT settings, Serilog with Console+File sinks.'),
      ...gap(1),
      codeBlock([
        '"JwtSettings": {',
        '  "Secret": "CHANGE_ME_TO_A_STRONG_32_CHAR_KEY_!!",',
        '  "Issuer": "ClinicKit",',
        '  "Audience": "ClinicKitClients",',
        '  "AccessTokenExpiryMinutes": 60,',
        '  "RefreshTokenExpiryDays": 7',
        '}',
      ]),
      ...gap(1),
      callout('⚠️', 'Security', 'Change JwtSettings.Secret before deploying. Must be at least 32 characters. Use a randomly generated value stored in environment variables or Azure Key Vault — never commit a real secret to source control.', CLR.lightRed, CLR.red),

      ...gap(1),
      fileCard('API/appsettings.Development.json', 'Development overrides: Default log level = Debug, EF Core = Information (shows SQL queries in console).'),
      fileCard('API/Properties/launchSettings.json', 'Two profiles: http (port 5000) and https (port 7000). Both open Swagger UI on launch. ASPNETCORE_ENVIRONMENT = Development.'),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  6. KEY FLOWS
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('06', 'Key Flows', CLR.navy, CLR.lightBlue),
      ...gap(1),

      h2('Login Flow'),
      ...gap(1),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [500, 2800, 6060],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.navy), shading: { fill: CLR.navy, type: ShadingType.CLEAR }, width: { size: 500, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [para(bold('', { color: CLR.white, size: 18 }))] }),
            new TableCell({ borders: allBorders(CLR.navy), shading: { fill: CLR.navy, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [para(bold('Component', { color: CLR.white, size: 18 }))] }),
            new TableCell({ borders: allBorders(CLR.navy), shading: { fill: CLR.navy, type: ShadingType.CLEAR }, width: { size: 6060, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [para(bold('Action', { color: CLR.white, size: 18 }))] }),
          ]}),
          ...[
            ['1', 'Client', 'POST /api/auth/login  { email, password }'],
            ['2', 'ValidationBehaviour', 'FluentValidation checks email format and password length >= 6'],
            ['3', 'LoginCommandHandler', 'Calls IIdentityService.ValidateUserAsync(email, password)'],
            ['4', 'IdentityService', 'UserManager.FindByEmailAsync + CheckPasswordAsync. Returns null on failure.'],
            ['5', 'LoginCommandHandler', 'Throws UnauthorizedAccessException if null → 401 from GlobalExceptionHandler'],
            ['6', 'LoginCommandHandler', 'Revokes all active refresh tokens for this user (single-session)'],
            ['7', 'JwtService', 'GenerateAccessToken(userId, email, tenantId, roles) → signed JWT'],
            ['8', 'JwtService', 'GenerateRefreshToken() → 64-byte random, base64'],
            ['9', 'LoginCommandHandler', 'Saves new RefreshToken to DB via IApplicationDbContext'],
            ['10', 'Client', 'Receives AuthResponse with both tokens and expiry times'],
          ].map(([n, comp, action], i) => new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: CLR.lightBlue, type: ShadingType.CLEAR }, width: { size: 500, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [para(bold(n, { size: 18, color: CLR.navy }))] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightGrey, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [para([bold(comp, { size: 18, color: CLR.blue })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightGrey, type: ShadingType.CLEAR }, width: { size: 6060, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [para([run(action, { size: 18 })])] }),
          ]})),
        ],
      }),

      ...gap(1),
      h2('Multi-Tenancy Flow (every authenticated request)'),
      ...gap(1),
      bullet2([bold('JWT parsed by UseAuthentication: '), run('tenant_id claim extracted from token, set in HttpContext.User.')]),
      bullet2([bold('TenantMiddleware: '), run('checks User.Identity.IsAuthenticated && !tenantService.HasTenant → 400 if missing.')]),
      bullet2([bold('CurrentUserService: '), run('any component reads TenantId via ICurrentUserService.TenantId — reads from the same HttpContext.User.')]),
      bullet2([bold('ApplicationDbContext query: '), run('EF evaluates CurrentTenantId = _currentUser.TenantId. Every LINQ query gets an automatic WHERE TenantId = @tenantId.')]),
      bullet2([bold('SaveChanges: '), run('new entities with TenantId == Guid.Empty are auto-stamped with current user\'s TenantId.')]),
      ...gap(1),
      callout('✅', 'Result', 'A user from Clinic A can never read or write data belonging to Clinic B — enforced at the database query layer, not in application code.', CLR.lightTeal, CLR.teal),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  7. HOW TO RUN
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('07', 'How to Run', CLR.teal, CLR.lightTeal),
      ...gap(1),

      h2('Prerequisites'),
      bullet2([bold('.NET 9 SDK: '), run('https://dotnet.microsoft.com/download')]),
      bullet2([bold('Docker Desktop: '), run('for SQL Server container')]),
      bullet2([bold('EF Core tools: '), code('dotnet tool install --global dotnet-ef')]),

      ...gap(1),
      h2('1. Start SQL Server in Docker'),
      codeBlock([
        'docker run -e "ACCEPT_EULA=Y" \\',
        '           -e "SA_PASSWORD=Your_password123" \\',
        '           -p 1433:1433 \\',
        '           --name clinickit-sql \\',
        '           -d mcr.microsoft.com/mssql/server:2022-latest',
      ]),

      ...gap(1),
      h2('2. Update appsettings.json'),
      para([run('Set the '), code('SA_PASSWORD'), run(' in '), code('DefaultConnection'), run(' to match the Docker password. Also update '), code('JwtSettings.Secret'), run(' to a random 32+ character string.')]),

      ...gap(1),
      h2('3. Run EF Migrations'),
      codeBlock([
        'cd ClinicKit/src/ClinicKit.Infrastructure',
        'dotnet ef migrations add InitialCreate --startup-project ../ClinicKit.API',
        'dotnet ef database update --startup-project ../ClinicKit.API',
      ]),

      ...gap(1),
      h2('4. Run the API'),
      codeBlock([
        'cd ClinicKit/src/ClinicKit.API',
        'dotnet run',
        '',
        '# Then open: http://localhost:5000/swagger',
      ]),

      ...gap(1),
      h2('5. Test Login via Swagger'),
      bullet2([run('Open Swagger UI at http://localhost:5000/swagger')]),
      bullet2([run('Create a user first — you need to seed one (Task 4 pending) or add via EF directly')]),
      bullet2([run('POST /api/auth/login with valid email + password')]),
      bullet2([run('Copy the accessToken, click the Authorize button in Swagger, paste: Bearer <token>')]),
      bullet2([run('All subsequent requests will include the JWT automatically')]),

      ...gap(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      //  8. NEXT TASKS
      // ══════════════════════════════════════════════════════════════════════
      sectionBanner('08', 'Remaining Sprint Tasks', CLR.grey, CLR.lightGrey),
      ...gap(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [800, 2800, 5760],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.grey), shading: { fill: CLR.grey, type: ShadingType.CLEAR }, width: { size: 800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Task', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.grey), shading: { fill: CLR.grey, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('Title', { color: CLR.white, size: 20 }))] }),
            new TableCell({ borders: allBorders(CLR.grey), shading: { fill: CLR.grey, type: ShadingType.CLEAR }, width: { size: 5760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para(bold('What to build', { color: CLR.white, size: 20 }))] }),
          ]}),
          ...[
            ['W1 T4', 'Roles & Permissions seeder', 'Seed Admin, Doctor, Receptionist roles and default permissions. Add a seeded admin user with tenant_id claim so login works immediately.'],
            ['W2 T6', 'App Shell — Sidebar + Layout', 'Angular frontend: lazy-loaded modules, AuthGuard, unified page layout.'],
            ['W2 T7', 'Auth module — Login screen', 'Angular login page, JWT token storage, HTTP interceptor to attach Authorization header, 401 redirect.'],
            ['W2 T8', 'GTable component', 'Generic Angular table with sort, filter, pagination, and action buttons.'],
            ['W2 T9', 'RTL/LTR toggle + ngx-translate', 'Arabic/English language files, automatic direction, PrimeNG RTL support.'],
            ['W2 T10', 'Shared components', 'ConfirmDialog, Toast service, *hasPermission directive.'],
            ['W3 T11', 'Patient entity + CRUD API', 'Name, Phone, DOB, Gender, MedicalHistory. Search by name and phone.'],
            ['W3 T12', 'Appointment entity + conflict check', 'Doctor, Patient, Slot. Prevent double-booking. States: Pending/Confirmed/Cancelled.'],
            ['W3 T13-15', 'Patient & Appointment screens', 'Angular screens: patient list, add/edit dialog, calendar view, medical file timeline.'],
            ['W4 T16-20', 'Invoice, WhatsApp, e-Receipt, Deploy', 'Billing API, WhatsApp reminders, e-Receipt stub, seed data, production deploy.'],
          ].map(([task, title, desc], i) => new TableRow({ children: [
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightGrey, type: ShadingType.CLEAR }, width: { size: 800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold(task, { size: 19, color: CLR.navy })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightGrey, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([bold(title, { size: 19 })])] }),
            new TableCell({ borders: allBorders(CLR.midGrey), shading: { fill: i % 2 === 0 ? CLR.white : CLR.lightGrey, type: ShadingType.CLEAR }, width: { size: 5760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [para([run(desc, { size: 19 })])] }),
          ]})),
        ],
      }),

      ...gap(1),
      callout('📌', 'How to add a new feature (the pattern)', 'Domain: create Entity extending BaseEntity. Application: add DbSet to IApplicationDbContext, write Command/Query + Handler + Validator. Infrastructure: add DbSet to ApplicationDbContext, add EF Configuration class. API: add controller endpoint that sends MediatR command.', CLR.lightBlue, CLR.blue),

      ...gap(1),
      divider(CLR.teal),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run('ClinicKit Backend Handover  |  Week 1 Complete  |  Built with ASP.NET Core 9 + Clean Architecture', { size: 18, color: CLR.grey })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('ClinicKit_Handover.docx', buf);
  console.log('Done: ClinicKit_Handover.docx');
});
