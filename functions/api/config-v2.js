function json(x,s=200){return new Response(JSON.stringify(x,null,2),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
async function fallback(request){try{let r=await fetch(new URL('/config/site.v2.json',request.url));if(r.ok)return await r.json()}catch{}return {version:2,site:{name:'Catarina Queiroz'},theme:{colors:{},layout:{}},sections:{}}
}
function admin(request){return (request.headers.get('cookie')||'').includes('cq_session=ok')}
export async function onRequestGet({request,env}){let config=await fallback(request);if(env.SITE_CONFIG){let saved=await env.SITE_CONFIG.get('site-config-v2','json');if(saved)config=saved}return json({config})}
export async function onRequestPut({request,env}){if(!admin(request))return json({error:'Não autorizado'},401);if(!env.SITE_CONFIG)return json({error:'Configure SITE_CONFIG no Cloudflare'},500);let body=await request.json();let config=body.config||body;config.version=2;await env.SITE_CONFIG.put('site-config-v2',JSON.stringify(config));return json({ok:true,config})}
export const onRequestPost=onRequestPut;
