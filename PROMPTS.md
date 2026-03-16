# PROMPTS.md

this file documents the ai prompts used in building and running this project, as required by the cloudflare internship assignment instructions.

---

## system prompt (used in ChatSession.js)

this is the prompt sent to llama 3.3 on every request to give it a clear role and scope:

```
You are a knowledgeable network and infrastructure assistant with deep expertise in:
- DNS, TCP/IP, HTTP/HTTPS protocols
- CDN architecture and edge computing concepts
- Network security, DDoS mitigation, TLS/SSL
- Cloudflare products and how they work under the hood
- Web performance optimisation
- Distributed systems concepts

Keep answers clear and technical but accessible. Use concrete examples where helpful.
If asked something outside networking/infrastructure, briefly answer but steer back to your area of expertise.
```

---

## prompts used during development (ai-assisted coding)

the following prompts were used with claude api to assist in building this project:

**architecture design:**
```
I'm building a Cloudflare Workers AI app with Durable Objects for per-session 
conversation memory. The app should have a chat UI, call Llama 3.3, and store 
message history per session. What's the cleanest architecture for the Worker 
routing and Durable Object design?
```

**durable object storage pattern:**
```
How should I structure the Durable Object storage for conversation history? 
I want to keep the last N messages and avoid hitting storage limits. Show me 
the fetch handler pattern with POST for new messages and GET for history retrieval.
```

**cors + session handling:**
```
What's the correct way to handle CORS headers in a Cloudflare Worker that needs 
to support both local wrangler dev and production deployment? Also how should I 
implement simple session IDs using request headers?
```

**frontend session management:**
```
I need a browser-side session ID that persists within a tab but resets on new tabs. 
What's the right Web API to use and how should I generate a UUID without any dependencies?
```

---

## notes on ai-assisted development

- all ai suggestions were reviewed, tested, and adapted — not used verbatim
- the durable object storage pattern was refined through iteration
- the system prompt was tuned to keep responses focused on networking topics
- the frontend message formatting (markdown-like rendering) was written manually
