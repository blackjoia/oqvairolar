# O Que Vai Rolar?

Agenda de eventos de Francisco Beltrão e região: oquevairolar.com.br

Feito com Vite, React, Tailwind e Firebase (Firestore, Auth e Hosting).

## Rodar no computador

```
npm install
npm run dev
```

Abra http://localhost:5173. Com `?demo` no endereço (ex.: http://localhost:5173/?demo) a página inicial mostra eventos de exemplo.

## Publicar

No PowerShell do Windows use `npx.cmd` no lugar de `npx`.

```
npm run build
npx firebase-tools deploy --only hosting,firestore
```

Prévia sem mexer no site no ar:

```
npm run build
npx firebase-tools hosting:channel:deploy previa --expires 7d
```

## Painel admin

Em /admin, entrando com a conta admin. O UID da conta está em `src/lib/firebase.js` e em `firestore.rules`.

## Eventos (coleção `eventos`)

O id do documento é o link fixo do evento: `/evento/<id>`.

Campos:
- `titulo`, `categoria`, `generos[]` e `descricao`
- `inicio` e `fim`
- `localNome`, `endereco`, `cidade`, `lat` e `lng`
- `cartazUrl`, `ingressoUrl`, `gratuito`, `preco` e `instagram`
- `status`: `publicado`, `pendente`, `rascunho` ou `rejeitado`
- `origem`, `criadoEm` e `atualizadoEm`
