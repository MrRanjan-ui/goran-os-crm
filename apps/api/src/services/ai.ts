import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function generateCompletion(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateChat(
  messages: { role: string; parts: { text: string }[] }[]
): Promise<string> {
  if (messages.length === 0) return "";
  const lastMessage = messages[messages.length - 1];
  const history = messages.slice(0, messages.length - 1);

  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessage(lastMessage.parts[0].text);
  return result.response.text();
}
