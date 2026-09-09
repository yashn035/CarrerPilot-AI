import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

export async function compileLatexToPdf(latexSource) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'latex-'));
  const texPath = path.join(tempDir, 'main.tex');
  
  try {
    await fs.writeFile(texPath, latexSource, 'utf-8');

    // We use a lightweight texlive image
    // Note: requires docker daemon to be running and accessible
    const dockerCmd = `docker run --rm -v "${tempDir}:/workdir" -w /workdir blang/latex:ubuntu latexmk -pdf -interaction=nonstopmode main.tex`;

    await new Promise((resolve, reject) => {
      exec(dockerCmd, { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          console.error("LATEX COMPILE ERROR STDOUT:", stdout);
          console.error("LATEX COMPILE ERROR STDERR:", stderr);
          const lineMatch = stderr?.match(/l\.(\d+)/) || stdout?.match(/l\.(\d+)/);
          let parsedError = "Compilation failed. Check your LaTeX syntax.";
          if (stderr?.includes("failed to connect to the docker API") || stderr?.includes("Is the docker daemon running") || stdout?.includes("docker")) {
            parsedError = "Docker daemon is not running. Please start Docker Desktop to compile PDFs.";
          } else if (lineMatch) {
            // Find the line that actually contains the error
            const lines = (stderr + "\n" + stdout).split('\n');
            const errorLine = lines.find(l => l.includes('!')) || 'LaTeX Syntax Error';
            parsedError = `LaTeX Error on line ${lineMatch[1]}. ${errorLine}`;
          } else if (error.killed) {
            parsedError = "Compilation timed out. Your code may be too complex.";
          }
          const err = new Error(parsedError);
          err.line = lineMatch ? parseInt(lineMatch[1]) : null;
          return reject(err);
        }
        resolve();
      });
    });

    const pdfPath = path.join(tempDir, 'main.pdf');
    const pdfBuffer = await fs.readFile(pdfPath);
    
    // We will clean up the temp dir, but return the buffer
    return pdfBuffer;
  } catch (error) {
    throw error;
  } finally {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error("Failed to clean up temp dir", e);
    }
  }
}
