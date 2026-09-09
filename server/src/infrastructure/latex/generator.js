import fs from 'fs/promises';
import path from 'path';

// Escapes special characters in LaTeX
export function escapeLatex(text) {
  if (!text) return '';
  const escaped = String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/%/g, '\\%');
  return escaped;
}

export async function generateLatex(resumeData, templateId = 'modern_ats') {
  // Try to load template from server/templates/
  let templateSource = '';
  try {
    const templatePath = path.resolve(process.cwd(), `server/templates/${templateId}/main.tex`);
    templateSource = await fs.readFile(templatePath, 'utf-8');
  } catch (err) {
    // Fallback to a hardcoded basic template if file not found
    templateSource = getFallbackTemplate();
  }

  // Replace placeholders
  const personal = resumeData.personal || {};
  let output = templateSource;
  
  output = output.replace(/\{\{FULL_NAME\}\}/g, escapeLatex(personal.name) || 'Your Name');
  output = output.replace(/\{\{EMAIL\}\}/g, escapeLatex(personal.email) || 'email@example.com');
  output = output.replace(/\{\{PHONE\}\}/g, escapeLatex(personal.phone) || '');
  output = output.replace(/\{\{LINKEDIN\}\}/g, escapeLatex(personal.linkedin) || '');
  output = output.replace(/\{\{GITHUB\}\}/g, escapeLatex(personal.github) || '');
  
  // Format Education
  const eduArr = resumeData.education || [];
  let eduLatex = '';
  if (eduArr.length > 0) {
    eduLatex = '\\section*{Education}\n\\begin{itemize}[leftmargin=*]\n';
    eduArr.forEach(edu => {
      eduLatex += `  \\item \\textbf{${escapeLatex(edu.school)}} -- ${escapeLatex(edu.degree)} \\hfill ${escapeLatex(edu.date)}\\\\\n`;
    });
    eduLatex += '\\end{itemize}\n';
  }
  output = output.replace(/\{\{EDUCATION\}\}/g, eduLatex);

  // Format Experience
  const expArr = resumeData.experience || [];
  let expLatex = '';
  if (expArr.length > 0) {
    expLatex = '\\section*{Experience}\n\\begin{itemize}[leftmargin=*]\n';
    expArr.forEach(exp => {
      expLatex += `  \\item \\textbf{${escapeLatex(exp.company)}} -- ${escapeLatex(exp.role)} \\hfill ${escapeLatex(exp.date)}\\\\\n`;
      if (exp.description) {
        expLatex += `    ${escapeLatex(exp.description)}\\\\\n`;
      }
    });
    expLatex += '\\end{itemize}\n';
  }
  output = output.replace(/\{\{EXPERIENCE\}\}/g, expLatex);
  
  // Format Projects
  const projArr = resumeData.projects || [];
  let projLatex = '';
  if (projArr.length > 0) {
    projLatex = '\\section*{Projects}\n\\begin{itemize}[leftmargin=*]\n';
    projArr.forEach(proj => {
      projLatex += `  \\item \\textbf{${escapeLatex(proj.title)}} \\hfill ${escapeLatex(proj.date)}\\\\\n`;
      if (proj.description) {
        projLatex += `    ${escapeLatex(proj.description)}\\\\\n`;
      }
    });
    projLatex += '\\end{itemize}\n';
  }
  output = output.replace(/\{\{PROJECTS\}\}/g, projLatex);
  
  // Format Skills
  const skillsArr = resumeData.skills || [];
  let skillsLatex = '';
  if (skillsArr.length > 0) {
    skillsLatex = `\\section*{Skills}\n${escapeLatex(skillsArr.join(', '))}\n`;
  }
  output = output.replace(/\{\{SKILLS\}\}/g, skillsLatex);

  return output;
}

function getFallbackTemplate() {
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}
\\begin{center}
    {\\Huge \\textbf{{{FULL_NAME}}}}\\\\
    \\vspace{2mm}
    {{EMAIL}} | {{PHONE}} | \\href{{{LINKEDIN}}}{LinkedIn} | \\href{{{GITHUB}}}{GitHub}
\\end{center}

{{EDUCATION}}

{{EXPERIENCE}}

{{PROJECTS}}

{{SKILLS}}

\\end{document}
`;
}
