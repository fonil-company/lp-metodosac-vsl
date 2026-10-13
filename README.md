# Método S.A.C — VSL com diagnóstico integrado

Os cinco CTAs abrem o quiz na própria página, em uma janela de tela inteira. O quiz é servido pelo mesmo site. Voltar à apresentação preserva as respostas enquanto a página permanecer aberta.

Conteúdo importado do fluxo ativo de `lp-quiz-metodosac-v1-main`: nome, operação, faturamento, origem dos clientes, contato e resultado. Alternativas, textos e pontuação originais foram preservados.

Ao abrir o diagnóstico, a URL da página identifica a tela atual: `#etapa1` (nome), `#etapa2` (operação), `#etapa3` (faturamento), `#etapa4` (origem dos clientes), `#etapa5` (contato), `#etapa6` (resultado) e `#etapa7` (obrigado, somente após confirmação do envio). Os parâmetros de campanha permanecem na URL. Voltar entre as perguntas ou reabrir o diagnóstico atualiza a marcação; o botão Voltar do navegador retorna à apresentação. Como as respostas ficam em memória, recarregar ou abrir um link direto para qualquer etapa inicia um novo diagnóstico na primeira tela. O link antigo `#diagnostico` continua funcionando.

## Executar

Requer Node.js 22 ou superior.

```sh
npm ci
npm run build
npm run dev
```

Abra http://127.0.0.1:4173. O servidor local também atende `/api/submit`.

Antes de testar envios localmente, copie `.env.example` para `.env` e configure `WEBHOOK_LEADS_URL`. O token não deve ser versionado. A configuração secreta do Sites não é copiada para o GitHub: configure também essa variável na hospedagem que usar este repositório.

Em hospedagens Node.js, execute `npm ci && npm run build`, defina `HOST=0.0.0.0` e inicie com `npm start`. `PORT` é configurável. GitHub Pages não executa a API de envio deste projeto.

## Estrutura

- `public/`: VSL, estilos, vídeos, fontes e documento do quiz.
- `src/components/quiz/`: componentes importados e adaptados.
- `src/lib/`: pontuação, rótulos, tipos e validações originais.
- `src/worker.js`: API de envio compatível com Cloudflare Workers.
- `dist/client/`: arquivos gerados para o navegador.
- `dist/server/`: Worker e configuração gerados.

O site precisa do Worker para enviar cadastros; hospedagem exclusivamente estática não atende `/api/submit`. Altere `public/` ou `src/` e execute o build.

## Envio

`WEBHOOK_LEADS_URL` substitui o webhook CRM original. `WEBHOOK_SUPABASE_URL` configura o destino secundário opcional, somente no servidor. Não coloque tokens no JavaScript público.

Em 06/10/2026, o serviço CRM original retornou HTTP 402 com `DEPLOYMENT_DISABLED`. É necessário reativá-lo ou configurar outro webhook para receber cadastros. O resultado é calculado e exibido independentemente do envio. Na falha, a tela de resultado informa que os dados ainda não foram entregues e permite tentar novamente. As respostas ficam apenas na memória da página aberta, sem confirmação falsa nem promessa de envio automático posterior.

UTMs e identificadores de campanha são repassados ao CRM. O Pixel PageView existente permanece na VSL. `dataLayer` recebe `click_apply`, `quiz_start` e `quiz_complete`; o último só ocorre após confirmação de envio. Esses eventos não contêm dados pessoais.

## Verificação

Com o servidor ativo, execute `node scripts/verify.mjs`. O teste verifica desktop e celular, campos obrigatórios, preservação das respostas, resultado, UTMs e falhas de envio. Envios são simulados e não geram cadastros reais.

Execute também `node scripts/verify-serving.mjs` para verificar compressão, cache e os trechos dos vídeos usados na reprodução e ao avançar.

## Desempenho

As fontes WOFF2 mantêm os mesmos caracteres e os logos WebP usam compressão sem perda. Os arquivos originais permanecem disponíveis. O build minifica o JavaScript e CSS da apresentação e gera versões Brotli/gzip dos arquivos de texto.

O servidor Node entrega a compressão aceita pelo navegador, revalida o cache com ETag e transmite arquivos por streaming. Os vídeos aceitam requisições de trechos (HTTP Range), sem carregar o arquivo inteiro na memória do servidor. O quiz e o YouTube continuam carregando somente quando abertos; os depoimentos permanecem com `preload="none"`.

Na medição local em Chromium, em 08/10/2026, os arquivos próprios transferidos no primeiro carregamento passaram de 1.111.312 para 604.488 bytes (46% menos). Abrir o quiz na mesma sessão passou de 1.091.207 para 141.763 bytes adicionais (87% menos), com as fontes reutilizadas do cache. Os números excluem serviços de terceiros e não representam uma medição da hospedagem pública. Outros servidores devem configurar sua própria compressão e cache.
