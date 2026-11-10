package ec.tuaquiler.app;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FirebaseFirestoreSettings;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.firestore.WriteBatch;
import org.json.JSONArray;
import org.json.JSONObject;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Firestore team access. Never store service-account keys in the app.
 * Every mutation must pass firestore.rules, including calls forged from WebView.
 * This is a beta; concurrent edits to non-payment records use last-write-wins.
 */
public final class TeamBridge {
  private final Activity activity;
  private final WebView view;
  private final FirebaseAuth auth;
  private final FirebaseFirestore store;
  private final List<ListenerRegistration> listeners = new ArrayList<>();
  private ListenerRegistration memberListener;
  private String workspaceId="", role="";
  private final SecureRandom random = new SecureRandom();

  public TeamBridge(Activity activity, WebView view, FirebaseApp app, FirebaseAuth auth) {
    this.activity=activity;this.view=view;this.auth=auth;
    this.store=app==null?null:FirebaseFirestore.getInstance(app);
    // En modo equipo, evita guardar contratos y documentos en caché persistente del dispositivo.
    // Sin conexión se debe usar modo local independiente, no dar por recibidos cobros compartidos.
    if(this.store!=null){
      FirebaseFirestoreSettings settings=new FirebaseFirestoreSettings.Builder()
        .setPersistenceEnabled(false).build();
      this.store.setFirestoreSettings(settings);
    }
  }
  private FirebaseUser user(){return auth==null?null:auth.getCurrentUser();}
  private boolean verified(){FirebaseUser u=user();return u!=null&&u.isEmailVerified();}
  private String uid(){FirebaseUser u=user();return u==null?"":u.getUid();}
  private boolean manager(){return "owner".equals(role)||"admin".equals(role);}
  private Map<String,Object> map(Object...args){Map<String,Object> m=new HashMap<>();for(int i=0;i<args.length;i+=2)m.put((String)args[i],args[i+1]);return m;}
  private void emit(JSONObject o){activity.runOnUiThread(()->{if(view!=null)view.evaluateJavascript("window.tuaTeamEvent && window.tuaTeamEvent("+JSONObject.quote(o.toString())+")",null);});}
  private void event(String type,String key,Object value){try{JSONObject o=new JSONObject();o.put("type",type);o.put(key,value);emit(o);}catch(Exception ignored){}}
  private void error(String msg){event("error","message",msg);}
  private void fail(Exception ex){error(ex==null?"No se completó la operación en Firebase":ex.getClass().getSimpleName()+": "+String.valueOf(ex.getMessage()).substring(0,Math.min(140,String.valueOf(ex.getMessage()).length())));}
  private DocumentReference ws(String id){return store.collection("workspaces").document(id);}
  private void clearListeners(){clearDataListeners();if(memberListener!=null){memberListener.remove();memberListener=null;}}
  private String randomCode(){byte[] b=new byte[18];random.nextBytes(b);StringBuilder sb=new StringBuilder();for(byte x:b)sb.append(String.format("%02x",x&0xff));return sb.toString();}

