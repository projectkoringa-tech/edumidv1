import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API Routes for OpenAI
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, model = "gpt-4o" } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key não configurada no servidor." });
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        ...messages
      ],
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/json", async (req, res) => {
  try {
    const { prompt, systemInstruction, model = "gpt-4o" } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key não configurada no servidor." });
    }
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
        { role: "user" as const, content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(response.choices[0].message.content || "{}"));
  } catch (error: any) {
    console.error("OpenAI JSON Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware de erro genérico
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado no servidor!');
});

export default app;
