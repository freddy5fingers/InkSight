
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { TattooStyle, TattooConcept, TattooVariation } from '../types';

// Singleton instance of the AI client, initialized lazily.
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
}

/**
 * Safely parses a JSON string that might be wrapped in markdown code fences.
 * @param jsonString The raw string response from the AI.
 * @returns The parsed JSON object.
 */
function parseJsonResponse<T>(jsonString: string): T {
    // Gracefully handle non-string inputs, though the caller should prevent this.
    if (typeof jsonString !== 'string') {
        jsonString = '';
    }
    
    // Trim whitespace that might affect regex or parsing.
    const trimmedString = jsonString.trim();
    
    // Attempt to find JSON within markdown-style code blocks.
    const match = trimmedString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    
    // If a match is found, use the captured group; otherwise, use the whole trimmed string.
    const stringToParse = match ? match[1].trim() : trimmedString;
    
    // An empty string is not valid JSON.
    if (!stringToParse) {
        throw new Error("Received an empty response from the AI.");
    }

    try {
        return JSON.parse(stringToParse);
    } catch (error) {
        console.error("Failed to parse JSON response from AI. Raw string was:", stringToParse);
        throw new Error("Received an invalid response format from the AI.");
    }
}


const INK_ORACLE_SYSTEM_PROMPT = `
You are InkOracle, a compassionate, creative, and detail-oriented assistant that conducts a short adaptive interview to generate a unique, meaningful tattoo concept. Your job is to (A) ask dynamic, never-repeated questions based on the user's previous answers, (B) gather enough personal, symbolic, and stylistic information, and (C) synthesize a single final output.

RULES:
1. NEVER use a fixed list of questions. Create each next question on-the-fly using the user's last answer. Questions should feel natural, specific, and probe for emotion, memory, symbol, aesthetic preference, or placement.
2. Stop asking when you have clearly captured: purpose (why tattoo), 1–3 key symbols/themes, aesthetic/style preference, and emotional tone. This is usually after 4–7 targeted questions.
3. After each user reply, provide a short summary of the key extracted data before asking the next question.
4. Output must be valid JSON. Do NOT include any extra text outside the JSON.

STYLE GUIDE:
When a user mentions a style, use these descriptions as context.
- Biomechanical: An intricate design that merges mechanical components with human or animal anatomy. Inspired by science fiction, these tattoos often feature gears, pistons, cables, and other mechanical details intricately integrated into the organic form. They give the impression of a cyborg-like existence, blurring the line between the natural and the artificial, creating a 3D effect of flesh intertwining with mechanical parts.

If the conversation is not complete, you MUST respond with this JSON schema:
{ "status": "CONTINUE", "summary": "A short summary of what you've learned from the last answer.", "nextQuestion": "Your new, insightful, adaptive question." }

If the conversation IS complete, you MUST respond with this JSON schema, filling in all details based on the entire conversation:
{
  "status": "COMPLETE",
  "data": {
    "concept_name": "string",
    "summary": "short string (1-2 sentences)",
    "meaning_and_symbols": [
      {"symbol": "string", "meaning": "string"}
    ],
    "variations": [
      {
        "style_name": "Minimal Fine-line",
        "short_description": "single sentence",
        "image_prompt": "string (for image model, e.g., 'professional tattoo stencil of [SUBJECT], clean black and white line art for thermal printing, clear outlines, with stippling and dotwork shading guides, isolated on a clean white background, high contrast vector, 1024x1024')"
      },
      {
        "style_name": "A second, complementary style",
        "short_description": "single sentence",
        "image_prompt": "string (for image model)"
      }
    ],
    "artist_prompt": "detailed, concise, formatted for tattoo artist (2-6 lines)",
    "placement_suggestions": ["Inner forearm", "Rib", "Shoulder top"],
    "color_palette_hint": ["muted sepia", "black & gray", "soft pastels"],
    "safety_flags": {
      "contains_personal_identifiers": false,
      "moderation_reason": null
    }
  }
}
`;

const getImagePromptSuffix = () => {
    return 'ultra high detail, 4k, professional vector art';
}

