/* TÚAquiler 2.8.2 — retroceso y validación obligatoria de formularios. */
(()=>{'use strict';
const KEY='tuaquiler.mvp.v1'; // Mantener esta clave para conservar datos existentes.
const FREE_TENANT_LIMIT=3;
// En esta compilación el cobro NO está integrado. No se permiten activaciones premium locales,
// para evitar que un botón de prueba conceda acceso de pago sin verificar Google Play.
const PREMIUM_BILLING_ENABLED=false;
function premiumVerified(){return false;} // TODO: sustituir exclusivamente por un derecho verificado en servidor.
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const periodNow=()=>{let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`id${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const fmtDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'}):'—';
const fmtPeriod=p=>{let [y,m]=p.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('es-EC',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())};
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=escapeHtml;
const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const $=sel=>document.querySelector(sel);
const icons={home:'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-8h6v8"/>',building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-4h4v4"/>',wallet:'<rect x="3" y="6" width="18" height="15" rx="3"/><path d="M3 10h18m-4 5h1M7 6V4h11"/>',receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6m-6 4h6"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12 5 5L20 7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',phone:'<path d="M4 3h5l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v5a2 2 0 0 1-2 2C9 22 2 15 2 5a2 2 0 0 1 2-2z"/>',edit:'<path d="m4 17 1-5 11-11 5 5-11 11zM3 21h18"/>',trash:'<path d="M4 7h16m-10 4v7m4-7v7M6 7l1 14h10l1-14M9 7V4h6v3"/>',export:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',upload:'<path d="M12 21V9m-5 5 5-5 5 5M5 7V3h14v4"/>',shield:'<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',spark:'<path d="m12 2 2 7 7 3-7 2-2 8-2-8-7-2 7-3z"/>',chat:'<path d="M21 11a8 8 0 0 1-8 8 9 9 0 0 1-4-.9L3 21l1.9-5A8 8 0 1 1 21 11z"/>',alert:'<circle cx="12" cy="12" r="10"/><path d="M12 7v6m0 4h.01"/>',lock:'<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',file:'<path d="M6 2h9l5 5v15H6zM15 2v5h5M9 13h8m-8 4h8"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>'};
const icon=(name,size=19)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.home}</svg>`;
const emptyDB=()=>({version:4,createdAt:new Date().toISOString(),properties:[],tenants:[],occupants:[],contracts:[],payments:[],expenses:[],receipts:[],profile:{},demo:false});
let db;try{db=JSON.parse(localStorage.getItem(KEY))||emptyDB();if(!Array.isArray(db.properties)||!Array.isArray(db.payments)||!Array.isArray(db.expenses))throw Error('bad')}catch(e){db=emptyDB()}
const state={screen:'home',period:periodNow(),movement:'payments',showArchived:false,planCycle:'year'};
const team={workspaceId:'',role:'',members:[],invites:[],error:'',lastInvite:null};

let storageKey=KEY;
let authState={configured:false,signedIn:false,emailVerified:false,uid:'',email:'',localAccess:sessionStorage.getItem('tua.local')==='1'};
try{if(window.TUAAndroid?.getAuthState){const a=JSON.parse(TUAAndroid.getAuthState());authState={...authState,...a,localAccess:(!a.configured&&sessionStorage.getItem('tua.local')==='1')};if(a.uid){storageKey=KEY+'.'+a.uid;db=JSON.parse(localStorage.getItem(storageKey))||emptyDB()}}}catch(e){console.warn('Auth sin configurar')}
function migrateDB(){
  if(!Array.isArray(db.tenants))db.tenants=[];
  if(!Array.isArray(db.contracts))db.contracts=[];
  if(!Array.isArray(db.occupants))db.occupants=[];
  if(!Array.isArray(db.receipts))db.receipts=[];
  if(!db.profile||typeof db.profile!=='object')db.profile={};
  if(!db.version||db.version<2){
    for(const p of db.properties){
      if(!p.unitNumber)p.unitNumber=(p.label.match(/(?:departamento|depto\.?|habitación|dpto\.?)\s*([A-Za-z0-9-]+)/i)||[])[1]||'';
      if(p.tenantName&&!db.tenants.some(t=>t.propertyId===p.id&&t.active)){
        db.tenants.push({id:id(),propertyId:p.id,name:p.tenantName,unitNumber:p.unitNumber,
          phone:p.tenantPhone||'',idNumber:'',email:'',startDate:p.contractStart||'',
          endDate:p.contractEnd||'',deposit:0,active:true,migrated:true});
      }
    }
    for(const pay of db.payments){
      if(!pay.tenantSnapshot){
        const p=propertyById(pay.propertyId),t=db.tenants.find(t=>t.propertyId===pay.propertyId);
        pay.tenantId=t?.id||null;pay.tenantSnapshot=t?.name||p?.tenantName||'No identificado (migración)';
        pay.unitSnapshot=t?.unitNumber||p?.unitNumber||'';pay.propertySnapshot=p?.label||'';
      }
    }
    db.version=2;
  }
  // Migrar los cánones originales del inmueble al historial particular del inquilino.
  // Los datos previos se conservan: no se eliminan ni recalculan pagos.
  if(db.version<3){
    for(const p of db.properties){
      p.rent=validRent(p.rent)?round(p.rent):null;
      p.dueDay=validDay(p.dueDay)?Number(p.dueDay):null;
    }
    for(const t of db.tenants){
      const p=propertyById(t.propertyId);
      if(t.rent===undefined)t.rent=p?.rent??null;
      if(t.dueDay===undefined)t.dueDay=p?.dueDay??null;
      if(!Array.isArray(t.termsHistory)){
        t.termsHistory=[{from:(t.startDate||'').slice(0,7)||p?.startPeriod||'1900-01',rent:t.rent??null,dueDay:t.dueDay??null}];
      }
    }
    db.version=3;
  }
  for(const p of db.properties){
    if(p.rent===undefined||p.rent==='')p.rent=null;
    if(p.dueDay===undefined||p.dueDay==='')p.dueDay=null;
  }
  for(const t of db.tenants){
    if(t.rent===undefined)t.rent=null;
    if(t.dueDay===undefined)t.dueDay=null;
    if(!Array.isArray(t.termsHistory))t.termsHistory=[];
  }
  db.version=4;
}
const validRent=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n))&&Number(n)>0&&Number(n)<=99999999;
const validDay=n=>n!==null&&n!==undefined&&n!==''&&Number.isInteger(Number(n))&&Number(n)>=1&&Number(n)<=31;
const optionalRent=n=>n===null||n===undefined||String(n).trim()===''?null:(validRent(n)?round(n):NaN);
const optionalDay=n=>n===null||n===undefined||String(n).trim()===''?null:(validDay(n)?Number(n):NaN);
function termsAt(p,t,period=state.period){
  if(!t)return {rent:null,dueDay:null};
  const all=Array.isArray(t.termsHistory)?t.termsHistory.filter(x=>x&&/^\d{4}-\d{2}$/.test(x.from)).slice().sort((a,b)=>a.from.localeCompare(b.from)):[];
  const matching=all.filter(x=>x.from<=period);
  const found=matching.length?matching[matching.length-1]:(all.length?all[0]:t);
  const rent=validRent(found?.rent)?round(found.rent):null;
  const dueDay=validDay(found?.dueDay)?Number(found.dueDay):null;
  return {rent,dueDay};
}
function setTenantTerms(t,from,rent,dueDay){
  if(!Array.isArray(t.termsHistory))t.termsHistory=[];
  t.termsHistory=t.termsHistory.filter(x=>x.from!==from);
  t.termsHistory.push({from,rent,dueDay});
  t.termsHistory.sort((a,b)=>a.from.localeCompare(b.from));
  t.rent=rent;t.dueDay=dueDay;
}
function tenantAt(p,period=state.period){
  if(!p)return null;
  const lastDay=period+'-31';
  return db.tenants.filter(t=>t.propertyId===p.id&&(!t.startDate||t.startDate<=lastDay)&&
    (!t.endDate||t.endDate>=period+'-01')&&(t.active!==false||!!t.endDate))
    .sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||''))||
      (Number(b.active===true)-Number(a.active===true)))[0]||null;
}
function paymentForTenant(p,t,period=state.period){
  if(!p||!t)return 0;
  return round(db.payments.filter(x=>x.propertyId===p.id&&x.period===period&&x.tenantId===t.id).reduce((v,x)=>v+x.amount,0));
}
function balanceOf(p,period=state.period){
  const t=tenantAt(p,period),terms=termsAt(p,t,period),paid=paymentForTenant(p,t,period);
  return {tenant:t,...terms,paid,pending:terms.rent===null?null:Math.max(0,round(terms.rent-paid))};
}
function dueDateForPeriod(period,day){
  if(!validDay(day))return null;
  const [year,month]=period.split('-').map(Number);
  const lastDay=new Date(year,month,0).getDate();
  return `${period}-${String(Math.min(day,lastDay)).padStart(2,'0')}`;
}
function isCurrentlyActiveTenant(t){return t.active!==false&&(!t.endDate||t.endDate>=today());}
function activeTenantCount(){return db.tenants.filter(isCurrentlyActiveTenant).length;}
function remainingFree(){return Math.max(0,FREE_TENANT_LIMIT-activeTenantCount());}
// El cupo aplica a inquilinos actuales; registros históricos y propiedades vacías no cuentan.
// Al sustituir un inquilino en una misma unidad, el ocupante anterior se archiva.
function activeCountAfterSave({tenantId,propertyId,active}){
  const others=db.tenants.filter(x=>isCurrentlyActiveTenant(x)&&x.id!==tenantId&&!(active&&x.propertyId===propertyId));
  return others.length+(active?1:0);
}
function planBadge(){let n=activeTenantCount();return `<span class="archive-tag" style="background:#fff0e5;color:#ad653c">Gratis · ${n}/${FREE_TENANT_LIMIT} inquilinos</span>`;}
function dayLabel(day){return day===null||day===undefined?'Por definir':String(day)+' de cada mes';}

