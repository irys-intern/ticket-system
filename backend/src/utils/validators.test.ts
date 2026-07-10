import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  createCommentSchema,
} from './validators.ts';
import { TicketPriority, TicketCategory, TicketStatus } from '../types/index.ts';

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: 'User',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      name: 'User',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      name: 'User',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      name: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid input', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
  });
});

describe('createTicketSchema', () => {
  const valid = {
    title: 'Something broke',
    description: 'Details about what broke',
    priority: TicketPriority.HIGH,
    category: TicketCategory.BUG,
  };

  it('accepts valid input', () => {
    expect(createTicketSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing title', () => {
    expect(createTicketSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects an invalid priority', () => {
    expect(createTicketSchema.safeParse({ ...valid, priority: 'urgent' }).success).toBe(false);
  });

  it('rejects an invalid category', () => {
    expect(createTicketSchema.safeParse({ ...valid, category: 'unknown' }).success).toBe(false);
  });

  it('rejects a title over 255 characters', () => {
    expect(createTicketSchema.safeParse({ ...valid, title: 'a'.repeat(256) }).success).toBe(false);
  });
});

describe('updateTicketSchema', () => {
  it('accepts a partial update with just a status', () => {
    expect(updateTicketSchema.safeParse({ status: TicketStatus.RESOLVED }).success).toBe(true);
  });

  it('accepts an empty object', () => {
    expect(updateTicketSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(updateTicketSchema.safeParse({ status: 'done' }).success).toBe(false);
  });
});

describe('assignTicketSchema', () => {
  it('accepts a valid uuid', () => {
    expect(assignTicketSchema.safeParse({ userId: '123e4567-e89b-12d3-a456-426614174000' }).success).toBe(
      true,
    );
  });

  it('rejects a non-uuid string', () => {
    expect(assignTicketSchema.safeParse({ userId: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('createCommentSchema', () => {
  it('accepts valid content', () => {
    expect(createCommentSchema.safeParse({ content: 'hello' }).success).toBe(true);
  });

  it('rejects empty content', () => {
    expect(createCommentSchema.safeParse({ content: '' }).success).toBe(false);
  });

  it('rejects content over 5000 characters', () => {
    expect(createCommentSchema.safeParse({ content: 'a'.repeat(5001) }).success).toBe(false);
  });
});
