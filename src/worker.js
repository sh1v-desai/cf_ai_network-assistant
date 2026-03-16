// worker.js
// main cloudflare worker entry point
// routes requests to either the chat api or serves static assets
// durable objects handle per-session state

import { ChatSession } from './ChatSession.js';
export { ChatSession };

// cors headers - needed for local dev
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const method = request.method;

    // preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // -- api routes --

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, url, env);
    }

    // -- serve frontend --
    // in production this is handled by pages, but useful for wrangler dev
    return new Response('use cloudflare pages to serve the frontend', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};


async function handleAPI(request, url, env) {
  const method = request.method;

  // get or create session id from header/cookie
  // simple approach: client generates a uuid and sends it as X-Session-Id
  const sessionId = request.headers.get('X-Session-Id') || 'default';

  // get durable object stub for this session
  const doId   = env.CHAT_SESSION.idFromName(sessionId);
  const doStub = env.CHAT_SESSION.get(doId);

  // -- POST /api/chat  - send a message
  if (method === 'POST' && url.pathname === '/api/chat') {
    const body = await request.json().catch(() => null);
    if (!body?.message) {
      return Response.json({ error: 'message required' }, { status: 400, headers: CORS });
    }

    // forward to durable object
    const doReq = new Request('http://do/message', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userMessage: body.message })
    });

    const doRes  = await doStub.fetch(doReq);
    const result = await doRes.json();

    return Response.json(result, {
      status:  doRes.status,
      headers: CORS
    });
  }

  // -- GET /api/history - retrieve conversation history
  if (method === 'GET' && url.pathname === '/api/history') {
    const doReq = new Request('http://do/history');
    const doRes = await doStub.fetch(doReq);
    const data  = await doRes.json();
    return Response.json(data, { headers: CORS });
  }

  // -- DELETE /api/reset - clear conversation
  if (method === 'DELETE' && url.pathname === '/api/reset') {
    const doReq = new Request('http://do/reset', { method: 'DELETE' });
    const doRes = await doStub.fetch(doReq);
    const data  = await doRes.json();
    return Response.json(data, { headers: CORS });
  }

  // -- GET /api/models - return available models info
  if (method === 'GET' && url.pathname === '/api/models') {
    return Response.json({
      current: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      provider: 'Cloudflare Workers AI',
      context_window: 128000
    }, { headers: CORS });
  }

  return Response.json({ error: 'not found' }, { status: 404, headers: CORS });
}
