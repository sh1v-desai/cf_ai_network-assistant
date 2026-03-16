// ChatSession.js
// durable object - handles per-session conversation memory
// each user gets their own DO instance keyed by session id
// stores message history so the llm has context across turns

export class ChatSession {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
    // persistent storage backed by durable object storage api
    this.storage = state.storage;
  }

  async fetch(request) {
    const url    = new URL(request.url);
    const method = request.method;

    if (method === 'POST' && url.pathname === '/message') {
      return this.handleMessage(request);
    }

    if (method === 'GET' && url.pathname === '/history') {
      return this.getHistory();
    }

    if (method === 'DELETE' && url.pathname === '/reset') {
      return this.resetHistory();
    }

    return new Response('not found', { status: 404 });
  }

  async handleMessage(request) {
    const { userMessage } = await request.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return Response.json({ error: 'invalid message' }, { status: 400 });
    }

    // load existing history
    let history = (await this.storage.get('history')) || [];

    // system prompt - gives the llm a clear role
    const systemPrompt = `You are a knowledgeable network and infrastructure assistant with deep expertise in:
- DNS, TCP/IP, HTTP/HTTPS protocols
- CDN architecture and edge computing concepts
- Network security, DDoS mitigation, TLS/SSL
- Cloudflare products and how they work under the hood
- Web performance optimisation
- Distributed systems concepts

Keep answers clear and technical but accessible. Use concrete examples where helpful.
If asked something outside networking/infrastructure, briefly answer but steer back to your area of expertise.`;

    // build messages array for llm
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    // call workers ai - llama 3.3 70b
    let assistantReply;
    try {
      const aiResponse = await this.env.AI.run(
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        { messages, max_tokens: 1024 }
      );
      assistantReply = aiResponse.response;
    } catch (err) {
      console.error('workers ai error:', err);
      return Response.json({ error: 'ai request failed' }, { status: 500 });
    }

    // persist updated history (keep last 20 messages to avoid hitting storage limits)
    history.push({ role: 'user',      content: userMessage   });
    history.push({ role: 'assistant', content: assistantReply });
    if (history.length > 20) {
      history = history.slice(history.length - 20);
    }
    await this.storage.put('history', history);

    return Response.json({
      reply:   assistantReply,
      history: history
    });
  }

  async getHistory() {
    const history = (await this.storage.get('history')) || [];
    return Response.json({ history });
  }

  async resetHistory() {
    await this.storage.delete('history');
    return Response.json({ ok: true });
  }
}
