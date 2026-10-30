# Reflexão (Step 1) — como lidamos com mudanças quebrando

**Como o time costuma lidar com mudanças quebrando:** a regra é que
mudanças quebrantes só entram em uma **versão nova** da API (`/v2/orders/:id`),
nunca na versão vigente. A versão antiga (`/orders/:id`) continua existindo e
continua atendendo os consumidores que ainda não migraram, e cada nova versão
é publicada no Pact Broker como uma tag própria (`v1`, `v2`) do **mesmo** par
consumer/provider. O provider então verifica as duas tags no mesmo build, o
que transforma "não quebre quem já existe" em uma condição verificable pelo
pipeline, e não em uma promessa do time.

**O que acontece com os consumidores quando APIs ou eventos evoluem:** com o
contrato, o consumidor passa a ser avisado antes da mudança. Um consumidor que
precisa de um campo novo escreve o contrato novo (v2) e passa a consumi-lo; um
consumidor que não mudou continua com o contrato v1, e o provider é obrigado a
satisfazer os dois ao mesmo tempo — se um campo é removido ou muda de tipo, a
verificação falha no CI. No caso dos eventos assíncronos o efeito é o mesmo:
o Shipping service declara no contrato do evento quais campos ele consome, e
se o publicador parar de mandar `shippingProvider`, a verificação do provider
falha antes do deploy, em vez de a notificação de envio silenciosamente
parar de funcionar.

**O que aprendi na prática com esta atividade:**

1. O contrato do **produto** precisa ser versionado junto com o contrato do
   **código** — o Broker guarda as duas versões lado a lado e é a matriz de
   compatibilidade que diz se uma mudança é segura.
2. Compatibilidade retroativa se garante **somando**, nunca removendo ou
   trocando o tipo de um campo; e o teste negativo
   (`orders.breaking.test.js`) provou que a regra é realmente aplicada, porque
   a remoção de `currency` derrubou a verificação do v1.
3. O consumidor precisa ser um **leitor tolerante**: ignorar campos
   desconhecidos é o que permite a evolução da API semoupled breaking change
   no lado de quem consome.
4. Contrato assíncrono não é um extra opcional: sem ele, o contrato de um
   evento continua sendo apenas documentação, e a primeira quebra em produção
   aparece no meio de uma fila, sem status check que a antecipe.
5. A matriz de compatibilidade do Broker é o inventário real de quem depende
   de quê — é ela que responde "posso desligar a v1?".
