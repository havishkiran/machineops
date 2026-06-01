import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/custom-fields?entityType=MACHINE|PART
router.get('/', async (req: Request, res: Response) => {
  const { entityType } = req.query;
  const orgId = (req as any).user?.orgId;
  const fields = await prisma.customField.findMany({
    where: {
      orgId,
      ...(entityType ? { entityType: entityType as string } : {}),
    },
    orderBy: [{ entityType: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(fields);
});

// POST /api/custom-fields
router.post('/', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const { entityType, name, label, fieldType, options, sortOrder, required } = req.body;

  // Auto-generate name from label if not provided
  const fieldName = name || label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const field = await prisma.customField.create({
    data: {
      entityType,
      name: fieldName,
      label,
      fieldType: fieldType || 'text',
      options: options ? JSON.stringify(options) : null,
      sortOrder: sortOrder ?? 0,
      required: required ?? false,
      orgId,
    },
  });
  res.status(201).json(field);
});

// PUT /api/custom-fields/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { label, fieldType, options, sortOrder, required } = req.body;
  const field = await prisma.customField.update({
    where: { id: req.params.id },
    data: {
      label,
      fieldType,
      options: options !== undefined ? (options ? JSON.stringify(options) : null) : undefined,
      sortOrder,
      required,
    },
  });
  res.json(field);
});

// DELETE /api/custom-fields/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.customField.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// GET /api/custom-fields/values/:entityType/:entityId
router.get('/values/:entityType/:entityId', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const { entityType, entityId } = req.params;
  const fields = await prisma.customField.findMany({
    where: { orgId, entityType },
    orderBy: [{ sortOrder: 'asc' }],
    include: {
      values: { where: { entityId } },
    },
  });
  // Flatten: return [{field, value}]
  const result = fields.map(f => ({
    ...f,
    options: f.options ? JSON.parse(f.options) : null,
    value: f.values[0]?.value ?? '',
  }));
  res.json(result);
});

// PUT /api/custom-fields/values/:entityId  (bulk upsert all values for an entity)
router.put('/values/:entityId', async (req: Request, res: Response) => {
  const { entityId } = req.params;
  const { values } = req.body as { values: { fieldId: string; value: string }[] };

  await Promise.all(
    values.map(v =>
      prisma.customFieldValue.upsert({
        where: { fieldId_entityId: { fieldId: v.fieldId, entityId } },
        update: { value: v.value },
        create: { fieldId: v.fieldId, entityId, value: v.value },
      })
    )
  );
  res.json({ ok: true });
});

export default router;
