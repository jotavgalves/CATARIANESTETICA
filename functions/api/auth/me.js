function hasCookie(request){return (request.headers.get('cookie')||'').includes('cq_session=ok')}
export function onRequestGet({request}){return new Response(JSON.stringify({authenticated:hasCookie(request)}),{headers:{'content-type':'application/json','cache-control':'no-store'}})}
