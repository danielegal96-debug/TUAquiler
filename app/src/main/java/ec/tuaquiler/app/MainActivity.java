package ec.tuaquiler.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.WindowInsets;
import android.graphics.Insets;
import android.widget.FrameLayout;
import android.util.Base64;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.auth.FirebaseUser;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import android.view.View;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Envoltorio Android para la app offline. Sirve los archivos desde un origen HTTPS local
 * privado. Solicita INTERNET únicamente para autenticación Firebase cuando esté configurada; el WebView sirve contenido local y la aplicación no incluye analítica.
 */
public class MainActivity extends Activity {
    private static final int CHOOSE_FILE = 41;
    private static final int SAVE_FILE = 42;
    private static final String HOST = "appassets.androidplatform.net";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingFile;
    private byte[] pendingBinary;
    private FirebaseAuth firebaseAuth;
    private boolean firebaseConfigured;
    private FirebaseApp configuredApp;
    private TeamBridge teamBridge;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(246,247,250));
        getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        initializeFirebase();
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(246,247,250));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        // No reutilizar HTML ni JavaScript de una instalación anterior.
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.clearCache(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // necesario para restaurar archivos elegidos por el usuario
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setDefaultTextEncodingName("UTF-8");
        webView.addJavascriptInterface(new LocalBridge(), "TUAAndroid");
        teamBridge = new TeamBridge(this, webView, configuredApp, firebaseAuth);
        webView.addJavascriptInterface(teamBridge, "TUATeam");

        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost())) {
                    String path = uri.getPath();
                    if (path != null && (path.equals("/index.html") || path.equals("/app.js") || path.equals("/office.js"))) {
                        try {
                            String name = path.substring(1);
                            InputStream data = getAssets().open(name);
                            String type = name.endsWith(".js") ? "application/javascript" : "text/html";
                            WebResourceResponse response = new WebResourceResponse(type,"UTF-8",data);
                            java.util.Map<String,String> headers = new java.util.HashMap<>();
                            headers.put("Cache-Control", "no-store, max-age=0, must-revalidate");
                            headers.put("Pragma", "no-cache");
                            headers.put("Expires", "0");
                            response.setResponseHeaders(headers);
                            return response;
                        } catch (Exception ignored) { }
                    }
                }
                return blocked();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost())) return false;
                // Los recordatorios solo se abren en una aplicación externa tras un toque del usuario.
                if ("https".equalsIgnoreCase(uri.getScheme()) &&
                    ("wa.me".equalsIgnoreCase(uri.getHost()) || "api.whatsapp.com".equalsIgnoreCase(uri.getHost()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); }
                    catch (Exception ex) { Toast.makeText(MainActivity.this,"Instala WhatsApp o un navegador",Toast.LENGTH_LONG).show(); }
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent chooser = params.createIntent();
                    chooser.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(chooser,CHOOSE_FILE);
                } catch(Exception ex) {
                    fileCallback.onReceiveValue(null);fileCallback=null;
                    Toast.makeText(MainActivity.this,"No se pudo abrir el selector de archivos",Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });
        // El contenedor, no el WebView, respeta barras del sistema (Android 15/16).
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(246,247,250));
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v,insets)->{
                Insets bars=insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(0,bars.top,0,bars.bottom);
                return insets;
            });
        } else {root.setFitsSystemWindows(true);}
        setContentView(root);
        webView.loadUrl("https://"+HOST+"/index.html?build=2.9.1");
    }

    private WebResourceResponse blocked() {
        return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
    }

    private class LocalBridge {
        @JavascriptInterface public void saveText(String filename,String content,String mime) {
            if (content == null || content.length() > 8_000_000) return;
            if (filename == null || !filename.matches("[A-Za-z0-9_-]+\\.(json|csv|txt)")) return;
            if (!("application/json".equals(mime)||mime.startsWith("text/csv")||"text/plain".equals(mime))) return;
            runOnUiThread(()->{
                pendingFile=content;
                try {
                    Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mime);
                    intent.putExtra(Intent.EXTRA_TITLE,filename);
                    startActivityForResult(intent,SAVE_FILE);
                } catch(Exception e) {
                    pendingFile=null;
                    Toast.makeText(MainActivity.this,"No se pudo guardar el archivo",Toast.LENGTH_SHORT).show();
                }
            });
        }
        @JavascriptInterface public void saveBinary(String filename, String base64, String mime) {
            if (filename==null || !filename.matches("[A-Za-z0-9_.-]+\\.(xlsx|docx)")) return;
            if (!("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".equals(mime) ||
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mime))) return;
            if (base64==null || base64.length()>20_000_000) return;
            try { byte[] data=Base64.decode(base64,Base64.DEFAULT);
                if(data.length>12_000_000)return;
                runOnUiThread(()->{pendingBinary=data;pendingFile=null;
                    Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mime);
                    intent.putExtra(Intent.EXTRA_TITLE,filename);
                    try{startActivityForResult(intent,SAVE_FILE);}catch(Exception ex){pendingBinary=null;Toast.makeText(MainActivity.this,"No se pudo abrir el guardado",Toast.LENGTH_SHORT).show();}
                });
            }catch(Exception e){ }
        }
        @JavascriptInterface public String getAuthState() {return authJson(null);}
        @JavascriptInterface public void emailAuth(String mode,String email,String password) {
            runOnUiThread(()->{
                if(!firebaseConfigured||firebaseAuth==null){emitAuth("Debes configurar Firebase antes de iniciar sesión");return;}
                if(email==null||password==null||email.length()>220||password.length()>200){emitAuth("Revisa tus credenciales");return;}
                if("register".equals(mode)) firebaseAuth.createUserWithEmailAndPassword(email.trim(),password)
                    .addOnCompleteListener(task->{if(task.isSuccessful()){FirebaseUser u=firebaseAuth.getCurrentUser();if(u!=null)u.sendEmailVerification();emitAuth(null);}else emitAuth("No se pudo registrar: "+simpleError(task.getException()));});
                else firebaseAuth.signInWithEmailAndPassword(email.trim(),password)
                    .addOnCompleteListener(task->{if(task.isSuccessful())emitAuth(null);else emitAuth("No se pudo ingresar: "+simpleError(task.getException()));});
            });
        }
        @JavascriptInterface public void googleAuth() {
            runOnUiThread(()->{
                if(!firebaseConfigured||firebaseAuth==null){emitAuth("Primero configura Firebase");return;}
                // Google Services genera default_web_client_id desde app/google-services.json.
                // La huella SHA-1 del certificado debe registrarse en Firebase antes de usar Google.
                int clientResource=getResources().getIdentifier("default_web_client_id","string",getPackageName());
                String clientId=clientResource==0?"":getString(clientResource).trim();
                if(clientId.isEmpty()){
                    emitAuth("Google pendiente: agrega la SHA-1 del APK en Firebase y actualiza google-services.json");
                    return;
                }
                GetGoogleIdOption googleOption=new GetGoogleIdOption.Builder()
                    .setServerClientId(clientId).setFilterByAuthorizedAccounts(false).build();
                GetCredentialRequest request=new GetCredentialRequest.Builder().addCredentialOption(googleOption).build();
                CredentialManager.create(MainActivity.this).getCredentialAsync(MainActivity.this,request,null,getMainExecutor(),
                  new CredentialManagerCallback<GetCredentialResponse,GetCredentialException>(){
                    @Override public void onResult(GetCredentialResponse result){
                        Credential credential=result.getCredential();
                        if(credential instanceof CustomCredential){
                            CustomCredential cc=(CustomCredential)credential;
                            if(GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(cc.getType())){
                                try{GoogleIdTokenCredential google=GoogleIdTokenCredential.createFrom(cc.getData());
                                    firebaseAuth.signInWithCredential(GoogleAuthProvider.getCredential(google.getIdToken(),null))
                                        .addOnCompleteListener(task->{if(task.isSuccessful())emitAuth(null);else emitAuth("Error de cuenta Google: "+simpleError(task.getException()));});
                                    return;
                                }catch(Exception ex){emitAuth("No se pudo leer la cuenta Google");return;}
                            }
                        }
                        emitAuth("Credencial Google no compatible");
                    }
                    @Override public void onError(GetCredentialException e){emitAuth("No se completó el acceso con Google");}
                  });
            });
        }
        @JavascriptInterface public void resendVerification(){
            runOnUiThread(()->{
                FirebaseUser u=firebaseAuth==null?null:firebaseAuth.getCurrentUser();
                if(u==null){emitAuth("Inicia sesión primero");return;}
                if(u.isEmailVerified()){emitAuth(null);return;}
                u.sendEmailVerification().addOnCompleteListener(task->{
                    if(task.isSuccessful()) Toast.makeText(MainActivity.this,"Revisa tu correo para verificar la cuenta",Toast.LENGTH_LONG).show();
                    else emitAuth("No se pudo enviar la verificación: "+simpleError(task.getException()));
                });
            });
        }
        @JavascriptInterface public void refreshVerification(){
            runOnUiThread(()->{
                FirebaseUser u=firebaseAuth==null?null:firebaseAuth.getCurrentUser();
                if(u==null){emitAuth("Inicia sesión primero");return;}
                u.reload().addOnCompleteListener(task->{
                    if(task.isSuccessful())emitAuth(null);
                    else emitAuth("No se pudo comprobar el correo: "+simpleError(task.getException()));
                });
            });
        }
        @JavascriptInterface public void logOut(){runOnUiThread(()->{if(firebaseAuth!=null)firebaseAuth.signOut();emitAuth(null);});}
        @JavascriptInterface public void shareText(String report) {
            if (report == null || report.length()>100_000) return;
            runOnUiThread(()->{
                Intent send=new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT,report);
                startActivity(Intent.createChooser(send,"Compartir reporte"));
            });
        }
    }

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
        super.onActivityResult(requestCode,resultCode,data);
        if (requestCode==CHOOSE_FILE) {
            if (fileCallback != null) {
                Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode,data);
                fileCallback.onReceiveValue(result);
                fileCallback = null;
            }
        } else if (requestCode==SAVE_FILE) {
            if (resultCode==RESULT_OK && data!=null && data.getData()!=null && (pendingFile!=null||pendingBinary!=null)) {
                try (OutputStream out=getContentResolver().openOutputStream(data.getData())) {
                    if(out == null) throw new Exception("Sin acceso");
                    out.write(pendingBinary!=null?pendingBinary:pendingFile.getBytes(StandardCharsets.UTF_8));
                    Toast.makeText(this,"Archivo guardado",Toast.LENGTH_SHORT).show();
                } catch(Exception e){
                    Toast.makeText(this,"No se pudo guardar el respaldo",Toast.LENGTH_LONG).show();
                }
            }
            pendingFile=null;
            pendingBinary=null;
        }
    }

    private String simpleError(Exception e){
        if(e==null || e.getMessage()==null)return "Error del servicio";
        String msg=e.getMessage();return msg.substring(0,Math.min(msg.length(),160));
    }
    private void initializeFirebase(){
        // Usar el proyecto Firebase predeterminado configurado mediante
        // app/google-services.json y el plugin com.google.gms.google-services.
        // No depender de valores CONFIGURAR_* de firebase_config.xml.
        try {
            FirebaseApp app=FirebaseApp.initializeApp(getApplicationContext());
            if(app==null) app=FirebaseApp.getInstance();
            configuredApp=app;
            firebaseAuth=FirebaseAuth.getInstance(app);
            firebaseConfigured=true;
        } catch(Exception ex) {
            android.util.Log.e("TUAquiler", "Firebase no se inicializo; revisar google-services.json y Gradle", ex);
            configuredApp=null;
            firebaseAuth=null;
            firebaseConfigured=false;
        }
    }
    private String authJson(String error){
        try{JSONObject o=new JSONObject();o.put("configured",firebaseConfigured);
            FirebaseUser u=firebaseAuth==null?null:firebaseAuth.getCurrentUser();
            o.put("signedIn",u!=null);o.put("emailVerified",u!=null&&u.isEmailVerified());o.put("uid",u==null?"":u.getUid());o.put("email",u==null?"":u.getEmail());
            if(error!=null)o.put("error",error);return o.toString();
        }catch(Exception e){return "{\"configured\":false,\"signedIn\":false}";}
    }
    private void emitAuth(String error){
        runOnUiThread(()->{String payload=JSONObject.quote(authJson(error));
            webView.evaluateJavascript("window.tuaAuthUpdate && window.tuaAuthUpdate("+payload+")",null);
        });
    }
    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("Boolean(window.appBack && window.appBack())",value->{
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onDestroy() {
        if(teamBridge!=null)teamBridge.close();
        if (webView!=null) { webView.removeJavascriptInterface("TUAAndroid");webView.removeJavascriptInterface("TUATeam");webView.destroy(); }
        super.onDestroy();
    }
}
