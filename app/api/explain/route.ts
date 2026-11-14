import { callApi, fail, fromCache, guard, respond, str, toCache } from '@/lib/apiverve';

// GET /api/explain?expression=0 9 * * 1-5: one Cron Parser call.
// The description never changes for an expression, but the next runs do, so the cache is short.
const TTL_MS = 60_000;

export async function GET(request: Request) {
  const expression = str(new URL(request.url).searchParams.get('expression'), 120).replace(/\s+/g, ' ');
  if (!expression) return fail('Enter a cron expression, like 0 9 * * 1-5');
  const parts = expression.split(' ').length;
  if (parts < 5 || parts > 6) return fail('A cron expression has 5 fields (or 6 with seconds), separated by spaces');

  const key = `cron:${expression}`;
  const hit = fromCache(key, TTL_MS);
  if (hit) return Response.json(hit);

  const blocked = guard(request);
  if (blocked) return blocked;

  return respond(async () => {
    const data = await callApi('cronparser', { query: { expression } });
    toCache(key, data);
    return data;
  });
}
