# Guia Definitivo de Deploy e Resolução de Caminhos (Next.js 16 + Vercel)

Este documento organiza os problemas recorrentes de build/deploy e consolida a solução definitiva, focando em duas frentes: raiz de projeto na Vercel e padronização de caminhos/imports no código.

## Sintomas Observados
- Logs indicando raiz errada: Next.js selecionou `D:\\GoogleDrive\\Bilder Ai\\package-lock.json` como root em vez de `Agencia/CRM`.
- Erros intermitentes de "Cannot find module" e tipagem retornando após correções.
- Múltiplos `package-lock.json` no repositório confundindo a detecção de workspace.

Referências:
- next.config.mjs já ajustado para raiz local do app: `next.config.mjs:1`.
- Aviso de raiz nos builds locais (corrigido): build mostrou seleção incorreta e foi alinhado.

## Causa-Raiz
- A Vercel está tentando instalar/compilar na pasta errada, pois o repositório contém múltiplas pastas e lockfiles na raiz. O projeto real vive em `Agencia/CRM`, mas o deploy ocorre na raiz do repo.

## Passo 1 — Ajustar Root Directory na Vercel
- Abra o projeto na Vercel.
- Vá em `Settings` → `General` → `Root Directory`.
- Selecione a pasta onde está o `package.json` do app: `Agencia/CRM`.
- Salve e faça redeploy.
- Garanta que os comandos estejam padrão:
  - Install Command: `npm install`
  - Build Command: `npm run build`

Por que isso funciona: evita que o builder rode na pasta-mãe, garantindo que dependências e paths sejam resolvidos no app correto.

## Passo 2 — (Opcional) Repositório Limpo
Se o passo 1 não resolver ou se deseja eliminar qualquer risco:
- Crie uma nova pasta vazia (ex.: `crm-final`).
- Copie apenas: `src/`, `public/`, `package.json`, `tsconfig.json`, `next.config.mjs`, `components.json`, `.env`.
- Não copie: `node_modules`, `.next`, `.git`.
- Faça `git init`, `npm install`, commit inicial e suba para um novo repositório.
- Importe o novo repo na Vercel (sem monorepo e sem lockfiles extra).

## Padronizações de Código (Aplicadas)
- Imports absolutos com alias `@/` restaurados:
  - `src/app/(dashboard)/crm/analytics/page.tsx:1`
- Tipagens fortes no calendário (sem `any`):
  - `src/app/(dashboard)/crm/calendar/page.tsx:9`
- Imports do `date-fns` somente da raiz:
  - `src/app/(dashboard)/crm/calendar/page.tsx:2`
- tsconfig estrito:
  - `tsconfig.json:11` (`strict: true`, `noImplicitAny: true`).
- Raiz de workspace alinhada para o builder local:
  - `next.config.mjs:1` (`turbopack.root`, `outputFileTracingRoot`).

## Checklist de Deploy
- [ ] Root Directory na Vercel aponta para `Agencia/CRM`.
- [ ] `next.config.mjs` sem opções inválidas, com `turbopack.root`.
- [ ] Imports `@/` só dentro de `src/` (sem `../../`).
- [ ] `date-fns` importado da raiz.
- [ ] `tsconfig.json` estrito e com `paths: { "@/*": ["./src/*"] }`.
- [ ] Redeploy acionado após salvar o Root Directory.

## Comandos Úteis
- Build local: `npm run build`
- Dev server: `npm run dev` → `http://localhost:3000`

## Status Atual
- Build local compila com sucesso (Types ok, sem ignorar erros).
- Push realizado em `main`; aguardar Vercel iniciar o deploy com Root Directory correto.
