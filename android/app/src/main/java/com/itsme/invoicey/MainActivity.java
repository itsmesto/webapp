package com.itsme.invoicey;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.View;
import android.view.WindowInsets;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.File;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** The Android host. The complete business application is bundled in assets and uses the native bridge for storage. */
public final class MainActivity extends Activity {
    private static final int FOLDER=41, BACKUP=42, PDF=43, IMPORT=44, FILE=45;
    // Start online against the real account so existing users can sign in and
    // see their hosted data. Do not silently open the bundled first-time setup
    // screen when the hosted login is temporarily unavailable.
    private static final String LOCAL_URL="file:///android_asset/business/index.html";
    private static final String HOSTED_URL="https://itsmesto.lk/";
    private static final String HOSTED_HOST="itsmesto.lk";
    private static final String LEGACY_HOSTED_HOST="api.primeenergy.lk";
    private WebView web; private NativeStorage storage; private ValueCallback<Uri[]> picker;
    private boolean hostedPageLoaded;
    private int hostedNavigation;
    private int hostedLoadAttempts;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService worker=Executors.newSingleThreadExecutor(r->{Thread t=new Thread(r,"invoicey-worker");t.setDaemon(true);return t;});
    /* A system picker result may arrive after a different UI action. Keep each request's
       data together instead of sharing one mutable request id/name/byte array. */
    private final Map<Integer,PendingAction> pendingActions=new HashMap<>();
    private static final class PendingAction {
        final String id, companyId, fileName;
        final byte[] bytes;
        PendingAction(String id,String companyId,String fileName,byte[] bytes){this.id=id;this.companyId=companyId;this.fileName=fileName;this.bytes=bytes;}
    }

