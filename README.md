# Dev Agent Orchestrator (Console + SDK hybride)

Pattern de production : les **définitions d'agents** vivent dans le Claude Console (Managed Agents), un petit script TypeScript se contente d'**ouvrir des sessions** et streamer les événements.

- **architect** — planifie l'implémentation
- **coder** — écrit le code et les tests
- **reviewer** — audite le résultat
- **engineering-lead** — coordinateur qui délègue aux trois ci-dessus

## 1. Créer les agents dans le Console

Va sur [platform.claude.com](https://platform.claude.com/workspaces/default/agent-quickstart).

> **Avant les agents : crée le vault Atlassian** (étape 0bis)
>
> 1. Console → **Vaults** → New vault
> 2. Type : OAuth credential pour Atlassian
> 3. Lance le flow OAuth (Dynamic Client Registration, pas besoin d'app OAuth à créer)
> 4. Note le `vault.id`
>
> Cette étape est faite une fois pour ton workspace.

### Agent 1 — architect

- **Name :** `architect`
- **Model :** `claude-opus-4-7`
- **System prompt :**
  ```
  You are a software architect. You receive feature requests that may
  reference Jira tickets (e.g. ENG-123). When a ticket is mentioned,
  use the atlassian MCP tools to fetch its description and acceptance
  criteria first. Then produce a concise implementation plan in markdown:
  - Linked Jira ticket (if any)
  - Files to create/modify
  - Function signatures
  - Data flow
  - Edge cases & error handling
  Do NOT write the implementation — only the plan.
  ```
- **MCP servers :**
  ```json
  [{
    "type": "url",
    "name": "atlassian",
    "url": "https://mcp.atlassian.com/v1/mcp/authv2"
  }]
  ```
- **Tools :**
  ```json
  [
    {"type": "agent_toolset_20260401"},
    {"type": "mcp_toolset", "mcp_server_name": "atlassian"}
  ]
  ```

Note bien l'`agent.id` retourné.

### Agent 2 — coder

- **Name :** `coder`
- **Model :** `claude-sonnet-4-6`
- **System prompt :**
  ```
  You are a senior TypeScript engineer. You receive an implementation plan
  from the architect. Execute it: write clean documented code, include unit
  tests, run them with bash, and return a summary of files touched + test results.
  ```
- **Tools :** `agent_toolset_20260401`

### Agent 3 — reviewer

- **Name :** `reviewer`
- **Model :** `claude-opus-4-7`
- **System prompt :**
  ```
  You are a strict code reviewer. Read the files the coder produced and
  report issues with file:line precision (bugs, missing tests, security,
  style). End with a verdict: APPROVED or CHANGES REQUESTED.
  ```
- **Tools :** `agent_toolset_20260401`

### Agent 4 — engineering-lead (coordinateur)

- **Name :** `engineering-lead`
- **Model :** `claude-opus-4-8`
- **System prompt :**
  ```
  You coordinate a small engineering team that works from Jira tickets:
  - Delegate planning to the architect agent first (it will fetch the
    Jira ticket if mentioned).
  - Pass the plan to the coder agent.
  - Ask the reviewer agent to audit.
  - If the reviewer returns CHANGES REQUESTED, loop back to the coder
    with the specific issues. Stop when APPROVED.
  - When done, ask the architect to post a summary comment on the Jira
    ticket via the atlassian MCP.
  - Summarize the final deliverable for the user.
  ```
- **Tools :** `agent_toolset_20260401`
- **Multiagent :** active "coordinator", ajoute les 3 agents (architect, coder, reviewer) au roster.

> Le coordinateur n'a pas besoin du MCP atlassian — il délègue aux agents qui l'ont.

### Environment

Crée un environment `cloud` (networking unrestricted) et note son ID.

## 2. Configurer le projet local

```bash
npm install
cp .env.example .env
# colle dans .env :
#   ANTHROPIC_API_KEY=...        (clé API du Console)
#   COORDINATOR_AGENT_ID=...     (l'id de engineering-lead)
#   ENVIRONMENT_ID=...           (l'id de l'environment)
#   ATLASSIAN_VAULT_ID=...       (l'id du vault OAuth Atlassian)
```

## 3. Lancer une tâche

Par ticket Jira :

```bash
npm start -- "Implémente ENG-1234"
```

Ou avec description libre :

```bash
npm start -- "Build a REST endpoint POST /users with email validation and SQLite"
```

L'architect ira automatiquement chercher le ticket Jira mentionné. Le coordinateur, en fin de run, fera poster un commentaire de résumé sur le ticket.

Le script ouvre une session, envoie la tâche au coordinateur, et streame :
- les threads spawnés par chaque délégation
- les messages entre coordinateur et subagents
- les tool calls en direct

## Pourquoi ce pattern

- Les **prompts** se modifient via l'UI du Console (avec preview, test, versioning intégré côté Anthropic)
- Ton **code** ne contient que la logique métier (déclenchement, traitement du résultat, intégration produit)
- Tu peux **A/B tester** des versions d'agents en changeant juste un ID dans `.env`
- Anthropic gère sandbox, credentials, checkpointing

## Pour aller plus loin

- Authentification MCP : crée un **vault** et passe `vault_ids` au `sessions.create`
- Webhooks : abonne-toi à `session.status_idle` pour traiter le résultat de manière asynchrone
- Auto-hébergement : passe l'environment en sandbox sur Cloudflare/Daytona/Modal/Vercel
