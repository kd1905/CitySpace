/**
 * Google Gemini LLM Service for CitySpace
 * Powered by Google Gemini Generative AI (gemini-3.6-flash, gemini-flash-lite-latest).
 * Handles property description generation, AI property assistance, and location narratives.
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GenerateDescriptionParams {
  title?: string;
  type?: string;
  category?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  price?: number;
  currency?: string;
  amenities?: string[];
  keyHighlights?: string[];
}

// Resilient priority cascade of models to ensure continuous availability
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-pro-latest',
];

/**
 * Retrieves the Gemini API key from environment variables.
 */
export const getGeminiApiKey = (): string => {
  return (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    (process.env as any)?.VITE_GEMINI_API_KEY ||
    ''
  );
};

/**
 * Low-level call to Google Gemini REST API with multi-model fallback.
 */
async function callGeminiApi(
  payload: {
    contents: any[];
    systemInstruction?: { parts: Array<{ text: string }> };
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
    };
  },
  signal?: AbortSignal
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Please configure EXPO_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY in .env'
    );
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error?.message || `HTTP ${response.status}`;
        lastError = new Error(`[Gemini ${model}] ${errMsg}`);
        continue; // Try next model in cascade
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate a response.');
}

/**
 * Generates text using Google Gemini with an optional system instruction.
 */
export async function generateGeminiText(
  prompt: string,
  systemInstruction?: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    signal?: AbortSignal;
  }
): Promise<string> {
  const payload: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 1024,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  return callGeminiApi(payload, options?.signal);
}

/**
 * Multi-turn chat with Google Gemini.
 */
export async function chatWithGemini(
  history: ChatMessage[],
  newMessage: string,
  systemInstruction?: string,
  signal?: AbortSignal
): Promise<string> {
  const formattedContents = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  formattedContents.push({
    role: 'user',
    parts: [{ text: newMessage }],
  });

  const payload: any = {
    contents: formattedContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  return callGeminiApi(payload, signal);
}

/**
 * Generates an evocative architectural property description for CitySpace listings.
 */
export async function generatePropertyDescription(
  params: GenerateDescriptionParams,
  signal?: AbortSignal
): Promise<string> {
  const systemInstruction = `You are a world-class luxury real estate copywriter and architectural curator for CitySpace, an elite luxury property marketplace.
Write compelling, evocative, and elegant property descriptions that highlight architectural pedigree, interior craftsmanship, light, spatial flow, and neighborhood allure.
Do not use hyperbolic buzzwords or generic marketing clichés. Write with sophistication, restraint, and vivid spatial detail. Format as 2 to 3 polished paragraphs.`;

  const prompt = `Please compose an architectural property description for the following development:
- Title: ${params.title || 'Exclusive Residence'}
- Type: ${params.type === 'rent' ? 'For Lease' : 'For Sale'}
- Category: ${params.category || 'Luxury Residence'}
- Location: ${params.neighborhood || ''}, ${params.city || 'Pune'}
- Address: ${params.address || 'Prime District'}
- Configuration: ${params.bedrooms ? `${params.bedrooms} Bedrooms` : ''}${params.bathrooms ? `, ${params.bathrooms} Bathrooms` : ''}
- Area: ${params.areaSqFt ? `${params.areaSqFt} sq. ft.` : 'Generously proportioned'}
- Pricing: ${params.price ? `${params.currency || '₹'} ${params.price.toLocaleString('en-IN')}` : 'Price on Request'}
${params.amenities && params.amenities.length > 0 ? `- Curated Amenities: ${params.amenities.join(', ')}` : ''}
${params.keyHighlights && params.keyHighlights.length > 0 ? `- Architectural Highlights: ${params.keyHighlights.join(', ')}` : ''}`;

  return generateGeminiText(prompt, systemInstruction, {
    temperature: 0.75,
    maxOutputTokens: 800,
    signal,
  });
}

/**
 * AI Real Estate Concierge / Property Assistant answering client enquiries.
 */
export async function askPropertyAssistant(
  userQuestion: string,
  propertyContext?: any,
  signal?: AbortSignal
): Promise<string> {
  const systemInstruction = `You are CitySpace AI Concierge, a knowledgeable, courteous, and precise real estate advisor.
Help prospective buyers and tenants understand property specifications, locality nuances, connectivity, and investment value.
If context is provided, rely on it strictly. Keep responses helpful, refined, and concise (under 150 words).`;

  let prompt = `User Enquiry: "${userQuestion}"`;
  if (propertyContext) {
    prompt += `\n\nProperty Context:\n${JSON.stringify(propertyContext, null, 2)}`;
  }

  return generateGeminiText(prompt, systemInstruction, {
    temperature: 0.6,
    maxOutputTokens: 500,
    signal,
  });
}

/**
 * Enhances locality & neighborhood narratives for listings and geography sections.
 */
export async function enhanceLocationNarrative(
  address: string,
  city: string,
  landmarks: string[] = [],
  signal?: AbortSignal
): Promise<string> {
  const systemInstruction = `You are an urban living and neighborhood specialist for CitySpace.
Describe the lifestyle, connectivity, dining, culture, and neighborhood prestige of a property's location in 1-2 vivid, informative sentences.`;

  const prompt = `Location: ${address}, ${city}
${landmarks.length > 0 ? `Nearby Points of Interest: ${landmarks.join(', ')}` : ''}
Write a concise, upscale lifestyle narrative highlighting this area's connectivity and residential appeal.`;

  return generateGeminiText(prompt, systemInstruction, {
    temperature: 0.7,
    maxOutputTokens: 250,
    signal,
  });
}
