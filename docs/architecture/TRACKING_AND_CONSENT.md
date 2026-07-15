# Rastreamento, consentimento e integrações

## Objetivo

O subsistema de rastreamento registra eventos do site e encaminha conversões para integrações configuradas, respeitando o modo de consentimento e mantendo credenciais fora do navegador.

## Entidades

### `cq_tracking_configs`

Configuração pública por site:

- modo de consentimento;
- Meta Pixel ID;
- GA4 Measurement ID;
- Google Ads conversion ID e label;
- ativação de envio no navegador;
- ativação de envio server-side.

### `cq_tracking_secrets`

Armazena um payload criptografado por site. Não deve ser selecionável diretamente pelo navegador nem exportado em migrações comuns.

### `cq_tracking_events`

Registra eventos e o resultado por plataforma:

- `event_id` idempotente;
- nome e origem;
- URL da página;
- session/visitor identifiers;
- consentimento e contexto em JSONB;
- status Meta, GA4 e Google Ads;
- último erro, tentativas e processamento.

## Fluxo público

```text
interação do visitante
        ↓
normalização do evento
        ↓
verificação do consentimento
        ↓
disparo no navegador quando habilitado
        ↓
registro/envio server-side quando configurado
```

Eventos de conversão devem usar identificadores consistentes para evitar duplicação entre browser e servidor.

## Consentimento

O modo atual deve ser lido da configuração do site. Integrações que dependem de consentimento não devem ser iniciadas antes da decisão aplicável.

O estado de consentimento enviado ao banco deve ser o mínimo necessário e não deve conter informações sensíveis desnecessárias.

## Segredos

Credenciais como tokens da Meta, GA4 API Secret e OAuth do Google:

- são enviados por fluxo administrativo protegido;
- são criptografados antes de persistência;
- não retornam ao navegador após o salvamento;
- não aparecem em logs, documentação, exportações comuns ou bundles;
- precisam ser cadastrados novamente ou migrados por procedimento seguro no projeto destino.

A chave de criptografia deve existir apenas como secret do ambiente server-side.

## Integrações

### Meta

Pode operar por Pixel no navegador e CAPI no servidor. O mesmo `event_id` deve ser usado para deduplicação quando ambos estão ativos.

### GA4

Pode usar `gtag` no navegador e Measurement Protocol no servidor. Measurement ID é público; API Secret não é.

### Google Ads

Pode usar tag de conversão no navegador e integração server-side conforme o endpoint e credenciais configurados.

## Falhas e retries

O registro do evento preserva status por plataforma. Falhas externas não devem impedir a navegação do usuário. Retentativas precisam ser limitadas e observáveis para evitar loops ou custos indevidos.

## Privacidade

- não registrar conteúdo médico ou relato sensível em eventos;
- não incluir service role ou tokens no frontend;
- não enviar dados pessoais sem base e consentimento aplicáveis;
- evitar armazenar IP bruto ou identificadores desnecessários;
- revisar textos de consentimento quando integrações mudarem.

## Migração

Em outro Supabase:

1. migrar `cq_tracking_configs`;
2. não copiar cegamente `encrypted_payload` se a chave mudar;
3. recadastrar ou recriptografar secrets no destino;
4. implantar Edge Functions;
5. validar eventos de teste;
6. somente então habilitar envio real.

Eventos históricos podem ser arquivados em vez de migrados, conforme necessidade operacional e política de retenção.