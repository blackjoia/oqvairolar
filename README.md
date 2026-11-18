# O Que Vai Rolar

Agenda de eventos de Francisco Beltrão e região — [oquevairolar.com.br](https://oquevairolar.com.br).

Site estático (HTML + JS) com Firebase: Firestore para os eventos, Authentication para o admin e Hosting para publicar.

## Publicar

```bash
npm install -g firebase-tools   # uma vez
firebase login                  # uma vez
firebase deploy                 # publica o site e as regras do banco
```

`firebase deploy --only hosting` publica só o site; `firebase deploy --only firestore:rules` publica só as regras.

## Admin

Acesse `/admin` e entre com a conta de administrador. No painel há o botão **Baixar backup**, que salva todos os eventos num arquivo JSON.

## Plano

O plano em fases está no projeto do Claude ("Plano O Que Vai Rolar"). Esta versão corresponde à **Fase 0**: organização e segurança.
