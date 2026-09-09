import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Handlebars helpers
handlebars.registerHelper('eq', (a, b) => a === b);
handlebars.registerHelper('or', function (...args) {
  return args.slice(0, -1).some(Boolean);
});

let compiledTemplate = null;

function getCompiledTemplate() {
  if (!compiledTemplate) {
    const templatePath = path.join(__dirname, '../../../infrastructure/templates/resumeTemplate.hbs');
    const source = fs.readFileSync(templatePath, 'utf8');
    compiledTemplate = handlebars.compile(source);
  }
  return compiledTemplate;
}

export function generateResumeHtml(resumeData) {
  const template = getCompiledTemplate();
  return template(resumeData);
}

/**
 * Pure JavaScript PDF generation fallback using pdf-lib.
 * Runs in any environment without browser dependencies or external binaries.
 */
export async function generatePdfLibFallback(resumeData) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 points
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const margin = 40;
  let y = height - margin;

  const checkPageBreak = (neededHeight = 20) => {
    if (y - neededHeight < margin) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }
  };

  const drawText = (text, options = {}) => {
    const fontSize = options.size || 9.5;
    const font = options.font || fontRegular;
    const color = options.color || rgb(0.15, 0.2, 0.28);
    const x = options.x || margin;
    const maxW = options.maxWidth || (width - margin * 2);

    const words = String(text || '').split(' ');
    let line = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxW && line) {
        checkPageBreak(fontSize + 4);
        page.drawText(line, { x, y, size: fontSize, font, color });
        y -= fontSize + 4;
        line = words[i];
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPageBreak(fontSize + 4);
      page.drawText(line, { x, y, size: fontSize, font, color });
      y -= fontSize + 4;
    }
  };

  const drawSectionHeading = (title) => {
    checkPageBreak(30);
    y -= 8;
    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.14, 0.38, 0.92)
    });
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92)
    });
    y -= 12;
  };

  // 1. HEADER SECTION
  const name = resumeData.personalInfo?.fullName || 'RESUME';
  page.drawText(name, {
    x: margin,
    y,
    size: 22,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16)
  });
  y -= 26;

  if (resumeData.targetRole) {
    page.drawText(resumeData.targetRole, {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.14, 0.38, 0.92)
    });
    y -= 16;
  }

  const info = resumeData.personalInfo || {};
  const contacts = [info.email, info.phone, info.location, info.linkedin, info.github, info.portfolio].filter(Boolean);
  if (contacts.length) {
    drawText(contacts.join('  |  '), { size: 9, color: rgb(0.35, 0.42, 0.52) });
    y -= 6;
  }

  // 2. PROFESSIONAL SUMMARY
  if (resumeData.summary) {
    drawSectionHeading('Professional Summary');
    drawText(resumeData.summary, { size: 9.5, color: rgb(0.2, 0.25, 0.3) });
    y -= 6;
  }

  // 3. WORK EXPERIENCE
  if (resumeData.experience?.length) {
    drawSectionHeading('Work Experience');
    for (const exp of resumeData.experience) {
      checkPageBreak(25);
      page.drawText(exp.position || 'Position', { x: margin, y, size: 10.5, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
      const duration = `${exp.startDate || ''} - ${exp.current ? 'Present' : (exp.endDate || '')}`;
      const durWidth = fontRegular.widthOfTextAtSize(duration, 9);
      page.drawText(duration, { x: width - margin - durWidth, y, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
      y -= 13;

      const sub = `${exp.company || ''}${exp.location ? ` | ${exp.location}` : ''}`;
      drawText(sub, { size: 9, font: fontOblique, color: rgb(0.35, 0.42, 0.52) });
      y -= 2;

      if (exp.bullets?.length) {
        for (const bullet of exp.bullets.filter(Boolean)) {
          drawText(`•  ${bullet}`, { x: margin + 8, maxWidth: width - margin * 2 - 8, size: 9, color: rgb(0.2, 0.25, 0.3) });
        }
      }
      y -= 6;
    }
  }

  // 4. PROJECTS
  if (resumeData.projects?.length) {
    drawSectionHeading('Key Projects');
    for (const proj of resumeData.projects) {
      checkPageBreak(20);
      page.drawText(proj.title || 'Project Title', { x: margin, y, size: 10.5, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
      y -= 13;

      if (proj.subtitle || proj.link) {
        drawText([proj.subtitle, proj.link].filter(Boolean).join(' - '), { size: 9, font: fontOblique, color: rgb(0.35, 0.42, 0.52) });
        y -= 2;
      }

      if (proj.bullets?.length) {
        for (const bullet of proj.bullets.filter(Boolean)) {
          drawText(`•  ${bullet}`, { x: margin + 8, maxWidth: width - margin * 2 - 8, size: 9, color: rgb(0.2, 0.25, 0.3) });
        }
      }
      y -= 6;
    }
  }

  // 5. EDUCATION
  if (resumeData.education?.length) {
    drawSectionHeading('Education');
    for (const edu of resumeData.education) {
      checkPageBreak(20);
      const degreeText = `${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`;
      page.drawText(degreeText, { x: margin, y, size: 10, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
      const dates = `${edu.startDate || ''} - ${edu.endDate || ''}`;
      const dWidth = fontRegular.widthOfTextAtSize(dates, 9);
      page.drawText(dates, { x: width - margin - dWidth, y, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
      y -= 13;

      const inst = `${edu.institution || ''}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}`;
      drawText(inst, { size: 9, font: fontRegular, color: rgb(0.35, 0.42, 0.52) });
      y -= 4;
    }
  }

  // 6. SKILLS
  const s = resumeData.skills || {};
  if (s.technical?.length || s.frameworks?.length || s.tools?.length || s.soft?.length) {
    drawSectionHeading('Skills & Competencies');
    if (s.technical?.length) {
      drawText(`Technical Skills: ${s.technical.join(', ')}`, { size: 9 });
    }
    if (s.frameworks?.length) {
      drawText(`Frameworks: ${s.frameworks.join(', ')}`, { size: 9 });
    }
    if (s.tools?.length) {
      drawText(`Tools: ${s.tools.join(', ')}`, { size: 9 });
    }
    if (s.soft?.length) {
      drawText(`Soft Skills: ${s.soft.join(', ')}`, { size: 9 });
    }
    y -= 4;
  }

  // 7. CERTIFICATIONS
  if (resumeData.certifications?.length) {
    drawSectionHeading('Certifications');
    for (const cert of resumeData.certifications) {
      checkPageBreak(15);
      drawText(`• ${cert.name || ''} - ${cert.issuer || ''} (${cert.date || ''})`, { size: 9 });
    }
    y -= 4;
  }

  // 8. ACHIEVEMENTS
  if (resumeData.achievements?.length) {
    drawSectionHeading('Achievements');
    for (const ach of resumeData.achievements) {
      checkPageBreak(18);
      drawText(`• ${ach.title || ''} (${ach.date || ''}) ${ach.description ? `: ${ach.description}` : ''}`, { size: 9 });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Main export function with Puppeteer rendering + pdf-lib fallback.
 */
export async function exportToPdf(resumeData) {
  const html = generateResumeHtml(resumeData);
  let browser;

  try {
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium-browser') ? '/usr/bin/chromium-browser' :
       fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.warn('[PDF Export] Puppeteer compilation failed/unavailable. Invoking pdf-lib fallback engine:', err.message);
    return await generatePdfLibFallback(resumeData);
  }
}

export function exportToTxt(resumeData) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements } = resumeData;
  let lines = [];

  lines.push('====================================================');
  lines.push((personalInfo.fullName || 'RESUME').toUpperCase());
  if (resumeData.targetRole) lines.push(`Target Role: ${resumeData.targetRole}`);
  
  const contacts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github
  ].filter(Boolean);
  if (contacts.length) lines.push(contacts.join(' | '));
  lines.push('====================================================\n');

  if (summary) {
    lines.push('--- PROFESSIONAL SUMMARY ---');
    lines.push(summary + '\n');
  }

  if (experience && experience.length) {
    lines.push('--- WORK EXPERIENCE ---');
    experience.forEach(exp => {
      lines.push(`${exp.position} | ${exp.company} (${exp.location || ''})`);
      lines.push(`Duration: ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`);
      if (exp.bullets && exp.bullets.length) {
        exp.bullets.forEach(b => lines.push(`  • ${b}`));
      }
      lines.push('');
    });
  }

  if (projects && projects.length) {
    lines.push('--- PROJECTS ---');
    projects.forEach(proj => {
      lines.push(`${proj.title} ${proj.link ? `[${proj.link}]` : ''}`);
      if (proj.subtitle) lines.push(proj.subtitle);
      if (proj.bullets && proj.bullets.length) {
        proj.bullets.forEach(b => lines.push(`  • ${b}`));
      }
      lines.push('');
    });
  }

  if (education && education.length) {
    lines.push('--- EDUCATION ---');
    education.forEach(edu => {
      lines.push(`${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}`);
      lines.push(`${edu.institution} | ${edu.startDate} - ${edu.endDate} ${edu.gpa ? `(GPA: ${edu.gpa})` : ''}`);
      lines.push('');
    });
  }

  if (skills) {
    lines.push('--- SKILLS & COMPETENCIES ---');
    if (skills.technical?.length) lines.push(`Technical: ${skills.technical.join(', ')}`);
    if (skills.frameworks?.length) lines.push(`Frameworks: ${skills.frameworks.join(', ')}`);
    if (skills.tools?.length) lines.push(`Tools: ${skills.tools.join(', ')}`);
    if (skills.soft?.length) lines.push(`Soft Skills: ${skills.soft.join(', ')}`);
    lines.push('');
  }

  if (certifications && certifications.length) {
    lines.push('--- CERTIFICATIONS ---');
    certifications.forEach(cert => lines.push(`- ${cert.name} (${cert.issuer}, ${cert.date})`));
    lines.push('');
  }

  if (achievements && achievements.length) {
    lines.push('--- ACHIEVEMENTS ---');
    achievements.forEach(ach => lines.push(`- ${ach.title} (${ach.date}): ${ach.description}`));
    lines.push('');
  }

  return lines.join('\n');
}

export function exportToJson(resumeData) {
  return JSON.stringify(resumeData, null, 2);
}
