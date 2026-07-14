# Rastreamento

## Fluxo único

Todos os componentes chamam `AnalyticsService.track()`. Nenhum componente pode chamar Meta ou Google diretamente.

```text
interação
  -> AnalyticsService
     -> navegador: Meta Pixel / Google tag
     -> servidor: Supabase Edge Function track-event
        -> Meta Conversions API
        -> GA4 Measurement Protocol
        -> Google Data Manager, quando configurado
```

O mesmo `eventId` é usado no navegador e no servidor para permitir deduplicação.

## Eventos permitidos

- `page_view`
- `view_procedure`
- `view_result`
- `click_whatsapp`
- `click_phone`
- `click_instagram`
- `click_map`
- `start_contact`
- `submit_lead`
- `schedule_requested`
- `appointment_confirmed`

## Privacidade

Eventos de análise ou marketing não são enviados sem a respectiva autorização. E-mail e telefone, quando presentes em eventos de lead, são normalizados e protegidos com SHA-256 antes do envio aos provedores.

## Segredos

Tokens não são armazenados no frontend. O painel envia as credenciais à função `tracking-secrets`, que exige usuário proprietário e grava somente o conteúdo criptografado.
