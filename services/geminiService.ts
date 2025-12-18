import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceItem, Client } from "../types";

// Initialize Gemini
// Note: In a real production app, this should be proxied through a backend.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateInvoiceDataFromText = async (
  promptText: string,
  existingClients: Client[]
): Promise<{
  clientId?: string;
  newClientName?: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  notes?: string;
}> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return { items: [] };
  }

  const clientListString = existingClients.map(c => `${c.name} (ID: ${c.id})`).join(", ");

  const prompt = `
    Analyze the following request to create an invoice: "${promptText}".
    
    Existing Clients: [${clientListString}]

    Extract the following:
    1. If the client matches an existing client, provide the Client ID.
    2. If it's a new client, provide the Client Name.
    3. List of items (description, quantity, unit price).
    4. Any notes.

    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientId: { type: Type.STRING, description: "ID of existing client if found" },
            newClientName: { type: Type.STRING, description: "Name if it is a new client" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                },
                required: ["description", "quantity", "unitPrice"]
              }
            },
            notes: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const analyzeFinancialHealth = async (invoiceSummary: string) => {
   if (!process.env.API_KEY) return "Configuração de API Key necessária para insights.";

   try {
     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: `Atue como um consultor financeiro. Analise estes dados de faturação resumidos e dê 3 conselhos curtos e práticos em Português: ${invoiceSummary}`,
     });
     return response.text;
   } catch (error) {
     return "Não foi possível gerar insights no momento.";
   }
}
