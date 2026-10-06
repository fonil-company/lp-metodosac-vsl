const DEFAULT_WEBHOOK = 'https://newtracking-sales-sys.vercel.app/api/webhooks/leads/cmpylrvkv000376i6bzhsl1lo';
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/submit') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return Response.json({ success: false }, { status: 405, headers: { Allow: 'POST' } });
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return Response.json({ success: false }, { status: 403 });
    try {
      const text = await request.text();
      if (text.length > 20000) return Response.json({ success: false }, { status: 413 });
      const body = JSON.parse(text);
      if (!body.nome_completo?.trim() || !body.empresa?.trim() || !/^\d{10,11}$/.test(body.whatsapp_limpo) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.privacy_consent !== true) {
        return Response.json({ success: false, error: 'Confira os campos obrigatórios.' }, { status: 400 });
      }
      const fields = {
        phone: 'whatsapp_limpo', name: 'nome_completo', email: 'email', document: 'cnpj_limpo', city: 'cidade', state: 'estado', pipeline_stage: 'nivel_qualificacao',
        empresa: 'empresa', cargo: 'cargo', resultado_diagnostico: 'resultado_diagnostico', tipo_operacao: 'tipo_operacao', segmento: 'segmento', publico_atendido: 'publico_atendido', faturamento: 'faturamento', uso_whatsapp: 'uso_whatsapp', equipe_comercial: 'tamanho_comercial', origem_clientes: 'origem_clientes', investimento_marketing: 'investimento_marketing', rastreio_vendas: 'rastreio_vendas', recompra: 'recompra', capacidade_atendimento: 'capacidade', objetivo_principal: 'objetivo', utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign', utm_content: 'utm_content', utm_term: 'utm_term', fbclid: 'fbclid', gclid: 'gclid', fbc: 'fbc', fbp: 'fbp', event_id: 'event_id', url_pagina: 'url_pagina', dispositivo: 'dispositivo'
      };
      for (const key of ['utm_id', 'gbraid', 'wbraid', 'msclkid']) fields[key] = key;
      const payload = Object.fromEntries(Object.entries(fields).flatMap(([to, from]) => typeof body[from] === 'string' && body[from].trim() ? [[to, body[from].trim()]] : []));
      const post = url => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
      const response = await post(env.WEBHOOK_LEADS_URL || DEFAULT_WEBHOOK);
      if (!response.ok) return Response.json({ success: false, error: 'Não foi possível enviar seus dados. Tente novamente em instantes.' }, { status: 502 });
      if (env.WEBHOOK_SUPABASE_URL) {
        try { await post(env.WEBHOOK_SUPABASE_URL); } catch { console.error('Falha no webhook secundário.'); }
      }
      return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json({ success: false, error: 'Não foi possível enviar seus dados. Tente novamente em instantes.' }, { status: 502 });
    }
  }
};
