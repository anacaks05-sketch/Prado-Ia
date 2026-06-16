# Prado Sports AI — V16.11 Cliente Final

## O que é esta versão
Versão para publicar e passar o LINK ao cliente.

## Importante
- Cliente NÃO recebe o ZIP.
- Cliente recebe apenas o link publicado do app.
- Cliente recebe um código premium individual após pagar.
- Você usa o mesmo app publicado, mas guarda o ZIP e o controle dos códigos.

## Alterado
- Removidos códigos de teste: PRADO2026, CARLOSVIP, PRADO19.
- Removido texto dizendo "troque antes de vender".
- Removidas ações internas das Configurações.
- Tela Premium ficou com texto de cliente.
- Suporte e versão do app ajustados para cliente.
- Validação premium pronta para usar CSV do Google Sheets.

## Para configurar antes de vender
No arquivo `index.html`, procure `window.PRADO_CONFIG` e preencha:
- `PAYMENT_LINK`: seu link de pagamento.
- `SUPPORT_WHATSAPP`: seu WhatsApp com DDI/DDD.
- `PREMIUM_CODES_CSV`: link CSV publicado da planilha com códigos ativos.

## Teste
Use: ?v=16-11
