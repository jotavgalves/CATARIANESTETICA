function session(request,env){let c=request.headers.get('cookie')||'';let expected=encodeURIComponent(env.ADMIN_SESSION_SECRET||env.ADMIN_PASSWORD||'');return !!expected&&c.includes('cq_session='+expected)}
export function onRequestGet({request,env}){return new Response(JSON.stringify({authenticated:session(request,env)}),{headers:{'content-type':'application/json','cache-control':'no-store'}})}
