# Prado Sports AI V12 — Versão celular sem pastas

Esta versão foi feita para subir pelo celular sem precisar enviar pastas.

## Arquivos para enviar no GitHub
Envie estes arquivos na raiz do repositório:

- index.html
- manifest.json
- sw.js
- icon.svg
- icon-192.png
- icon-512.png

## Para API segura na Vercel
O GitHub pelo celular não envia pasta inteira. Então crie manualmente um arquivo novo com este nome:

api/football.js

Depois cole o conteúdo de `API-FOOTBALL-COPIAR.txt`.

Na Vercel, vá em Settings > Environment Variables e adicione:

APISPORTS_KEY = sua chave da API-Football

Depois faça Redeploy.

## Teste rápido sem proxy
Também dá para testar pelo botão ⚙️ do app colando a chave da API no navegador, mas para vender o produto use a variável da Vercel.
