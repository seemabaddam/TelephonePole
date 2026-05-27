import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Event } from '../models/Event';
import upload from '../middleware/upload';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../constants';

const router = Router();

function buildImageUrl(id: string | Types.ObjectId): string {
  return `/api/events/${id}/image`;
}

// POST /api/events
router.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        const status = (err as { code?: string }).code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({ error: message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const { title, description, eventDate, venue, location } = req.body;

      if (!title || !eventDate || !req.file) {
        res.status(400).json({ error: 'title, eventDate, and poster image are required' });
        return;
      }

      const event = await Event.create({
        title,
        description,
        eventDate: new Date(eventDate),
        venue,
        location,
        imageData: req.file.buffer,
        imageMimeType: req.file.mimetype,
      });

      res.status(201).json({
        _id: event._id.toString(),
        title: event.title,
        description: event.description,
        eventDate: event.eventDate.toISOString(),
        venue: event.venue,
        location: event.location,
        uploadedAt: event.uploadedAt.toISOString(),
        imageUrl: buildImageUrl(event._id),
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create event' });
    }
  },
);

// GET /api/events
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      cursor,
      limit: limitStr,
      uploadedAfter,
      uploadedBefore,
      eventAfter,
      eventBefore,
      location,
      sort,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(
      limitStr !== undefined ? parseInt(limitStr, 10) : DEFAULT_PAGE_LIMIT,
      MAX_PAGE_LIMIT,
    );
    const query: Record<string, unknown> = {};

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }
    if (uploadedAfter || uploadedBefore) {
      query.uploadedAt = {
        ...(uploadedAfter ? { $gte: new Date(uploadedAfter) } : {}),
        ...(uploadedBefore ? { $lte: new Date(uploadedBefore) } : {}),
      };
    }
    if (eventAfter || eventBefore) {
      query.eventDate = {
        ...(eventAfter ? { $gte: new Date(eventAfter) } : {}),
        ...(eventBefore ? { $lte: new Date(eventBefore) } : {}),
      };
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Default sort by eventDate ascending (soonest first); pass sort=uploadedAt for newest-posted first.
    const sortOrder = sort === 'uploadedAt'
      ? { _id: -1 as const }
      : { eventDate: 1 as const, _id: -1 as const };

    const docs = await Event.find(query)
      .select('-imageData')
      .sort(sortOrder)
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

    res.json({
      events: items.map((e) => ({
        _id: e._id.toString(),
        eventDate: (e.eventDate as Date).toISOString(),
        venue: e.venue,
        location: e.location,
        uploadedAt: (e.uploadedAt as Date).toISOString(),
        imageUrl: buildImageUrl(e._id),
      })),
      nextCursor,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).select('-imageData').lean();
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      eventDate: (event.eventDate as Date).toISOString(),
      venue: event.venue,
      location: event.location,
      uploadedAt: (event.uploadedAt as Date).toISOString(),
      imageUrl: buildImageUrl(event._id),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// GET /api/events/:id/image
router.get('/:id/image', async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).select('imageData imageMimeType');
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.set('Content-Type', event.imageMimeType);
    res.send(event.imageData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

export default router;
