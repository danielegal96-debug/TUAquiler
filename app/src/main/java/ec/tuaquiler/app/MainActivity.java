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
