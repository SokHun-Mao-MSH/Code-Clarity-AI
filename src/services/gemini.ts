import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GenerationOptions {
  inputCode?: string;
  language: string;
  outputLanguage: string;
  actionType: "Explain" | "Debug" | "Refactor" | "Generate" | string;
  imageData?: string;
  mimeType?: string;
  modelName?: string;
}

export async function generateAIContent(options: GenerationOptions) {
  const {
    inputCode,
    language,
    outputLanguage,
    actionType,
    imageData,
    mimeType,
    modelName,
  } = options;

  const prompt = `You are a professional AI code assistant. Your goal is to provide 100% accurate and reliable answers.
Drive straight into the content without ANY introductory filler.

Guidelines:
1. NO INTRO: ABSOLUTELY NO introductory phrases in ANY language. You MUST NOT say "You are using...", "Here is...", or "អ្នកកំពុងប្រើ៖ របៀប...". Start your response IMMEDIATELY with the first step of analysis or the code block. ZERO text before the core content.
2. Language: Provide the response exclusively in ${outputLanguage}.
   - If the language is Khmer: Use correct grammar and natural wording. Keep the response balanced (not too short, not too long), clear, and detailed.
3. Processing Rules for ${actionType}:
   - Explain: Provide step-by-step guidance. Make it simple and beginner-friendly. Use clear examples.
   - Debug: Clearly explain the cause of the error. Show how to fix it. When providing the fixed code, use the header "កូដដែលបានកែតម្រូវ (Corrected Code):" and then the code block.
   - Refactor: Rewrite code in a clean, professional, and maintainable way following best practices.
4. Vision: If an image is provided, analyze it for visible code, error messages, or UI issues. Combine this with any provided code to give a complete solution.
5. Code Review: Analyze the provided code/image carefully. Identify any errors or bad practices. Even in "Explain" mode, if there are mistakes, point them out and explain why, then suggest improvements.
6. Formatting: ALWAYS wrap any code snippets in triple backticks with the language specified (e.g. \`\`\`javascript). Do not write code like a sentence. Use clear, separate blocks.

CRITICAL: START YOUR RESPONSE DIRECTLY WITH THE CONTENT. DO NOT INCLUDE ANY HEADER OR INTRODUCTION.

Code to process:
\`\`\`${language}
${inputCode || "No code provided, please analyze the image contents if available."}
\`\`\``;

  const apiKey = process.env.GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);
  const selectedModel = modelName || "gemini-3-flash-preview";
  const fallbackModel = "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: selectedModel });

  const parts: any[] = [
    { text: prompt },
    ...(imageData
      ? [
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType || "image/png",
            },
          },
        ]
      : []),
  ];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });
    return result.response.text();
  } catch (error: any) {
    const message = error?.message || String(error);
    const isModelMissing = error?.status === 404 || message.includes("Model not found");

    if (isModelMissing && selectedModel !== fallbackModel) {
      try {
        const fallback = genAI.getGenerativeModel({ model: fallbackModel });
        const fallbackResult = await fallback.generateContent({
          contents: [{ role: "user", parts }],
        });
        return fallbackResult.response.text();
      } catch (fallbackError: any) {
        const fallbackMessage = fallbackError?.message || String(fallbackError);
        throw new Error(
          `Model '${selectedModel}' unavailable and fallback '${fallbackModel}' failed: ${fallbackMessage}`,
        );
      }
    }

    throw new Error(`AI Generation failed: ${message}`);
  }
}
