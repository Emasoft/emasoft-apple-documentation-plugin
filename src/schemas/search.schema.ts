import { z } from 'zod';

export const searchAppleDocsSchema = z.object({
  query: z.string().describe('Search query for Apple Developer Documentation'),
  type: z.enum(['all', 'documentation', 'sample']).default('all')
    .describe('Type of content to search for (documentation=API reference, sample=code samples)'),
  select: z.boolean().optional()
    .describe('Jev semantic selection: keep only the best-matching results. Default follows APPLE_DOCS_MCP_JEV_RERANK; true while it is not enabled is an error'),
  maxResults: z.number().int().min(1).max(5).default(5)
    .describe('With select on: how many results to return at most (1-5)'),
});