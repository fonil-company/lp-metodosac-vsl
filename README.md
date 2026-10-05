# Método S.A.C — Landing page VSL

Página estática, responsiva e sem dependências de build. O conteúdo publicável está em `dist/`.

## Visualização local

```sh
python -m http.server 4173 --directory dist --bind 127.0.0.1
```

Abra `http://127.0.0.1:4173`.

## Conteúdo e integrações

- Layout inspirado na estrutura de https://vincisociety.com.br/negocios-creators/ e adaptado ao guia DOCX e à identidade visual fornecidos.
- Logo original enviada pelo cliente, exibida sem as margens transparentes por CSS.
- Inter hospedada localmente; cores `#0D0D0D`, `#1A1A1A`, `#6CF203` e `#C6F601`.
- VSL: https://www.youtube.com/watch?v=v-A7exiRzbE. O player só é carregado após o clique.
- Todos os CTAs direcionam a https://v1.sacmetodo.com.br/ e repassam UTMs e identificadores comuns de campanha.
- Nove blocos visíveis. A dobra de três provas sociais aguarda depoimentos reais, com resultado, identificação e autorização de uso. Não existem provas fictícias ou placeholders visíveis.
- FAQ acessível via teclado, com uma resposta aberta por vez.
- `dataLayer`: `view_content`, `click_apply`, `video_requested`, `play_testimonial` e `play_video` (quando o player confirmar reprodução). Nenhum ID de Meta, Google ou GTM foi fornecido. `quiz_start` e `quiz_complete` pertencem ao quiz externo e precisam ser configurados lá.
- Texto segue o DOCX (Sistema de Aquisição Comercial); logo preserva o descritivo do arquivo original (Sistema de Aquisição de Clientes).

## Arquivos

- `dist/index.html`: conteúdo e metadados.
- `dist/styles.css`: identidade visual e responsividade.
- `dist/app.js`: CTAs, parâmetros de campanha, player e FAQ.
- `dist/assets/`: logo, thumbnail real da VSL e fontes.

Para alterar a URL do diagnóstico, atualize `QUIZ_URL` no JavaScript e os links de fallback no HTML.
