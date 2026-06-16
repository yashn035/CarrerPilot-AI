/**
 * Resume Export Service
 * Compiles Resume JSON payloads into print-ready PDF-style HTML or Microsoft Word-compliant DOCX format.
 */

export function compileResumeToHtml(resume) {
  const template = resume.template || 'classic';
  const layout = resume.layout || 'chronological';
  
  const personalInfo = resume.personalInfo || {};
  const education = resume.education || [];
  const experience = resume.experience || [];
  const projects = resume.projects || [];
  const skills = resume.skills || [];
  const certifications = resume.certifications || [];

  // Determine section ordering based on layout
  const order = {
    chronological: ['experience', 'education', 'projects', 'skills', 'certifications'],
    functional: ['skills', 'projects', 'education', 'experience', 'certifications'],
    combination: ['skills', 'experience', 'projects', 'education', 'certifications'],
    targeted: ['experience', 'projects', 'skills', 'education', 'certifications'],
    ats: ['skills', 'education', 'projects', 'experience', 'certifications']
  }[layout] || ['experience', 'education', 'projects', 'skills', 'certifications'];

  // Font and color palettes based on template type
  let fontStack = "font-family: 'Times New Roman', Times, serif;";
  let primaryColor = "#111827";
  let headingStyle = "font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #d1d5db; margin-top: 14px; margin-bottom: 6px; padding-bottom: 2px;";
  let bodyFontSize = "10.5pt";
  let titleFontSize = "22pt";

  if (template === 'modern') {
    fontStack = "font-family: 'Inter', -apple-system, sans-serif;";
    primaryColor = "#2563eb"; // Accent blue
    headingStyle = `font-weight: 850; text-transform: uppercase; color: ${primaryColor}; border-bottom: 2px solid #e2e8f0; margin-top: 16px; margin-bottom: 8px; padding-bottom: 3px; letter-spacing: 0.05em;`;
    titleFontSize = "24pt";
  } else if (template === 'minimal') {
    fontStack = "font-family: 'Outfit', sans-serif;";
    primaryColor = "#000000";
    headingStyle = "font-weight: 700; text-transform: uppercase; color: #111827; border-left: 4px solid #111827; padding-left: 8px; margin-top: 14px; margin-bottom: 6px;";
    titleFontSize = "20pt";
    bodyFontSize = "10pt";
  } else if (template === 'ats') {
    fontStack = "font-family: Arial, Helvetica, sans-serif;";
    primaryColor = "#000000";
    headingStyle = "font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000000; margin-top: 12px; margin-bottom: 4px; padding-bottom: 1px; letter-spacing: 0.02em;";
    titleFontSize = "18pt";
    bodyFontSize = "10pt";
  }

  // Compile Header Links
  const headerLinks = [
    personalInfo.phone && `Phone: ${personalInfo.phone}`,
    personalInfo.email && `Email: ${personalInfo.email}`,
    personalInfo.linkedin && `LinkedIn: ${personalInfo.linkedin}`,
    personalInfo.github && `GitHub: ${personalInfo.github}`,
    personalInfo.portfolio && `Portfolio: ${personalInfo.portfolio}`
  ].filter(Boolean).join(' | ');

  // Section Compilers
  const sections = {
    education: education.length > 0 && `
      <div>
        <h2 style="${headingStyle} font-size: 11pt; margin-top: 12px;">Education</h2>
        ${education.map(edu => `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: ${bodyFontSize};">
            <tr>
              <td style="font-weight: bold; text-align: left;">${edu.school || 'University'}</td>
              <td style="text-align: right; color: #4b5563;">${edu.date || ''}</td>
            </tr>
            <tr>
              <td style="font-style: italic; text-align: left;">${edu.degree || 'Degree'}</td>
              <td style="text-align: right; font-weight: bold;">${edu.gpa ? `GPA: ${edu.gpa}` : ''}</td>
            </tr>
          </table>
        `).join('')}
      </div>
    `,
    experience: experience.length > 0 && `
      <div>
        <h2 style="${headingStyle} font-size: 11pt; margin-top: 12px;">Experience</h2>
        ${experience.map(exp => `
          <div style="margin-bottom: 8px; font-size: ${bodyFontSize};">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; text-align: left;">${exp.company || 'Company'}</td>
                <td style="text-align: right; color: #4b5563;">${exp.date || ''}</td>
              </tr>
              <tr>
                <td style="font-style: italic; text-align: left; color: #374151;">${exp.role || 'Role'}</td>
                <td style="text-align: right; color: #4b5563;">${exp.location || ''}</td>
              </tr>
            </table>
            <div style="margin-top: 3px; padding-left: 12px; border-left: 2px solid ${template === 'modern' ? '#2563eb' : '#e5e7eb'};">
              ${(exp.description || '').split('\n').filter(Boolean).map(bullet => `
                <div style="margin-bottom: 2px; position: relative; padding-left: 10px; line-height: 1.4;">
                  <span style="position: absolute; left: 0; color: ${primaryColor};">•</span>
                  ${bullet.trim()}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `,
    projects: projects.length > 0 && `
      <div>
        <h2 style="${headingStyle} font-size: 11pt; margin-top: 12px;">Projects</h2>
        ${projects.map(proj => `
          <div style="margin-bottom: 8px; font-size: ${bodyFontSize};">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; text-align: left;">
                  ${proj.title || 'Project'}
                  ${proj.technologies ? `<span style="font-weight: normal; font-style: italic; color: #6b7280; font-size: 9.5pt;"> (${proj.technologies})</span>` : ''}
                </td>
                <td style="text-align: right; color: #4b5563;">${proj.date || ''}</td>
              </tr>
            </table>
            <div style="margin-top: 3px; padding-left: 12px; border-left: 2px solid ${template === 'modern' ? '#2563eb' : '#e5e7eb'};">
              ${(proj.description || '').split('\n').filter(Boolean).map(bullet => `
                <div style="margin-bottom: 2px; position: relative; padding-left: 10px; line-height: 1.4;">
                  <span style="position: absolute; left: 0; color: ${primaryColor};">•</span>
                  ${bullet.trim()}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `,
    skills: skills.length > 0 && `
      <div>
        <h2 style="${headingStyle} font-size: 11pt; margin-top: 12px;">Skills</h2>
        <p style="font-size: ${bodyFontSize}; margin: 0; line-height: 1.4;">
          <strong style="color: ${template === 'modern' ? primaryColor : '#1f2937'};">Core Competencies:</strong>
          <span>${skills.join(', ')}</span>
        </p>
      </div>
    `,
    certifications: certifications.length > 0 && `
      <div>
        <h2 style="${headingStyle} font-size: 11pt; margin-top: 12px;">Certifications</h2>
        <ul style="font-size: ${bodyFontSize}; margin: 0; padding-left: 16px; line-height: 1.4;">
          ${certifications.map(cert => `<li style="margin-bottom: 2px;">${cert}</li>`).join('')}
        </ul>
      </div>
    `
  };

  const orderedContent = order.map(key => sections[key]).filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${personalInfo.name || 'Resume'} - CareerPilot AI</title>
  <style>
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #000000;
        -webkit-print-color-adjust: exact;
      }
      .page-break {
        page-break-before: always;
      }
    }
    body {
      ${fontStack}
      color: #1f2937;
      line-height: 1.35;
      background: #ffffff;
      margin: 0;
      padding: 24px;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto;">
    <!-- Header -->
    <div style="text-align: ${template === 'classic' ? 'center' : 'left'}; border-bottom: ${template === 'modern' ? `2px solid ${primaryColor}` : 'none'}; padding-bottom: 6px; margin-bottom: 10px;">
      <h1 style="margin: 0 0 4px 0; font-size: ${titleFontSize}; font-weight: 850; letter-spacing: -0.02em; color: ${template === 'modern' ? primaryColor : '#111827'}; text-transform: uppercase;">
        ${personalInfo.name || 'Your Name'}
      </h1>
      <div style="font-size: 9.5pt; color: #4b5563; font-weight: 500;">
        ${headerLinks}
      </div>
    </div>

    <!-- Summary -->
    ${personalInfo.summary ? `
      <div style="margin-bottom: 12px;">
        <p style="font-size: ${bodyFontSize}; line-height: 1.45; margin: 0; color: #374151;">
          ${personalInfo.summary}
        </p>
      </div>
    ` : ''}

    <!-- Content sections in custom order -->
    ${orderedContent}
  </div>
</body>
</html>`;
}

export function compileResumeToDocxXml(resume) {
  const htmlContent = compileResumeToHtml(resume);

  // Wrap compiled HTML layout inside Microsoft Word compatible XML schema
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <title>${resume.personalInfo?.name || 'Resume'} - Exported Document</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11.0in;
      margin: 0.75in 0.75in 0.75in 0.75in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
  </style>
</head>
<body style="tab-interval:.5in">
  <div class="Section1">
    ${htmlContent}
  </div>
</body>
</html>`;
}
