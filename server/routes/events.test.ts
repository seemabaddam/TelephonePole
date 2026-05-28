import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import eventsRouter from './events';
import { Event } from '../models/Event';
import { DEFAULT_PAGE_LIMIT } from '../constants';

const IMAGE_BUF = Buffer.from([0xff, 0xd8, 0xff]);
const IMAGE_MIME = 'image/jpeg';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/events', eventsRouter);
  return app;
}

async function seedEvent(overrides: Partial<{
  title: string;
  description: string;
  eventDate: Date;
  venue: string;
  location: string;
  imageData: Buffer;
  imageMimeType: string;
}> = {}) {
  return Event.create({
    title: 'Test Event',
    eventDate: new Date('2026-06-01'),
    imageData: IMAGE_BUF,
    imageMimeType: IMAGE_MIME,
    ...overrides,
  });
}

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Event.deleteMany({});
});

describe('POST /api/events', () => {
  it('creates an event with all fields', async () => {
    const res = await request(app)
      .post('/api/events')
      .field('title', 'Summer Concert')
      .field('eventDate', '2026-07-04')
      .field('description', 'A great show')
      .field('venue', 'Central Park')
      .field('location', 'New York')
      .attach('image', IMAGE_BUF, { filename: 'poster.jpg', contentType: IMAGE_MIME });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeTruthy();
    expect(res.body.title).toBe('Summer Concert');
    expect(res.body.imageUrl).toMatch(/^\/api\/events\/.+\/image$/);
    expect(res.body.description).toBe('A great show');
    expect(res.body.venue).toBe('Central Park');
    expect(res.body.location).toBe('New York');
  });

  it('creates an event with only required fields (optional fields omitted)', async () => {
    const res = await request(app)
      .post('/api/events')
      .field('title', 'Minimal Event')
      .field('eventDate', '2026-08-01')
      .attach('image', IMAGE_BUF, { filename: 'poster.jpg', contentType: IMAGE_MIME });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeTruthy();
    expect(res.body.title).toBe('Minimal Event');
    expect(res.body.description).toBeUndefined();
    expect(res.body.venue).toBeUndefined();
    expect(res.body.location).toBeUndefined();
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .field('eventDate', '2026-07-04')
      .attach('image', IMAGE_BUF, { filename: 'poster.jpg', contentType: IMAGE_MIME });

    expect(res.status).toBe(400);
  });

  it('returns 400 when eventDate is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .field('title', 'No Date Event')
      .attach('image', IMAGE_BUF, { filename: 'poster.jpg', contentType: IMAGE_MIME });

    expect(res.status).toBe(400);
  });

  it('returns 400 when image is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .field('title', 'No Image Event')
      .field('eventDate', '2026-07-04');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/events', () => {
  it('returns empty list when collection is empty', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
    expect(res.body.nextCursor).toBeNull();
  });

  it('returns first page with nextCursor when more events exist', async () => {
    for (let i = 0; i < DEFAULT_PAGE_LIMIT + 1; i++) {
      await seedEvent({ title: `Event ${i}` });
    }

    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(DEFAULT_PAGE_LIMIT);
    expect(res.body.nextCursor).toBeTruthy();
  });

  it('returns second page via nextCursor with no further cursor', async () => {
    for (let i = 0; i < DEFAULT_PAGE_LIMIT + 1; i++) {
      await seedEvent({ title: `Event ${i}` });
    }

    const first = await request(app).get('/api/events');
    const { nextCursor } = first.body;

    const second = await request(app).get(`/api/events?cursor=${nextCursor}`);

    expect(second.status).toBe(200);
    expect(second.body.events).toHaveLength(1);
    expect(second.body.nextCursor).toBeNull();
  });

  it('filters by location (case-insensitive partial match)', async () => {
    await seedEvent({ title: 'NYC Event', location: 'New York' });
    await seedEvent({ title: 'LA Event', location: 'Los Angeles' });

    const res = await request(app).get('/api/events?location=york');

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].location).toBe('New York');
  });

  it('returns events sorted by eventDate ascending by default', async () => {
    await seedEvent({ title: 'June 3', eventDate: new Date('2026-06-03') });
    await seedEvent({ title: 'June 1', eventDate: new Date('2026-06-01') });
    await seedEvent({ title: 'June 2', eventDate: new Date('2026-06-02') });

    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    const dates = res.body.events.map((e: { eventDate: string }) => e.eventDate);
    expect(dates[0] <= dates[1]).toBe(true);
    expect(dates[1] <= dates[2]).toBe(true);
  });

  it('returns events sorted by uploadedAt descending when sort=uploadedAt', async () => {
    const a = await seedEvent({ title: 'First inserted', eventDate: new Date('2026-06-01') });
    const b = await seedEvent({ title: 'Second inserted', eventDate: new Date('2026-06-02') });
    const c = await seedEvent({ title: 'Third inserted', eventDate: new Date('2026-06-03') });

    const res = await request(app).get('/api/events?sort=uploadedAt');

    expect(res.status).toBe(200);
    const ids = res.body.events.map((e: { _id: string }) => e._id);
    // Newest _id (c) should come first
    expect(ids[0]).toBe(c._id.toString());
    expect(ids[1]).toBe(b._id.toString());
    expect(ids[2]).toBe(a._id.toString());
  });
});

describe('GET /api/events/:id', () => {
  it('returns event details when found', async () => {
    const event = await seedEvent({ title: 'Detail Event', description: 'Some details' });

    const res = await request(app).get(`/api/events/${event._id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(event._id.toString());
    expect(res.body.title).toBe('Detail Event');
    expect(res.body.description).toBe('Some details');
    expect(res.body.imageUrl).toMatch(/^\/api\/events\/.+\/image$/);
    expect(res.body.imageData).toBeUndefined();
  });

  it('returns 404 when event does not exist', async () => {
    const fakeId = new Types.ObjectId().toString();

    const res = await request(app).get(`/api/events/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/events/:id/image', () => {
  it('returns the image buffer with correct Content-Type', async () => {
    const event = await seedEvent();

    const res = await request(app)
      .get(`/api/events/${event._id}/image`)
      .buffer(true);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(IMAGE_MIME);
    expect(Buffer.isBuffer(res.body) || res.body instanceof Uint8Array).toBe(true);
  });

  it('returns 404 when event does not exist', async () => {
    const fakeId = new Types.ObjectId().toString();

    const res = await request(app).get(`/api/events/${fakeId}/image`);

    expect(res.status).toBe(404);
  });
});