function isTeam(){return !!(team.workspaceId&&team.role)}
function isManager(){return !isTeam()||team.role==='owner'||team.role==='admin'}
function canCollect(){return isManager()||team.role==='collector'}
function isOwner(){return !!(isTeam()&&team.role==='owner')}
function roleTitle(r){return ({owner:'Propietario',admin:'Administrador',collector:'Cobrador',reader:'Lector'})[r]||'No asignado'}
function teamActiveAccount(){return !!(authState.configured&&authState.signedIn&&window.TUATeam)}
function currentWorkspaceStorage(){return 'tuaquiler.workspace.'+authState.uid}
function saveLocalCache(){
 // Los datos compartidos no se conservan en almacenamiento WebView sin cifrar.
 // Firebase vuelve a obtenerlos mientras la sesión tenga permiso y conectividad.
 if(isTeam()||team.workspaceId)return true;
 try{localStorage.setItem(storageKey,JSON.stringify(db));return true}catch(e){toast('No se pudo guardar en el dispositivo');return false}
}
function switchLocal(){
 const previous=team.workspaceId;
 try{if(previous)localStorage.removeItem(KEY+'.team.'+previous);localStorage.removeItem(currentWorkspaceStorage())}catch(e){}
 team.workspaceId='';team.role='';team.members=[];team.invites=[];team.lastInvite=null;
 storageKey=authState.uid?KEY+'.'+authState.uid:KEY;loadCurrentDB();state.screen='collaborators';render()
}
function teamEvent(value){
  try{const x=typeof value==='string'?JSON.parse(value):value;
    if(x.type==='error'){team.error=x.message||'No se pudo sincronizar';toast(team.error);return}
    if(x.type==='notice'){toast(x.message||'Operación realizada');return}
    if(x.type==='revoked'){const key=storageKey;try{if(team.workspaceId)localStorage.removeItem(key)}catch(e){}switchLocal();toast(x.message||'Acceso revocado');return}
    if(x.type==='left'){switchLocal();return}
    if(x.type==='joined'){
      team.workspaceId=x.workspaceId;
      storageKey=KEY+'.team.'+x.workspaceId;
      team.error='';
      // Se conserva la caché temporal únicamente para mostrar el panel mientras llega Firebase.
      // No se copia automáticamente el contenido personal a la administración compartida.
      db=emptyDB();render();return;
    }
    if(x.type==='role'){const old=team.role;team.role=x.role;if(old&&old!==x.role&&!isManager()){db=emptyDB();try{localStorage.removeItem(KEY+'.team.'+team.workspaceId)}catch(e){}}try{localStorage.setItem(currentWorkspaceStorage(),team.workspaceId)}catch(e){}render();return}
    if(x.type==='members'){team.members=JSON.parse(x.json||'[]');render();return}
    if(x.type==='invites'){team.invites=JSON.parse(x.json||'[]');render();return}
    if(x.type==='invited'){team.lastInvite={code:x.code,email:x.email,role:x.role};render();toast('Invitación preparada para compartir');return}
    if(x.type==='data'&&team.workspaceId){
      let incoming=JSON.parse(x.json||'{}');
      db={...emptyDB(),...incoming,payments:db.payments||[]};migrateDB();saveLocalCache();render();return;
    }
    if(x.type==='payments'&&team.workspaceId){
      db.payments=JSON.parse(x.json||'[]');saveLocalCache();render();return;
    }
  }catch(err){toast('Error al leer la respuesta de colaboración')}
}
function inviteModal(){
 if(!isOwner())return toast('Solo el propietario puede invitar');
 const body=`<form id="invite-form">${field('email','Correo del colaborador *','','email','required maxlength="180" autocomplete="email"')}<div class="field"><label for="f-role">Permisos *</label><select name="role" id="f-role"><option value="collector">Cobrador — consultar y registrar pagos</option><option value="admin">Administrador — gestionar inmuebles, inquilinos y gastos</option><option value="reader">Lector — solo consultar</option></select></div><div class="notice">La invitación genera un código único para compartir personalmente. La otra persona debe ingresar con ese mismo correo verificado. Nunca compartas contraseñas.</div><div class="form-actions"><button class="btn light" data-action="close-modal" type="button">Cancelar</button><button class="btn primary" type="submit">Crear invitación</button></div></form>`;
 modal('Invitar colaborador',body,()=>$('#invite-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const mail=String(f.get('email')).trim().toLowerCase();const role=String(f.get('role'));if(mail.toLowerCase()===String(authState.email).toLowerCase())return toast('Ya eres el propietario');if(!teamActiveAccount())return toast('Configura Firebase para invitar');window.TUATeam.invite(mail,role);closeModal()}));
}
function acceptInviteModal(){
 if(!teamActiveAccount())return toast('Para aceptar invitaciones configura Firebase y entra con tu cuenta');
 modal('Unirme como colaborador',`<form id="accept-form">${field('code','Código privado de invitación *','','text','required minlength="36" maxlength="36" autocapitalize="none" autocomplete="off"')}<p class="hint">Este código debe enviártelo el propietario. Por seguridad, solo funciona con el correo al que fue emitido y verificado en Firebase.</p><div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Aceptar invitación</button></div></form>`,()=>$('#accept-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);window.TUATeam.accept(String(f.get('code')).trim().toLowerCase());closeModal();toast('Validando invitación con Firebase…')}));
}
function collaborators(){
 const configured=teamActiveAccount();const isWorkspace=isTeam();
 const first=`<div class="screen-head"><div class="eyebrow">ADMINISTRACIÓN COMPARTIDA</div><h1 class="heading">Colaboradores</h1><p class="sub">Cada persona utiliza su propia cuenta y recibe permisos según su responsabilidad.</p></div>`;
 const roles=`<div class="setting-card"><h3>Permisos por función</h3><div class="team-role"><b>Propietario</b><p>Invita y revoca accesos. Controla toda la administración.</p></div><div class="team-role"><b>Administrador</b><p>Gestiona inmuebles, inquilinos, contratos, gastos y pagos.</p></div><div class="team-role"><b>Cobrador</b><p>Consulta alquileres y registra pagos. No modifica contratos ni gastos.</p></div><div class="team-role"><b>Lector</b><p>Consulta información y pagos, sin cambios.</p></div></div>`;
 if(!configured)return first+`<div class="setting-card"><h3>Colaboración todavía sin activar</h3><p>Estás utilizando datos locales. Para que otra persona entre desde su teléfono hacen falta Firebase Authentication, Cloud Firestore y reglas de acceso publicadas. Aquí no se crean colaboradores falsos.</p><div class="tip">Puedes seguir utilizando la aplicación y los 3 inquilinos activos gratuitos sin equipo.</div></div>`+roles+`<button class="btn outline full" data-action="back-settings">Volver a Ajustes</button>`;
 if(!authState.emailVerified)return first+`<div class="setting-card"><h3>Verifica tu correo antes de invitar</h3><p>Por seguridad, solo las cuentas con correo verificado pueden crear un equipo o aceptar invitaciones. Revisa el enlace de verificación de Firebase en tu correo.</p><button class="btn primary full" data-action="refresh-email-verification">Ya verifiqué mi correo</button><button class="btn outline full" data-action="resend-email-verification">Reenviar verificación</button></div>`+roles;
 if(!isWorkspace)return first+`<div class="setting-card"><h3>Crear mi administración compartida</h3><p>Solo para el propietario. Se copiarán tus registros de este dispositivo al nuevo espacio de Firebase una única vez. Guarda antes un respaldo JSON.</p><button class="btn primary full" data-action="create-team">Activar equipo con mis datos</button></div><div class="setting-card"><h3>¿Te invitó otra persona?</h3><p>Inicia sesión con el correo al que te invitó el propietario y escribe tu código de acceso.</p><button class="btn outline full" data-action="accept-team">Introducir código de invitación</button></div>`+roles+`<button class="btn outline full" data-action="back-settings">Volver a Ajustes</button>`;
 const memberRows=isOwner()?team.members.filter(m=>m.uid!==authState.uid).map(m=>`<div class="team-person"><div class="team-avatar">${icon('user',19)}</div><div style="flex:1;min-width:0"><b>${escapeHtml(m.email||'Sin correo')}</b><p>${escapeHtml(roleTitle(m.role))} · ${escapeHtml(m.status||'activo')}</p></div><button class="btn danger small-btn" data-action="remove-collaborator" data-id="${attr(m.uid)}">Revocar</button></div>`).join(''):'';
 const inviteRows=isOwner()?team.invites.filter(i=>i.status==='pending').map(i=>`<div class="team-person"><div class="team-avatar">${icon('chat',19)}</div><div style="flex:1;min-width:0"><b>${escapeHtml(i.email)}</b><p>${escapeHtml(roleTitle(i.role))} · Pendiente</p></div><button class="btn outline small-btn" data-action="share-invite" data-id="${attr(i.code)}">Compartir</button><button class="btn danger small-btn" data-action="cancel-invite" data-id="${attr(i.code)}">×</button></div>`).join(''):'';
 return first+`<div class="setting-card"><div class="team-head"><div><h3>Mi equipo</h3><p>Tu función: <b>${escapeHtml(roleTitle(team.role))}</b></p></div><span class="archive-tag">Conectado</span></div>${isOwner()?`<button class="btn primary full" data-action="invite-team">${icon('plus',16)} Invitar colaborador</button>`:`<p>Solo el propietario puede gestionar invitaciones y revocar accesos.</p>`}${team.lastInvite&&isOwner()?`<div class="tip"><b>Invitación creada para ${escapeHtml(team.lastInvite.email)}</b><p>Compártela únicamente con esa persona; deberá verificar su correo.</p><button class="btn outline small-btn" data-action="share-invite" data-id="${attr(team.lastInvite.code)}">Compartir código</button></div>`:''}</div>${isOwner()?`<div class="setting-card"><h3>Personas con acceso (${team.members.length})</h3>${memberRows||'<p>No hay colaboradores todavía.</p>'}</div><div class="setting-card"><h3>Invitaciones pendientes</h3>${inviteRows||'<p>No hay invitaciones pendientes.</p>'}</div>`:''}<div class="setting-card"><h3>Separación de información</h3><p>Los cobradores y lectores reciben datos de inmuebles, inquilinos y cobros. Los contratos, cédulas, datos privados del arrendador y gastos se reservan para propietario y administrador. Los pagos se registran con el correo de quien los ingresó.</p><button class="btn light small-btn" data-action="exit-team">Salir a mis datos personales</button></div>`+roles;
}

function loadCurrentDB(){try{db=JSON.parse(localStorage.getItem(storageKey))||emptyDB()}catch(e){db=emptyDB()}migrateDB()}
migrateDB();
function authUpdate(payload){try{const a=typeof payload==='string'?JSON.parse(payload):payload;if(a.error){toast(a.error);return}if(!a.signedIn&&isTeam()){window.TUATeam?.leaveWorkspace();switchLocal()}const oldKey=storageKey;authState={...authState,...a,localAccess:false};sessionStorage.removeItem('tua.local');storageKey=a.uid?KEY+'.'+a.uid:KEY;if(storageKey!==oldKey)loadCurrentDB();render();if(a.signedIn&&window.TUATeam){let wid=localStorage.getItem(currentWorkspaceStorage());if(wid)window.TUATeam.enterWorkspace(wid)}toast(a.signedIn?'Sesión iniciada':'Sesión cerrada')}catch(e){toast('No se pudo completar el acceso')}}
function logout(){if(window.TUAAndroid?.logOut&&authState.configured)TUAAndroid.logOut();else{authState.localAccess=false;sessionStorage.removeItem('tua.local');render()}}
function nativeGoogle(){if(!authState.configured||!window.TUAAndroid?.googleAuth)return toast('Google requiere configurar Firebase');TUAAndroid.googleAuth();toast('Selecciona una cuenta de Google')}
function renderAuth(){const target=$('#auth');target.innerHTML=`<div class="auth-wrap"><div class="auth-mark">${icon('home',32)}</div><div class="auth-logo">TÚ<span>Aquiler</span></div><h1>Tu alquiler,<br>todo bajo control.</h1><p class="auth-sub">Gestiona inquilinos, cobros, gastos y contratos desde un solo lugar.</p>${authState.configured?`<button class="btn google full" data-action="google-login"><span class="g">G</span> Continuar con Google</button><div class="or">o accede con tu correo</div><form id="login-form"><input type="email" name="email" autocomplete="email" placeholder="Correo electrónico" required><input type="password" name="password" autocomplete="current-password" placeholder="Contraseña · mínimo 6 caracteres" required minlength="6"><div class="form-actions"><button class="btn primary" type="submit" name="mode" value="login">Ingresar</button><button class="btn outline" type="submit" name="mode" value="register">Crear cuenta</button></div></form><p class="auth-notice">Autenticación por Firebase. Para compartir registros con colaboradores, activa una administración compartida en Ajustes.</p>`:`<div class="setting-card"><b>Inicio de sesión preparado</b><p>Para activar Google y el registro por correo debes configurar Firebase en el proyecto Android. En esta demostración puedes explorar el modo local, sin crear cuentas falsas.</p><button class="btn primary full" data-action="continue-local">Entrar en modo local de prueba</button></div><p class="auth-notice">No uses el modo de prueba para documentos sensibles sin protección y respaldos adecuados.</p>`}</div>`}
function hasAvailableUnit(){return db.properties.some(p=>!p.archivedAt)}
function freeUnits(exceptTenantId=''){return db.properties.filter(p=>!p.archivedAt&&!db.tenants.some(t=>t.id!==exceptTenantId&&t.propertyId===p.id&&isCurrentlyActiveTenant(t)))}
function identityTypeOptions(selected){return `<div class="field"><label for="f-idType">Tipo de documento del arrendatario</label><select id="f-idType" name="idType"><option value="cedula" ${selected==='cedula'?'selected':''}>Cédula ecuatoriana</option><option value="pasaporte" ${selected==='pasaporte'?'selected':''}>Pasaporte</option><option value="ruc" ${selected==='ruc'?'selected':''}>RUC / persona jurídica</option><option value="otro" ${selected==='otro'?'selected':''}>Otro documento</option></select></div>`}
function tenantModal(tid,pid){
  // El usuario NO puede iniciar la creación de arrendatarios si no ha creado una unidad.
  if(!hasAvailableUnit()){
    toast('Primero registra un inmueble o departamento; después podrás añadir inquilinos.');
    return nav('properties');
  }
  const t=db.tenants.find(x=>x.id===tid);
  const available=freeUnits(t?.id||'');
  if(!t&&!available.length){toast('No hay departamentos libres. Crea otra unidad antes de registrar un inquilino.');return nav('units')}
  const p=(t?propertyById(t.propertyId):available.find(x=>x.id===pid))||available[0];
  if(!p)return toast('Registra primero una unidad disponible');
  const term=termsAt(p,t,state.period);
  const options=available.filter(x=>!x.archivedAt||x.id===p.id).map(x=>`<option value="${attr(x.id)}" ${p.id===x.id?'selected':''}>${escapeHtml(x.label)} · Unidad ${escapeHtml(x.unitNumber||'principal')}</option>`).join('');
  const body=`<form id="tenant-form">
    <div class="setup-stage"><b>Ficha del arrendatario</b><p>La propiedad se registra primero. Los datos de contrato se completarán después, en otra pantalla.</p></div>
    <div class="field"><label for="f-propertyId">Inmueble / unidad asignada *</label><select id="f-propertyId" name="propertyId" required>${options}</select></div>
    <div class="form-subheading">Identificación del arrendatario</div>
    ${field('name','Nombres y apellidos completos / razón social *',t?.name||'','text','required maxlength="150" autocomplete="name"')}
    <div class="form-row">${identityTypeOptions(t?.idType||'cedula')}${field('idNumber','Número de documento *',t?.idNumber||'','text','required maxlength="30" autocomplete="off"')}</div>
    <p class="hint">El número de documento es obligatorio para identificar al arrendatario y preparar su contrato.</p>
    <div class="form-row">${field('nationality','Nacionalidad (opcional)',t?.nationality||'','text','maxlength="70"')}${field('civilStatus','Estado civil (opcional)',t?.civilStatus||'','text','maxlength="65"')}</div>
    ${field('occupation','Profesión u ocupación (opcional)',t?.occupation||'','text','maxlength="110"')}
    ${field('residenceAddress','Domicilio para notificaciones (opcional)',t?.residenceAddress||'','text','maxlength="240"')}
    <div class="form-row">${field('phone','Teléfono / WhatsApp *',t?.phone||'','tel','required maxlength="30" autocomplete="tel"')}${field('email','Correo electrónico',t?.email||'','email','maxlength="140" autocomplete="email"')}</div>
    <div class="form-subheading">Asignación y alquiler</div>
    ${field('unitNumber','Número de departamento o unidad asignada',t?.unitNumber??p.unitNumber??'','text','readonly aria-readonly="true"')}
    <div class="form-row">${field('startDate','Fecha de ingreso *',t?.startDate||today(),'date','required')}${field('endDate','Fecha de salida acordada',t?.endDate||'','date')}</div>
    <div class="plan-mini">${planBadge()} <span>El plan gratuito permite hasta tres inquilinos activos; los ocupantes no generan otro cupo.</span></div>
    <div class="notice">${icon('receipt',18)} <div><b>Condiciones particulares</b><br>El canon y el día de cobro son propios de este arrendamiento. Ambos son obligatorios al registrar un arrendamiento; solo los valores de referencia de la unidad son opcionales.</div></div>
    <div class="form-row">${field('rent','Canon mensual (USD) *',t?term.rent??'':p.rent??'','number','min="0.01" max="99999999" step="0.01" placeholder="Ej. 200.00"')}${field('dueDay','Día de cobro (1 a 31) *',t?term.dueDay??'':p.dueDay??'','number','min="1" max="31" step="1" placeholder="Ej. 5"')}</div>
    ${t?field('termsFrom','Aplicar cambios desde este mes',state.period,'month','required'):''}
    ${field('deposit','Garantía entregada (USD, opcional)',t?.deposit??0,'number','min="0" max="99999999" step="0.01"')}
    <div class="field"><label for="f-active">Estado</label><select id="f-active" name="active"><option value="true" ${t?.active!==false?'selected':''}>Ocupando inmueble</option><option value="false" ${t?.active===false?'selected':''}>Inquilino anterior</option></select></div>
    <div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">${t?'Guardar cambios':'Registrar arrendatario'}</button></div>
  </form>`;
  modal(t?'Editar datos del arrendatario':'Registrar inquilino / arrendatario',body,()=>{
    const form=$('#tenant-form');
    form.querySelector('[name="propertyId"]').addEventListener('change',e=>{
      if(t)return;
      const chosen=propertyById(e.target.value);if(!chosen)return;
      form.querySelector('[name="unitNumber"]').value=chosen.unitNumber||'';
      form.querySelector('[name="rent"]').value=chosen.rent??'';
      form.querySelector('[name="dueDay"]').value=chosen.dueDay??'';
    });
    form.addEventListener('submit',e=>{
      e.preventDefault();const f=new FormData(e.target),propertyId=String(f.get('propertyId')),
        property=propertyById(propertyId),active=f.get('active')==='true',name=String(f.get('name')||'').trim(),
        unitNumber=String(f.get('unitNumber')||'').trim(),startDate=String(f.get('startDate')||''),endDate=String(f.get('endDate')||''),
        rent=optionalRent(f.get('rent')),dueDay=optionalDay(f.get('dueDay'));
      if(!property||(!t&&property.archivedAt)||!name)return toast('Selecciona un inmueble disponible y completa el nombre');
      if(Number.isNaN(rent)||Number.isNaN(dueDay))return toast('Revisa el canon o día de cobro (1 a 31)');
      if(startDate&&endDate&&endDate<startDate)return toast('La salida no puede ser anterior al ingreso');
      const projected=activeCountAfterSave({tenantId:t?.id,propertyId,active});
      const existing=activeTenantCount();
      if(!premiumVerified()&&projected>FREE_TENANT_LIMIT&&projected>existing)return toast('El plan gratis admite hasta 3 inquilinos activos. Consulta Pro en Ajustes.');
      if(t&&propertyId!==t.propertyId){
        if(db.payments.some(x=>x.tenantId===t.id)||db.contracts.some(x=>x.tenantId===t.id))return toast('Para cambiar la unidad, cierra la ocupación y registra otra para conservar su historial.');
      }
      if(active&&db.tenants.some(x=>x.propertyId===propertyId&&x.id!==t?.id&&isCurrentlyActiveTenant(x))){
        return toast('Este departamento ya está ocupado. Finaliza antes el arrendamiento anterior o escoge una unidad libre.');
      }
      const item={id:t?.id||id(),propertyId,name,idType:String(f.get('idType')||'cedula'),
        idNumber:String(f.get('idNumber')||'').trim(),nationality:String(f.get('nationality')||'').trim(),
        civilStatus:String(f.get('civilStatus')||'').trim(),occupation:String(f.get('occupation')||'').trim(),
        residenceAddress:String(f.get('residenceAddress')||'').trim(),
        unitNumber:property.unitNumber||unitNumber||'',phone:String(f.get('phone')||'').trim(),
        email:String(f.get('email')||'').trim(),startDate,endDate,deposit:round(f.get('deposit')),
        active,example:t?.example||false};
      if(!active&&!item.endDate)item.endDate=today();
      if(!Number.isFinite(item.deposit)||item.deposit<0)return toast('Revisa la garantía');
      if(t){Object.assign(t,item);const current=termsAt(property,t,String(f.get('termsFrom')||state.period));
        if(current.rent!==rent||current.dueDay!==dueDay)setTenantTerms(t,String(f.get('termsFrom')),rent,dueDay);
      }else{item.rent=rent;item.dueDay=dueDay;item.termsHistory=[{from:startDate.slice(0,7)||state.period,rent,dueDay}];db.tenants.push(item)}
      if(!save())return;
      closeModal();nav('tenants');if(!t)postTenantSaved(item.id);toast(t?'Arrendatario actualizado':'Inquilino registrado');
    });
  });
}
function profileModal(){const pr=db.profile||{};let body=`<form id="owner-form">${field('name','Nombre completo / razón social *',pr.name||'','text','required maxlength="130"')}${field('id','Cédula / RUC *',pr.id||'','text','required maxlength="25"')}${field('address','Domicilio del arrendador',pr.address||'','text','maxlength="200"')}${field('city','Ciudad *',pr.city||'Guayaquil','text','required maxlength="80"')}${field('phone','Teléfono',pr.phone||'','tel','maxlength="25"')}${field('email','Correo electrónico',pr.email||'','email','maxlength="140"')}<div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>`;modal('Datos del arrendador',body,()=>$('#owner-form').addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.target);db.profile=Object.fromEntries(f);save();closeModal();toast('Datos guardados')}))}
function datePlusMonthsMinusDay(iso,months){if(!iso)return '';const d=new Date(iso+'T12:00:00'),day=d.getDate(),target=new Date(d.getFullYear(),d.getMonth()+months,1,12);const max=new Date(target.getFullYear(),target.getMonth()+1,0).getDate();target.setDate(Math.min(day,max));target.setDate(target.getDate()-1);return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`}
function contractModal(tenantId){let t=db.tenants.find(x=>x.id===tenantId);if(!t)return toast('Selecciona primero un inquilino');let p=propertyById(t.propertyId);if(!p)return toast('No existe inmueble asociado');let c=db.contracts.find(x=>x.tenantId===tenantId)||{},pr=db.profile||{},terms=termsAt(p,t,(c.start||t.startDate||state.period).slice(0,7));let start=c.start||t.startDate||today(),end=c.end||t.endDate||datePlusMonthsMinusDay(start,24);const body=`<form id="contract-form"><div class="notice">Borrador editable, no se firma ni registra legalmente desde la app. Comprueba duración, canon legal y requisitos municipales/notariales antes de usarlo.</div><div class="field"><label>Modelo *</label><select name="type"><option value="vivienda" ${c.type==='vivienda'?'selected':''}>Vivienda urbana</option><option value="habitacion" ${c.type==='habitacion'?'selected':''}>Habitación (uso residencial)</option><option value="local" ${c.type==='local'?'selected':''}>Local comercial</option></select></div>${field('ownerName','Nombre del arrendador *',c.ownerName||pr.name||'','text','required maxlength="130"')}${field('ownerId','Cédula / RUC arrendador *',c.ownerId||pr.id||'','text','required maxlength="25"')}<div class="form-subheading">Datos del arrendatario (tomados de su ficha)</div>${field('tenantName','Nombre completo / razón social del arrendatario *',c.tenantName||t.name,'text','required maxlength="150"')}<div class="field"><label for="f-tenantIdType">Tipo de documento</label><select id="f-tenantIdType" name="tenantIdType"><option value="cedula" ${(c.tenantIdType||t.idType||'cedula')==='cedula'?'selected':''}>Cédula ecuatoriana</option><option value="pasaporte" ${(c.tenantIdType||t.idType)==='pasaporte'?'selected':''}>Pasaporte</option><option value="ruc" ${(c.tenantIdType||t.idType)==='ruc'?'selected':''}>RUC</option><option value="otro" ${(c.tenantIdType||t.idType)==='otro'?'selected':''}>Otro</option></select></div>${field('tenantIdNumber','Número de documento del arrendatario *',c.tenantIdNumber||t.idNumber||'','text','required maxlength="30"')}${field('tenantNationality','Nacionalidad (opcional)',c.tenantNationality||t.nationality||'','text','maxlength="70"')}${field('tenantCivilStatus','Estado civil (opcional)',c.tenantCivilStatus||t.civilStatus||'','text','maxlength="65"')}${field('tenantOccupation','Ocupación (opcional)',c.tenantOccupation||t.occupation||'','text','maxlength="110"')}${field('tenantResidenceAddress','Domicilio para notificaciones (opcional)',c.tenantResidenceAddress||t.residenceAddress||'','text','maxlength="240"')}${field('tenantPhone','Teléfono del arrendatario (opcional)',c.tenantPhone||t.phone||'','tel','maxlength="30"')}${field('tenantEmail','Correo del arrendatario (opcional)',c.tenantEmail||t.email||'','email','maxlength="140"')}<p class="hint">Estos datos se guardarán en el borrador del contrato. Para cambiar permanentemente la ficha del inquilino, usa «Editar arrendatario».</p>${field('propertyAddress','Dirección del inmueble *',c.propertyAddress||p.address||'','text','required maxlength="240"')}${field('unitNumber','Número de departamento / unidad',c.unitNumber||t.unitNumber||p.unitNumber,'text','maxlength="30"')}<div class="form-row">${field('start','Inicio *',start,'date','required')}${field('end','Fin previsto *',end,'date','required')}</div><div class="form-row">${field('rent','Canon mensual (USD) *',c.rent??terms.rent??'','number','required min="0.01" step="0.01"')}${field('deposit','Depósito / garantía (USD)',c.deposit??t.deposit??0,'number','min="0" step="0.01"')}</div>${field('dueDay','Día de cobro acordado (opcional)',c.dueDay??terms.dueDay??'','number','min="1" max="31" step="1" placeholder="Sin día fijo"')}<p class="hint">Si lo dejas vacío, el contrato indicará que la fecha de cobro debe acordarse entre las partes.</p>${field('paymentMethod','Lugar y forma de pago',c.paymentMethod||'Transferencia bancaria a la cuenta indicada por el arrendador.','text','maxlength="240"')}${field('utilities','Servicios y gastos a cargo de cada parte',c.utilities||'Los consumos individuales de agua, luz y otros servicios se pagarán según facturas y medidores aplicables.','text','maxlength="350"')}<div class="field"><label>Inventario, estado de entrega y anexos</label><textarea name="inventory" maxlength="3000">${escapeHtml(c.inventory||'Entregar con inventario firmado y fotografías del estado del inmueble.')}</textarea></div><div class="field"><label>Justificación de plazo excepcional menor a dos años (solo si realmente corresponde)</label><textarea name="exceptionReason" maxlength="350" placeholder="Ej. estancia transitoria documentada. No usar por defecto.">${escapeHtml(c.exceptionReason||'')}</textarea></div><label class="hint" style="display:block"><input type="checkbox" name="syncTerms" value="yes" checked> Aplicar el canon y día de cobro de este contrato al seguimiento de pagos desde su fecha de inicio.</label><p class="hint">La Ley de Inquilinato (art. 28) reconoce normalmente dos años mínimos a favor del inquilino. Para contratos de canon superior a un SBU consulta obligación de escrito y registro notarial (art. 29). La reforma debatida en octubre de 2026 no se presume vigente.</p><div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Generar contrato Word</button></div></form>`;modal('Contrato de alquiler editable',body,()=>$('#contract-form').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(d.end<d.start)return toast('Fecha de fin anterior al inicio');const legalMin=datePlusMonthsMinusDay(d.start,24);if(d.end<legalMin&&!String(d.exceptionReason).trim())return toast('Plazo inferior a dos años: requiere excepción legal justificada');const newRent=optionalRent(d.rent),newDay=optionalDay(d.dueDay);if(newRent===null||Number.isNaN(newRent)||Number.isNaN(newDay))return toast('Indica un canon positivo y revisa el día de cobro');const contract={...c,...d,rent:newRent,dueDay:newDay,tenantId,propertyId:p.id,createdAt:c.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};let at=db.contracts.findIndex(x=>x.tenantId===tenantId);if(at>=0)db.contracts[at]=contract;else db.contracts.push(contract);if(d.syncTerms==='yes')setTenantTerms(t,d.start.slice(0,7),newRent,newDay);if(!save())return;closeModal();downloadContract(contract,p,t);toast('Contrato Word generado para revisar')}))}
function contractParagraphs(c,p,t){const owner=c.ownerName,tenant=c.tenantName,address=c.propertyAddress,unit=c.unitNumber||'No especificado';const identityType={cedula:'cédula',pasaporte:'pasaporte',ruc:'RUC',otro:'documento de identidad'}[c.tenantIdType]||'documento de identidad';const details=[c.tenantNationality&&('nacionalidad '+c.tenantNationality),c.tenantCivilStatus&&('estado civil '+c.tenantCivilStatus),c.tenantOccupation&&('ocupación '+c.tenantOccupation)].filter(Boolean).join(', ');const noticeContact=[c.tenantResidenceAddress&&('domicilio '+c.tenantResidenceAddress),c.tenantPhone&&('teléfono '+c.tenantPhone),c.tenantEmail&&('correo '+c.tenantEmail)].filter(Boolean).join('; ');return [{text:'CONTRATO DE ARRENDAMIENTO DE INMUEBLE URBANO',style:'title'},'MODELO AJUSTABLE — ECUADOR. Revisar con un profesional antes de firma y registro.',{text:'PRIMERA. COMPARECIENTES',style:'heading'},`En ${db.profile.city||'________________'}, comparecen ${owner}, identificación ${c.ownerId}, en calidad de ARRENDADOR, y ${tenant}, ${identityType} N.º ${c.tenantIdNumber}${details?' ('+details+')':''}, en calidad de ARRENDATARIO. Declaran capacidad y voluntad para celebrar este contrato de arrendamiento.`,{text:'SEGUNDA. BIEN INMUEBLE Y DESTINO',style:'heading'},`El arrendador entrega para uso de ${c.type==='local'?'local comercial':c.type==='habitacion'?'habitación':'vivienda'} el inmueble ubicado en ${address}; denominación: ${p.label}; departamento/unidad ${unit}. Se incluyen solo los espacios, llaves y elementos relacionados en el acta de entrega e inventario anexo. El destino será exclusivamente el declarado, salvo autorización escrita y conforme a la ley.`,{text:'TERCERA. PLAZO',style:'heading'},`El plazo acordado va del ${fmtDate(c.start)} al ${fmtDate(c.end)}. Se respetará el derecho legal del arrendatario a duración mínima conforme al artículo 28 de la Ley de Inquilinato; cualquier plazo excepcional requiere causa legal comprobable. ${c.exceptionReason?'Causa declarada para plazo excepcional: '+c.exceptionReason+'.':''}`,{text:'CUARTA. CANON Y FORMA DE PAGO',style:'heading'},`El canon mensual convenido es de ${money(c.rent)} (dólares de los Estados Unidos de América), ${validDay(c.dueDay)?'pagadero el día '+c.dueDay+' de cada mes':'con fecha de pago por acordar expresamente entre las partes'}. Forma de pago: ${c.paymentMethod}. Las partes verificarán que la pensión y cualquier ajuste respeten las reglas legales y municipales aplicables. Los pagos se acreditarán con comprobantes de recepción.`,{text:'QUINTA. GARANTÍA',style:'heading'},`Las partes declaran una garantía o depósito de ${money(c.deposit||0)}. La aplicación y restitución de esa garantía estarán sujetas a las normas vigentes y a una liquidación sustentada de obligaciones o daños atribuibles, con comprobantes.`,{text:'SEXTA. SERVICIOS Y GASTOS',style:'heading'},`${c.utilities} Ninguna cláusula podrá desconocer obligaciones legales imperativas de las partes.`,{text:'SÉPTIMA. CONSERVACIÓN, REPARACIONES E INVENTARIO',style:'heading'},`El inmueble se entregará en condiciones legales de habitabilidad y uso. Se firmará un acta de entrega-recepción con lectura de medidores, cantidad de llaves, estado e inventario: ${c.inventory}. Las reparaciones y responsabilidades se distribuirán conforme a la Ley de Inquilinato y demás normativa aplicable.`,{text:'OCTAVA. USO Y AUTORIZACIONES',style:'heading'},'El arrendatario usará el inmueble para el destino acordado y comunicará oportunamente daños y necesidades de reparación. Las modificaciones, cesiones o subarriendos requerirán el consentimiento exigible conforme a la ley.',{text:'NOVENA. TERMINACIÓN Y CONTROVERSIAS',style:'heading'},'Las causales, plazos, avisos y procedimientos para terminar el arrendamiento serán exclusivamente los permitidos por la Ley de Inquilinato y normativa aplicable. No se pacta desalojo extrajudicial ni renuncia anticipada a derechos irrenunciables. Las partes procurarán soluciones consensuadas o los mecanismos legalmente admitidos.',{text:'DÉCIMA. FORMALIZACIÓN Y REGISTROS',style:'heading'},'Las partes revisarán los requisitos municipales y, cuando el canon exceda de un salario básico unificado mensual, los deberes de contrato escrito y registro notarial previstos en el artículo 29 de la Ley de Inquilinato, sin perjuicio de reformas posteriores vigentes.',{text:'UNDÉCIMA. DATOS Y COMUNICACIONES',style:'heading'},`Para notificaciones del arrendatario se registra: ${noticeContact||'domicilio, teléfono y correo por acordar por escrito'}. Los datos de identificación y contacto se emplearán para la administración y cumplimiento contractual, con base legal válida y medidas de protección conforme a la Ley Orgánica de Protección de Datos Personales. No se autoriza su divulgación indiscriminada.`,{text:'ANEXOS',style:'heading'},'Se recomienda adjuntar inventario firmado, fotografías de entrega, lecturas de medidores, documentos de identidad pertinentes, información predial/certificación municipal cuando corresponda y comprobantes de garantía.',{text:'FIRMAS',style:'heading'},'__________________________                           __________________________',`ARRENDADOR: ${owner}                                  ARRENDATARIO: ${tenant}`,'Lugar y fecha de firma: _________________________________________________','NOTA: Documento editable generado por TÚAquiler. No implica firma electrónica, validez automática, protocolización ni inscripción.']}
async function saveOfficeFile(filename,blob,mime){if(window.TUAAndroid?.saveBinary){let reader=new FileReader();reader.onload=()=>{let str=String(reader.result||'');TUAAndroid.saveBinary(filename,str.split(',')[1]||'',mime)};reader.readAsDataURL(blob);return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function downloadContract(c,p,t){const paras=contractParagraphs(c,p,t),file=TUAOffice.document(paras);saveOfficeFile(`Contrato_TUAquiler_${String(t.name).replace(/[^a-z0-9_-]/gi,'_').slice(0,35)}.docx`,file,'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
function exportXLSX(){
  const per=state.period,tenantName=o=>o.tenantSnapshot||(db.tenants.find(t=>t.id===o.tenantId)||{}).name||'No identificado';
  const header=['Fecha de recepción','Mes al que corresponde','Inquilino','Unidad','Inmueble','Monto USD','Medio','Observaciones','Registrado por'];
  const income=db.payments.filter(o=>localMonth(o.date)===per).slice().sort((a,b)=>a.date.localeCompare(b.date)).map(o=>{
    let p=propertyById(o.propertyId);return[o.date,o.period,tenantName(o),o.unitSnapshot||p?.unitNumber||'',o.propertySnapshot||p?.label||'',o.amount,o.method||'',o.note||'',o.recordedBy||''];
  });
  const expenses=db.expenses.filter(o=>localMonth(o.date)===per).slice().sort((a,b)=>a.date.localeCompare(b.date)).map(o=>{
    let p=propertyById(o.propertyId);return[o.date,o.category||'',o.unitSnapshot||p?.unitNumber||'',o.propertySnapshot||p?.label||'',o.amount,o.note||''];
  });
  const tt=totals(),summary=[['TÚAquiler — Informe mensual',fmtPeriod(per)],['Moneda','USD'],['Ingresos recibidos según fecha',tt.collected],['Abonos aplicados al período',tt.applied],['Gastos registrados',tt.expense],['Balance neto',tt.net],['Pendiente de cobro (solo cánones definidos)',tt.pending],['Inmuebles con inquilino',tt.count],['Alquileres sin canon definido',tt.undefinedRent]];
  const balances=propsAt().map(p=>{let b=balanceOf(p);return[p.label,p.unitNumber||'',b.tenant?.name||'',b.rent??'SIN DEFINIR',b.paid,b.pending??'SIN DEFINIR',b.dueDay??'SIN DEFINIR'];});
  const sheets=[{name:'Resumen',rows:[['Concepto','Valor'],...summary]},
    {name:'Ingresos',rows:[header,...income]},
    {name:'Gastos',rows:[['Fecha','Categoría','Unidad','Inmueble','Monto USD','Observaciones'],...expenses]},
    {name:'Saldos',rows:[['Inmueble','Unidad','Inquilino','Canon USD','Abonos del inquilino USD','Pendiente USD','Día de cobro'],...balances]}];
  saveOfficeFile(`TUAquiler_Informe_${per}.xlsx`,TUAOffice.workbook(sheets),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  toast('Informe Excel con ingresos, gastos y saldos preparado');
}

function save(){
 try{
  if(team.workspaceId){
    if(!isManager()||!window.TUATeam)return false;
    const data={...db,payments:[]};TUATeam.pushState(JSON.stringify(data));
    // No se almacena información sensible compartida en localStorage.
    return true;
  }
  localStorage.setItem(storageKey,JSON.stringify(db));return true;
 }catch(e){toast('No se pudo guardar. Exporta un respaldo si estás en modo local.');return false}
}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3000)}
function localMonth(date){return date.slice(0,7)}
function activeIn(p,period){return (!p.startPeriod||p.startPeriod<=period)&&(!p.archivedAt||p.archivedAt>period)}
function propsAt(period=state.period){return db.properties.filter(p=>activeIn(p,period))}
function propertyById(pid){return db.properties.find(p=>p.id===pid)}
function paidAmount(pid,period=state.period){return round(db.payments.filter(p=>p.propertyId===pid&&p.period===period).reduce((a,p)=>a+p.amount,0))}
function expenseAmount(pid,period=state.period){return round(db.expenses.filter(e=>e.propertyId===pid&&localMonth(e.date)===period).reduce((a,e)=>a+e.amount,0))}
function totals(){
  const entries=propsAt().map(p=>({p,b:balanceOf(p)})).filter(x=>!!x.b.tenant);
  const rated=entries.filter(x=>x.b.rent!==null);
  const due=round(rated.reduce((a,x)=>a+x.b.rent,0));
  const collected=round(db.payments.filter(p=>localMonth(p.date)===state.period).reduce((a,p)=>a+p.amount,0));
  const applied=round(db.payments.filter(p=>p.period===state.period).reduce((a,p)=>a+p.amount,0));
  const expense=round(db.expenses.filter(e=>localMonth(e.date)===state.period).reduce((a,e)=>a+e.amount,0));
  const pending=round(rated.reduce((a,x)=>a+x.b.pending,0));
  return {due,collected,applied,expense,pending,net:round(collected-expense),
    paid:rated.filter(x=>x.b.pending<.001).length,count:entries.length,undefinedRent:entries.length-rated.length};
}
function periodControl(){return `<div class="period"><button data-action="month-back" title="Mes anterior" aria-label="Mes anterior">‹</button><div class="current">${escapeHtml(fmtPeriod(state.period))}</div><button data-action="month-next" title="Mes siguiente" aria-label="Mes siguiente">›</button></div>`}
function empty(iconName,title,desc,actionLabel,action){return `<div class="empty"><div class="empty-icon">${icon(iconName,26)}</div><h3>${title}</h3><p>${desc}</p>${actionLabel?`<button class="btn primary" data-action="${action}">${icon('plus',16)} ${actionLabel}</button>`:''}</div>`}
function smallStatus(p){
  const b=balanceOf(p);
  if(!b.tenant)return '<span class="status mid">Sin inquilino</span>';
  if(b.rent===null)return '<span class="status mid">Sin canon definido</span>';
  if(b.pending<.001)return '<span class="status ok">Al día</span>';
  if(b.paid>0)return '<span class="status mid">Abono parcial</span>';
  const due=dueDateForPeriod(state.period,b.dueDay);
  if(!due)return '<span class="status mid">Pendiente sin fecha</span>';
  if(due>today())return '<span class="status mid">Por vencer</span>';
  if(due===today())return '<span class="status">Vence hoy</span>';
  return '<span class="status">Vencido</span>';
}
function rentRow(p){
  const b=balanceOf(p),t=b.tenant,remaining=b.pending;
  return `<div class="rent-card"><div class="property-avatar ${remaining!==null&&remaining<.001&&t?'green':''}">${icon('building',22)}</div><div class="rent-detail"><div class="rent-name">${escapeHtml(p.label)}${p.unitNumber?' · Unidad '+escapeHtml(p.unitNumber):''}</div><div class="rent-tenant">${escapeHtml(t?.name||'Sin inquilino')} · ${b.dueDay?'Vence '+fmtDate(dueDateForPeriod(state.period,b.dueDay)):'Sin día fijo'}</div></div><div class="rent-right"><div class="rent-amount">${!t?'—':remaining===null?'Por definir':money(remaining)}</div>${smallStatus(p)}</div></div>`;
}
function home(){
  let t=totals(),list=propsAt().slice().sort((a,b)=>(balanceOf(b).pending||0)-(balanceOf(a).pending||0));
  return `<section class="screen-head"><div class="eyebrow">MI ADMINISTRACIÓN</div><h1 class="heading">Todo en orden.<br>Todo en un lugar.</h1><p class="sub">Gestiona tus alquileres sin complicarte.</p></section>${periodControl()}<section class="hero"><div class="hero-icon">${icon('wallet',31)}</div><div class="over">Ingresos recibidos este mes</div><div class="value">${money(t.collected)}</div><div class="pill">${icon('check',14)} ${t.paid} de ${t.count-t.undefinedRent} alquileres definidos al día</div></section><div class="stats"><div class="stat"><div class="topline"><span>Por cobrar</span><span class="icon-bubble">${icon('clock',17)}</span></div><div class="val">${money(t.pending)}</div><div class="help">${t.undefinedRent?`${t.undefinedRent} sin canon definido · `:''}Saldo registrado</div></div><div class="stat"><div class="topline"><span>Balance neto</span><span class="icon-bubble">${icon('receipt',17)}</span></div><div class="val">${money(t.net)}</div><div class="help">Cobros menos gastos</div></div></div><div class="action-grid">${canCollect()&&hasAvailableUnit()?`<button class="action" data-action="new-payment"><i>${icon('plus',19)}</i> Registrar pago</button>`:''}${isManager()&&hasAvailableUnit()?`<button class="action" data-action="new-tenant"><i>${icon('user',18)}</i> Registrar inquilino</button>`:''}${!hasAvailableUnit()&&isManager()?`<button class="action" data-action="new-property"><i>${icon('building',18)}</i> Registrar primer inmueble</button>`:''}</div><div class="section-head"><h2 class="section-title">Estado de cobros</h2><button class="text-btn" data-screen="properties">Ver todos ${icon('arrow',14)}</button></div>${list.length?`<div class="cards">${list.map(rentRow).join('')}</div>`:empty('building','Comienza con un inmueble','Registra primero un inmueble y luego a su inquilino.')}${activeTenantCount()>=2?`<div class="plan-hint"><div><b>${activeTenantCount()>=FREE_TENANT_LIMIT?'Ya utilizas tus 3 cupos gratuitos':'Tu plan gratis está funcionando'}</b><p>${activeTenantCount()>=FREE_TENANT_LIMIT?'Puedes seguir gestionando tus alquileres y conservar todo el historial. Para sumar otro inquilino activo, conoce el plan Pro.':'Te queda '+remainingFree()+' cupo gratuito. Si tu administración crece, el plan Pro permite inquilinos ilimitados.'}</p></div><button class="btn outline small-btn" data-action="show-plans">Ver planes</button></div>`:''}${db.demo?'<div class="tip">Datos ficticios de prueba. Puedes quitarlos en Ajustes.</div>':''}`;
}
function propertyCard(p){
  let active=activeIn(p,state.period),b=balanceOf(p),t=b.tenant;
  return `<article class="prop-card"><div class="prop-line"><div class="property-avatar">${icon('building',23)}</div><div style="flex:1;min-width:0"><div class="prop-title">${escapeHtml(p.label)} ${p.archivedAt?'<span class="archive-tag">Archivado</span>':''}</div><div class="prop-address">${escapeHtml(p.address||p.type||'Sin dirección registrada')} ${p.unitNumber?' · Unidad '+escapeHtml(p.unitNumber):''}</div></div><div style="text-align:right"><div style="font-size:16px;font-weight:850">${b.rent===null?'Sin canon':money(b.rent)}</div><div class="tiny muted" style="margin-top:3px">${b.rent===null?'por definir':'por mes'}</div></div></div><div class="prop-meta"><div><div class="meta-label">Inquilino del período</div><div class="meta-value">${escapeHtml(t?.name||'Sin asignar')}</div></div><div><div class="meta-label">Día de cobro</div><div class="meta-value">${escapeHtml(dayLabel(b.dueDay))}</div></div></div>${t?.endDate?`<div class="tip" style="margin-top:12px">Fecha de salida acordada: ${fmtDate(t.endDate)}</div>`:''}<div class="prop-actions"><button class="btn light small-btn" data-action="edit-property" data-id="${p.id}">${icon('edit',14)} Editar inmueble</button>${t?`<button class="btn light small-btn" data-action="edit-tenant" data-id="${t.id}">Inquilino y condiciones</button><button class="btn outline small-btn" data-action="new-contract" data-id="${t.id}">Contrato</button>`:`<button class="btn primary small-btn" data-action="new-tenant" data-id="${p.id}">Registrar inquilino</button>`}${active&&t?`<button class="btn light small-btn" data-action="new-payment" data-id="${p.id}">Pago</button>`:''}${t?.phone?`<button class="btn outline small-btn" data-action="remind" data-id="${p.id}">WhatsApp</button>`:''}<button class="btn light small-btn" data-action="archive" data-id="${p.id}">${p.archivedAt?'Reactivar':'Archivar'}</button></div></article>`;
}
function properties(){let list=db.properties.filter(p=>state.showArchived||!p.archivedAt),n=db.properties.filter(p=>!p.archivedAt).length;return `<div class="screen-head"><div class="eyebrow">PORTAFOLIO</div><h1 class="heading">Mis inmuebles e inquilinos</h1><p class="sub">${n} ${n===1?'inmueble activo':'inmuebles activos'} · ${activeTenantCount()} de ${FREE_TENANT_LIMIT} inquilinos activos gratis · <button class="text-btn" style="display:inline" data-action="show-plans">Ver Pro</button>.</p></div>${isManager()?`<div class="btn-row"><button class="btn primary" data-action="new-property">${icon('plus',17)} Nuevo inmueble</button>${hasAvailableUnit()?`<button class="btn outline" data-action="new-tenant">${icon('plus',17)} Registrar inquilino</button>`:''}</div>`:''}<div class="section-head"><h2 class="section-title">Propiedades</h2><button class="text-btn" data-action="toggle-archived">${state.showArchived?'Ocultar':'Mostrar'} archivadas</button></div>${list.length?list.map(propertyCard).join(''):empty('building','Aún no tienes inmuebles','Agrega un departamento, casa, habitación o local comercial.','Nueva propiedad','new-property')}<div class="section-head"><h2 class="section-title">Historial de inquilinos</h2></div>${db.tenants.length?db.tenants.slice().reverse().map(t=>{let p=propertyById(t.propertyId);return `<div class="movement"><i>${icon('building',19)}</i><div style="flex:1"><div class="rent-name">${escapeHtml(t.name||'Sin nombre')}</div><div class="meta">${escapeHtml(p?.label||'Inmueble anterior')} · Dpto. ${escapeHtml(t.unitNumber||p?.unitNumber||'—')} · ${t.active?'Activo':'Anterior'}</div></div><button class="btn light small-btn" data-action="edit-tenant" data-id="${t.id}">Editar</button></div>`}).join(''):empty('building','Sin inquilinos','El primer paso es registrar un inmueble o departamento. Después podrás asignar a una persona.',hasAvailableUnit()?'Registrar inquilino':'Registrar inmueble',hasAvailableUnit()?'new-tenant':'new-property')}</div>`}
function movementItem(o,type){let p=propertyById(o.propertyId),isPayment=type==='payments',t=isPayment?(db.tenants.find(t=>t.id===o.tenantId)||null):null;let name=o.tenantSnapshot||t?.name||p?.tenantName||'Inquilino no identificado',unit=o.unitSnapshot||t?.unitNumber||p?.unitNumber||'—',prop=o.propertySnapshot||p?.label||'Inmueble anterior';return `<div class="movement ${isPayment?'':'expense'}"><i>${icon(isPayment?'down':'up',21)}</i><div style="flex:1;min-width:0"><div class="rent-name">${isPayment?escapeHtml(name):escapeHtml(prop)}</div><div class="meta">${isPayment?`Dpto. ${escapeHtml(unit)} · ${escapeHtml(prop)} · `:''}${isPayment?escapeHtml(o.method||'Pago'):escapeHtml(o.category||'Gasto')} · ${fmtDate(o.date)}${isPayment?' · Alquiler '+escapeHtml(fmtPeriod(o.period||localMonth(o.date))):''}${o.note?' · '+escapeHtml(o.note):''}${isPayment&&o.recordedBy?' · Registrado por '+escapeHtml(o.recordedBy):''}</div></div><div class="amount" style="color:${isPayment?'var(--green)':'var(--red)'}">${isPayment?'+':'−'}${money(o.amount)}</div>${isManager()?`<button class="delete" title="Eliminar movimiento" aria-label="Eliminar movimiento" data-action="delete-move" data-type="${type}" data-id="${o.id}">${icon('trash',16)}</button>`:''}</div>`}
function movements(type){let isPayment=type==='payments';let entries=(isPayment?db.payments.filter(p=>localMonth(p.date)===state.period):db.expenses.filter(e=>localMonth(e.date)===state.period)).slice().sort((a,b)=>b.date.localeCompare(a.date));let amt=round(entries.reduce((a,p)=>a+p.amount,0));return `<div class="screen-head"><div class="eyebrow">MOVIMIENTOS</div><h1 class="heading">${isPayment?'Historial de pagos':'Gastos registrados'}</h1><p class="sub">${isPayment?'Se muestra según la fecha en que recibiste el dinero. Cada pago indica a qué mes de alquiler corresponde y quién lo realizó.':'Revisa egresos por propiedad y fecha.'}</p></div>${periodControl()}<div class="switcher"><button class="${isPayment?'active':''}" data-screen="payments">Ingresos</button><button class="${!isPayment?'active':''}" data-screen="expenses" ${!isManager()?'disabled style="display:none"':''}>Gastos</button></div><div class="stat" style="margin-bottom:12px"><div class="topline"><span>${isPayment?'Total recibido en el mes':'Total gastos'}</span><span class="icon-bubble">${icon(isPayment?'wallet':'receipt',17)}</span></div><div class="val">${money(amt)}</div><div class="help">${entries.length} ${entries.length===1?'registro':'registros'} · ${escapeHtml(fmtPeriod(state.period))}</div></div>${(isPayment?canCollect():isManager())?`<button class="btn primary full" data-action="new-${isPayment?'payment':'expense'}">${icon('plus',17)} ${isPayment?'Registrar pago':'Registrar gasto'}</button>`:''}<div class="section-head"><h2 class="section-title">Historial del mes</h2></div>${entries.length?entries.map(x=>movementItem(x,type)).join(''):empty(isPayment?'wallet':'receipt',`Sin ${isPayment?'pagos':'gastos'} este mes`,'Los movimientos aparecen aquí según su fecha. Los pagos identifican el período al que se aplican.',`Registrar ${isPayment?'pago':'gasto'}`,`new-${isPayment?'payment':'expense'}`)}`}
function settings(){const t=totals();return `<div class="screen-head"><div class="eyebrow">AJUSTES</div><h1 class="heading">Mi información</h1><p class="sub">Control de tus datos y documentos.</p></div><div class="notice">${icon('shield',20)} <div><b>Cuenta: ${escapeHtml(authState.signedIn?(authState.email||'Conectado'):'Modo local')}</b><br>${authState.signedIn?(isTeam()?'Administración compartida por Firebase · '+roleTitle(team.role):'Cuenta autenticada. Los datos de alquiler se guardan en este dispositivo salvo que actives un equipo.'):'Sin cuenta en la nube. Guarda respaldos antes de cambiar de teléfono.'}</div></div>${authState.signedIn?`<div class="setting-card"><button class="btn outline small-btn" data-action="logout">Cerrar sesión</button></div>`:authState.configured?`<div class="setting-card"><button class="btn outline small-btn" data-action="show-login">Iniciar sesión</button></div>`:''}<div class="setting-card"><h3>Mi plan · ${premiumVerified()?'Pro':'Gratis'}</h3><p>Actualmente administras ${activeTenantCount()} de ${FREE_TENANT_LIMIT} inquilinos activos gratis. Los inquilinos anteriores no consumen cupo. Los cobros de suscripción aún no están habilitados.</p><button class="btn outline small-btn" data-action="show-plans">${icon('spark',16)} Ver planes y precios</button></div><div class="setting-card"><h3>Colaboradores</h3><p>Invita a un administrador, cobrador o lector. Cada persona entra con su propia cuenta y sus permisos.</p><button class="btn outline small-btn" data-action="show-collaborators">${icon('user',16)} Gestionar colaboradores</button></div><div class="setting-card"><h3>Datos del arrendador</h3><p>Se completan automáticamente en los modelos de contrato.</p><button class="btn outline small-btn" data-action="owner-profile">Editar mis datos</button></div><div class="setting-card"><h3>Exportar informe Excel</h3><p>Genera un archivo .xlsx con cuatro hojas: Resumen, Ingresos, Gastos y Saldos. Puedes elegir el mes en la parte superior de Inicio.</p><button class="btn primary small-btn" data-action="export-xlsx">${icon('export',17)} Descargar Excel</button></div><div class="setting-card"><h3>Respaldo de datos</h3><p>Respaldo JSON personal. En modo equipo, es una copia de los datos que tus permisos permiten consultar. La sincronización requiere Firebase y conexión.</p><button class="btn outline small-btn" data-action="export-json">Guardar copia JSON</button><button class="btn outline small-btn" data-action="import-json">Restaurar copia</button></div><div class="setting-card"><h3>Reporte del mes</h3><p>${escapeHtml(fmtPeriod(state.period))}: recaudado ${money(t.collected)} · gastos ${money(t.expense)} · pendiente ${money(t.pending)}.</p><button class="btn outline small-btn" data-action="share-report">Compartir resumen</button><button class="btn outline small-btn" data-action="export-csv">Exportar CSV</button></div><div class="setting-card"><h3>Contratos de arrendamiento</h3><p>Plantillas editables en Word, sujetas a revisión. En "Inquilinos" selecciona "Crear contrato" dentro de la ficha del arrendatario. La app no firma ni registra contratos ante notario.</p></div><div class="setting-card"><h3>Datos de demostración</h3><button class="btn light small-btn" data-action="load-demo">Cargar datos ficticios</button>${db.demo?`<button class="btn danger small-btn" data-action="remove-demo">Reiniciar demostración</button>`:''}</div><div class="setting-card"><h3>Acerca de TÚAquiler</h3><p>Versión 2.6 de pruebas. La exportación Excel es informativa y no equivale a una factura del SRI. Los contratos requieren revisión jurídica y cumplimiento de requisitos locales.</p></div>`}
function plans(){
 const n=activeTenantCount(),annual=state.planCycle==='year';
 return `<div class="screen-head"><div class="eyebrow">PLANES TÚAQUILER</div><h1 class="heading">Crece sin complicarte.</h1><p class="sub">Empieza gratis. Amplía tus cupos cuando realmente los necesites.</p></div>
 <div class="plan-usage"><div class="plan-usage-top"><b>Tu plan actual: Gratis</b>${planBadge()}</div><div class="plan-meter"><span style="width:${Math.min(100,n/FREE_TENANT_LIMIT*100)}%"></span></div><p>${n} de ${FREE_TENANT_LIMIT} inquilinos activos · Los anteriores no cuentan para el límite.</p></div>
 <div class="plan-box"><div class="plan-headline"><span class="eyebrow">SIN COSTO</span><span class="plan-price">$0</span></div><h2 class="section-title">Gratis para empezar</h2><p class="sub" style="margin:9px 0">Hasta 3 inquilinos activos, sin límite de inmuebles vacíos ni de registros históricos.</p><div class="plan-feature">${icon('check',17)} Registro de propiedades e inquilinos</div><div class="plan-feature">${icon('check',17)} Pagos, gastos e historial</div><div class="plan-feature">${icon('check',17)} Excel y contratos editables</div><div class="plan-feature">${icon('check',17)} Sin tarjeta de crédito</div><span class="plan-current">Tu plan actual</span></div>
 <div class="plan-box pro"><div class="plan-ribbon">Una forma sencilla de ahorrar</div><div class="plan-headline"><span class="eyebrow">TÚAQUILER PRO</span><span class="plan-price">${annual?'$20':'$3'}<small>/${annual?'año':'mes'}</small></span></div><h2 class="section-title">Espacio para seguir creciendo</h2><p class="sub" style="margin:9px 0">Inquilinos activos ilimitados y todas las funciones de administración incluidas.</p><div class="switcher" style="margin-top:14px"><button class="${!annual?'active':''}" data-action="plan-month">Mensual · $3</button><button class="${annual?'active':''}" data-action="plan-year">Anual · $20</button></div>${annual?'<div class="plan-saving"><b>Ahorras $16 al año (44 %)</b><span>Comparado con 12 pagos mensuales de $3 · equivale a unos $1,67 al mes.</span></div>':'<p class="hint">Paga $3 por mes. Si prefieres ahorrar, el plan anual cuesta $20 por 12 meses.</p>'}<div class="plan-feature">${icon('check',17)} Inquilinos ilimitados</div><div class="plan-feature">${icon('check',17)} Mantienes los registros y documentos anteriores</div><div class="plan-feature">${icon('check',17)} Cambia las condiciones de cada alquiler</div><button class="btn primary full" disabled aria-disabled="true" style="margin-top:18px">Suscripción próximamente</button><p class="hint" style="margin-top:12px">Precios propuestos en USD. Todavía no se procesan pagos ni se activan planes Pro. La compra y renovación deberán configurarse y verificarse mediante Google Play.</p></div>
 <div class="setting-card"><h3>Si dejas de tener Pro</h3><p>Podrás seguir consultando tus inmuebles, pagos, contratos y reportes. No perderás información; solo se limitará la creación de nuevos inquilinos activos cuando superes los 3 gratuitos.</p><button class="btn outline small-btn" data-action="back-settings">Volver a Ajustes</button></div>`;
}
function render(){const showApp=!!(authState.signedIn||authState.localAccess);document.querySelector('.app').hidden=!showApp;document.querySelector('#auth').hidden=showApp;if(!showApp){renderAuth();return}document.querySelector('.top-chip').textContent=isTeam()?('Equipo · '+roleTitle(team.role)):'Datos locales';let main=$('#main');let scroll=window.scrollY;main.innerHTML=state.screen==='home'?home():state.screen==='properties'?properties():state.screen==='payments'?movements('payments'):state.screen==='expenses'?movements('expenses'):state.screen==='plans'?plans():state.screen==='collaborators'?collaborators():settings();const tabs=[['home','home','Inicio'],['properties','building','Inmuebles'],['payments','wallet','Cobros'],...(isManager()?[['expenses','receipt','Gastos']]:[]),['settings','settings','Ajustes']];$('#nav').style.gridTemplateColumns=`repeat(${tabs.length},1fr)`;$('#nav').innerHTML=tabs.map(([screen,ic,label])=>`<button class="tab ${(state.screen===screen||(state.screen==='plans'&&screen==='settings'))?'active':''}" data-screen="${screen}" aria-label="${label}" aria-current="${state.screen===screen?'page':'false'}"><span class="nav-icon">${icon(ic,21)}</span><span>${label}</span></button>`).join('');if(isTeam()&&!isManager()){const restricted=['new-property','edit-property','new-tenant','edit-tenant','new-contract','new-expense','archive','owner-profile','import-json','load-demo','remove-demo','delete-move'];main.querySelectorAll('[data-action]').forEach(e=>{if(restricted.includes(e.dataset.action)||(e.dataset.action==='remind'&&!canCollect())||(e.dataset.action==='new-payment'&&!canCollect()))e.style.display='none'});if(state.screen==='settings')main.querySelectorAll('.setting-card').forEach(e=>{if(['Datos del arrendador','Datos de demostración','Contratos de arrendamiento'].includes(e.querySelector('h3')?.textContent))e.style.display='none'})}window.scrollTo(0,scroll)}
function nav(s){if(isTeam()&&!isManager()&&s==='expenses')return toast('Tu permiso no incluye gastos');state.screen=s;render();window.scrollTo({top:0,behavior:'instant'})}
function month(delta){let[y,m]=state.period.split('-').map(Number),d=new Date(y,m-1+delta,1);state.period=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;render()}
let formPageWizard=null;
// Un campo sin la marca «opcional» debe completarse antes de avanzar o guardar.
// Únicamente las excepciones aquí documentadas se permiten vacías.
const OPTIONAL_FIELDS_BY_FORM={
  'building-form':['city','notes'],
  'unit-form':['rent','dueDay'],
  'tenant-form':['nationality','civilStatus','occupation','residenceAddress','email','endDate','deposit'],
  'contract-form':['tenantNationality','tenantCivilStatus','tenantOccupation','tenantResidenceAddress','tenantPhone','tenantEmail','dueDay','deposit','inventory','exceptionReason'],
  'owner-form':['address','phone','email'],
  'payment-form':['note'],
  'expense-form':['note'],
  'receipt-demo-form':['note'],
  'occupant-form':['email','phone']
};
function setFormRequirementPolicy(form){
  const optional=new Set(OPTIONAL_FIELDS_BY_FORM[form.id]||[]);
  form.querySelectorAll('input[name], select[name], textarea[name]').forEach(control=>{
    if(control.disabled||control.readOnly||control.type==='hidden'||control.type==='checkbox'||control.type==='radio'||control.type==='button')return;
    const label=control.id?form.querySelector(`label[for="${control.id}"]`):control.closest('.field')?.querySelector('label');
    const text=label?.textContent||'';
    const isOptional=optional.has(control.name)||/\(opcional\)|si aplica|solo si corresponde/i.test(text);
    control.required=!isOptional;
    if(label){
      if(isOptional){if(!/opcional|si aplica|solo si corresponde/i.test(text))label.append(' (opcional)');}
      else if(!/\*/.test(text))label.append(' *');
    }
    if(control.required){
      control.addEventListener('input',()=>control.setCustomValidity(''));
      control.addEventListener('change',()=>control.setCustomValidity(''));
    }
  });
  const checkBlankRequired=()=>{
    const controls=form.querySelectorAll('input[required],select[required],textarea[required]');
    controls.forEach(el=>{
      if(!el.disabled&&!el.readOnly&&el.type!=='file'&&typeof el.value==='string'){
        el.setCustomValidity(el.value.trim()?'':'Este dato es obligatorio');
      }
    });
  };
  // En formularios de una sola página, el evento submit debe bloquear el
  // guardado cuando un campo obligatorio contiene únicamente espacios.
  // Los formularios por etapas tienen su propia validación de todas las páginas.
  form.addEventListener('submit',event=>{
    if(form.noValidate)return;
    checkBlankRequired();
    const invalid=Array.from(form.querySelectorAll('input,select,textarea'))
      .find(el=>!el.disabled&&!el.readOnly&&!el.checkValidity());
    if(invalid){
      event.preventDefault();event.stopImmediatePropagation();
      invalid.reportValidity();invalid.focus();
    }
  },true);
  return checkBlankRequired;
}
function modal(title,body,after){
  // Los formularios ya no utilizan dialog ni una lámina emergente:
  // ocupan su propia vista, con navegación por secciones cuando son largos.
  if(/<form(?:\s|>)/i.test(body))return openFormPage(title,body,after);
  $('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#modal').showModal();if(after)after();
}
function openFormPage(title,body,after){
  const page=$('#form-page'),container=$('#form-page-content');
  if($('#modal').open)$('#modal').close();
  $('#form-page-title').textContent=title;
  container.innerHTML=body;
  const form=container.querySelector('form');
  if(!form)throw new Error('El formulario no existe');
  const enforceRequired=setFormRequirementPolicy(form);
  formPageWizard=null;
  page.hidden=false;
  // Capturar controles previos antes de reorganizar el formulario.
  const footer=Array.from(form.children).find(el=>el.classList?.contains('form-actions'));
  if(footer)footer.remove();
  const all=Array.from(form.children);
  let sections=[];let labels=[];let splitIndices=[];
  if(form.id==='tenant-form'){
    labels=['Datos personales','Condiciones del alquiler'];
    splitIndices=[all.findIndex(el=>el.classList?.contains('form-subheading')&&el.textContent.includes('Asignación y alquiler'))];
  }else if(form.id==='contract-form'){
    labels=['Partes del contrato','Inmueble y pagos','Cláusulas y anexos'];
    splitIndices=[all.findIndex(el=>el.querySelector?.('[name="propertyAddress"]')),all.findIndex(el=>el.querySelector?.('textarea[name="inventory"]'))];
  }
  // Si una versión futura modifica el HTML, se mantiene un único formulario completo.
  if(splitIndices.length && splitIndices.every((i,n)=>i>0 &&(n===0||i>splitIndices[n-1]))){
    const cuts=[0,...splitIndices,all.length];
    sections=labels.map((label,n)=>{
      const block=document.createElement('section');block.className='wizard-page';block.dataset.step=String(n);
      for(const node of all.slice(cuts[n],cuts[n+1]))block.appendChild(node);
      form.appendChild(block);return block;
    });
    const progress=document.createElement('div');progress.className='wizard-progress';progress.id='wizard-progress';
    form.prepend(progress);
    const controls=document.createElement('div');controls.className='wizard-controls';controls.innerHTML='<button type="button" class="btn light" data-action="form-prev">Anterior</button><button type="button" class="btn primary" data-action="form-next">Siguiente →</button>';
    form.appendChild(controls);
    if(footer){
      // En el último paso permanece Anterior junto al botón Guardar.
      const cancel=footer.querySelector('[data-action="close-modal"]');
      if(cancel)cancel.remove();
      const back=document.createElement('button');back.type='button';back.className='btn light';back.dataset.action='form-prev';back.textContent='← Anterior';
      footer.prepend(back);form.appendChild(footer);
    }
    form.noValidate=true;
    formPageWizard={form,sections,labels,step:0,controls,footer,progress};
    form.addEventListener('submit',e=>{
      for(let n=0;n<sections.length;n++){
        const bad=firstInvalidSection(n);
        if(bad){e.preventDefault();e.stopImmediatePropagation();showFormStep(n);bad.reportValidity();bad.focus();return}
      }
    },true);
    showFormStep(0);
  }else if(footer)form.appendChild(footer);
  document.body.style.overflow='hidden';page.scrollTop=0;
  if(after)after();
}
function firstInvalidSection(index){
  const wizard=formPageWizard;if(!wizard)return null;
  for(const el of wizard.sections[index].querySelectorAll('input,select,textarea')){
    if(el.disabled||el.readOnly)continue;
    if(el.required&&el.type!=='file'&&typeof el.value==='string')el.setCustomValidity(el.value.trim()?'':'Este dato es obligatorio');
    if(!el.checkValidity())return el;
  }
  return null;
}
function showFormStep(step){
  const w=formPageWizard;if(!w)return;
  w.step=Math.min(w.sections.length-1,Math.max(0,step));
  w.sections.forEach((sec,i)=>{sec.hidden=i!==w.step});
  w.controls.hidden=w.step===w.sections.length-1;
  const prev=w.controls.querySelector('[data-action="form-prev"]');if(prev)prev.disabled=w.step===0;
  if(w.footer)w.footer.hidden=w.step!==w.sections.length-1;
  w.progress.innerHTML='<div class="wizard-meter">'+w.labels.map((_,i)=>'<i class="'+(i<=w.step?'active':'')+'"></i>').join('')+'</div><div class="wizard-label">Paso '+(w.step+1)+' de '+w.sections.length+' · '+w.labels[w.step]+'</div>';
  $('#form-page').scrollTo({top:0,behavior:'instant'});
}
function advanceFormStep(){
  const w=formPageWizard;if(!w)return;
  const bad=firstInvalidSection(w.step);
  if(bad){bad.reportValidity();bad.focus();return}
  showFormStep(w.step+1);
}
function previousFormStep(){if(formPageWizard)showFormStep(formPageWizard.step-1)}
function closeModal(){
  const page=$('#form-page');
  if(!page.hidden){page.hidden=true;$('#form-page-content').innerHTML='';formPageWizard=null;document.body.style.overflow='';return true}
  if($('#modal').open){$('#modal').close();return true}
  return false;
}
function field(name,label,value='',type='text',extra=''){let v=attr(value);return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${v}" ${extra}></div>`}
function propertyModal(pid){
  const p=pid?propertyById(pid):null;if(pid&&!p)return toast('Inmueble no encontrado');
  let body=`<form id="property-form">${field('label','Nombre del inmueble *',p?.label||'','text','required maxlength="80" placeholder="Ej. Condominio Adán"')}<div class="form-row"><div class="field"><label for="f-type">Tipo</label><select id="f-type" name="type">${['Departamento','Casa','Habitación','Local comercial','Oficina','Otro'].map(x=>`<option ${p?.type===x?'selected':''}>${x}</option>`).join('')}</select></div>${field('unitNumber','N.º de departamento o unidad (si aplica)',p?.unitNumber||'','text','maxlength="30" placeholder="Ej. 22"')}</div>${field('address','Dirección completa',p?.address||'','text','maxlength="200" placeholder="Calle, número, ciudad"')}<p class="hint"><b>Condiciones de referencia (opcionales).</b> Cada departamento y cada inquilino puede tener un canon y un día de cobro distintos. Puedes dejarlos vacíos y definirlos al registrar al inquilino.</p><div class="form-row">${field('rent','Canon de referencia (USD, opcional)',p?.rent??'','number','min="0.01" max="99999999" step="0.01" placeholder="Sin definir"')}${field('dueDay','Día de cobro de referencia (opcional)',p?.dueDay??'','number','min="1" max="31" step="1" placeholder="Sin definir"')}</div><p class="hint">Para días 29, 30 o 31, el panel toma el último día de los meses más cortos. Comprueba que esto corresponda al acuerdo firmado; no hay avisos automáticos. Cada unidad se registra como inmueble independiente.</p>${!p?`<div class="field"><label for="f-startPeriod">Primer mes de seguimiento</label><input id="f-startPeriod" name="startPeriod" type="month" required value="${state.period}"></div>`:''}<div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">${p?'Guardar':'Añadir inmueble'}</button></div></form>`;
  modal(p?'Editar inmueble':'Nuevo inmueble',body,()=>$('#property-form').addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget),rent=optionalRent(f.get('rent')),due=optionalDay(f.get('dueDay'));
    if(Number.isNaN(rent)||Number.isNaN(due))return toast('Revisa el canon o el día de cobro (1 a 31)');
    const item={id:p?.id||id(),label:String(f.get('label')).trim(),type:String(f.get('type')),
      unitNumber:String(f.get('unitNumber')).trim(),address:String(f.get('address')).trim(),rent,dueDay:due,
      startPeriod:p?.startPeriod||String(f.get('startPeriod')),archivedAt:p?.archivedAt||null,example:p?.example||false};
    if(!item.label)return toast('Indica el nombre del inmueble');
    const duplicate=db.properties.find(x=>x.id!==item.id&&x.label.toLowerCase()===item.label.toLowerCase()&&
      String(x.unitNumber||'').toLowerCase()===item.unitNumber.toLowerCase()&&String(x.address||'').toLowerCase()===item.address.toLowerCase());
    if(duplicate&&!confirm('Ya existe un inmueble con este nombre, unidad y dirección. ¿Registrar otro igualmente?'))return;
    if(p)Object.assign(p,item);else db.properties.push(item);
    if(!save())return;
    closeModal();nav('properties');toast(p?'Inmueble actualizado':'Inmueble registrado');
  }));
}
function selectProperty(selected){let list=db.properties.filter(p=>!p.archivedAt||p.archivedAt>state.period);return `<div class="field"><label for="f-propertyId">Inmueble *</label><select id="f-propertyId" name="propertyId" required>${list.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${escapeHtml(p.label)}</option>`).join('')}</select></div>`}
function paymentModal(pid){
  const list=db.properties.filter(p=>activeIn(p,state.period)&&tenantAt(p,state.period));
  if(!list.length){toast('Primero debe haber un inmueble con inquilino');return isManager()?(db.properties.length?tenantModal():propertyModal()):null}
  const sel=list.find(p=>p.id===pid)||list[0],b=balanceOf(sel),initial=b.pending===null?'':b.pending||b.rent||'';
  const body=`<form id="payment-form"><div class="field"><label for="f-propertyId">Inquilino / departamento *</label><select id="f-propertyId" name="propertyId" required>${list.map(p=>{let x=tenantAt(p,state.period);return `<option value="${attr(p.id)}" ${p.id===sel.id?'selected':''}>${escapeHtml(x?.name||'—')} · Unidad ${escapeHtml(x?.unitNumber||p.unitNumber||'—')} · ${escapeHtml(p.label)}</option>`}).join('')}</select></div><div class="total-note"><span>Saldo de ${escapeHtml(fmtPeriod(state.period))}</span><strong id="due-label">${b.pending===null?'Canon sin definir':money(b.pending)}</strong></div><div class="form-row">${field('amount','Importe recibido (USD) *',initial,'number','required min="0.01" step="0.01" max="99999999"')}${field('date','Fecha real del pago *',today(),'date','required')}</div><div class="field"><label for="f-method">Medio de pago</label><select id="f-method" name="method"><option>Transferencia</option><option>Efectivo</option><option>Depósito</option><option>Otro</option></select></div><div class="field"><label for="f-note">Comprobante / nota</label><textarea id="f-note" name="note" maxlength="200" placeholder="Referencia de transferencia, recibo, etc."></textarea></div><p class="hint">Este pago se asignará a ${escapeHtml(fmtPeriod(state.period))}, aunque la fecha real sea otra. La app no distribuye automáticamente pagos entre meses. Confirma que recibiste el dinero.</p><div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Guardar pago</button></div></form>`;
  modal('Registrar pago de inquilino',body,()=>{
    $('#f-propertyId').addEventListener('change',e=>{
      const p=propertyById(e.target.value),b=balanceOf(p),val=b.pending;
      $('#due-label').textContent=val===null?'Canon sin definir':money(val);
      $('#f-amount').value=val===null?'':(val||b.rent||'').toString();
    });
    $('#payment-form').addEventListener('submit',e=>{
      e.preventDefault();const f=new FormData(e.currentTarget),amount=optionalRent(f.get('amount')),
        p=propertyById(String(f.get('propertyId'))),tenant=tenantAt(p,state.period);
      if(!p||!tenant||amount===null||Number.isNaN(amount))return toast('Revisa inquilino e importe');
      const b=balanceOf(p);
      if(b.pending===null){if(!confirm('El canon está sin definir. ¿Registrar este abono sin saldo calculado?'))return}
      else if(amount>b.pending+.001&&!confirm(`El pago de ${money(amount)} supera el saldo de ${money(b.pending)}. ¿Registrarlo como pago adicional?`))return;
      const payment={id:id(),propertyId:p.id,tenantId:tenant.id,tenantSnapshot:tenant.name,
        unitSnapshot:tenant.unitNumber||p.unitNumber||'',propertySnapshot:p.label,amount,
        date:String(f.get('date')),period:state.period,method:String(f.get('method')),
        note:String(f.get('note')).trim(),recordedBy:authState.email||'Propietario (local)',recordedByUid:authState.uid||'',example:false};
      if(isTeam()){
        // En equipo, un pago no cuenta hasta que el servidor lo confirme y lo devuelva al escuchar Firestore.
        if(!window.TUATeam)return toast('No hay conexión con la administración compartida');
        TUATeam.addPayment(JSON.stringify(payment));
        closeModal();nav('payments');toast('Enviando cobro. Se reflejará al confirmarlo Firebase.');return;
      }
      db.payments.push(payment);
      if(!save()){db.payments.pop();return}
      closeModal();nav('payments');toast('Pago vinculado al inquilino y al período');
    });
  });
}
function expenseModal(){if(!db.properties.length)return toast('Primero agrega un inmueble');let body=`<form id="expense-form">${selectProperty('')}<div class="form-row">${field('amount','Importe (USD) *','','number','required min="0.01" max="99999999" step="0.01"')}${field('date','Fecha del gasto *',today(),'date','required')}</div><div class="field"><label for="f-category">Categoría</label><select id="f-category" name="category"><option>Mantenimiento</option><option>Reparación</option><option>Servicios básicos</option><option>Administración</option><option>Impuestos</option><option>Otro</option></select></div><div class="field"><label for="f-note">Nota</label><textarea id="f-note" name="note" maxlength="200" placeholder="Descripción opcional"></textarea></div><p class="hint">Los gastos se muestran según el mes de su fecha.</p><div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">Guardar gasto</button></div></form>`;modal('Registrar gasto',body,()=>{$('#expense-form').addEventListener('submit',e=>{e.preventDefault();let f=new FormData(e.currentTarget),amount=round(f.get('amount')),p=propertyById(String(f.get('propertyId')));if(!p||!(amount>0)||!Number.isFinite(amount))return toast('Revisa el inmueble y el importe');db.expenses.push({id:id(),propertyId:p.id,unitSnapshot:p.unitNumber||'',propertySnapshot:p.label,amount,date:String(f.get('date')),category:String(f.get('category')),note:String(f.get('note')).trim(),example:false});if(!save())return;closeModal();nav('expenses');toast('Gasto registrado correctamente')})})}
function archive(pid){
  const p=propertyById(pid);if(!p)return;
  if(p.archivedAt){
    if(!confirm(`¿Reactivar ${p.label}? Se conservarán todos sus registros y la fecha original de seguimiento.`))return;
    p.archivedAt=null;
  }else{
    if(!confirm(`¿Archivar ${p.label}? No se borrarán pagos ni inquilinos anteriores.`))return;
    p.archivedAt=state.period;
  }
  if(!save())return;render();toast('Estado actualizado');
}
function safePhone(s){s=String(s||'').replace(/[^\d+]/g,'');if(s.startsWith('+'))s=s.slice(1);if(s.startsWith('00'))s=s.slice(2);if(/^09\d{8}$/.test(s))s='593'+s.slice(1);if(/^9\d{8}$/.test(s))s='593'+s;return /^\d{10,15}$/.test(s)?s:null}
function remind(pid){
  const p=propertyById(pid),b=balanceOf(p),t=b.tenant;
  if(!p||!t)return toast('Primero registra un inquilino');
  const num=safePhone(t.phone);if(!num)return toast('Revisa el WhatsApp del inquilino');
  const name=t.unitNumber||p.unitNumber||'',period=fmtPeriod(state.period);
  const msg=b.pending===null?`Hola ${t.name}, te escribo para coordinar el pago del alquiler de ${period} correspondiente a la unidad ${name}. Gracias.`:
    b.pending?`Hola ${t.name}, te recuerdo que el saldo de alquiler de la unidad ${name} correspondiente a ${period} es ${money(b.pending)}. Avísame cuando realices el pago. Gracias.`:
      `Hola ${t.name}, gracias. El alquiler de la unidad ${name} de ${period} está registrado como pagado.`;
  window.location.href=`https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}
function deleteMovement(type,mid){let arr=type==='payments'?db.payments:db.expenses;let item=arr.find(x=>x.id===mid);if(!item)return;if(!confirm(`¿Eliminar este registro de ${money(item.amount)}? Esta acción no se puede deshacer.`))return;
  if(isTeam()&&type==='payments'){
    if(!window.TUATeam)return toast('No hay conexión con Firebase');
    TUATeam.removePayment(mid);toast('Solicitando anulación. Espera la confirmación de Firebase.');return;
  }
  let i=arr.indexOf(item);arr.splice(i,1);if(!save()){arr.splice(i,0,item);return;}render();toast('Movimiento eliminado');
}
function safeCsv(s){let v=String(s??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}
function makeCsv(){
  const rows=[['Inmueble','Unidad','Inquilino','Canon mensual USD','Ingresos del inquilino USD','Pendiente USD','Gastos USD']];
  for(const p of propsAt()){
    const b=balanceOf(p);
    rows.push([p.label,b.tenant?.unitNumber||p.unitNumber||'',b.tenant?.name||'',
      b.rent??'SIN DEFINIR',b.paid,b.pending??'SIN DEFINIR',expenseAmount(p.id)]);
  }
  const t=totals();rows.push(['TOTAL','','',t.due,t.applied,t.pending,t.expense]);
  return '\ufeff'+rows.map(r=>r.map(safeCsv).join(';')).join('\r\n');
}
function reportText(){
  const t=totals();
  return `TÚAquiler — Reporte ${fmtPeriod(state.period)}\nInmuebles arrendados: ${t.count}\nCobrado: ${money(t.collected)}\nPor cobrar (cánones definidos): ${money(t.pending)}\nSin canon definido: ${t.undefinedRent}\nGastos: ${money(t.expense)}\nBalance neto: ${money(t.net)}\n\n`+
    propsAt().map(p=>{const b=balanceOf(p);return `${p.label} / ${p.unitNumber||'Sin unidad'} / ${b.tenant?.name||'Sin inquilino'}: recibido ${money(b.paid)}, canon ${b.rent===null?'sin definir':money(b.rent)}`}).join('\n')+
    '\n\nRegistro informativo, no comprobante fiscal.';
}
function saveFile(name,content,mime){if(window.TUAAndroid&&typeof TUAAndroid.saveText==='function'){TUAAndroid.saveText(name,content,mime);return}const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Archivo preparado')}
async function shareReport(){let report=reportText();try{if(navigator.share){await navigator.share({title:'Reporte TÚAquiler',text:report});return}}catch(e){if(e.name==='AbortError')return}if(window.TUAAndroid&&TUAAndroid.shareText){TUAAndroid.shareText(report);return}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(report);toast('Reporte copiado');return}saveFile(`Reporte_TUAquiler_${state.period}.txt`,report,'text/plain')}
function exportJSON(){let payload={app:'TÚAquiler',exportedAt:new Date().toISOString(),data:db};saveFile(`TUAquiler_Respaldo_${today()}.json`,JSON.stringify(payload,null,2),'application/json')}
function importJSON(file){
  if(!file)return;if(file.size>4000000)return toast('Archivo demasiado grande');
  const reader=new FileReader();reader.onload=()=>{
    try{
      let payload=JSON.parse(String(reader.result)),d=payload.data;
      if(payload.app!=='TÚAquiler'||!d||!Array.isArray(d.properties)||!Array.isArray(d.payments)||!Array.isArray(d.expenses))throw Error('formato');
      if(d.properties.length>2000||d.payments.length>50000||d.expenses.length>50000||(d.tenants||[]).length>4000)throw Error('tamaño');
      const ids=new Set();
      for(const p of d.properties){
        if(typeof p.id!=='string'||typeof p.label!=='string'||!p.id||!p.label.trim()||ids.has(p.id))throw Error('inmueble');
        ids.add(p.id);
        if(p.rent!==null&&p.rent!==undefined&&p.rent!==''&&!validRent(p.rent))throw Error('canon');
        if(p.dueDay!==null&&p.dueDay!==undefined&&p.dueDay!==''&&!validDay(p.dueDay))throw Error('día de cobro');
      }
      if(d.tenants!==undefined&&!Array.isArray(d.tenants))throw Error('inquilinos');
      for(const t of d.tenants||[]){
        if(typeof t.id!=='string'||!ids.has(t.propertyId)||typeof t.name!=='string')throw Error('inquilino');
        if(t.rent!==null&&t.rent!==undefined&&!validRent(t.rent))throw Error('canon de inquilino');
        if(t.dueDay!==null&&t.dueDay!==undefined&&!validDay(t.dueDay))throw Error('día');
      }
      for(const r of [...d.payments,...d.expenses]){
        if(!ids.has(r.propertyId)||!Number.isFinite(r.amount)||r.amount<=0||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(r.date))throw Error('movimiento');
      }
      if(!confirm(`¿Reemplazar todos los registros de esta cuenta por ${d.properties.length} inmuebles? Guarda antes tu respaldo actual.`))return;
      db={...emptyDB(),...d};migrateDB();if(!save())return;nav('home');toast('Respaldo restaurado');
    }catch(e){toast('No se pudo importar: '+(e.message||'archivo no válido'))}
  };reader.readAsText(file);
}
function loadDemo(){
  if(db.properties.length||db.payments.length||db.expenses.length){if(!confirm('Para cargar datos de ejemplo se reemplazarán tus registros. ¿Continuar?'))return}
  const month=periodNow(),labels=[['Edificio Norte','101','Guayaquil · Norte',220,'María González',5],['Edificio Norte','102','Guayaquil · Norte',250,'Carlos Vera',10],['Locales Centro','A','Centro',380,'Ana Rodríguez',5]];
  db=emptyDB();db.demo=true;
  db.properties=labels.map(x=>({id:id(),label:x[0],unitNumber:x[1],address:x[2],type:'Departamento',rent:null,dueDay:null,startPeriod:month,archivedAt:null,example:true}));
  db.tenants=labels.map((x,i)=>({id:id(),propertyId:db.properties[i].id,name:x[4],unitNumber:x[1],idNumber:'',phone:'',email:'',startDate:month+'-01',endDate:'',deposit:0,active:true,rent:x[3],dueDay:x[5],termsHistory:[{from:month,rent:x[3],dueDay:x[5]}],example:true}));
  for(const i of [0,1])db.payments.push({id:id(),propertyId:db.properties[i].id,tenantId:db.tenants[i].id,tenantSnapshot:db.tenants[i].name,unitSnapshot:db.tenants[i].unitNumber,propertySnapshot:db.properties[i].label,amount:db.tenants[i].rent,date:today(),period:month,method:'Transferencia',note:'Ejemplo',example:true});
  db.payments.push({id:id(),propertyId:db.properties[2].id,tenantId:db.tenants[2].id,tenantSnapshot:db.tenants[2].name,unitSnapshot:'A',propertySnapshot:db.properties[2].label,amount:100,date:today(),period:month,method:'Efectivo',note:'Abono de ejemplo',example:true});
  db.expenses.push({id:id(),propertyId:db.properties[0].id,unitSnapshot:'101',propertySnapshot:'Edificio Norte',amount:35,date:today(),category:'Mantenimiento',note:'Ejemplo',example:true});
  state.period=month;if(!save())return;nav('home');toast('Demostración cargada');
}
function handleAction(action,el){let pid=el.dataset.id;
 const managementActions=['new-property','edit-property','new-tenant','edit-tenant','new-contract','new-expense','archive','owner-profile','import-json','load-demo','remove-demo'];
 if(isTeam()&&['load-demo','remove-demo'].includes(action))return toast('No reemplaces datos compartidos con registros de prueba');
 if(isTeam()&&action==='import-json')return toast('En un espacio compartido no se pueden restaurar copias desde un teléfono');
 if(isTeam()&&managementActions.includes(action)&&!isManager())return toast('Tu permiso no permite realizar esta acción');
 if(isTeam()&&['new-payment','remind'].includes(action)&&!canCollect())return toast('Tu permiso es de consulta');
 if(isTeam()&&action==='delete-move'&&!isManager())return toast('Solo propietario o administrador pueden borrar movimientos');
 switch(action){case'refresh-email-verification':if(window.TUAAndroid?.refreshVerification)TUAAndroid.refreshVerification();return toast('Comprobando verificación…');case'resend-email-verification':if(window.TUAAndroid?.resendVerification)TUAAndroid.resendVerification();return toast('Solicitando otro correo de verificación…');case'show-collaborators':return nav('collaborators');case'create-team':if(!teamActiveAccount())return toast('Configura Firebase e inicia sesión');if(!confirm('Se publicarán tus inmuebles, inquilinos, pagos y gastos en tu espacio de Firebase. Confirma que tienes autorización para gestionar estos datos y guarda antes un respaldo. ¿Continuar?'))return;window.TUATeam.startWorkspace(JSON.stringify(db));return toast('Activando equipo en Firebase…');case'accept-team':return acceptInviteModal();case'invite-team':return inviteModal();case'exit-team':window.TUATeam?.leaveWorkspace();return switchLocal();case'remove-collaborator':if(!isOwner())return; if(confirm('¿Revocar el acceso de esta persona? Sus registros de pagos permanecerán identificados.'))window.TUATeam.revoke(pid);return;case'cancel-invite':if(isOwner()&&confirm('¿Cancelar este código de invitación?'))window.TUATeam.cancelInvite(pid);return;case'share-invite':{if(!isOwner())return;let inv=team.invites.find(x=>x.code===pid)||team.lastInvite;if(!inv||inv.code!==pid)return;const msg=`Invitación a TÚAquiler. Ingresa con tu correo ${inv.email} verificado y abre Ajustes → Colaboradores → Unirme. Código privado: ${inv.code}. No compartas este código con terceros.`;if(window.TUAAndroid?.shareText)TUAAndroid.shareText(msg);else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).then(()=>toast('Invitación copiada'));else toast('Usa la app Android para compartir la invitación');return;}
 case'show-plans':return nav('plans');case'back-settings':return nav('settings');case'plan-month':state.planCycle='month';return render();case'plan-year':state.planCycle='year';return render();case'new-property':return propertyModal();case'edit-property':return propertyModal(pid);case'new-tenant':return tenantModal(null,pid);case'edit-tenant':return tenantModal(pid);case'new-contract':return contractModal(pid);case'owner-profile':return profileModal();case'new-payment':return paymentModal(pid);case'new-expense':return expenseModal();case'close-modal':return closeModal();case'form-back':return formPageWizard?.step>0?previousFormStep():closeModal();case'form-next':return advanceFormStep();case'form-prev':return previousFormStep();case'month-back':return month(-1);case'month-next':return month(1);case'toggle-archived':state.showArchived=!state.showArchived;return render();case'archive':return archive(pid);case'remind':return remind(pid);case'delete-move':return deleteMovement(el.dataset.type,pid);case'export-json':return exportJSON();case'import-json':return $('#import-file').click();case'export-xlsx':return exportXLSX();case'export-csv':return saveFile(`TUAquiler_${state.period}.csv`,makeCsv(),'text/csv;charset=utf-8');case'share-report':return shareReport();case'load-demo':return loadDemo();case'logout':return logout();case'show-login':authState.localAccess=false;sessionStorage.removeItem('tua.local');return render();case'continue-local':authState.localAccess=true;sessionStorage.setItem('tua.local','1');storageKey=KEY;loadCurrentDB();return render();case'google-login':return nativeGoogle();case'remove-demo':if(confirm('¿Eliminar TODOS los datos de esta cuenta? No se puede deshacer.')){db=emptyDB();save();nav('home');toast('Datos reiniciados')}return;}}
document.addEventListener('click',e=>{let tab=e.target.closest('[data-screen]');if(tab){nav(tab.dataset.screen);return}let act=e.target.closest('[data-action]');if(act)handleAction(act.dataset.action,act)});$('#close-modal').addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});$('#import-file').addEventListener('change',e=>{importJSON(e.target.files?.[0]);e.target.value=''});window.appBack=()=>{if(!$('#form-page').hidden){if(formPageWizard?.step>0)previousFormStep();else closeModal();return true}if($('#modal').open){closeModal();return true}if(state.screen!=='home'){nav('home');return true}return false};window.tuaAuthUpdate=authUpdate;window.tuaTeamEvent=teamEvent;
if(authState.signedIn&&window.TUATeam){const wid=localStorage.getItem(currentWorkspaceStorage());if(wid)window.TUATeam.enterWorkspace(wid)}document.addEventListener('submit',e=>{if(e.target.id==='login-form'){e.preventDefault();const f=new FormData(e.target),email=String(f.get('email')||'').trim(),pass=String(f.get('password')||''),mode=e.submitter?.value==='register'?'register':'login';if(!authState.configured||!window.TUAAndroid?.emailAuth)return toast('Configura Firebase para activar el acceso');if(!email.includes('@')||pass.length<6)return toast('Revisa correo y contraseña (mínimo 6 caracteres)');window.TUAAndroid.emailAuth(mode,email,pass);toast('Procesando acceso…')}});render();
/* TÚAquiler 2.4 — navegación lateral y flujos locales documentados.
 * La vista de inquilino es DEMOSTRACIÓN local: no implica autenticación ni envía correos.
 * Los documentos adjuntos locales se almacenan en IndexedDB, no en el JSON de respaldo.
 */
const v24LegacyRender = render;
const v24LegacyNav = nav;
const v24LegacyAction = handleAction;
const v24Sections = [
  ['home','home','Inicio'], ['properties','building','Inmuebles'],
  ['units','building','Unidades'], ['tenants','user','Inquilinos'],
  ['contracts','file','Contratos'], ['payments','wallet','Cobros'],
  ['expenses','receipt','Gastos'], ['receipts','upload','Comprobantes'],
  ['reports','export','Informes'], ['collaborators','shield','Colaboradores'],
  ['plans','spark','Suscripción'], ['settings','settings','Ajustes']
];
state.v24Menu = false;
state.portalTenantId = '';
function drawerOpen(){state.v24Menu=true;const d=$('#drawer'),mask=$('#drawer-overlay');d.classList.add('open');d.setAttribute('aria-hidden','false');mask.hidden=false;$('#menu-toggle').setAttribute('aria-expanded','true');$('#drawer-close').focus()}
function drawerClose(){state.v24Menu=false;const d=$('#drawer'),mask=$('#drawer-overlay');d.classList.remove('open');d.setAttribute('aria-hidden','true');mask.hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false')}
function renderSideMenu(){
  const list=v24Sections.filter(([s])=>{
    if(!isTeam()||isManager())return true;
    return !['expenses','contracts','receipts','reports'].includes(s);
  });
  $('#drawer-links').innerHTML=list.map(([s,ic,label])=>`<button class="drawer-link ${state.screen===s?'active':''}" type="button" data-screen="${s}" aria-current="${state.screen===s?'page':'false'}">${icon(ic,20)} <span>${label}</span></button>`).join('')
    + (!isTeam()?`<div class="drawer-sep"></div><button class="drawer-link" type="button" data-screen="tenant-portal">${icon('user',20)} <span>Vista inquilino <small>DEMO</small></span></button>`:'')
    + '<div class="drawer-sep"></div><button class="drawer-link" data-action="logout" type="button">'+icon('lock',20)+' <span>Cerrar sesión</span></button>';
}
function v24Head(name,kicker,desc=''){return `<div class="screen-head"><div class="eyebrow">${escapeHtml(kicker)}</div><h1 class="heading">${escapeHtml(name)}</h1>${desc?`<p class="sub">${escapeHtml(desc)}</p>`:''}</div>`}
function v24Empty(title,message){return `<div class="empty">${icon('file',28)}<h3 style="margin-top:9px">${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`}
function unitsScreen(){
 const list=db.properties.filter(p=>!p.archivedAt).slice().sort((a,b)=>a.label.localeCompare(b.label)||String(a.unitNumber||'').localeCompare(String(b.unitNumber||'')));
 return v24Head('Unidades y departamentos','INMUEBLES','Cada unidad puede tener su propio canon y fecha de cobro; los valores del inmueble son solo referencias.')+
 (isManager()?`<button class="btn primary" data-action="new-property">${icon('plus',16)} Añadir unidad</button>`:'')+
 `<div class="tip">En este prototipo se conserva el modelo anterior: cada unidad figura como un registro de inmueble. El paso a inmuebles con múltiples unidades está diseñado en el documento técnico para una migración posterior sin pérdida de datos.</div>`+
 (list.length?list.map(p=>{let t=tenantAt(p,state.period),b=balanceOf(p);return `<article class="prop-card"><div class="prop-title">${escapeHtml(p.label)} · ${escapeHtml(p.unitNumber||'Unidad sin número')}</div><p class="prop-address">${escapeHtml(p.address||'Dirección no indicada')}</p><div class="prop-meta"><div><div class="meta-label">Ocupación</div><div class="meta-value">${escapeHtml(t?.name||'Disponible')}</div></div><div><div class="meta-label">Canon del mes</div><div class="meta-value">${b.rent===null?'No definido':money(b.rent)}</div></div></div>${isManager()?`<div class="prop-actions"><button class="btn outline small-btn" data-action="edit-property" data-id="${attr(p.id)}">Editar unidad</button><button class="btn light small-btn" data-action="new-tenant" data-id="${attr(p.id)}">Asignar inquilino</button></div>`:''}</article>`}).join(''):v24Empty('No hay unidades','Añade el primer inmueble o departamento para comenzar.'));
}
function tenantsScreen(){
 const list=db.tenants.slice().sort((a,b)=>(b.active?1:0)-(a.active?1:0));
 let html=v24Head('Inquilinos y ocupantes','PERSONAS','Los ocupantes autorizados no generan otra mensualidad ni consumen cupo de inquilino activo.')+
 (isManager()&&hasAvailableUnit()?`<button class="btn primary" data-action="new-tenant">${icon('plus',17)} Registrar inquilino</button>`:'');
 if(!list.length)return html+(hasAvailableUnit()?v24Empty('Sin inquilinos','Ya tienes un inmueble disponible. Ahora registra a la persona que lo ocupará.'):`<div class="setup-stage"><b>Paso 1 de 3 · Registrar inmueble</b><p>Para registrar un inquilino, primero crea el inmueble o departamento donde vivirá.</p><button class="btn primary" data-action="new-property">${icon('plus',16)} Registrar primer inmueble</button></div>`);
 html+=list.map(t=>{let p=propertyById(t.propertyId),occs=(db.occupants||[]).filter(o=>o.tenantId===t.id),b=balanceOf(p);return `<article class="prop-card"><div class="prop-line"><div class="property-avatar">${icon('user',22)}</div><div><div class="prop-title">${escapeHtml(t.name)}</div><div class="prop-address">${escapeHtml(p?.label||'Inmueble anterior')} · Dpto. ${escapeHtml(t.unitNumber||p?.unitNumber||'—')}</div></div></div>${t.idNumber?`<p class="small muted" style="margin:10px 0">Documento: ${escapeHtml(t.idType==='pasaporte'?'Pasaporte':t.idType==='ruc'?'RUC':'Cédula')} · ••••${escapeHtml(String(t.idNumber).slice(-4))}</p>`:''}<div class="prop-meta"><div><div class="meta-label">Estado</div><div class="meta-value">${t.active?'Inquilino activo':'Histórico'}</div></div><div><div class="meta-label">Ocupantes</div><div class="meta-value">${occs.length}</div></div></div>${occs.map(o=>`<p class="small muted" style="margin-top:9px">• ${escapeHtml(o.name)} · Ocupante autorizado</p>`).join('')}<div class="prop-actions">${isManager()?`<button class="btn light small-btn" data-action="edit-tenant" data-id="${attr(t.id)}">Editar</button><button class="btn outline small-btn" data-action="new-contract" data-id="${attr(t.id)}">Crear contrato</button><button class="btn light small-btn" data-action="add-occupant" data-id="${attr(t.id)}">+ Ocupante</button>`:''}</div></article>`}).join('');
 return html;
}
function contractsScreen(){
 const arr=db.contracts||[];
 return v24Head('Contratos de alquiler','DOCUMENTOS','El contrato se prepara en una pantalla independiente. El Word generado es un borrador editable, no una firma ni registro notarial.')+
 `<div class="notice">${icon('shield',18)} <div>Revisa requisitos municipales y legales ecuatorianos. El documento debe ser revisado antes de firmarse. La aplicación no formaliza contratos automáticamente.</div></div>`+
 (db.tenants.length&&isManager()?`<div class="section-head"><h2 class="section-title">Crear contrato para</h2></div><div class="cards">${db.tenants.filter(t=>t.active).map(t=>`<div class="rent-card"><div class="rent-detail"><div class="rent-name">${escapeHtml(t.name)}</div><div class="rent-tenant">${escapeHtml(propertyById(t.propertyId)?.label||'—')} · Unidad ${escapeHtml(t.unitNumber||'—')}</div></div><button class="btn primary small-btn" data-action="new-contract" data-id="${attr(t.id)}">Crear</button></div>`).join('')}</div>`:'')+
 `<div class="section-head"><h2 class="section-title">Borradores guardados</h2></div>`+
 (arr.length?arr.map(c=>{let t=db.tenants.find(t=>t.id===c.tenantId),p=propertyById(c.propertyId);return `<div class="movement"><i>${icon('file',21)}</i><div style="flex:1"><div class="rent-name">${escapeHtml(t?.name||c.tenantName||'Sin nombre')}</div><div class="meta">${escapeHtml(p?.label||'—')} · ${escapeHtml(c.start||'—')} a ${escapeHtml(c.end||'—')}</div></div>${isManager()?`<button class="btn light small-btn" data-action="new-contract" data-id="${attr(c.tenantId)}">Editar</button>`:''}</div>`}).join(''):v24Empty('No hay contratos','Al registrar un inquilino podrás crear su contrato en un paso separado.'));
}
function reportsScreen(){return v24Head('Informes y exportaciones','FINANZAS','Exporta ingresos, gastos y saldos del período seleccionado.')+
 periodControl()+`<div class="setting-card"><h3>Informe Excel</h3><p>Hojas: Resumen, Ingresos, Gastos y Saldos. Identifica quién pagó, la unidad, la fecha y el período aplicado.</p><button class="btn primary" data-action="export-xlsx">${icon('export',16)} Exportar Excel</button></div>`+
 `<div class="setting-card"><h3>Respaldo JSON</h3><p>Conserva los registros de la app. Los archivos adjuntos de comprobantes almacenados localmente no van incluidos en el respaldo JSON de esta beta.</p><button class="btn outline" data-action="export-json">${icon('export',16)} Exportar respaldo</button></div>`+
 `<div class="setting-card"><h3>Resumen compartible</h3><p>Informe de texto con cifras del período.</p><button class="btn outline" data-action="share-report">${icon('chat',16)} Compartir resumen</button></div>`;}
function postTenantSaved(tenantId){
 const t=db.tenants.find(x=>x.id===tenantId);if(!t)return;
 modal('Inquilino registrado',`<div class="success-panel">${icon('check',28)}<h3>${escapeHtml(t.name)} ya está registrado</h3><p>¿Deseas preparar su contrato ahora? La elaboración del contrato se realiza en otra pantalla, con campos y cláusulas independientes.</p></div><div class="btn-row"><button class="btn primary" data-action="new-contract" data-id="${attr(t.id)}">Crear contrato ahora</button><button class="btn outline" data-action="finish-tenant">Hacerlo después</button></div>`,null);
}
function addOccupantModal(tenantId){
 const t=db.tenants.find(x=>x.id===tenantId);if(!t||!isManager())return toast('Selecciona un inquilino');
 modal('Añadir ocupante',`<div class="notice">Los ocupantes autorizados se vinculan al arrendamiento principal. No crean una deuda mensual independiente.</div><form id="occupant-form">${field('name','Nombre completo *','','text','required maxlength="120"')}${field('email','Correo para futura invitación','','email','maxlength="140"')}${field('phone','Teléfono','','tel','maxlength="30"')}<label class="small"><input type="checkbox" name="canSubmit" value="yes"> Permitir subir comprobantes cuando se habilite el acceso real</label><div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Guardar ocupante</button></div></form>`,()=>$('#occupant-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')||'').trim();if(!name)return toast('Escribe el nombre');db.occupants.push({id:id(),tenantId,propertyId:t.propertyId,name,email:String(f.get('email')||'').trim(),phone:String(f.get('phone')||'').trim(),canSubmit:f.get('canSubmit')==='yes',createdAt:new Date().toISOString()});if(!save())return;closeModal();nav('tenants');toast('Ocupante registrado sin canon independiente')}));
}
const v24FileDB={
 async conn(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('IndexedDB no disponible'));const req=indexedDB.open('tuaquiler_demo_receipts',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})},
 async put(key,file){let database=await this.conn();return new Promise((resolve,reject)=>{const tx=database.transaction('files','readwrite');tx.objectStore('files').put(file,key);tx.oncomplete=()=>{database.close();resolve(true)};tx.onerror=()=>{database.close();reject(tx.error)}})},
 async get(key){let database=await this.conn();return new Promise((resolve,reject)=>{const tx=database.transaction('files','readonly');const req=tx.objectStore('files').get(key);req.onsuccess=()=>{database.close();resolve(req.result)};req.onerror=()=>{database.close();reject(req.error)}})}
};
function receiptBadge(s){return s==='approved'?'<span class="status ok">Aprobado</span>':s==='rejected'?'<span class="status">Rechazado</span>':'<span class="status mid">Pendiente de revisión</span>'}
function receiptScreen(){
 const entries=(db.receipts||[]).slice().reverse();
 return v24Head('Comprobantes','REVISIÓN DE PAGOS','Ningún comprobante se contabiliza como pago hasta que la administración lo apruebe.')+
 `<div class="tip">Módulo local de pruebas. Para recibir archivos de otros teléfonos y enviar correos automáticamente se necesitan Firebase Storage, funciones de servidor y reglas por roles.</div>`+
 (entries.length?entries.map(r=>{const t=db.tenants.find(t=>t.id===r.tenantId),p=propertyById(r.propertyId);return `<article class="prop-card"><div class="prop-line"><div class="property-avatar">${icon('file',22)}</div><div style="flex:1"><div class="prop-title">${escapeHtml(r.tenantSnapshot||t?.name||'Inquilino')}</div><div class="prop-address">${escapeHtml(p?.label||'—')} · ${escapeHtml(r.unitSnapshot||'—')} · ${escapeHtml(r.period)}</div></div><div style="text-align:right"><b>${money(r.amount)}</b><div>${receiptBadge(r.status)}</div></div></div><div class="prop-address" style="margin-top:12px">${escapeHtml(r.fileName||'Archivo')} · ${escapeHtml(r.method||'Transferencia')} · ${escapeHtml(r.sentAt?.slice(0,10)||'—')}</div><div class="prop-actions"><button class="btn outline small-btn" data-action="download-receipt" data-id="${attr(r.id)}">Ver archivo</button>${r.status==='pending'&&isManager()?`<button class="btn primary small-btn" data-action="approve-receipt" data-id="${attr(r.id)}">Aprobar</button><button class="btn danger small-btn" data-action="reject-receipt" data-id="${attr(r.id)}">Rechazar</button>`:''}</div></article>`}).join(''):v24Empty('Sin comprobantes','Los comprobantes enviados en la demostración local aparecerán aquí.'));
}
function tenantPortalScreen(){
 if(isTeam())return v24Head('Portal de inquilino','PRÓXIMAMENTE','El acceso real por cuentas separadas requiere Firebase con permisos por arrendamiento.');
 const tenants=db.tenants.filter(t=>t.active),t=tenants.find(t=>t.id===state.portalTenantId)||tenants[0];
 if(t)state.portalTenantId=t.id;
 return v24Head('Vista de inquilino','DEMOSTRACIÓN LOCAL','Esta vista permite probar el flujo desde la cuenta del propietario. NO es un acceso privado de inquilinos.')+
 `<div class="notice">${icon('alert',18)} <div>Modo demostración: no compartas este acceso con inquilinos reales. No hay inicio de sesión separado ni envío automático de correos.</div></div>`+
 (!t?v24Empty('Sin inquilinos','Registra un inquilino activo para probar este portal.'):
 `<div class="field"><label for="portal-tenant">Simular vista de</label><select id="portal-tenant">${tenants.map(x=>`<option value="${attr(x.id)}" ${x.id===t.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>`+
 (()=>{let p=propertyById(t.propertyId),b=balanceOf(p);return `<div class="stat"><div class="topline">Unidad asignada</div><div class="val" style="font-size:20px">${escapeHtml(p?.label||'Inmueble')} · ${escapeHtml(t.unitNumber||p?.unitNumber||'—')}</div><div class="help">Próximo cobro: ${b.dueDay?escapeHtml(String(b.dueDay))+' de cada mes':'No definido'}</div></div><div class="stats"><div class="stat"><div class="topline">Canon mensual</div><div class="val">${b.rent===null?'—':money(b.rent)}</div></div><div class="stat"><div class="topline">Saldo del mes</div><div class="val">${b.pending===null?'—':money(b.pending)}</div></div></div>`})()+
 `<div class="setting-card"><h3>Enviar comprobante (prueba local)</h3><p>Adjunta un JPG, PNG o PDF de hasta 5 MB. Se guarda solamente en este dispositivo para probar la revisión; no se envía por correo.</p><button class="btn primary" data-action="submit-receipt-demo" data-id="${attr(t.id)}">${icon('upload',16)} Subir comprobante</button></div>`+
 `<div class="setting-card"><h3>Mis pagos</h3>${db.payments.filter(x=>x.tenantId===t.id).slice().reverse().map(x=>`<div class="movement"><div><b>${money(x.amount)}</b><div class="meta">${escapeHtml(x.period)} · ${escapeHtml(x.method||'Pago')}</div></div></div>`).join('')||'<p>Sin pagos registrados</p>'}</div>`+
 `<div class="setting-card"><h3>Mi contrato</h3><p>${db.contracts.some(c=>c.tenantId===t.id)?'Hay un borrador de contrato asociado. El acceso y descarga desde una cuenta real de inquilino se habilitará en la fase cloud.':'Aún no hay contrato guardado.'}</p></div>`);
}
function receiptDemoModal(tenantId){
 if(isTeam())return toast('La subida segura desde otra cuenta todavía requiere Firebase');
 const t=db.tenants.find(x=>x.id===tenantId);if(!t)return toast('Inquilino no encontrado');const p=propertyById(t.propertyId);const b=balanceOf(p);
 modal('Subir comprobante de prueba',`<div class="notice">Este archivo NO se enviará por correo. El documento queda en el almacenamiento de prueba de este dispositivo hasta que se habilite el servicio seguro.</div><form id="receipt-demo-form"><div class="stat"><div class="topline">Inquilino</div><b>${escapeHtml(t.name)} · ${escapeHtml(t.unitNumber||p?.unitNumber||'—')}</b></div>${field('period','Mes al que corresponde',state.period,'month','required')}${field('amount','Importe declarado (USD) *',b.pending??'','number','required min="0.01" step="0.01" max="99999999"')}<div class="field"><label>Método de pago</label><select name="method"><option>Transferencia</option><option>Depósito</option><option>Efectivo</option><option>Otro</option></select></div><div class="field"><label for="local-receipt-file">Comprobante JPG, PNG o PDF *</label><input id="local-receipt-file" name="attachment" type="file" required accept="image/jpeg,image/png,application/pdf"></div><div class="field"><label>Nota</label><textarea name="note" maxlength="280" placeholder="Referencia u observación"></textarea></div><div class="form-actions"><button class="btn light" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Enviar a revisión local</button></div></form>`,()=>$('#receipt-demo-form').addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.target),file=f.get('attachment'),amount=optionalRent(f.get('amount')),period=String(f.get('period')||'');
  if(!(file instanceof File)||file.size===0||file.size>5*1024*1024||!['image/jpeg','image/png','application/pdf'].includes(file.type))return toast('Adjunta JPG, PNG o PDF de máximo 5 MB');
  if(amount===null||Number.isNaN(amount)||!/^[0-9]{4}-[0-9]{2}$/.test(period))return toast('Revisa importe y período');
  const receipt={id:id(),tenantId:t.id,tenantSnapshot:t.name,unitSnapshot:t.unitNumber||p?.unitNumber||'',propertyId:p.id,period,amount,method:String(f.get('method')),note:String(f.get('note')||'').trim(),fileName:file.name.slice(0,130),contentType:file.type,sentAt:new Date().toISOString(),status:'pending'};
  try{await v24FileDB.put(receipt.id,file);db.receipts.push(receipt);if(!save()){db.receipts.pop();return}closeModal();nav('receipts');toast('Comprobante de prueba pendiente de revisión')}catch(err){toast('No se pudo guardar el archivo en este dispositivo')}
 }));
}
function receiptAction(action,rid){
 if(isTeam())return toast('Esta función local no está habilitada para equipo');
 const r=db.receipts.find(r=>r.id===rid);if(!r)return toast('Comprobante no encontrado');
 if(action==='download-receipt'){v24FileDB.get(r.id).then(f=>{if(!f)return toast('Archivo no disponible en este dispositivo');saveOfficeFile(r.fileName,f,r.contentType)}).catch(()=>toast('No se pudo abrir el archivo'));return;}
 if(!isManager())return toast('Solo la administración puede revisar');
 if(r.status!=='pending')return toast('Este comprobante ya fue revisado');
 if(action==='approve-receipt'){
  if(!confirm('Confirma primero que el dinero realmente fue recibido en tu cuenta. ¿Aprobar y registrar este pago?'))return;
  if(db.payments.some(p=>p.sourceReceiptId===r.id))return toast('Este comprobante ya fue contabilizado');
  const p=propertyById(r.propertyId),t=db.tenants.find(t=>t.id===r.tenantId);
  if(!p||!t)return toast('No se encontró el arrendamiento asociado');
  const payment={id:id(),propertyId:p.id,tenantId:t.id,tenantSnapshot:r.tenantSnapshot,unitSnapshot:r.unitSnapshot,propertySnapshot:p.label,amount:r.amount,date:today(),period:r.period,method:r.method,note:(r.note||'')+' · Comprobante local validado',sourceReceiptId:r.id,recordedBy:authState.email||'Propietario (local)',example:false};
  r.status='approved';r.reviewedAt=new Date().toISOString();r.reviewedBy=authState.email||'Propietario local';r.paymentId=payment.id;db.payments.push(payment);
  if(!save()){db.payments.pop();r.status='pending';delete r.paymentId;return}render();toast('Pago confirmado e incorporado al historial');return;
 }
 if(action==='reject-receipt'){
  const note=prompt('Motivo del rechazo (obligatorio):','');if(note===null)return;
  if(!note.trim())return toast('Indica el motivo de rechazo');r.status='rejected';r.reviewNote=note.trim().slice(0,280);r.reviewedAt=new Date().toISOString();if(!save()){r.status='pending';return}render();toast('Comprobante rechazado');
 }
}
render = function(){
  v24LegacyRender();
  if(document.querySelector('.app').hidden){drawerClose();return}
  let html=null;
  if(state.screen==='units')html=unitsScreen();
  else if(state.screen==='tenants')html=tenantsScreen();
  else if(state.screen==='contracts')html=contractsScreen();
  else if(state.screen==='reports')html=reportsScreen();
  else if(state.screen==='receipts')html=receiptScreen();
  else if(state.screen==='tenant-portal')html=tenantPortalScreen();
  if(html!==null)$('#main').innerHTML=html;
  // La navegación inferior existente permanece solo como contenedor técnico oculto.
  $('#nav').hidden=true;renderSideMenu();
  const heading=$('#main h1.heading');document.title='TÚAquiler · '+(heading?.textContent||'Administración');
  // En equipo se respetan los permisos originales y se prohíben opciones locales no autorizadas.
  if(isTeam()&&!isManager())$('#main').querySelectorAll('[data-action="add-occupant"],[data-action="new-contract"]').forEach(el=>el.remove());
};
nav = function(screen){drawerClose();if(isTeam()&&!isManager()&&['contracts','expenses','receipts','reports'].includes(screen))return toast('No tienes permiso para abrir esta sección');v24LegacyNav(screen)};
handleAction = function(action,el){
 const rid=el.dataset.id;
 if(action==='open-drawer')return drawerOpen();
 if(action==='close-drawer')return drawerClose();
 if(action==='finish-tenant'){closeModal();return nav('tenants')}
 if(action==='new-contract'&&$('#modal').open)closeModal();
 if(action==='add-occupant')return addOccupantModal(rid);
 if(action==='submit-receipt-demo')return receiptDemoModal(rid);
 if(['download-receipt','approve-receipt','reject-receipt'].includes(action))return receiptAction(action,rid);
 return v24LegacyAction(action,el);
};
$('#drawer-overlay').addEventListener('click',drawerClose);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.v24Menu){drawerClose();e.preventDefault()}});
document.addEventListener('change',e=>{if(e.target.id==='portal-tenant'){state.portalTenantId=e.target.value;render()}});
const v24PreviousBack=window.appBack;
window.appBack=()=>{if(state.v24Menu){drawerClose();return true}return v24PreviousBack()};
// TÚAquiler 2.6 — edificios con unidades independientes, migración no destructiva y alta guiada.
// Compatibilidad: db.properties continúa representando UNIDADES para conservar propertyId
// en pagos, gastos, contratos y comprobantes de versiones anteriores.
function migrateBuildings(){
  if(!Array.isArray(db.buildings))db.buildings=[];
  const canonical=v=>String(v||'').trim().toLocaleLowerCase('es');
  for(const u of db.properties){
    let building=db.buildings.find(b=>b.id===u.buildingId);
    if(!building)building=db.buildings.find(b=>canonical(b.name)===canonical(u.label)&&canonical(b.address)===canonical(u.address));
    if(!building){building={id:id(),name:String(u.label||'Inmueble').trim(),type:'Edificio / inmueble',address:String(u.address||'').trim(),city:'',notes:'',createdAt:new Date().toISOString(),fromLegacy:true};db.buildings.push(building)}
    u.buildingId=building.id;
    if(!u.unitNumber)u.unitNumber='Principal';
  }
  db.version=Math.max(5,Number(db.version)||0);
}
const v26PriorMigration=migrateDB;
migrateDB=function(){v26PriorMigration();migrateBuildings()};
const v26PriorSave=save;
save=function(){migrateBuildings();return v26PriorSave()};
migrateBuildings();
function buildingById(buildingId){return db.buildings.find(b=>b.id===buildingId)}
function unitsIn(buildingId){return db.properties.filter(p=>p.buildingId===buildingId)}
function availableUnitsForBuilding(buildingId){return freeUnits().filter(p=>p.buildingId===buildingId)}
function setupStep(){if(!db.buildings.length)return 1;if(!hasAvailableUnit())return 2;if(!db.tenants.some(t=>isCurrentlyActiveTenant(t))&&!db.onboardingSkipped)return 3;return 4}
function setupScreen(){
  const step=setupStep();
  const heading=v24Head('Configura tus alquileres','EMPEZAR EN TÚAQUILER','Los registros siguen un orden para evitar inquilinos sin inmueble o departamento.');
  const progressButton=(label,screen,available,done)=>available?`<button type="button" class="setup-step ${done?'now':''}" data-screen="${screen}" aria-label="Volver a ${label}">${label}</button>`:`<span>${label}</span>`;
  const steps=`<div class="setup-progress" aria-label="Etapas del registro">${progressButton('1. Inmueble','properties',db.buildings.length>0,step>=1)}${progressButton('2. Unidad','units',db.buildings.length>0,step>=2)}${progressButton('3. Inquilino','tenants',db.properties.length>0,step>=3)}<span>4. Contrato</span></div>`;
  if(step===1)return heading+steps+`<section class="setup-stage"><b>Paso 1 · Registra tu primer inmueble</b><p>Indica el nombre del edificio, casa o conjunto y su ubicación. Aquí no se asignan precios ni se registran personas todavía.</p><button class="btn primary" data-action="new-property">${icon('plus',17)} Registrar inmueble</button></section>`;
  if(step===2)return heading+steps+`<section class="setup-stage"><b>Paso 2 · Agrega un departamento o unidad</b><p>${escapeHtml(db.buildings[0].name)} ya está registrado. Ahora identifica el departamento, habitación o local que podrás alquilar. Cada unidad tendrá su propio canon de referencia y día de cobro opcionales.</p><button class="btn primary" data-action="new-unit" data-id="${attr(db.buildings[0].id)}">${icon('plus',17)} Agregar primera unidad</button><button class="btn outline" data-screen="properties">← Volver a inmuebles</button></section>`;
  if(step===3)return heading+steps+`<section class="setup-stage"><b>Paso 3 · Registra el primer inquilino</b><p>Ya tienes ${db.properties.filter(p=>!p.archivedAt).length} unidades. Asigna a una persona solamente a un departamento disponible. Después podrás crear su contrato en una pantalla aparte.</p><button class="btn primary" data-action="new-tenant">${icon('plus',17)} Registrar inquilino</button><button class="btn outline" data-screen="units">← Volver a departamentos</button><button class="btn light" data-screen="properties">Editar inmueble</button><button class="btn light" data-action="skip-tenant">Todavía no tengo inquilinos</button></section>`;
  return heading+`<section class="setup-stage"><b>¡Configuración lista!</b><p>Puedes ver cobros, gastos e informes en tu panel de administración.</p><button class="btn primary" data-screen="home">Abrir inicio</button></section>`;
}
function buildingModal(buildingId){
 if(!isManager())return toast('No tienes permiso para modificar inmuebles');
 const b=buildingId?buildingById(buildingId):null;
 if(buildingId&&!b)return toast('Inmueble no encontrado');
 const body=`<form id="building-form"><div class="setup-stage"><b>Inmueble / edificio</b><p>Registra el inmueble principal; sus departamentos se añadirán por separado.</p></div>${field('name','Nombre del inmueble *',b?.name||'','text','required maxlength="100" placeholder="Ej. Condominio Adán"')}<div class="field"><label for="f-buildingType">Tipo de inmueble *</label><select name="buildingType" id="f-buildingType">${['Edificio / condominio','Casa','Conjunto habitacional','Local comercial','Otro'].map(t=>`<option ${b?.type===t?'selected':''}>${t}</option>`).join('')}</select></div>${field('address','Dirección del inmueble *',b?.address||'','text','required maxlength="220"')}${field('city','Ciudad (opcional)',b?.city||'','text','maxlength="90"')}${field('notes','Observaciones (opcional)',b?.notes||'','text','maxlength="260"')}<p class="hint">Aquí no se registra el inquilino ni se fija un canon obligatorio. Cada unidad tendrá sus propias condiciones.</p><div class="form-actions"><button class="btn light" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">${b?'Guardar inmueble':'Crear inmueble'}</button></div></form>`;
 modal(b?'Editar inmueble':'Nuevo inmueble',body,()=>$('#building-form').addEventListener('submit',e=>{
  e.preventDefault();const fd=new FormData(e.target);const name=String(fd.get('name')||'').trim(),address=String(fd.get('address')||'').trim();
  if(!name||!address)return toast('Completa nombre y dirección');
  if(db.buildings.some(x=>x.id!==b?.id&&x.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es')&&x.address.toLocaleLowerCase('es')===address.toLocaleLowerCase('es')))return toast('Ese inmueble ya está registrado');
  const item={id:b?.id||id(),name,address,type:String(fd.get('buildingType')||'Edificio / condominio'),city:String(fd.get('city')||'').trim(),notes:String(fd.get('notes')||'').trim(),createdAt:b?.createdAt||new Date().toISOString()};
  if(b){Object.assign(b,item);for(const p of unitsIn(b.id)){p.label=name;p.address=address}}else db.buildings.push(item);
  if(!save())return;closeModal();nav(b?'properties':'setup');toast(b?'Inmueble actualizado':'Inmueble registrado; agrega sus unidades');
 }));
}
function unitModal(unitId,buildingId){
 if(!isManager())return toast('No tienes permiso para modificar departamentos');
 if(!db.buildings.length){toast('Primero debes registrar el inmueble');return nav('setup')}
 const p=unitId?propertyById(unitId):null;
 if(unitId&&!p)return toast('Unidad no encontrada');
 const first=buildingById(p?.buildingId||buildingId)||db.buildings[0];
 const choices=db.buildings.map(b=>`<option value="${attr(b.id)}" ${b.id===first.id?'selected':''}>${escapeHtml(b.name)}</option>`).join('');
 const body=`<form id="unit-form"><div class="setup-stage"><b>Unidad independiente</b><p>Registra el número del departamento, habitación, casa o local. Los cobros se vincularán exclusivamente a esta unidad.</p></div><div class="field"><label for="f-buildingId">Inmueble al que pertenece *</label><select name="buildingId" id="f-buildingId" required ${p?'disabled':''}>${choices}</select></div>${field('unitNumber','Número o nombre de unidad *',p?.unitNumber==='Principal'?'Principal':p?.unitNumber||'','text','required maxlength="35" placeholder="Ej. 101, 22, Local A"')}<div class="field"><label for="f-unitType">Tipo de unidad</label><select id="f-unitType" name="unitType">${['Departamento','Casa','Habitación','Local comercial','Oficina','Otro'].map(t=>`<option ${p?.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="form-row">${field('rent','Canon de referencia (USD, opcional)',p?.rent??'','number','min="0.01" step="0.01" placeholder="Por definir"')}${field('dueDay','Día de cobro de referencia (opcional)',p?.dueDay??'','number','min="1" max="31" step="1" placeholder="Por definir"')}</div><p class="hint">La cifra pactada con cada arrendatario se registra posteriormente en su propia ficha.</p><div class="form-actions"><button type="button" class="btn light" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">${p?'Guardar unidad':'Crear unidad'}</button></div></form>`;
 modal(p?'Editar departamento / unidad':'Nueva unidad / departamento',body,()=>$('#unit-form').addEventListener('submit',e=>{
  e.preventDefault();const fd=new FormData(e.target),b=buildingById(p?.buildingId||String(fd.get('buildingId')));
  const unitNumber=String(fd.get('unitNumber')||'').trim(),rent=optionalRent(fd.get('rent')),dueDay=optionalDay(fd.get('dueDay'));
  if(!b||!unitNumber)return toast('Selecciona un inmueble e indica el departamento');
  if(Number.isNaN(rent)||Number.isNaN(dueDay))return toast('Revisa el canon o día de cobro');
  if(unitsIn(b.id).some(u=>u.id!==p?.id&&u.unitNumber.toLocaleLowerCase('es')===unitNumber.toLocaleLowerCase('es')))return toast('Este número de departamento ya existe en el inmueble');
  const item={id:p?.id||id(),buildingId:b.id,label:b.name,address:b.address,unitNumber,type:String(fd.get('unitType')||'Departamento'),rent,dueDay,startPeriod:p?.startPeriod||periodNow(),archivedAt:p?.archivedAt||null,example:p?.example||false};
  if(p){Object.assign(p,item);for(const t of db.tenants.filter(t=>t.propertyId===p.id))t.unitNumber=unitNumber}else db.properties.push(item);
  if(!save())return;closeModal();nav(p?'units':'setup');toast(p?'Unidad actualizada':'Unidad agregada. Ya puedes asignar inquilinos');
 }));
}
function buildingScreen(){
 const bList=db.buildings;
 const head=v24Head('Mis inmuebles','PORTAFOLIO','Primero registra el inmueble y después sus unidades o departamentos.');
 return head+(isManager()?`<button class="btn primary" data-action="new-property">${icon('plus',16)} Nuevo inmueble</button>`:'')+
 (bList.length?bList.map(b=>{const units=unitsIn(b.id),open=availableUnitsForBuilding(b.id);
  return `<article class="prop-card"><div class="prop-line"><div class="property-avatar">${icon('building',23)}</div><div><div class="prop-title">${escapeHtml(b.name)}</div><div class="prop-address">${escapeHtml(b.address||'Sin dirección')} ${b.city?' · '+escapeHtml(b.city):''}</div></div></div><div class="prop-meta"><div><div class="meta-label">Unidades</div><div class="meta-value">${units.length}</div></div><div><div class="meta-label">Disponibles</div><div class="meta-value">${open.length}</div></div></div>${isManager()?`<div class="prop-actions"><button class="btn primary small-btn" data-action="new-unit" data-id="${attr(b.id)}">+ Añadir unidad</button><button class="btn light small-btn" data-action="edit-building" data-id="${attr(b.id)}">Editar inmueble</button></div>`:''}</article>`}).join(''):empty('building','Todavía no hay inmuebles','Registra primero el edificio, casa o conjunto. Luego agrega departamentos.','Registrar primer inmueble','new-property'));
}
function independentUnitsScreen(){
 const head=v24Head('Departamentos y unidades','UNIDADES','Cada unidad pertenece a un inmueble y puede tener precio y fecha de cobro distintos.');
 if(!db.buildings.length)return head+`<div class="setup-stage"><b>Paso 1 · No hay inmuebles</b><p>Registra primero un inmueble para poder añadir departamentos.</p><button class="btn primary" data-action="new-property">Registrar inmueble</button></div>`;
 return head+(isManager()?`<button class="btn primary" data-action="new-unit">${icon('plus',16)} Añadir unidad / departamento</button>`:'')+
 (db.properties.length?db.properties.map(p=>{const b=buildingById(p.buildingId),t=db.tenants.find(t=>t.propertyId===p.id&&isCurrentlyActiveTenant(t));return `<article class="prop-card"><div class="prop-title">${escapeHtml(b?.name||p.label)} · ${escapeHtml(p.unitNumber||'Principal')}</div><p class="prop-address">${escapeHtml(b?.address||p.address||'')}</p><div class="prop-meta"><div><div class="meta-label">Situación actual</div><div class="meta-value">${escapeHtml(t?.name||'Disponible')}</div></div><div><div class="meta-label">Canon de referencia</div><div class="meta-value">${p.rent===null?'Opcional':money(p.rent)}</div></div></div>${isManager()?`<div class="prop-actions"><button class="btn light small-btn" data-action="edit-unit" data-id="${attr(p.id)}">Editar unidad</button>${!t?`<button class="btn primary small-btn" data-action="new-tenant" data-id="${attr(p.id)}">Registrar inquilino</button>`:`<button class="btn outline small-btn" data-action="edit-tenant" data-id="${attr(t.id)}">Ver inquilino</button>`}</div>`:''}</article>`}).join(''):`<div class="setup-stage"><b>Paso 2 · Agrega la primera unidad</b><p>Por ejemplo, el departamento 101 del inmueble que acabas de crear.</p><button class="btn primary" data-action="new-unit" data-id="${attr(db.buildings[0].id)}">Agregar primera unidad</button></div>`);
}
const v26PriorAction=handleAction;
handleAction=function(action,el){
 const rid=el?.dataset?.id||'';
 if(action==='new-property')return buildingModal();
 if(action==='edit-building'||action==='edit-property')return buildingModal(action==='edit-building'?rid:buildingById(propertyById(rid)?.buildingId)?.id);
 if(action==='new-unit')return unitModal(null,rid);
 if(action==='edit-unit')return unitModal(rid);
 if(action==='skip-tenant'){db.onboardingSkipped=true;if(!save())return;return nav('home')}
 if(action==='new-tenant'&&!freeUnits().length){toast(db.buildings.length?'Agrega una unidad disponible para registrar al inquilino':'Primero registra un inmueble');return nav(db.buildings.length?'units':'setup')}
 if(action==='finish-tenant'){db.onboardingSkipped=true;save();closeModal();return nav('home')}
 return v26PriorAction(action,el);
};
const v26PriorRender=render;
render=function(){
 if(state.screen==='home'&&setupStep()<4&&isManager())state.screen='setup';
 v26PriorRender();
 if(document.querySelector('.app').hidden)return;
 if(state.screen==='setup')$('#main').innerHTML=setupScreen();
 else if(state.screen==='properties')$('#main').innerHTML=buildingScreen();
 else if(state.screen==='units')$('#main').innerHTML=independentUnitsScreen();
 renderSideMenu();$('#nav').hidden=true;
 const h=$('#main h1.heading');document.title='TÚAquiler · '+(h?.textContent||'Administración');
};
const v26PriorNav=nav;
nav=function(screen){
 if(screen==='home'&&setupStep()<4&&isManager())screen='setup';
 return v26PriorNav(screen);
};
// La versión anterior mostraba acceso a inquilinos si existía CUALQUIER unidad,
// aunque todas estuvieran ocupadas. No se permiten dos ocupaciones activas simultáneas.
const v26PriorTenantsScreen=tenantsScreen;
tenantsScreen=function(){
 if(!db.buildings.length)return v24Head('Inquilinos y ocupantes','PASO INICIAL','Primero debes registrar un inmueble.')+`<div class="setup-stage"><b>Paso 1 · Nuevo inmueble</b><p>El registro de inquilinos se habilitará después de crear una unidad libre.</p><button class="btn primary" data-action="new-property">Registrar inmueble</button></div>`;
 if(!hasAvailableUnit())return v24Head('Inquilinos y ocupantes','PASO INICIAL','Antes de registrar una persona, añade un departamento.')+`<div class="setup-stage"><b>Paso 2 · Agrega una unidad</b><button class="btn primary" data-action="new-unit" data-id="${attr(db.buildings[0].id)}">Agregar primera unidad</button></div>`;
 let html=v26PriorTenantsScreen();
 if(!freeUnits().length)html=html.replace(/<button class="btn primary" data-action="new-tenant">[\s\S]*?<\/button>/,'');
 return html;
};
const v26PriorHome=home;
home=function(){if(setupStep()<4&&isManager())return setupScreen();return v26PriorHome()};
// Subir versionCode evita que Android considere la actualización idéntica a 2.4.
render();

// TÚAquiler 2.7 — protección definitiva del alta inicial.
// La navegación y las operaciones se validan nuevamente en la interfaz;
// la mera presencia de un botón antiguo nunca habilita un inquilino sin unidad.
const BUILD_TAG='2.8.2';
function preRegistrationStatus(){
  if(!Array.isArray(db.buildings)||db.buildings.length===0)return 'building';
  if(!Array.isArray(db.properties)||!db.properties.some(p=>!p.archivedAt))return 'unit';
  return 'ready';
}
function onboardingRouteIsAllowed(screen){
  const stage=preRegistrationStatus();
  if(stage==='ready')return true;
  if(stage==='building')return ['setup','properties','settings','plans','collaborators'].includes(screen);
  return ['setup','properties','units','settings','plans','collaborators'].includes(screen);
}
function normalizedFirstScreen(screen){
  if(!isManager()||preRegistrationStatus()==='ready')return screen;
  return onboardingRouteIsAllowed(screen)?screen:'setup';
}
const v27PreviousNav=nav;
nav=function(screen){return v27PreviousNav(normalizedFirstScreen(screen))};
const v27PreviousRender=render;
render=function(){
  if(isManager())state.screen=normalizedFirstScreen(state.screen);
  v27PreviousRender();
  const appVisible=!document.querySelector('.app').hidden;
  if(appVisible){
    const status=$('.top-chip');
    if(status)status.textContent=(isTeam()?'Equipo':'Datos locales')+' · v'+BUILD_TAG;
  }else{
    const wrap=document.querySelector('#auth .auth-wrap');
    if(wrap){
      const el=document.createElement('p');
      el.className='auth-notice version-build';
      el.textContent='TÚAquiler v'+BUILD_TAG+' · versión de prueba';
      wrap.appendChild(el);
    }
  }
};
const v27PreviousMenu=renderSideMenu;
renderSideMenu=function(){
  v27PreviousMenu();
  const stage=preRegistrationStatus();
  const links=$('#drawer-links');
  if(!links)return;
  if(isManager()&&stage!=='ready'){
    links.querySelectorAll('[data-screen]').forEach(btn=>{
      if(!onboardingRouteIsAllowed(btn.dataset.screen))btn.remove();
    });
    const info=document.createElement('div');
    info.className='drawer-sep';
    const explanation=document.createElement('p');
    explanation.className='small muted';
    explanation.style.padding='4px 17px 12px';
    explanation.textContent=stage==='building'?'Paso obligatorio: registra tu primer inmueble.':'Paso obligatorio: añade una unidad al inmueble.';
    links.prepend(info,explanation);
  }
};
const v27PreviousAction=handleAction;
handleAction=function(action,el){
  const stage=preRegistrationStatus();
  if(['new-tenant','new-payment','new-contract','add-occupant','submit-receipt-demo'].includes(action)&&stage!=='ready'){
    toast(stage==='building'?'Primero registra un inmueble.':'Primero añade un departamento o unidad.');
    return nav('setup');
  }
  if(action==='new-payment'&&!db.tenants.some(isCurrentlyActiveTenant)){
    toast('Para registrar un pago, primero registra un inquilino activo.');
    return nav('tenants');
  }
  return v27PreviousAction(action,el);
};
// En el asistente, la tecla Atrás de Android permite regresar a pantallas ya completadas.
const previousBackAction=window.appBack;
window.appBack=()=>{
  if(!$('#form-page').hidden||$('#modal').open)return previousBackAction();
  if(state.screen==='setup'){
    const step=setupStep();
    if(step===3){nav('units');return true}
    if(step===2){nav('properties');return true}
  }
  if(state.screen==='units'&&setupStep()<4){nav('properties');return true}
  if(state.screen==='properties'&&setupStep()<4){nav('setup');return true}
  return previousBackAction();
};
// Aplicar las protecciones inmediatamente al abrir la app, incluso con
// datos locales de versiones anteriores o una sesión restaurada.
render();

})();