  @JavascriptInterface public void startWorkspace(String dataJson){
    if(store==null||!verified()) {error("Para colaborar, configura Firebase, inicia sesión y verifica tu correo.");return;}
    if(dataJson==null||dataJson.length()>700000){error("Datos demasiado grandes para activar colaboración. Exporta un respaldo.");return;}
    String ownerUid=uid();
    DocumentReference w=ws(ownerUid);
    w.get().addOnSuccessListener(doc->{
      if(doc.exists()){enterWorkspace(ownerUid);return;}
      try {
        JSONObject data=new JSONObject(dataJson);
        String full=buildState(data,false),publicView=buildState(data,true);
        WriteBatch batch=store.batch();
        batch.set(w,map("ownerUid",ownerUid,"createdAt",FieldValue.serverTimestamp(),"name","Mi administración"));
        batch.set(w.collection("members").document(ownerUid),map("uid",ownerUid,"email",user().getEmail(),"role","owner","status","active"));
        batch.set(w.collection("state").document("full"),map("json",full,"updatedAt",FieldValue.serverTimestamp()));
        batch.set(w.collection("state").document("public"),map("json",publicView,"updatedAt",FieldValue.serverTimestamp()));
        JSONArray payments=data.optJSONArray("payments");
        if(payments!=null&&payments.length()>300){error("Para activar colaboración, reduce el tamaño de los registros o solicita migración asistida.");return;}
        if(payments!=null)for(int i=0;i<payments.length();i++){
          JSONObject p=payments.optJSONObject(i);if(p!=null&&p.has("id")){
            String paymentId=p.optString("id","");if(!paymentId.matches("[a-zA-Z0-9_-]{8,80}"))continue;
            p.put("recordedByUid",ownerUid);
            p.put("recordedBy","Importado por "+user().getEmail());
            batch.set(w.collection("payments").document(paymentId),map("json",p.toString(),"recordedByUid",ownerUid,"recordedByEmail",user().getEmail(),"imported",true,"createdAt",FieldValue.serverTimestamp()));
          }
        }
        batch.commit().addOnSuccessListener(v->enterWorkspace(ownerUid)).addOnFailureListener(this::fail);
      }catch(Exception ex){fail(ex);}
    }).addOnFailureListener(this::fail);
  }
  private String buildState(JSONObject data,boolean limited)throws Exception{
    JSONObject output=new JSONObject();
    output.put("version",data.optInt("version",3));
    output.put("properties",data.optJSONArray("properties")!=null?data.getJSONArray("properties"):new JSONArray());
    JSONArray tenants=data.optJSONArray("tenants");
    if(tenants==null)tenants=new JSONArray();
    if(limited){
      JSONArray sanitized=new JSONArray();
      for(int i=0;i<tenants.length();i++){
        JSONObject src=tenants.optJSONObject(i);if(src==null)continue;
        JSONObject o=new JSONObject(src.toString());
        o.remove("idNumber");o.remove("email");o.remove("deposit");
        sanitized.put(o);
      }
      output.put("tenants",sanitized);output.put("expenses",new JSONArray());output.put("contracts",new JSONArray());output.put("profile",new JSONObject());
    }else{
      output.put("tenants",tenants);
      output.put("expenses",data.optJSONArray("expenses")!=null?data.getJSONArray("expenses"):new JSONArray());
      output.put("contracts",data.optJSONArray("contracts")!=null?data.getJSONArray("contracts"):new JSONArray());
      output.put("profile",data.optJSONObject("profile")!=null?data.getJSONObject("profile"):new JSONObject());
    }
    return output.toString();
  }
  @JavascriptInterface public void enterWorkspace(String wid){
    if(store==null||user()==null||wid==null||!wid.matches("[A-Za-z0-9_-]{8,160}")){error("Inicia sesión para ver la administración compartida");return;}
    leaveInternal();
    DocumentReference w=ws(wid);
    memberListener=w.collection("members").document(uid()).addSnapshotListener((snapshot,ex)->{
      if(ex!=null){fail(ex);leaveInternal();event("revoked","message","No se pudo verificar tu permiso; el espacio compartido se cerró.");return;}
      if(snapshot==null||!snapshot.exists()||!"active".equals(snapshot.getString("status"))){leaveInternal();event("revoked","message","Tu acceso fue revocado o todavía no está activo.");return;}
      String newRole=snapshot.getString("role");if(newRole==null||!(newRole.equals("owner")||newRole.equals("admin")||newRole.equals("collector")||newRole.equals("reader"))){leaveInternal();return;}
      if(!wid.equals(workspaceId)||!newRole.equals(role)){
        // Keep the membership watcher while rebuilding the data subscriptions.
        workspaceId=wid;role=newRole;
        clearDataListeners();
        event("joined","workspaceId",wid);
        event("role","role",role);
        String docName=manager()?"full":"public";
        listeners.add(w.collection("state").document(docName).addSnapshotListener((doc,e)->{
          if(e!=null){fail(e);return;}
          if(doc!=null&&doc.exists())event("data","json",doc.getString("json")!=null?doc.getString("json"):"{}");
        }));
        listeners.add(w.collection("payments").addSnapshotListener((snap,e)->{
          if(e!=null){fail(e);return;}
          JSONArray all=new JSONArray();if(snap!=null)for(DocumentSnapshot d:snap.getDocuments()){
            try{
              String json=d.getString("json");if(json==null)continue;
              JSONObject record=new JSONObject(json);
              // La autoría visible proviene de metadatos protegidos por reglas, no del JSON editable.
              String auditUid=d.getString("recordedByUid");String auditEmail=d.getString("recordedByEmail");
              record.put("recordedByUid",auditUid==null?"":auditUid);
              if(Boolean.TRUE.equals(d.getBoolean("imported")))
                record.put("recordedBy","Importado por "+(auditEmail==null?"propietario":auditEmail));
              else record.put("recordedBy",auditEmail==null?"Sin autor verificado":auditEmail);
              all.put(record);
            }catch(Exception ignored){}
          }
          event("payments","json",all.toString());
        }));
        if("owner".equals(role)){
          listeners.add(w.collection("members").addSnapshotListener((snap,e)->{
            if(e!=null){fail(e);return;}
            JSONArray all=new JSONArray();if(snap!=null)for(DocumentSnapshot d:snap.getDocuments()){
              try{JSONObject m=new JSONObject();m.put("uid",d.getId());m.put("email",d.getString("email"));m.put("role",d.getString("role"));m.put("status",d.getString("status"));all.put(m);}catch(Exception ignored){}
            }
            event("members","json",all.toString());
          }));
          listeners.add(store.collection("invites").whereEqualTo("createdBy",uid()).addSnapshotListener((snap,e)->{
            if(e!=null){fail(e);return;}
            JSONArray all=new JSONArray();if(snap!=null)for(DocumentSnapshot d:snap.getDocuments()){
              try{JSONObject m=new JSONObject();m.put("code",d.getId());m.put("email",d.getString("email"));m.put("role",d.getString("role"));m.put("status",d.getString("status"));all.put(m);}catch(Exception ignored){}
            }
            event("invites","json",all.toString());
          }));
        }
      }
    });
  }
  private void clearDataListeners(){for(ListenerRegistration l:listeners)l.remove();listeners.clear();}
  private void leaveInternal(){clearListeners();workspaceId="";role="";}
  @JavascriptInterface public void leaveWorkspace(){leaveInternal();event("left","message","Vista local activada");}

