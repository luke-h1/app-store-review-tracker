import { z } from 'zod';
import type { ReviewHandlerParams } from '../types/reviews';

export class ValidationException extends Error {
  errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[]) {
    const messages = errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    super(`Validation failed: ${messages}`);
    this.name = 'ValidationException';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}

/**
 * Zod schema for review handler parameters
 */
const reviewHandlerParamsSchema = z
  .object({
    appleAppId: z.string().optional(),
    googleAppId: z.string().optional(),
    country: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    sortBy: z.enum(['mostRecent', 'mostHelpful']).optional(),
  })
  .refine(data => data.appleAppId || data.googleAppId, {
    message: 'At least one of appleAppId or googleAppId must be provided',
    path: ['appIds'],
  });

/**
 * Validates review handler parameters using Zod
 */
export const validateReviewHandlerParams = (
  params: ReviewHandlerParams,
): void => {
  try {
    reviewHandlerParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationException(error.issues);
    }
    throw error;
  }
};