// For "Direct Idea" mode
export async function generateTattooConcept(prompt: string, style: TattooStyle): Promise<TattooConcept> {
  const ai = getAiClient();
  const imagePrompt = `professional tattoo stencil of ${prompt} in a ${style} style, clean black and white line art for thermal printing, clear outlines, with stippling and dotwork shading guides, isolated on a clean white background, high contrast vector, ${getImagePromptSuffix()}, 1024x1024`;

  const textGenPrompt = `
    Based on the tattoo idea "${prompt}" in a ${style} style, generate a comprehensive tattoo concept.
    The output must be a single JSON object matching this schema:
    {
      "concept_name": "A creative name",
      "summary": "A short summary of the concept",
      "meaning_and_symbols": [{"symbol": "The main element", "meaning": "Its symbolic meaning"}],
      "variations": [
        {
          "style_name": "${style}",
          "short_description": "A brief description of this style variation.",
          "image_prompt": "${imagePrompt}"
        }
      ],
      "artist_prompt": "A detailed prompt for a human tattoo artist.",
      "placement_suggestions": ["List 3 suitable body placements."],
      "color_palette_hint": ["Suggest a color palette, e.g., 'Black and gray'"]
    }
  `;

  try {
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: textGenPrompt,
      config: { responseMimeType: 'application/json' },
    });

    const textResult = parseJsonResponse<any>(textResponse.text);

    const variation = textResult.variations[0];
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: variation.image_prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    let base64Image: string | undefined;
    const imageParts = imageResponse.candidates?.[0]?.content?.parts;
    if (imageParts) {
      for (const part of imageParts) {
        if (part.inlineData) { base64Image = part.inlineData.data; break; }
      }
    }
    if (!base64Image) throw new Error("Image generation failed.");
    
    const finalVariation: TattooVariation = {
      ...variation,
      image: `data:image/png;base64,${base64Image}`,
    };

    return {
      id: new Date().toISOString(),
      ...textResult,
      variations: [finalVariation],
      interview: [{ q: 'Direct Idea', a: prompt }],
      safety_flags: { contains_personal_identifiers: false, moderation_reason: null },
    };
  } catch (error) {
    console.error("Error generating direct tattoo concept:", error);
    throw new Error("Failed to generate tattoo idea.");
  }
}

// For "Personalized Journey" mode
export type ConversationTurn = { q: string, a: string };

type IntermediateResponse = {
  status: 'CONTINUE';
  summary: string;
  nextQuestion: string;
};

type FinalResponsePayload = Omit<TattooConcept, 'id' | 'variations' | 'interview'> & {
  variations: Omit<TattooVariation, 'image'>[];
};

type FinalResponse = {
  status: 'COMPLETE';
  data: FinalResponsePayload;
};

type ConversationResponse = IntermediateResponse | FinalResponse;


export async function advanceConversation(conversation: ConversationTurn[]): Promise<ConversationResponse> {
  const ai = getAiClient();
  const history = conversation.map(turn => `\nUSER: ${turn.a}\nINKORACLE: ${turn.q}`).join('');
  const prompt = `This is the conversation history:${history}\n\nBased on this, determine if you have enough information (purpose, symbols, style, tone). If not, ask a targeted follow-up question. If you do, generate the complete concept. Generate your JSON response.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: INK_ORACLE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });
    return parseJsonResponse<ConversationResponse>(response.text);
  } catch (error) {
    console.error("Error advancing conversation:", error);
    throw new Error("The AI conversation failed. Please try again.");
  }
}


export async function generatePersonalizedImages(conceptData: FinalResponsePayload, conversation: ConversationTurn[]): Promise<TattooConcept> {
  const ai = getAiClient();
  try {
    const imagePromises = (conceptData.variations || []).map(variation => {
        const fullPrompt = `${variation.image_prompt}, ${getImagePromptSuffix()}`;
        return ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        }).then(response => {
            const imageParts = response.candidates?.[0]?.content?.parts;
            if (imageParts) {
            for (const part of imageParts) {
                if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            }
            throw new Error(`Image generation failed for style ${variation.style_name}`);
        });
    });

    const images = await Promise.all(imagePromises);

    const finalVariations: TattooVariation[] = conceptData.variations.map((variation, index) => ({
      ...variation,
      image: images[index],
    }));
    
    return {
      ...conceptData,
      id: new Date().toISOString(),
      variations: finalVariations,
      interview: conversation,
    };

  } catch (error) {
    console.error("Error generating personalized images:", error);
    throw new Error("Failed to generate images for your concept. Please try again.");
  }
}

export async function refineTattooImage(base64Image: string, prompt: string): Promise<string> {
    const ai = getAiClient();
    
    const match = base64Image.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match || match.length !== 3) {
      throw new Error("Invalid base64 image format.");
    }
    const mimeType = match[1];
    const imageData = match[2];
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: imageData,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
  
      let newBase64Image: string | undefined;
      const imageParts = response.candidates?.[0]?.content?.parts;
      if (imageParts) {
        for (const part of imageParts) {
          if (part.inlineData) {
            newBase64Image = part.inlineData.data;
            break;
          }
        }
      }
  
      if (!newBase64Image) {
        throw new Error("Image refinement failed to produce a new image.");
      }
  
      return `data:${mimeType};base64,${newBase64Image}`;
  
    } catch (error) {
      console.error("Error refining tattoo image:", error);
      throw new Error("Failed to refine the tattoo image.");
    }
}

// New function to generate isolated elements for the editor
export async function generateTattooElement(prompt: string): Promise<string> {
  const ai = getAiClient();
  // We ask for a white background so we can use mix-blend-mode: multiply in the UI
  const elementPrompt = `isolated tattoo flash element of ${prompt}, bold black ink, white background, no border, high contrast, vector style`;

  try {
    // Using imagen-4.0-generate-001 for reliable, high-quality image generation
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: elementPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
        return `data:image/png;base64,${imageBytes}`;
    }
    throw new Error("Failed to generate element.");
  } catch (error) {
    console.error("Error generating tattoo element:", error);
    throw new Error("Failed to generate new element.");
  }
}
