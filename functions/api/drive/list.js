function json(x,s=200){return new Response(JSON.stringify(x,null,2),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})}
function ok(request){return (request.headers.get('cookie')||'').includes('cq_session=ok')}
export async function onRequestGet({request}){if(!ok(request))return json({error:'Não autorizado'},401);return json({configured:false,files:[],message:'Estrutura pronta. Configure GOOGLE_DRIVE_API_KEY e GOOGLE_DRIVE_FOLDER_ID para ativar a leitura da pasta do Drive.'})}
