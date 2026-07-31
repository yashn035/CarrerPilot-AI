import zlib from 'zlib';
import aiOrchestrator from '../../../infrastructure/ai/ai.orchestrator.js';
import promptEngine from '../../../infrastructure/ai/prompt.engine.js';
import logger from '../../../shared/logger/logger.js';

// Dynamic import placeholders
let pdfParse = null;
let mammoth = null;

try {
  pdfParse = (await import('pdf-parse')).default;
} catch (e) {
  logger.warn("pdf-parse dependency is not installed. Will utilize Gemini native file parsing or local regex fallback.");
}

try {
  mammoth = await import('mammoth');
} catch (e) {
  logger.warn("mammoth dependency is not installed. Will utilize local XML scanner fallback.");
}

/**
 * Parses a resume buffer (PDF, DOCX, or text) and generates a structured candidate profile.
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<Object>}
 */
export async function parseResume(buffer, mimeType) {
  let extractedText = "";

  logger.info(`Starting resume parsing pipeline for mimeType: ${mimeType}`);

  if (mimeType === 'application/pdf') {
    extractedText = await parsePdfBuffer(buffer);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
    extractedText = await parseDocxBuffer(buffer);
  } else {
    // Treat as plain text
    extractedText = buffer.toString('utf-8');
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("Unable to extract readable text content from the uploaded resume file.");
  }

  // Pass extracted text to Gemini to build a structured profile
  const systemPrompt = promptEngine.getPrompt('interview_profile_extractor', 'v1');
  const userPrompt = `Raw Resume Text Content:\n${extractedText}\n\nCompile structured candidate JSON profile:`;

  try {
    const aiResponse = await aiOrchestrator.callAI(systemPrompt, userPrompt, false);
    if (aiResponse) {
      const parsedProfile = aiOrchestrator.parseCleanJson(aiResponse);
      if (parsedProfile && parsedProfile.skills) {
        return parsedProfile;
      }
    }
  } catch (err) {
    logger.error("AI NLP profiling failed, using rule-based profile generator", err);
  }

  // Rule-based fallback profile generator
  return generateRuleBasedProfile(extractedText);
}

/**
 * Extracts text from PDF buffer
 */
async function parsePdfBuffer(buffer) {
  if (pdfParse) {
    try {
      const data = await pdfParse(buffer);
      if (data && data.text) return data.text;
    } catch (err) {
      logger.warn("pdf-parse engine execution failed. Falling back to native/regex parse.", err);
    }
  }

  // Dynamic native parse check via Gemini API (multimodal parts)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (GEMINI_API_KEY) {
    try {
      logger.info("Attempting native Gemini file text extraction...");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: buffer.toString("base64")
                  }
                },
                { text: "Extract and return all the plain text contents of this resume document verbatim." }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          logger.info("Verbatim text successfully extracted via Gemini native parser.");
          return text;
        }
      }
    } catch (e) {
      logger.warn("Native Gemini file extraction failed, invoking regex scanners.", e);
    }
  }

  // Custom regex ASCII scanner (reads plain text streams in uncompressed PDFs)
  return extractAlphanumericASCII(buffer);
}

/**
 * Extracts text from DOCX buffer
 */
async function parseDocxBuffer(buffer) {
  if (mammoth) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result && result.value) return result.value;
    } catch (err) {
      logger.warn("mammoth engine execution failed. Falling back to local XML parser.", err);
    }
  }

  // Manual fallback: scan DOCX zip files for word/document.xml tags
  try {
    // Find the compressed content of word/document.xml by regex scanning or zip boundaries
    // A docx is a zip file. Let's do a simple scan for printable text inside tags <w:t>
    const strContent = buffer.toString('binary');
    const xmlTexts = [];
    const xmlTagRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    while ((match = xmlTagRegex.exec(strContent)) !== null) {
      xmlTexts.push(match[1]);
    }
    if (xmlTexts.length > 0) {
      return xmlTexts.join(" ");
    }
  } catch (err) {
    logger.warn("Local DOCX XML extraction failed.", err);
  }

  return extractAlphanumericASCII(buffer);
}

/**
 * Standard utility to filter readable ASCII streams from raw buffers.
 */
function extractAlphanumericASCII(buffer) {
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    // Keep standard characters, spaces, and formatting linebreaks
    if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
      output += String.fromCharCode(charCode);
    }
  }
  return output;
}

/**
 * Regex-based profile extraction if AI is unavailable.
 */
function generateRuleBasedProfile(text) {
  const textLower = text.toLowerCase();
  const profile = {
    name: "Candidate Profile",
    skills: [],
    projects: [],
    experience: [],
    education: "Undergraduate Study",
    strengths: ["Communication Skills"],
    weak_areas: ["System Architecture Details"]
  };

  // Extract common tech skills
  const skillKeywords = ["javascript", "react", "node", "python", "cpp", "java", "sql", "mongodb", "docker", "aws", "typescript", "express"];
  skillKeywords.forEach(s => {
    if (textLower.includes(s)) {
      profile.skills.push(s.toUpperCase());
    }
  });

  // Extract name (guess from first non-empty lines)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    profile.name = lines[0].substring(0, 30);
  }

  // Extract projects/experience
  lines.forEach(line => {
    if (line.toLowerCase().includes("project") || line.toLowerCase().includes("built") || line.toLowerCase().includes("developer")) {
      if (profile.projects.length < 3) profile.projects.push(line);
    }
    if (line.toLowerCase().includes("intern") || line.toLowerCase().includes("engineer") || line.toLowerCase().includes("experience")) {
      if (profile.experience.length < 3) profile.experience.push(line);
    }
  });

  return profile;
}
