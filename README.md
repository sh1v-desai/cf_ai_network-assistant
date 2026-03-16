# cf_ai_network-assistant

an ai-powered networking and infrastructure assistant built entirely on cloudflare's stack. ask it anything about dns, cdns, tls, ddos mitigation, http protocols, or edge computing.

built as part of the cloudflare software engineering internship application.

---

## what it does

- chat interface for asking networking and infrastructure questions
- powered by **llama 3.3 70b** via cloudflare workers ai
- **per-session conversation memory** using durable objects — the llm remembers context across turns
- each browser tab gets its own isolated session
- clean, fast ui served via cloudflare pages

## architecture

```
browser
  │
  ├── GET  /           → static html/js (cloudflare pages / assets)
  │
  └── POST /api/chat   → cloudflare worker
                              │
                              ├── routes to Durable Object (per session id)
                              │     └── loads history from DO storage
                              │
                              ├── calls Workers AI (llama 3.3)
                              │
                              └── saves updated history back to DO
```

**components used:**
| requirement | implementation |
|---|---|
| LLM | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` via Workers AI |
| Workflow / coordination | Cloudflare Worker routes + Durable Objects |
| User input | Chat UI served via Cloudflare Pages (assets binding) |
| Memory / state | Durable Objects persistent storage (per-session history) |

---

## running locally

**requirements:** node 18+, a cloudflare account

```bash
# 1. clone the repo
git clone https://github.com/sh1v-desai/cf_ai_network-assistant
cd cf_ai_network-assistant

# 2. install wrangler
npm install

# 3. log in to cloudflare
npx wrangler login

# 4. run locally (workers ai works in wrangler dev with --remote flag)
npx wrangler dev --remote
```

then open `http://localhost:8787` in your browser.

---

## deploying to cloudflare

```bash
npx wrangler deploy
```

wrangler will output your worker url. the frontend is served from the same worker via the assets binding.

---

## project structure

```
cf_ai_network-assistant/
├── src/
│   ├── worker.js        # main worker entry point, api routing
│   └── ChatSession.js   # durable object - conversation memory
├── public/
│   └── index.html       # chat ui (single file, no build step)
├── wrangler.toml        # cloudflare config (ai + do bindings)
├── package.json
├── README.md
└── PROMPTS.md           # ai prompts used in development
```

---

## example questions to try

- *"how does cloudflare's cdn decide which edge node to route traffic to?"*
- *"explain the dns resolution process from browser to root nameserver"*
- *"what's the difference between tcp and udp and when would you use each?"*
- *"how does a tls 1.3 handshake work?"*
- *"what are durable objects and how do they differ from kv?"*
- *"walk me through how ddos mitigation works at the network layer"*