    @Override public void onCreate(Bundle state){super.onCreate(state);storage=new NativeStorage(this);
        // Opt out of edge-to-edge drawing where the platform permits it. The
        // WebView still receives the measured insets below, so modal actions
        // remain above gesture and three-button navigation areas.
        if(Build.VERSION.SDK_INT>=30) getWindow().setDecorFitsSystemWindows(true);
        getWindow().setStatusBarColor(Color.rgb(15, 29, 25));
        getWindow().setNavigationBarColor(Color.rgb(229, 233, 234));
        // capturePicture() is used by the A4 exporter to include the full document,
        // including content that is below the WebView viewport. Android requires
        // this flag before the first WebView is created.
        WebView.enableSlowWholeDocumentDraw();
        web=new WebView(this);web.setBackgroundColor(Color.WHITE);
        // Keep the web application below the phone's status and navigation bars.
        // This prevents the hamburger button and drawer content from being hidden
        // under system controls on Samsung and other Android devices.
        web.setFitsSystemWindows(true);
        web.setOnApplyWindowInsetsListener((view,insets)->{
            int topPx=0,bottomPx=0,imePx=0;
            if(Build.VERSION.SDK_INT>=30){
                android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());
                android.graphics.Insets ime=insets.getInsets(WindowInsets.Type.ime());
                topPx=bars.top;bottomPx=bars.bottom;imePx=ime.bottom;
                // Keep the WebView's native layout limited by system bars only.
                // The page receives the IME inset separately and resizes/scrolls
                // its own form, which avoids double-counting the keyboard height.
                view.setPadding(0,topPx,0,bottomPx);
            }else{
                topPx=insets.getSystemWindowInsetTop();bottomPx=insets.getSystemWindowInsetBottom();view.setPadding(0,topPx,0,bottomPx);
            }
            float density=getResources().getDisplayMetrics().density;
            ((WebView)view).evaluateJavascript("window.InvoiceyAndroidUI&&window.InvoiceyAndroidUI.setSystemInsets("+(topPx/density)+","+(bottomPx/density)+","+(imePx/density)+")",null);
            return insets;
        });
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(true);s.setAllowContentAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);if(Build.VERSION.SDK_INT>=21)cookies.setAcceptThirdPartyCookies(web,true);
        // The bundled application uses ES modules from the private android_asset
        // origin. Android WebView disables file-to-file module loading by default,
        // which leaves the page at its initial blank loading shell on some phones.
        // The app has no remote page content and intercepts external links, so the
        // packaged asset origin is explicitly enabled here.
        s.setAllowFileAccessFromFileURLs(true);s.setAllowUniversalAccessFromFileURLs(true);
        s.setBuiltInZoomControls(false);s.setDisplayZoomControls(false);
        web.addJavascriptInterface(storage,"InvoiceyNative");web.addJavascriptInterface(new PlatformBridge(),"InvoiceyPlatformNative");web.setWebViewClient(new LocalClient());web.setWebChromeClient(new Chrome());setContentView(web);web.requestApplyInsets();loadHostedWorkspace();}
    @Override public void onBackPressed(){if(web==null){super.onBackPressed();return;}web.evaluateJavascript("window.invoiceyHandleBack ? String(window.invoiceyHandleBack()) : 'false'",v->{if(!"true".equals(v)&&!"\"true\"".equals(v))MainActivity.super.onBackPressed();});}
    @Override protected void onDestroy(){if(web!=null)web.destroy();if(storage!=null)storage.closeDatabases();worker.shutdownNow();super.onDestroy();}

    private final class LocalClient extends WebViewClient{
        private boolean internal(Uri uri){
            String scheme=uri.getScheme();
            if("file".equalsIgnoreCase(scheme)||"about".equalsIgnoreCase(scheme))return true;
            return "https".equalsIgnoreCase(scheme)&&(HOSTED_HOST.equalsIgnoreCase(uri.getHost())||LEGACY_HOSTED_HOST.equalsIgnoreCase(uri.getHost()));
        }
        private boolean external(Uri uri){String scheme=uri.getScheme();if("file".equalsIgnoreCase(scheme)||"about".equalsIgnoreCase(scheme))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException e){Toast.makeText(MainActivity.this,"No app can open that link.",Toast.LENGTH_SHORT).show();}return true;}
        private boolean isHosted(Uri uri){return uri!=null&&"https".equalsIgnoreCase(uri.getScheme())&&(HOSTED_HOST.equalsIgnoreCase(uri.getHost())||LEGACY_HOSTED_HOST.equalsIgnoreCase(uri.getHost()));}
        @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri uri=r.getUrl();return internal(uri)?false:external(uri);}
        @Override public boolean shouldOverrideUrlLoading(WebView v,String u){Uri uri=Uri.parse(u);return internal(uri)?false:external(uri);}
        @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){super.onReceivedError(v,request,error);android.util.Log.w("InvoiceyWeb","Load error: "+request.getUrl()+" / "+error.getDescription());if(request.isForMainFrame()&&isHosted(request.getUrl()))retryHostedWorkspace();}
        @Override public void onReceivedError(WebView v,int errorCode,String description,String failingUrl){super.onReceivedError(v,errorCode,description,failingUrl);android.util.Log.w("InvoiceyWeb","Load error: "+failingUrl+" / "+description);try{if(isHosted(Uri.parse(failingUrl)))retryHostedWorkspace();}catch(Exception ignored){}}
        @Override public void onPageStarted(WebView v,String url,Bitmap favicon){super.onPageStarted(v,url,favicon);android.util.Log.i("InvoiceyWeb","Page started: "+url);}
        @Override public void onPageFinished(WebView v,String url){super.onPageFinished(v,url);android.util.Log.i("InvoiceyWeb","Page finished: "+url);try{if(isHosted(Uri.parse(url))){hostedPageLoaded=true;hostedLoadAttempts=0;installHostedAndroidBridge(v);}}catch(Exception ignored){}}
    }
    /** Android WebView can retain a failed first navigation as ERR_CACHE_MISS. Retry the
     * hosted page with a short cache-busting query so the login screen is not replaced
     * by the WebView's generic network error page. */
    private void loadLocalWorkspace(){
        hostedNavigation++;
        web.loadUrl(LOCAL_URL+"?android=1&mode=offline-first&build=31900");
    }
    private void retryHostedWorkspace(){
        // Keep retrying the hosted login rather than opening local first-time
        // setup. Local setup would make the user believe hosted records had
        // disappeared.
        if(hostedLoadAttempts>=2){hostedLoadAttempts=0;main.postDelayed(this::loadHostedWorkspace,1500L);return;}
        hostedLoadAttempts++;
        main.postDelayed(this::loadHostedWorkspace,350L);
    }
    private void loadHostedWorkspace(){
        hostedPageLoaded=false;
        final int navigation=++hostedNavigation;
        String url=HOSTED_URL+"?android=1&build=31527&load="+System.currentTimeMillis();
        web.loadUrl(url);
        // A WebView network navigation can remain pending without calling an
        // error callback. Retry the hosted login instead of switching to local
        // first-time setup, which would create an unrelated empty workspace.
        main.postDelayed(()->{if(web!=null&&!hostedPageLoaded&&hostedNavigation==navigation)retryHostedWorkspace();},8000L);
    }
    /** Expose Android save/share/backup actions to the hosted page after it loads. */
    private void installHostedAndroidBridge(WebView view){
        injectHostedPhoneUi(view);
        String js="(function(){if(window.__invoiceyAndroidBridge)return;window.__invoiceyAndroidBridge=true;document.documentElement.classList.add('invoicey-android');var pending=new Map();window.InvoiceyPlatform={resolve:function(id,payload){var item=pending.get(id);if(!item)return;pending.delete(id);try{var result=typeof payload==='string'?JSON.parse(payload):payload;if(result.ok)item.resolve(result.value||{});else item.reject(new Error(result.error||'Android action failed.'));}catch(error){item.reject(error);}}};function request(operation,args){return new Promise(function(resolve,reject){var reply;try{reply=JSON.parse(window.InvoiceyPlatformNative.request(operation,JSON.stringify(args||{})));}catch(error){reject(error);return;}if(reply.error){reject(new Error(reply.error));return;}if(!reply.pending){resolve(reply.value||{});return;}pending.set(reply.id,{resolve:resolve,reject:reject});});}async function activeCompanyId(){try{var response=await fetch('/api/backup/status');return response.ok?(await response.json()).companyId||'':'';}catch(error){return '';}}window.invoiceyDesktop={savePDF:function(options){return request('savePDF',options);},printPDF:function(options){return request('printPDF',options);},sharePDF:function(options){return request('sharePDF',options);},chooseBackupDirectory:async function(){return request('chooseBackupDirectory',{companyId:await activeCompanyId()});},saveBackup:async function(args){var data=args.bytes instanceof Uint8Array?args.bytes:new Uint8Array(args.bytes),binary='',chunk=32768;for(var i=0;i<data.length;i+=chunk)binary+=String.fromCharCode.apply(null,data.subarray(i,i+chunk));return request('saveBackup',{fileName:args.fileName,bytes:btoa(binary)});},exportWorkspace:function(){return request('exportWorkspace');},importWorkspace:function(){return request('importWorkspace');}};})();";
        view.evaluateJavascript(js,null);
    }
    /** The hosted desktop page does not include the Android-only drawer assets. Inject
     * the bundled versions so the phone keeps the hamburger, scrim, safe-area layout,
     * and left-edge swipe navigation while still using the hosted business data. */
    private void injectHostedPhoneUi(WebView view){
        try{
            String css=readAsset("business/android.css");
            String ui=readAsset("business/android-ui.js");
            String js="(function(){try{if(!document.getElementById('invoiceyAndroidInjectedCss')){var style=document.createElement('style');style.id='invoiceyAndroidInjectedCss';style.textContent="+JSONObject.quote(css)+";document.head.appendChild(style);}if(!window.InvoiceyAndroidUI){(0,eval)("+JSONObject.quote(ui)+");}}catch(error){console.error('Invoicey Android UI injection failed',error);}})();";
            view.evaluateJavascript(js,null);
        }catch(Exception error){android.util.Log.w("InvoiceyWeb","Android UI assets could not be injected",error);}
    }
    private String readAsset(String name) throws java.io.IOException{
        try(InputStream input=getAssets().open(name);ByteArrayOutputStream output=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int read;while((read=input.read(buffer))!=-1)output.write(buffer,0,read);
            return output.toString("UTF-8");
        }
    }
    private final class Chrome extends WebChromeClient{
        @Override public boolean onConsoleMessage(ConsoleMessage message){android.util.Log.d("InvoiceyWeb",message.message()+" ("+message.sourceId()+":"+message.lineNumber()+")");return true;}
        @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){if(picker!=null)picker.onReceiveValue(null);picker=cb;try{startActivityForResult(p.createIntent().addCategory(Intent.CATEGORY_OPENABLE),FILE);}catch(ActivityNotFoundException e){picker=null;cb.onReceiveValue(null);Toast.makeText(MainActivity.this,"A file picker is unavailable.",Toast.LENGTH_SHORT).show();}return true;}
    }

    private final class PlatformBridge{
        @JavascriptInterface public String request(String operation,String json){
            String id=UUID.randomUUID().toString();
            try{JSONObject a=new JSONObject(json==null?"{}":json);String companyId=a.optString("companyId","");
                if("chooseBackupDirectory".equals(operation)){begin(FOLDER,new PendingAction(id,companyId,"",null));launch(FOLDER,new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION));}
                else if("saveBackup".equals(operation)){byte[] bytes=Base64.decode(a.optString("bytes"),Base64.DEFAULT);if(bytes.length>128*1024*1024)throw new IllegalArgumentException("The Excel backup is too large to save on this device.");String name=safe(a.optString("fileName","Company_Backup.xlsx"),"Company_Backup.xlsx");if(!name.toLowerCase().endsWith(".xlsx"))name+=".xlsx";begin(BACKUP,new PendingAction(id,"",name,bytes));launch(BACKUP,document("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",name));}
                else if("savePDF".equals(operation)){String name=safe(a.optString("suggestedName","Business_document"),"Business_document");exportPdfToFile(name,id);}
                else if("printPDF".equals(operation)){String name=safe(a.optString("suggestedName","Business_document"),"Business_document");printGeneratedPdf(name,id);}
                else if("sharePDF".equals(operation)){String name=safe(a.optString("suggestedName","Business_document"),"Business_document");PdfExport.generate(web,MainActivity.this,name,(file,quality,error)->{if(error!=null){resolve(id,false,error.getMessage(),null);return;}sharePdf(file,name,id);});}
                else if("exportWorkspace".equals(operation)){worker.execute(()->{try{File f=WorkspaceTransfer.exportWorkspace(MainActivity.this,storage);share(f,"application/octet-stream");resolve(id,true,"",new JSONObject().put("fileName",f.getName()));/* Export checkpoints the open SQLite files. Reload so the bundled backend opens fresh handles. */main.postDelayed(()->{if(web!=null)web.reload();},500);}catch(Exception e){resolve(id,false,e.getMessage(),null);}});}
                else if("importWorkspace".equals(operation)){begin(IMPORT,new PendingAction(id,"","",null));launch(IMPORT,new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/octet-stream"));}
                else throw new IllegalArgumentException("Unsupported Android action: "+operation);
                return new JSONObject().put("pending",true).put("id",id).toString();
            }catch(Exception e){return jsonValue("error",e.getMessage()==null?e.getClass().getSimpleName():e.getMessage()).toString();}
        }
    }
    private void begin(int requestCode,PendingAction action){synchronized(pendingActions){if(pendingActions.containsKey(requestCode))throw new IllegalStateException("Another Android file action is already open.");pendingActions.put(requestCode,action);}}
    private PendingAction take(int requestCode){synchronized(pendingActions){return pendingActions.remove(requestCode);}}
    private void launch(int requestCode,Intent intent){main.post(()->{try{startActivityForResult(intent,requestCode);}catch(Exception error){PendingAction action=take(requestCode);if(action!=null)resolve(action.id,false,error.getMessage(),null);}});}
    private Intent document(String mime,String name){return new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE,name);}
    private String safe(String value,String fallback){String s=String.valueOf(value==null?fallback:value).replaceAll("[^A-Za-z0-9._-]","_");return s.isEmpty()?fallback:s;}
    private void resolve(String id,boolean ok,String message,JSONObject value){main.post(()->{try{JSONObject p=new JSONObject().put("ok",ok);if(ok)p.put("value",value==null?JSONObject.NULL:value);else p.put("error",message==null?"Action failed":message);web.evaluateJavascript("window.InvoiceyPlatform&&window.InvoiceyPlatform.resolve("+JSONObject.quote(id)+","+JSONObject.quote(p.toString())+")",null);}catch(Exception ignored){}});}
    private void openNativePrint(String name,String id,String resultKey){main.post(()->{try{PrintManager manager=(PrintManager)getSystemService(PRINT_SERVICE);if(manager==null)throw new IllegalStateException("Android printing is unavailable on this device.");String printName=name.toLowerCase().endsWith(".pdf")?name:name+".pdf";PrintAttributes attributes=new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).setColorMode(PrintAttributes.COLOR_MODE_COLOR).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build();PrintDocumentAdapter adapter=web.createPrintDocumentAdapter(printName);manager.print(printName,adapter,attributes);resolve(id,true,"",new JSONObject().put(resultKey,true));}catch(Exception error){resolve(id,false,error.getMessage(),null);}});}
    private void exportPdfToFile(String name,String id){PdfExport.generate(web,MainActivity.this,name,(file,quality,error)->{if(error!=null){resolve(id,false,error.getMessage(),null);return;}try{byte[] bytes=java.nio.file.Files.readAllBytes(file.toPath());String pdfName=name.toLowerCase().endsWith(".pdf")?name:name+".pdf";begin(PDF,new PendingAction(id,"",pdfName,bytes));launch(PDF,document("application/pdf",pdfName));}catch(Exception e){resolve(id,false,e.getMessage(),null);}finally{if(file!=null)file.delete();}});}
    private void printGeneratedPdf(String name,String id){PdfExport.generate(web,MainActivity.this,name,(file,quality,error)->{if(error!=null){resolve(id,false,error.getMessage(),null);return;}try{PrintManager manager=(PrintManager)getSystemService(PRINT_SERVICE);if(manager==null)throw new IllegalStateException("Android printing is unavailable on this device.");String printName=name.toLowerCase().endsWith(".pdf")?name:name+".pdf";int pages=quality==null?1:Math.max(1,quality.optInt("pages",1));PrintAttributes attributes=new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).setColorMode(PrintAttributes.COLOR_MODE_COLOR).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build();manager.print(printName,new InvoiceyPrintAdapter(file,pages),attributes);resolve(id,true,"",new JSONObject().put("printed",true));}catch(Exception e){if(file!=null)file.delete();resolve(id,false,e.getMessage(),null);}});}
    private final class InvoiceyPrintAdapter extends PrintDocumentAdapter {
        private final File file; private final int pages;
        InvoiceyPrintAdapter(File file,int pages){this.file=file;this.pages=pages;}
        @Override public void onLayout(PrintAttributes oldAttributes,PrintAttributes newAttributes,CancellationSignal cancellationSignal,LayoutResultCallback callback,android.os.Bundle extras){
            if(cancellationSignal.isCanceled()){callback.onLayoutCancelled();return;}
            PrintDocumentInfo info=new PrintDocumentInfo.Builder(file.getName()).setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(pages).build();
            callback.onLayoutFinished(info,true);
        }
        @Override public void onWrite(android.print.PageRange[] pagesToWrite,ParcelFileDescriptor destination,CancellationSignal cancellationSignal,WriteResultCallback callback){
            if(cancellationSignal.isCanceled()){callback.onWriteCancelled();return;}
            try(FileInputStream input=new FileInputStream(file);FileOutputStream output=new FileOutputStream(destination.getFileDescriptor())){byte[] buffer=new byte[8192];int read;while((read=input.read(buffer))!=-1){if(cancellationSignal.isCanceled()){callback.onWriteCancelled();return;}output.write(buffer,0,read);}output.flush();callback.onWriteFinished(new android.print.PageRange[]{android.print.PageRange.ALL_PAGES});}
            catch(Exception error){callback.onWriteFailed(error.getMessage());}
        }
        @Override public void onFinish(){if(file!=null)file.delete();}
    }
    private void sharePdf(File file,String name,String id){main.post(()->{try{
        if(file==null||!file.isFile()||file.length()==0)throw new java.io.IOException("The PDF could not be created.");
        File dir=new File(getCacheDir(),"share");if(!dir.exists()&&!dir.mkdirs())throw new java.io.IOException("The share folder could not be created.");
        String pdfName=name.toLowerCase().endsWith(".pdf")?name:name+".pdf";File target=new File(dir,pdfName);
        java.nio.file.Files.copy(file.toPath(),target.toPath(),java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        if(!target.isFile()||target.length()==0)throw new java.io.IOException("The PDF could not be prepared for sharing.");
        Uri uri=new Uri.Builder().scheme("content").authority(getPackageName()+".exports").appendPath(target.getName()).build();
        try(InputStream check=getContentResolver().openInputStream(uri)){
            byte[] signature=new byte[5];if(check==null||check.read(signature)!=signature.length||!"%PDF-".equals(new String(signature,java.nio.charset.StandardCharsets.US_ASCII)))throw new java.io.IOException("The prepared file is not a readable PDF.");
        }
        Intent send=new Intent(Intent.ACTION_SEND).setType("application/pdf").putExtra(Intent.EXTRA_STREAM,uri);
        send.setClipData(ClipData.newUri(getContentResolver(),pdfName,uri));send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        List<ResolveInfo> targets=getPackageManager().queryIntentActivities(send,PackageManager.MATCH_DEFAULT_ONLY);
        if(targets.isEmpty())throw new ActivityNotFoundException("No installed app can share PDF files.");
        // Direct Share shortcuts may start the destination without going through the
        // normal chooser grant path. Grant read-only access to the apps that can receive
        // this PDF; the share URI is scoped to this one cached file.
        for(ResolveInfo targetInfo:targets){if(targetInfo.activityInfo!=null)grantUriPermission(targetInfo.activityInfo.packageName,uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);}
        Intent chooser=Intent.createChooser(send,"Share PDF");
        // Some Android Sharesheet direct-contact targets launch through the chooser rather
        // than the send intent. Put the same URI grant on both intents for those targets.
        chooser.setClipData(ClipData.newUri(getContentResolver(),pdfName,uri));chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivity(chooser);resolve(id,true,"",new JSONObject().put("shared",true));
    }catch(Exception error){resolve(id,false,error.getMessage(),null);}finally{if(file!=null)file.delete();}});}
    private JSONObject jsonValue(String key,Object value){try{return new JSONObject().put(key,value);}catch(Exception ignored){return new JSONObject();}}
    private void share(File file,String mime){main.post(()->{try{File dir=new File(getCacheDir(),"share");dir.mkdirs();File target=new File(dir,file.getName());java.nio.file.Files.copy(file.toPath(),target.toPath(),java.nio.file.StandardCopyOption.REPLACE_EXISTING);Uri uri=Uri.parse("content://"+getPackageName()+".exports/"+Uri.encode(target.getName()));Intent send=new Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(Intent.createChooser(send,"Share workspace backup"));}catch(Exception e){Toast.makeText(this,e.getMessage(),Toast.LENGTH_LONG).show();}});}

    @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(req==FILE){if(picker!=null){picker.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);picker=null;}return;}PendingAction action=take(req);if(action==null)return;
        if(req==FOLDER){if(result==RESULT_OK&&data!=null&&data.getData()!=null){try{Uri uri=data.getData();getContentResolver().takePersistableUriPermission(uri,data.getFlags()&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION));String key=action.companyId.isEmpty()?"backupTree:default":"backupTree:"+action.companyId;storage.prefs.edit().putString(key,uri.toString()).commit();String path=storage.dataRoot.getAbsolutePath()+(action.companyId.isEmpty()?"/setup-backups":"/companies/"+action.companyId+"/backups");resolve(action.id,true,"",jsonValue("path",path));}catch(Exception e){resolve(action.id,false,e.getMessage(),null);}}else resolve(action.id,true,"",jsonValue("canceled",true));return;}
        if(req==BACKUP||req==PDF){if(result==RESULT_OK&&data!=null&&data.getData()!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData(),"wt")){if(out==null)throw new java.io.IOException("The selected destination could not be opened.");out.write(action.bytes);out.flush();resolve(action.id,true,"",new JSONObject().put("saved",true).put("fileName",action.fileName));}catch(Exception e){resolve(action.id,false,e.getMessage(),null);}}else resolve(action.id,true,"",jsonValue("saved",false));return;}
        if(req==IMPORT){if(result==RESULT_OK&&data!=null&&data.getData()!=null){Uri uri=data.getData();worker.execute(()->{try{JSONObject r=WorkspaceTransfer.importWorkspace(MainActivity.this,uri,storage);resolve(action.id,true,"",r);main.post(()->web.reload());}catch(Exception e){resolve(action.id,false,e.getMessage(),null);}});}else resolve(action.id,true,"",jsonValue("canceled",true));}
    }
}


