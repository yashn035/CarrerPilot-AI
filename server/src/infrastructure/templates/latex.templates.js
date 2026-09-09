export const LATEX_TEMPLATES = {
  modern: `\\documentclass[a4paper,10pt]{article}
\\usepackage[left=0.75in,top=0.6in,right=0.75in,bottom=0.6in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

\\begin{document}
\\pagestyle{empty}

\\begin{center}
  {\\Huge \\textbf{ {{TITLE}} }} \\\\
  \\vspace{5pt}
  \\href{mailto:{{EMAIL}}}{ {{EMAIL}} } \\textbar{} {{PHONE}} \\textbar{} \\href{ {{LINKEDIN}} }{LinkedIn}
\\end{center}

{{CONTENT}}

\\end{document}`
};
