package com.itsme.invoicey;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteCursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteProgram;
import android.database.sqlite.SQLiteStatement;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

/** Private, bounded storage for the bundled local application only. */
public final class NativeStorage {
    public final File dataRoot;
    public final SharedPreferences prefs;
    private final Context context;
    private final Map<Integer,SQLiteDatabase> databases = new HashMap<>();
    private int nextHandle=1;
    public NativeStorage(Context context) {
        this.context=context; dataRoot=new File(context.getFilesDir(),"data"); dataRoot.mkdirs();
        prefs=context.getSharedPreferences("invoicey",Context.MODE_PRIVATE);
    }
    @JavascriptInterface public synchronized String call(String operation,String json) {
        JSONObject reply=new JSONObject();
        try { Object result=perform(operation,new JSONObject(json==null?"{}":json)); reply.put("ok",true);reply.put("value",result==null?JSONObject.NULL:result); }
        catch(Exception error) { Log.e("Invoicey",operation+": "+error.getMessage()); try {reply.put("ok",false);reply.put("error",error.getMessage()==null?error.getClass().getSimpleName():error.getMessage());}catch(Exception ignored){} }
        return reply.toString();
    }
    private File file(String value) throws Exception {
        File result=new File(value).getCanonicalFile(),root=dataRoot.getCanonicalFile();
        if(!result.equals(root)&&!result.getPath().startsWith(root.getPath()+File.separator))throw new IOException("The app can access only its private company data folders.");
        return result;
    }
    private boolean asset(String value){return value.equals("/app")||value.startsWith("/app/");}
    private String assetPath(String value)throws Exception {String part=value.substring(4);if(part.contains("..")||part.contains("\\"))throw new IOException("Invalid asset path.");return "business"+part;}
    private InputStream read(String value)throws Exception {return asset(value)?context.getAssets().open(assetPath(value)):new FileInputStream(file(value));}
    private byte[] bytes(InputStream in,int maximum)throws Exception {try(InputStream input=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] chunk=new byte[32768];int count;while((count=input.read(chunk))!=-1){if(out.size()+count>maximum)throw new IOException("The file exceeds the supported size.");out.write(chunk,0,count);}return out.toByteArray();}}
    private byte[] decode(String value){return Base64.decode(value,Base64.DEFAULT);}
    private String encode(byte[] value){return Base64.encodeToString(value,Base64.NO_WRAP);}
    private SQLiteDatabase database(JSONObject args)throws Exception {SQLiteDatabase db=databases.get(args.getInt("handle"));if(db==null||!db.isOpen())throw new IOException("The database is closed.");return db;}
    private void bind(SQLiteProgram statement,JSONArray params)throws Exception {
        for(int i=0;i<params.length();i++){Object value=params.get(i);int slot=i+1;if(value==JSONObject.NULL)statement.bindNull(slot);else if(value instanceof JSONObject&&((JSONObject)value).has("__bytes"))statement.bindBlob(slot,decode(((JSONObject)value).getString("__bytes")));else if(value instanceof Boolean)statement.bindLong(slot,(Boolean)value?1:0);else if(value instanceof Float||value instanceof Double)statement.bindDouble(slot,((Number)value).doubleValue());else if(value instanceof Number)statement.bindLong(slot,((Number)value).longValue());else statement.bindString(slot,String.valueOf(value));}
    }
    private JSONArray query(SQLiteDatabase db,String sql,JSONArray params)throws Exception {
        try(Cursor cursor=db.rawQueryWithFactory((database,driver,editTable,sqliteQuery)->{try{bind(sqliteQuery,params);}catch(Exception e){throw new IllegalArgumentException(e);}return new SQLiteCursor(database,driver,editTable,sqliteQuery);},sql,new String[0],null)){
            JSONArray rows=new JSONArray();while(cursor.moveToNext()){JSONObject row=new JSONObject();for(int i=0;i<cursor.getColumnCount();i++){Object value;switch(cursor.getType(i)){case Cursor.FIELD_TYPE_NULL:value=JSONObject.NULL;break;case Cursor.FIELD_TYPE_INTEGER:value=cursor.getLong(i);break;case Cursor.FIELD_TYPE_FLOAT:value=cursor.getDouble(i);break;case Cursor.FIELD_TYPE_BLOB:value=new JSONObject().put("__bytes",encode(cursor.getBlob(i)));break;default:value=cursor.getString(i);}row.put(cursor.getColumnName(i),value);}rows.put(row);}return rows;
        }
    }
    static List<String> splitSQL(String sql) {
        List<String> statements=new ArrayList<>();StringBuilder current=new StringBuilder();char quote=0;boolean line=false,block=false;
        for(int i=0;i<sql.length();i++){char c=sql.charAt(i),next=i+1<sql.length()?sql.charAt(i+1):0;if(line){current.append(c);if(c=='\n')line=false;continue;}if(block){current.append(c);if(c=='*'&&next=='/'){current.append(next);i++;block=false;}continue;}if(quote!=0){current.append(c);if(c==quote){if(next==quote){current.append(next);i++;}else quote=0;}continue;}if(c=='-'&&next=='-'){line=true;current.append(c);continue;}if(c=='/'&&next=='*'){block=true;current.append(c);continue;}if(c=='\''||c=='"'||c=='`'){quote=c;current.append(c);continue;}if(c==';'){if(!current.toString().trim().isEmpty())statements.add(current.toString().trim());current.setLength(0);}else current.append(c);}
        if(!current.toString().trim().isEmpty())statements.add(current.toString().trim());return statements;
    }
    private Object perform(String op,JSONObject a)throws Exception {
        if(op.equals("env"))return new JSONObject().put("dataRoot",dataRoot.getCanonicalPath()).put("assetRoot","/app").put("appVersion",BuildConfig.VERSION_NAME);
        if(op.equals("prefs.get"))return prefs.getString(a.getString("key"),"");
        if(op.equals("prefs.set")){prefs.edit().putString(a.getString("key"),a.optString("value","")).commit();return null;}
        if(op.equals("sqlite.open")){File target=file(a.getString("path"));target.getParentFile().mkdirs();SQLiteDatabase db=SQLiteDatabase.openOrCreateDatabase(target,null);int handle=nextHandle++;databases.put(handle,db);return handle;}
        if(op.equals("sqlite.close")){SQLiteDatabase db=databases.remove(a.getInt("handle"));if(db!=null)db.close();return null;}
        if(op.equals("sqlite.exec")){SQLiteDatabase db=database(a);for(String sql:splitSQL(a.getString("sql"))){String clean=sql.replaceAll("(?m)^\\s*--[^\\n]*"," ").trim();if(clean.toUpperCase(Locale.ROOT).startsWith("PRAGMA")){try(Cursor cursor=db.rawQuery(sql,null)){cursor.moveToFirst();}}else db.execSQL(sql);}return null;}
        if(op.equals("sqlite.all"))return query(database(a),a.getString("sql"),a.optJSONArray("params")==null?new JSONArray():a.getJSONArray("params"));
        if(op.equals("sqlite.run")){SQLiteDatabase db=database(a);try(SQLiteStatement statement=db.compileStatement(a.getString("sql"))){bind(statement,a.optJSONArray("params")==null?new JSONArray():a.getJSONArray("params"));statement.execute();}try(Cursor c=db.rawQuery("SELECT changes(),last_insert_rowid()",null)){c.moveToFirst();return new JSONObject().put("changes",c.getLong(0)).put("lastInsertRowid",c.getLong(1));}}
        if(op.equals("fs.exists")){String value=a.getString("path");if(asset(value)){try{context.getAssets().open(assetPath(value)).close();return true;}catch(Exception e){return value.equals("/app");}}return file(value).exists();}
        if(op.equals("fs.mkdir")){File f=file(a.getString("path"));if(!f.exists()&&!f.mkdirs())throw new IOException("The company folder could not be created.");return null;}
        if(op.equals("fs.read"))return encode(bytes(read(a.getString("path")),128*1024*1024));
        if(op.equals("fs.write")){File f=file(a.getString("path"));if(a.optString("flag").contains("x")&&f.exists())throw new IOException("The backup file already exists.");f.getParentFile().mkdirs();byte[] data=decode(a.getString("data"));if(data.length>128*1024*1024)throw new IOException("File too large.");try(FileOutputStream out=new FileOutputStream(f)){out.write(data);out.getFD().sync();}if(f.getName().endsWith("_Backup.xlsx"))mirrorBackup(f);return null;}
        if(op.equals("fs.rename")){File from=file(a.getString("from")),to=file(a.getString("to"));Files.move(from.toPath(),to.toPath(),StandardCopyOption.REPLACE_EXISTING);if(to.getName().endsWith("_Backup.xlsx"))mirrorBackup(to);return null;}
        if(op.equals("fs.unlink")){Files.delete(file(a.getString("path")).toPath());return null;}
        if(op.equals("fs.copy")){Files.copy(file(a.getString("from")).toPath(),file(a.getString("to")).toPath(),StandardCopyOption.REPLACE_EXISTING);return null;}
        if(op.equals("fs.readdir")){String[] names=file(a.getString("path")).list();if(names==null)throw new IOException("The folder could not be read.");return new JSONArray(Arrays.asList(names));}
        if(op.equals("fs.realpath"))return asset(a.getString("path"))?a.getString("path"):file(a.getString("path")).getCanonicalPath();
        if(op.equals("fs.access")){if(!file(a.getString("path")).canWrite())throw new IOException("The backup folder is not writable.");return null;}
        if(op.equals("fs.stat")){String name=a.getString("path");if(asset(name)){byte[] data=bytes(read(name),128*1024*1024);return new JSONObject().put("size",data.length).put("isDirectory",false).put("modifiedAt",0);}File f=file(name);if(!f.exists())throw new FileNotFoundException("File not found: "+f.getName());return new JSONObject().put("size",f.length()).put("isDirectory",f.isDirectory()).put("modifiedAt",f.lastModified());}
        if(op.equals("crypto.hash"))return encode(MessageDigest.getInstance(a.getString("algorithm").equals("sha256")?"SHA-256":a.getString("algorithm")).digest(decode(a.getString("data"))));
        if(op.equals("zlib.deflate")){byte[] input=decode(a.getString("data"));Deflater engine=new Deflater(Deflater.DEFAULT_COMPRESSION,true);try{engine.setInput(input);engine.finish();ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[32768];while(!engine.finished()){int n=engine.deflate(buffer);out.write(buffer,0,n);}return encode(out.toByteArray());}finally{engine.end();}}
        if(op.equals("zlib.inflate")){byte[] input=decode(a.getString("data"));Inflater engine=new Inflater(true);try{engine.setInput(input);ByteArrayOutputStream out=new ByteArrayOutputStream();int max=a.optInt("maxOutputLength",384*1024*1024);byte[] buffer=new byte[32768];while(!engine.finished()){int n=engine.inflate(buffer);if(n==0){if(engine.needsInput()||engine.needsDictionary())throw new IOException("The compressed workbook is incomplete.");throw new IOException("The compressed workbook is invalid.");}if(out.size()+n>max)throw new IOException("The workbook exceeds the supported size.");out.write(buffer,0,n);}return encode(out.toByteArray());}finally{engine.end();}}
        throw new IOException("Unsupported local operation: "+op);
    }
    private void mirrorBackup(File f)throws Exception {
        String relative=dataRoot.toPath().relativize(f.toPath()).toString().replace('\\','/'),companyId=relative.startsWith("companies/")?relative.split("/")[1]:"";
        String tree=prefs.getString("backupTree:"+companyId,prefs.getString("backupTree:default",""));if(tree.isEmpty())return;
        try {Uri root=Uri.parse(tree),parent=DocumentsContract.buildDocumentUriUsingTree(root,DocumentsContract.getTreeDocumentId(root)),children=DocumentsContract.buildChildDocumentsUriUsingTree(root,DocumentsContract.getTreeDocumentId(root)),dest=null;
            try(Cursor c=context.getContentResolver().query(children,new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)){if(c!=null)while(c.moveToNext())if(f.getName().equals(c.getString(1))){dest=DocumentsContract.buildDocumentUriUsingTree(root,c.getString(0));break;}}
            if(dest==null)dest=DocumentsContract.createDocument(context.getContentResolver(),parent,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",f.getName());if(dest==null)throw new IOException("Backup destination unavailable.");try(OutputStream out=context.getContentResolver().openOutputStream(dest,"wt");InputStream in=new FileInputStream(f)){if(out==null)throw new IOException("Backup destination could not be opened.");in.transferTo(out);}prefs.edit().remove("backupWarning:"+companyId).apply();
        }catch(Exception e){prefs.edit().putString("backupWarning:"+companyId,e.getMessage()).apply();throw new IOException("Data was saved privately, but the selected backup folder is unavailable. Choose it again in Backup & Restore.",e);}
    }
    public synchronized void closeDatabases(){for(SQLiteDatabase db:databases.values())try{db.close();}catch(Exception ignored){}databases.clear();}
    public boolean isConfigured(){File registry=new File(dataRoot,"access.sqlite");if(!registry.exists())return false;try(SQLiteDatabase db=SQLiteDatabase.openDatabase(registry.getPath(),null,SQLiteDatabase.OPEN_READONLY);Cursor c=db.rawQuery("SELECT count(*) FROM users",null)){return c.moveToFirst()&&c.getInt(0)>0;}catch(Exception e){return true;}}
    public boolean isSuperAuthorized(){try{String cookie=prefs.getString("invoicey_session","");if(cookie.contains("="))cookie=cookie.substring(cookie.indexOf('=')+1);StringBuilder hex=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(cookie.getBytes(java.nio.charset.StandardCharsets.UTF_8)))hex.append(String.format("%02x",b&255));try(SQLiteDatabase db=SQLiteDatabase.openDatabase(new File(dataRoot,"access.sqlite").getPath(),null,SQLiteDatabase.OPEN_READONLY);Cursor c=db.rawQuery("SELECT u.is_super,u.active,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?",new String[]{hex.toString()})){return c.moveToFirst()&&c.getInt(0)==1&&c.getInt(1)==1&&Instant.parse(c.getString(2)).isAfter(Instant.now());}}catch(Exception e){return false;}}
}

