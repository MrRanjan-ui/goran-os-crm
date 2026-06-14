import { Router } from "express";
import { z } from "zod";
import { generateCompletion, generateChat } from "../services/ai.js";
import { AiLogModel } from "../models/AiLog.js";
import { chatSchema } from "../validation/index.js";

const leadScoreSchema = z.object({
  lead: z.record(z.unknown())
});

const summarySchema = z.object({
  type: z.string(),
  content: z.string()
});

const insightSchema = z.object({
  context: z.string()
});

export const aiRouter = Router();

aiRouter.post("/lead-score", async (req, res, next) => {
  try {
    const payload = leadScoreSchema.parse(req.body);
    const prompt = `Score this lead from 0-100 and estimate win probability 0-1. Return JSON with score and probability only.\nLead: ${JSON.stringify(
      payload.lead
    )}`;
    const response = await generateCompletion(prompt);
    await AiLogModel.create({
      category: "lead-score",
      prompt,
      response,
      model: "gemini-1.5-pro",
      createdBy: req.user?.id ?? "system",
      updatedBy: req.user?.id ?? "system"
    });
    res.json({ data: response });
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/summary", async (req, res, next) => {
  try {
    const payload = summarySchema.parse(req.body);
    const prompt = `Provide a concise ${payload.type} summary. Content:\n${payload.content}`;
    const response = await generateCompletion(prompt);
    await AiLogModel.create({
      category: "summary",
      prompt,
      response,
      model: "gemini-1.5-pro",
      createdBy: req.user?.id ?? "system",
      updatedBy: req.user?.id ?? "system"
    });
    res.json({ data: response });
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/insights", async (req, res, next) => {
  try {
    const payload = insightSchema.parse(req.body);
    const prompt = `Provide operational insights and recommendations for an agency dashboard.\nContext:\n${payload.context}`;
    const response = await generateCompletion(prompt);
    await AiLogModel.create({
      category: "insights",
      prompt,
      response,
      model: "gemini-1.5-pro",
      createdBy: req.user?.id ?? "system",
      updatedBy: req.user?.id ?? "system"
    });
    res.json({ data: response });
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/chat", async (req, res, next) => {
  try {
    const payload = chatSchema.parse(req.body);
    const response = await generateChat(payload.messages);
    
    // Save an AiLogModel entry
    await AiLogModel.create({
      category: "chat",
      prompt: JSON.stringify(payload.messages),
      response,
      model: "gemini-1.5-pro",
      createdBy: req.user?.id ?? "system",
      updatedBy: req.user?.id ?? "system"
    });
    
    res.json({ data: response });
  } catch (err) {
    next(err);
  }
});