  @JavascriptInterface public void invite(String email,String invitedRole){
    if(!"owner".equals(role)||!verified()||store==null){error("Solo el propietario puede invitar desde una cuenta verificada");return;}
    if(email==null||!email.trim().toLowerCase().matches("^[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$")||email.length()>180){error("Correo del colaborador inválido");return;}
    if(!("admin".equals(invitedRole)||"collector".equals(invitedRole)||"reader".equals(invitedRole))){error("Permiso no válido");return;}
    String code=randomCode(),target=email.trim().toLowerCase();
    store.collection("invites").document(code).set(map("workspaceId",workspaceId,"email",target,"role",invitedRole,"createdBy",uid(),"status","pending","createdAt",FieldValue.serverTimestamp()))
      .addOnSuccessListener(v->{try{JSONObject o=new JSONObject();o.put("type","invited");o.put("code",code);o.put("email",target);o.put("role",invitedRole);emit(o);}catch(Exception ignored){}})
      .addOnFailureListener(this::fail);
  }
  @JavascriptInterface public void accept(String code){
    if(store==null||!verified()){error("Debes ingresar con un correo verificado para aceptar la invitación.");return;}
    if(code==null||!code.matches("[a-f0-9]{36}")){error("Código de invitación inválido");return;}
    store.collection("invites").document(code).get().addOnSuccessListener(doc->{
      if(!doc.exists()||!"pending".equals(doc.getString("status"))){error("La invitación no existe o ya se usó");return;}
      if(user().getEmail()==null||!user().getEmail().equalsIgnoreCase(doc.getString("email"))){error("Entra con el correo al que se envió esta invitación");return;}
      String wid=doc.getString("workspaceId"),newRole=doc.getString("role");
      if(wid==null||newRole==null){error("Invitación incompleta");return;}
      DocumentReference m=ws(wid).collection("members").document(uid());
      WriteBatch batch=store.batch();
      batch.set(m,map("uid",uid(),"email",user().getEmail().toLowerCase(),"role",newRole,"status","active","inviteCode",code));
      batch.update(doc.getReference(),"status","accepted","acceptedBy",uid());
      batch.commit().addOnSuccessListener(v->enterWorkspace(wid)).addOnFailureListener(this::fail);
    }).addOnFailureListener(this::fail);
  }
  @JavascriptInterface public void revoke(String targetUid){
    if(!"owner".equals(role)||workspaceId.isEmpty()||targetUid==null||targetUid.equals(uid())){error("No se puede revocar este acceso");return;}
    ws(workspaceId).collection("members").document(targetUid).delete().addOnSuccessListener(v->event("notice","message","Acceso revocado" )).addOnFailureListener(this::fail);
  }
  @JavascriptInterface public void cancelInvite(String code){
    if(!"owner".equals(role)||code==null||!code.matches("[a-f0-9]{36}")){error("Invitación no válida");return;}
    store.collection("invites").document(code).delete().addOnSuccessListener(v->event("notice","message","Invitación cancelada")).addOnFailureListener(this::fail);
  }
  @JavascriptInterface public void pushState(String json){
    if(store==null||workspaceId.isEmpty()||!manager()){error("Tu permiso no permite modificar inmuebles o contratos");return;}
    if(json==null||json.length()>700000){error("Datos demasiado grandes para sincronizar. Guarda un respaldo.");return;}
    try{
      JSONObject data=new JSONObject(json);
      WriteBatch batch=store.batch();DocumentReference w=ws(workspaceId);
      batch.set(w.collection("state").document("full"),map("json",buildState(data,false),"updatedAt",FieldValue.serverTimestamp(),"updatedBy",uid()));
      batch.set(w.collection("state").document("public"),map("json",buildState(data,true),"updatedAt",FieldValue.serverTimestamp(),"updatedBy",uid()));
      batch.commit().addOnFailureListener(this::fail);
    }catch(Exception ex){fail(ex);}
  }
  @JavascriptInterface public void addPayment(String paymentJson){
    if(store==null||workspaceId.isEmpty()||!(manager()||"collector".equals(role))){error("Este permiso no permite registrar cobros");return;}
    if(paymentJson==null||paymentJson.length()>15000){error("Registro de pago demasiado largo");return;}
    try{
      JSONObject p=new JSONObject(paymentJson);String paymentId=p.optString("id","");
      if(!paymentId.matches("[A-Za-z0-9_-]{8,80}"))throw new Exception("ID de pago inválido");
      p.put("recordedByUid",uid());p.put("recordedBy",user().getEmail());
      ws(workspaceId).collection("payments").document(paymentId).set(map("json",p.toString(),"recordedByUid",uid(),"recordedByEmail",user().getEmail(),"imported",false,"createdAt",FieldValue.serverTimestamp()))
        .addOnFailureListener(this::fail);
    }catch(Exception ex){fail(ex);}
  }
  @JavascriptInterface public void removePayment(String paymentId){
    if(store==null||workspaceId.isEmpty()||!manager()){error("Solo el propietario o administrador puede borrar pagos");return;}
    if(paymentId==null||!paymentId.matches("[A-Za-z0-9_-]{8,80}"))return;
    ws(workspaceId).collection("payments").document(paymentId).delete().addOnFailureListener(this::fail);
  }
  public void close(){leaveInternal();}
}
