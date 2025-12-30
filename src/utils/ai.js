import { getAISettings, getCategories } from "./storage";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const buildPrompt = (expenseText, categories) => {
  const categoryList = categories.map(c => c.name).join(", ");
  return `
    You are an expense tracker assistant. Extract expense details from this text: "${expenseText}".
    Match the category to one of these: ${categoryList}. If no match, use "Miscellaneous".
    
    Return ONLY a valid JSON object with these keys:
    - amount (number): the cost in Naira (ONLY the number, no symbols or commas)
    - category (string): the EXACT name of the matching category
    - note (string): a brief description (max 20 chars)
    - date (string): "today" or "yesterday" if specified, otherwise null
    
    Example: {"amount": 500, "category": "Food (Mama Put)", "note": "Rice and stew", "date": null}
  `;
};

const buildImagePrompt = (categories) => {
    const categoryList = categories.map(c => c.name).join(", ");
    return `
      Analyze this receipt image. Extract the total amount and best category.
      Match the category to one of these: ${categoryList}. If uncertain, use "Miscellaneous".
      
      Return ONLY a valid JSON object with:
      - amount (number): the total cost
      - category (string): EXACT category name
      - note (string): Merchant name or brief item summary (max 20 chars)
    `;
  };

export const processExpenseText = async (text) => {
  try {
    const settings = await getAISettings();
    if (!settings.enabled || !settings.apiKey) {
      throw new Error("AI not enabled or API key missing");
    }

    const categories = await getCategories();
    const prompt = buildPrompt(text, categories);

    const response = await fetch(`${GEMINI_API_URL}?key=${settings.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Gemini API Error:", data);
      return null;
    }

    const resultText = data.candidates[0].content.parts[0].text;
    // Clean up markdown code blocks if present
    const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const result = JSON.parse(cleanJson);
    
    // Find the actual category object ID
    const matchedCategory = categories.find(c => c.name === result.category);
    
    return {
      ...result,
      categoryId: matchedCategory ? matchedCategory.id : categories[categories.length - 1].id // Fallback to last (Misc)
    };

  } catch (error) {
    console.error("AI Processing Error:", error);
    return null;
  }
};

export const processReceiptImage = async (base64Image) => {
    try {
      const settings = await getAISettings();
      if (!settings.enabled || !settings.apiKey) {
        throw new Error("AI not enabled or API key missing");
      }
  
      const categories = await getCategories();
      const prompt = buildImagePrompt(categories);
  
      const response = await fetch(`${GEMINI_API_URL}?key=${settings.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                }
            ]
          }]
        })
      });
  
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error("Gemini API Error:", data);
        return null;
      }
  
      const resultText = data.candidates[0].content.parts[0].text;
      const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleanJson);
      
      const matchedCategory = categories.find(c => c.name === result.category);
      
      return {
        ...result,
        categoryId: matchedCategory ? matchedCategory.id : categories[categories.length - 1].id
      };
  
    } catch (error) {
      console.error("AI Image Processing Error:", error);
      return null;
    }
  };

  const buildAdvicePrompt = (expenses, dailyLimit, categories) => {
    // Simplify data to save tokens
    const recentExpenses = expenses.slice(0, 20).map(e => {
        const cat = categories.find(c => c.id === e.category)?.name || "Unknown";
        return `${e.amount} (${cat}) on ${new Date(e.date).toDateString()}: ${e.note}`;
    }).join("\n");

    return `
      You are a wise and friendly financial advisor for a Nigerian student.
      Daily Limit: ₦${dailyLimit}
      Recent Expenses:
      ${recentExpenses}

      Based on this data, provide 3 short, actionable, and encouraging pieces of advice to help me manage my money better. 
      Focus on patterns like spending too much on food or transport if visible.
      Keep it brief, friendly, and use Nigerian relatable context if appropriate (but keep English).
      Return ONLY a JSON object with a key "advice" which is an ARRAY of strings.
      Example: {"advice": ["You spend a lot on food, try cooking more.", "Good job staying within budget yesterday!"]}
    `;
};

export const getSpendingAdvice = async (expenses, dailyLimit) => {
    try {
        const settings = await getAISettings();
        if (!settings.enabled || !settings.apiKey) {
            throw new Error("AI not enabled");
        }

        const categories = await getCategories();
        const prompt = buildAdvicePrompt(expenses, dailyLimit, categories);

        const response = await fetch(`${GEMINI_API_URL}?key=${settings.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content) {
            console.error("Gemini Advice Error:", data);
            return null;
        }

        const resultText = data.candidates[0].content.parts[0].text;
        const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanJson);
        
        return result.advice || ["Keep tracking your expenses to see better insights!"];

    } catch (error) {
        console.error("AI Advice Error:", error);
        return null; // Return null to handle UI gracefully
    }
};
