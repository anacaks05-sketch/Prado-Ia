# Prado Sports AI — V16.30 APIs Football + Odds

## Alterado
- Adicionado proxy seguro `/api/football` para API-Football/API-Sports.
- Adicionado proxy seguro `/api/odds` para The Odds API.
- O app agora tenta carregar jogos pela API-Football.
- O app agora tenta buscar odds reais pela Odds API.
- Quando encontra odds reais, a IA usa essas odds nos mercados e bilhetes.
- Scanner da Home passa a girar mercados/odds vindos das predições com odds reais quando disponíveis.
- Mantida a Home Pro compacta aprovada da V16.29.6.

## Variáveis na Vercel
Configure em Settings > Environment Variables:

APISPORTS_KEY = sua chave da API-Football/API-Sports
ODDS_API_KEY = sua chave da The Odds API

Opcional:
ODDS_SPORTS = soccer_brazil_campeonato,soccer_epl,soccer_spain_la_liga,soccer_uefa_champs_league,soccer_conmebol_copa_libertadores

## Teste
Use: ?v=16-30

Se uma chave não estiver configurada, o app continua abrindo em prévia/demo sem quebrar.
