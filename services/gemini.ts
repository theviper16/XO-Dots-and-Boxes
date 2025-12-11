import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getGameCommentary = async (
  player1Name: string,
  player2Name: string,
  score1: number,
  score2: number,
  theme: string,
  lastAction: string
): Promise<string> => {
  if (!ai) return "AI commentator is offline (API Key missing).";

  try {
    const prompt = `
      You are an energetic arcade game commentator for a game of Dots and Boxes.
      The current theme is ${theme}.
      Player 1: ${player1Name} (Score: ${score1}).
      Player 2: ${player2Name} (Score: ${score2}).
      The last action was: ${lastAction}.
      
      Give a short, witty, 1-sentence commentary on the state of the game.
      Be playful and thematic based on the ${theme} setting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The commentator is speechless!";
  }
};

export const getTrashTalk = async (theme: string): Promise<string> => {
    if (!ai) return "Good luck!";

    try {
        const prompt = `Generate a short, funny, family-friendly trash talk line for a competitive arcade game player. Theme: ${theme}. Max 10 words.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (e) {
        return "I'm going to win this!";
    }
}
