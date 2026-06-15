import { Router } from "express";
import { z } from "zod";
import { Model } from "mongoose";

const listQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20)
});

interface CrudOptions<T> {
  model: Model<T>;
  resourceName: string;
  createSchema: z.ZodSchema;
  updateSchema: z.ZodSchema;
  searchFields?: string[];
  postCreate?: (item: any, req: any) => Promise<void>;
  postUpdate?: (item: any, req: any) => Promise<void>;
}

export function createCrudRouter<T>({
  model,
  resourceName,
  createSchema,
  updateSchema,
  searchFields = [],
  postCreate,
  postUpdate
}: CrudOptions<T>) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const { q, page, limit } = listQuerySchema.parse(req.query);
      const filter: Record<string, unknown> = { isArchived: false };

      if (q && searchFields.length) {
        filter.$or = searchFields.map((field) => ({
          [field]: { $regex: q, $options: "i" }
        }));
      }

      // Filter by any other query parameters passed (e.g., projectId, clientId, etc.)
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== "q" && key !== "page" && key !== "limit" && value !== undefined && value !== "") {
          filter[key] = value;
        }
      }

      const [items, total] = await Promise.all([
        model
          .find(filter)
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        model.countDocuments(filter)
      ]);

      res.json({
        data: items,
        meta: { total, page, limit, resource: resourceName }
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const item = await model.findById(req.params.id).lean();
      if (!item) {
        res.status(404).json({ error: `${resourceName} not found` });
        return;
      }
      res.json({ data: item });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const payload = createSchema.parse(req.body) as Record<string, unknown>;
      const createdBy = req.user?.id ?? "system";
      const item = await model.create({
        ...payload,
        createdBy,
        updatedBy: createdBy
      });
      if (postCreate) {
        try {
          await postCreate(item, req);
        } catch (hookErr) {
          console.error(`Error in postCreate hook for ${resourceName}:`, hookErr);
        }
      }
      res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const payload = updateSchema.parse(req.body) as Record<string, unknown>;
      const updatedBy = req.user?.id ?? "system";
      const item = await model.findByIdAndUpdate(
        req.params.id,
        { ...payload, updatedBy },
        { new: true }
      );
      if (!item) {
        res.status(404).json({ error: `${resourceName} not found` });
        return;
      }
      if (postUpdate) {
        try {
          await postUpdate(item, req);
        } catch (hookErr) {
          console.error(`Error in postUpdate hook for ${resourceName}:`, hookErr);
        }
      }
      res.json({ data: item });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const item = await model.findByIdAndUpdate(
        req.params.id,
        { isArchived: true, updatedBy: req.user?.id ?? "system" },
        { new: true }
      );
      if (!item) {
        res.status(404).json({ error: `${resourceName} not found` });
        return;
      }
      res.json({ data: item });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
