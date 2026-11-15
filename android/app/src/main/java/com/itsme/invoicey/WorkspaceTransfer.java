package com.itsme.invoicey;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

/** Portable, validated copies of the complete multi-company private workspace. */
public final class WorkspaceTransfer {
    private WorkspaceTransfer() { }

    private static final String FORMAT = "invoicey-workspace-v1";
    private static final String APP_VERSION = "3.1.5";
    private static final long MAX_BYTES = 512L * 1024 * 1024;
    private static final int MAX_FILES = 50_000;
    private static final int MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
    private static final int BUFFER_SIZE = 64 * 1024;
    private static final String UUID_RE = "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    private static final Set<String> ROLES = new HashSet<>(Arrays.asList(
        "company_admin", "accountant", "salesperson", "storekeeper", "manager", "custom"));

    private static final Map<String, String> REGISTRY_COLUMNS = columns(
        "companies:id,name,profile_json,data_path,backup_dir,enabled,user_limit,role_limits_json,modules_json,created_at,updated_at",
        "users:id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at",
        "memberships:company_id,user_id,role,active,permissions_json,created_at,updated_at",
        "sessions:token_hash,user_id,active_company_id,expires_at,created_at,last_seen",
        "audit:id,user_id,company_id,username,company_name,action,details,created_at");

    private static final Map<String, String> BUSINESS_COLUMNS = columns(
        "settings:id,company_name,currency,locale,email,phone,address,tax_number,updated_at",
        "app_metadata:key,value", "sequences:name,value",
        "projects:id,project_key,title,customer_id,created_at,updated_at",
        "companies:id,name,address,logo_data,bank_name,bank_branch,bank_account_number,account_holder,contact_numbers,email,website,tax_number,additional_info,terms_conditions,is_default,created_at,updated_at",
        "customers:id,name,phone,email,address,created_at,updated_at",
        "suppliers:id,name,phone,email,address,created_at,updated_at",
        "products:id,sku,name,category,unit,quantity,reorder_level,purchase_price,selling_price,description,created_at,updated_at",
        "services:id,code,title,description,unit_price,unit_cost,created_at,updated_at",
        "invoices:id,number,customer_id,invoice_date,due_date,status,notes,total,quotation_id,created_at,updated_at,company_id,subtotal,discount_amount,discount_rate,tax_rate,tax_amount,terms,project_key,created_by",
        "invoice_items:id,invoice_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,service_id,item_code,service_title,service_description,discount_percent,discount_amount",
        "payments:id,invoice_id,customer_id,amount,method,reference,payment_date,notes,created_at",
        "quotations:id,number,customer_id,document_type,quote_date,valid_until,status,notes,total,invoice_id,created_at,updated_at,company_id,subtotal,discount_amount,discount_rate,tax_rate,tax_amount,terms,project_key,created_by",
        "quotation_items:id,quotation_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,service_id,item_code,service_title,service_description,discount_percent,discount_amount",
        "purchases:id,number,supplier_id,purchase_date,status,notes,total,created_at,updated_at,company_id,terms,created_by",
        "purchase_items:id,purchase_id,product_id,quantity,unit_cost,line_total",
        "supplier_payments:id,supplier_id,purchase_id,amount,method,reference,payment_date,notes,created_at",
        "expenses:id,description,category,amount,expense_date,payment_method,notes,created_at,updated_at,project_key,quotation_id,invoice_id,customer_id,supplier_id,project_name,expense_type,worker_count,worker_names,working_days,working_hours,labour_rate,labour_rate_unit,additional_labour,created_by",
        "expense_categories:id,name,created_at,updated_at",
        "expense_attachments:id,expense_id,file_name,mime_type,size_bytes,file_data,created_at",
        "stock_movements:id,product_id,movement_type,quantity,unit_cost,reference,notes,movement_date,created_at",
        "partners:id,name,share_percent,email,created_at,updated_at",
        "profit_shares:id,partner_id,period_start,period_end,profit_basis,share_percent,amount,created_at");

    /** No workspace is replaced until the entire incoming archive has been verified. */
    public static JSONObject importWorkspace(Context ctx, Uri source, NativeStorage storage) throws Exception {
        synchronized (storage) {
            if (storage.isConfigured() && !storage.isSuperAuthorized()) {
                throw new IOException("Sign in as the software super administrator before importing a complete workspace.");
            }
            final File dataRoot = storage.dataRoot.getCanonicalFile();
            final File filesRoot = ctx.getFilesDir().getCanonicalFile();
            requirePrivateChild(filesRoot, dataRoot);
            final File stage = new File(filesRoot, "workspace-import-" + UUID.randomUUID());
            final File payload = new File(stage, "payload");
            ensureDirectory(payload);
            File recovery = null;
            boolean installed = false;
            try {
                Map<String, FileDigest> incoming = new LinkedHashMap<>();
                byte[] manifestBytes = extract(ctx, source, payload, incoming);
                JSONObject manifest = new JSONObject(new String(manifestBytes, StandardCharsets.UTF_8));
                validateManifest(manifest, incoming);
                List<Company> companies = validateWorkspace(payload, manifest);
                int users = countUsers(new File(payload, "access.sqlite"));
                // Rebase only the staged copy, retaining all identities, hashes and permissions.
                rebaseRegistry(payload, dataRoot, false);
                for (Company company : companies) ensureDirectory(new File(payload, "companies/" + company.id + "/backups"));
                // Check authorization again immediately before mutation, then close native handles.
                if (storage.isConfigured() && !storage.isSuperAuthorized()) {
                    throw new IOException("Super administrator authorization expired. Sign in and try again.");
                }
                storage.closeDatabases();
                if (dataRoot.exists()) {
                    recovery = new File(dataRoot.getParentFile(), dataRoot.getName() + "-recovery-" + timestamp() + "-" + UUID.randomUUID().toString().substring(0, 8));
                    requirePrivateChild(filesRoot, recovery);
                    if (!dataRoot.renameTo(recovery)) throw new IOException("The current workspace could not be moved to a recovery copy. No imported data was installed.");
                }
                if (!payload.renameTo(dataRoot)) {
                    if (recovery != null && !recovery.renameTo(dataRoot)) {
                        throw new IOException("Import was stopped. The previous workspace remains safely saved at " + recovery.getAbsolutePath() + ". Restart the app before continuing.");
                    }
                    throw new IOException("The imported workspace could not be installed. The previous workspace was restored.");
                }
                installed = true;
                // Portable workspaces carry no login session. Other local preferences are retained.
                storage.prefs.edit().remove("invoicey_session").remove("active_company_id").commit();
                return new JSONObject().put("success", true).put("companyCount", companies.size())
                    .put("companies", companies.size()).put("userCount", users)
                    .put("recoveryDirectory", recovery == null ? JSONObject.NULL : recovery.getAbsolutePath())
                    .put("message", "Workspace imported. Sign in with your existing username and password.");
            } finally {
                // Staged content is private and newly created; the recovery copy is never removed.
                if (!installed || stage.exists()) deletePrivateTree(stage, filesRoot);
            }
        }
    }

    /** A full export contains authentication data, so only the software super administrator may create it. */
    public static File exportWorkspace(Context ctx, NativeStorage storage) throws Exception {
        synchronized (storage) {
            if (!storage.isConfigured() || !storage.isSuperAuthorized()) {
                throw new IOException("Sign in as the software super administrator to export the complete workspace.");
            }
            File filesRoot = ctx.getFilesDir().getCanonicalFile();
            File dataRoot = storage.dataRoot.getCanonicalFile();
            requirePrivateChild(filesRoot, dataRoot);
            File stage = new File(filesRoot, "workspace-export-" + UUID.randomUUID());
            File payload = new File(stage, "payload");
            ensureDirectory(payload);
            File output = new File(ctx.getCacheDir(), "itsme-invoicey-workspace-" + timestamp() + "-" + UUID.randomUUID().toString().substring(0, 8) + ".invoicey.zip");
            boolean complete = false;
            try {
                storage.closeDatabases();
                File registrySource = new File(dataRoot, "access.sqlite");
                checkpoint(registrySource);
                copyFile(registrySource, new File(payload, "access.sqlite"));
                List<Company> companies = readCompanies(new File(payload, "access.sqlite"));
                for (Company company : companies) {
                    File business = new File(dataRoot, "companies/" + company.id + "/business.sqlite");
                    checkpoint(business);
                    copyTree(new File(dataRoot, "companies/" + company.id), new File(payload, "companies/" + company.id), dataRoot);
                }
                rebaseRegistry(payload, payload, true);
                Map<String, FileDigest> digests = new LinkedHashMap<>();
                collectFiles(payload, payload, digests);
                JSONObject manifest = createManifest(companies, digests);
                validateManifest(manifest, digests);
                validateWorkspace(payload, manifest);
                try (ZipOutputStream zip = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(output)))) {
                    writeEntry(zip, "manifest.json", manifest.toString(2).getBytes(StandardCharsets.UTF_8));
                    byte[] buffer = new byte[BUFFER_SIZE];
                    for (String name : digests.keySet()) {
                        zip.putNextEntry(new ZipEntry(name));
                        try (InputStream input = new BufferedInputStream(new FileInputStream(new File(payload, name)))) {
                            int n;
                            while ((n = input.read(buffer)) != -1) zip.write(buffer, 0, n);
                        }
                        zip.closeEntry();
                    }
                }
                complete = true;
                return output;
            } finally {
                deletePrivateTree(stage, filesRoot);
                if (!complete && output.exists()) output.delete();
            }
        }
    }

    private static byte[] extract(Context ctx, Uri source, File payload, Map<String, FileDigest> files) throws Exception {
        InputStream raw = ctx.getContentResolver().openInputStream(source);
        if (raw == null) throw new IOException("The selected workspace file could not be opened.");
        byte[] manifest = null;
        long total = 0;
        Set<String> seen = new HashSet<>();
        byte[] buffer = new byte[BUFFER_SIZE];
        try (ZipInputStream zip = new ZipInputStream(new BufferedInputStream(raw))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                if (entry.isDirectory()) throw new IOException("The workspace has an unexpected directory entry.");
                validatePath(name, true);
                if (!seen.add(name)) throw new IOException("The workspace contains a duplicate file: " + name);
                if (seen.size() > MAX_FILES + 1) throw new IOException("The workspace contains too many files.");
                if ("manifest.json".equals(name)) {
                    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                    int n;
                    while ((n = zip.read(buffer)) != -1) {
                        if (bytes.size() + n > MAX_MANIFEST_BYTES) throw new IOException("The workspace manifest is too large.");
                        bytes.write(buffer, 0, n);
                    }
                    manifest = bytes.toByteArray();
                } else {
                    File target = new File(payload, name).getCanonicalFile();
                    requirePrivateChild(payload.getCanonicalFile(), target);
                    ensureDirectory(target.getParentFile());
                    MessageDigest sha = MessageDigest.getInstance("SHA-256");
                    long size = 0;
                    try (FileOutputStream output = new FileOutputStream(target)) {
                        int n;
                        while ((n = zip.read(buffer)) != -1) {
                            size += n;
                            total += n;
                            if (size > MAX_BYTES || total > MAX_BYTES) throw new IOException("The workspace exceeds the 512 MB uncompressed limit.");
                            sha.update(buffer, 0, n);
                            output.write(buffer, 0, n);
                        }
                        output.getFD().sync();
                    }
                    files.put(name, new FileDigest(size, hex(sha.digest())));
                }
                zip.closeEntry();
            }
        }
        if (manifest == null || files.isEmpty()) throw new IOException("This file is not a complete itsme invoicey workspace export.");
        return manifest;
    }

    private static void validateManifest(JSONObject manifest, Map<String, FileDigest> actual) throws Exception {
        if (!FORMAT.equals(manifest.optString("format")) || !"access.sqlite".equals(manifest.optString("registry"))) {
            throw new IOException("This workspace format is not supported.");
        }
        if (manifest.optInt("schemaVersion", 1) != 1) throw new IOException("This workspace database version is not supported.");
        String version = manifest.optString("appVersion");
        if (!version.matches("[23]\\.[0-9]+\\.[0-9]+(?:[-+][a-zA-Z0-9.-]+)?")) {
            throw new IOException("This workspace was created by an incompatible software version.");
        }
        JSONArray expected = manifest.getJSONArray("files");
        if (expected.length() == 0 || expected.length() > MAX_FILES || expected.length() != actual.size()) {
            throw new IOException("The workspace file list is incomplete or invalid.");
        }
        Set<String> seen = new HashSet<>();
        long total = 0;
        for (int i = 0; i < expected.length(); i++) {
            JSONObject file = expected.getJSONObject(i);
            String name = file.getString("path");
            validatePath(name, false);
            if (!seen.add(name)) throw new IOException("The manifest repeats a file.");
            long size = file.getLong("size");
            String sha = file.getString("sha256");
            FileDigest got = actual.get(name);
            if (size < 0 || size > MAX_BYTES || !sha.matches("[0-9a-f]{64}") || got == null
                || size != got.size || !MessageDigest.isEqual(sha.getBytes(StandardCharsets.US_ASCII), got.sha256.getBytes(StandardCharsets.US_ASCII))) {
                throw new IOException("A workspace file is missing, damaged or has been modified: " + name);
            }
            total += size;
            if (total > MAX_BYTES) throw new IOException("The workspace exceeds the 512 MB limit.");
        }
        if (manifest.getLong("totalBytes") != total || !seen.contains("access.sqlite")) {
            throw new IOException("The workspace size or registry does not match its manifest.");
        }
    }

    private static List<Company> validateWorkspace(File payload, JSONObject manifest) throws Exception {
        File registryFile = new File(payload, "access.sqlite");
        List<Company> companies;
        SQLiteDatabase registry = openReadOnly(registryFile);
        try {
            validateDatabase(registry, REGISTRY_COLUMNS, "Account registry");
            companies = readCompanies(registry);
            if (companies.isEmpty()) throw new IOException("The workspace has no companies.");
            JSONArray declared = manifest.getJSONArray("companies");
            Map<String, JSONObject> companyMap = new HashMap<>();
            for (int i = 0; i < declared.length(); i++) {
                JSONObject company = declared.getJSONObject(i);
                String id = company.getString("id");
                requireCompanyId(id);
                if (companyMap.put(id, company) != null) throw new IOException("The workspace repeats a company identity.");
            }
            if (companyMap.size() != companies.size()) throw new IOException("The company manifest does not match the registry.");
            for (Company company : companies) {
                JSONObject declaredCompany = companyMap.get(company.id);
                if (declaredCompany == null || !company.name.equals(declaredCompany.getString("name"))
                    || company.enabled != declaredCompany.getBoolean("enabled")) {
                    throw new IOException("Company details do not match the workspace manifest.");
                }
            }
            validateAccounts(registry, companies);
        } finally { registry.close(); }

        Set<String> ids = new HashSet<>();
        for (Company company : companies) {
            ids.add(company.id);
            SQLiteDatabase business = openReadOnly(new File(payload, "companies/" + company.id + "/business.sqlite"));
            try {
                validateDatabase(business, BUSINESS_COLUMNS, company.name);
                String tenant = scalar(business, "SELECT value FROM app_metadata WHERE key='tenant_id'");
                if (!company.id.equals(tenant)) throw new IOException("A business database belongs to another company: " + company.name);
                if (count(business, "SELECT count(*) FROM companies") != 1
                    || count(business, "SELECT count(*) FROM companies WHERE id='company-default' AND is_default=1") != 1
                    || !company.name.equals(scalar(business, "SELECT name FROM companies WHERE id='company-default'"))) {
                    throw new IOException("A business profile is mixed with another company: " + company.name);
                }
                for (String table : Arrays.asList("invoices", "quotations", "purchases")) {
                    if (count(business, "SELECT count(*) FROM " + table + " WHERE company_id IS NULL OR company_id<>'company-default'") != 0) {
                        throw new IOException("Financial documents refer to another company: " + company.name);
                    }
                }
                if (count(business, "SELECT count(*) FROM settings WHERE id=1") != 1
                    || !company.name.equals(scalar(business, "SELECT company_name FROM settings WHERE id=1"))) {
                    throw new IOException("Company settings do not match their business database.");
                }
            } finally { business.close(); }
        }
        JSONArray fileList = manifest.getJSONArray("files");
        for (int i = 0; i < fileList.length(); i++) {
            String name = fileList.getJSONObject(i).getString("path");
            if (name.startsWith("companies/") && !ids.contains(name.split("/", 3)[1])) {
                throw new IOException("The workspace contains files for an unregistered company.");
            }
        }
        return companies;
    }

    private static void validateAccounts(SQLiteDatabase db, List<Company> companies) throws Exception {
        Set<String> usernames = new HashSet<>();
        try (Cursor rows = db.rawQuery("SELECT username,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super FROM users", null)) {
            while (rows.moveToNext()) {
                String username = rows.getString(0);
                if (username == null || !username.matches("[a-z0-9._-]{3,40}") || !usernames.add(username)) throw new IOException("The workspace has an invalid or duplicate username.");
                for (int i = 1; i <= 4; i++) {
                    String value = rows.getString(i);
                    if (value == null || !value.matches(i == 1 || i == 3 ? "[0-9a-f]{32}" : "[0-9a-f]{128}")) {
                        throw new IOException("A password or recovery hash is missing or incompatible.");
                    }
                }
                requireBit(rows.getInt(5)); requireBit(rows.getInt(6));
            }
        }
        if (usernames.isEmpty() || count(db, "SELECT count(*) FROM users WHERE active=1 AND is_super=1") < 1) {
            throw new IOException("The workspace needs an active software super administrator.");
        }
        try (Cursor rows = db.rawQuery("SELECT role,active,permissions_json FROM memberships", null)) {
            while (rows.moveToNext()) {
                if (!ROLES.contains(rows.getString(0))) throw new IOException("The workspace uses an unsupported user role.");
                requireBit(rows.getInt(1));
                JSONObject permissions = new JSONObject(rows.getString(2));
                for (java.util.Iterator<String> scopes = permissions.keys(); scopes.hasNext();) {
                    Object scope = permissions.get(scopes.next());
                    if (!(scope instanceof JSONObject)) throw new IOException("User permissions are invalid.");
                    requireBooleanObject((JSONObject) scope);
                }
            }
        }
        for (Company company : companies) {
            if (company.enabled && count(db, "SELECT count(*) FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=? AND m.role='company_admin' AND m.active=1 AND u.active=1", company.id) < 1) {
                throw new IOException("An enabled company has no active administrator: " + company.name);
            }
        }
        // SQLite foreign-key declarations are also validated, but explicitly check ownership.
        if (count(db, "SELECT count(*) FROM memberships m LEFT JOIN companies c ON c.id=m.company_id LEFT JOIN users u ON u.id=m.user_id WHERE c.id IS NULL OR u.id IS NULL") != 0) {
            throw new IOException("User memberships refer to missing companies or users.");
        }
    }

    private static void validateDatabase(SQLiteDatabase db, Map<String, String> required, String label) throws Exception {
        try (Cursor integrity = db.rawQuery("PRAGMA integrity_check", null)) {
            if (!integrity.moveToFirst() || !"ok".equals(integrity.getString(0)) || integrity.moveToNext()) throw new IOException(label + " failed database integrity checks.");
        }
        try (Cursor foreign = db.rawQuery("PRAGMA foreign_key_check", null)) {
            if (foreign.moveToFirst()) throw new IOException(label + " contains broken record relationships.");
        }
        try (Cursor objects = db.rawQuery("SELECT name,type,sql FROM sqlite_master WHERE type IN ('table','view','trigger')", null)) {
            while (objects.moveToNext()) {
                String name = objects.getString(0), type = objects.getString(1), sql = objects.getString(2);
                if (!"table".equals(type) || (!name.startsWith("sqlite_") && !required.containsKey(name))
                    || (sql != null && sql.toUpperCase(Locale.ROOT).contains("CREATE VIRTUAL TABLE"))) {
                    throw new IOException(label + " contains unsupported database objects.");
                }
            }
        }
        for (Map.Entry<String, String> table : required.entrySet()) {
            Set<String> found = new HashSet<>();
            try (Cursor info = db.rawQuery("PRAGMA table_info(\"" + table.getKey() + "\")", null)) {
                while (info.moveToNext()) found.add(info.getString(info.getColumnIndexOrThrow("name")));
            }
            for (String column : table.getValue().split(",")) if (!found.contains(column)) {
                throw new IOException(label + " is incompatible: " + table.getKey() + "." + column + " is missing.");
            }
        }
    }

    private static List<Company> readCompanies(File registry) throws Exception {
        SQLiteDatabase db = openReadOnly(registry);
        try { return readCompanies(db); } finally { db.close(); }
    }

    private static List<Company> readCompanies(SQLiteDatabase db) throws Exception {
        List<Company> companies = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        try (Cursor rows = db.rawQuery("SELECT id,name,enabled,profile_json,modules_json,role_limits_json,user_limit FROM companies ORDER BY id", null)) {
            while (rows.moveToNext()) {
                String id = rows.getString(0), name = rows.getString(1);
                requireCompanyId(id);
                if (!ids.add(id) || name == null || name.trim().isEmpty() || name.length() > 160) throw new IOException("The registry has an invalid company identity.");
                requireBit(rows.getInt(2));
                JSONObject profile = new JSONObject(rows.getString(3));
                if (!name.equals(profile.optString("name"))) throw new IOException("Company profile details do not match the registry.");
                requireBooleanObject(new JSONObject(rows.getString(4)));
                JSONObject limits = new JSONObject(rows.getString(5));
                for (java.util.Iterator<String> keys = limits.keys(); keys.hasNext();) {
                    Object limit = limits.get(keys.next());
                    if (!(limit instanceof Number) || ((Number) limit).doubleValue() < 0 || ((Number) limit).doubleValue() > 500) throw new IOException("Company user limits are invalid.");
                }
                if (rows.getInt(6) < 1 || rows.getInt(6) > 500) throw new IOException("Company user limits are invalid.");
                companies.add(new Company(id, name, rows.getInt(2) == 1));
            }
        }
        return companies;
    }

    private static void rebaseRegistry(File payload, File destination, boolean relative) throws Exception {
        File registry = new File(payload, "access.sqlite");
        SQLiteDatabase db = SQLiteDatabase.openDatabase(registry.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);
        try {
            List<Company> companies = readCompanies(db);
            db.beginTransaction();
            try {
                db.execSQL("DELETE FROM sessions");
                for (Company company : companies) {
                    String prefix = "companies/" + company.id;
                    String business = relative ? prefix + "/business.sqlite" : new File(destination, prefix + "/business.sqlite").getAbsolutePath();
                    String backup = relative ? prefix + "/backups" : new File(destination, prefix + "/backups").getAbsolutePath();
                    db.execSQL("UPDATE companies SET data_path=?,backup_dir=? WHERE id=?", new Object[]{business, backup, company.id});
                }
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
            try (Cursor ignored = db.rawQuery("PRAGMA wal_checkpoint(TRUNCATE)", null)) { if (ignored.moveToFirst() && ignored.getInt(0) != 0) throw new IOException("The staged registry could not be fully checkpointed."); }
        } finally { db.close(); }
        removeEmptySidecars(registry);
    }

    private static void checkpoint(File file) throws Exception {
        if (!file.isFile()) throw new IOException("A company database is missing.");
        SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);
        try (Cursor cursor = db.rawQuery("PRAGMA wal_checkpoint(TRUNCATE)", null)) {
            if (cursor.moveToFirst() && cursor.getInt(0) != 0) throw new IOException("Close other database operations before exporting.");
        } finally { db.close(); }
    }

    private static JSONObject createManifest(List<Company> companies, Map<String, FileDigest> files) throws Exception {
        JSONArray companyList = new JSONArray(), fileList = new JSONArray();
        long total = 0;
        for (Company company : companies) companyList.put(new JSONObject().put("id", company.id).put("name", company.name).put("enabled", company.enabled));
        for (Map.Entry<String, FileDigest> entry : files.entrySet()) {
            total += entry.getValue().size;
            fileList.put(new JSONObject().put("path", entry.getKey()).put("size", entry.getValue().size).put("sha256", entry.getValue().sha256));
        }
        return new JSONObject().put("format", FORMAT).put("schemaVersion", 1).put("appVersion", APP_VERSION)
            .put("createdAt", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).format(new Date()))
            .put("registry", "access.sqlite").put("companies", companyList).put("files", fileList).put("totalBytes", total);
    }

    private static void collectFiles(File root, File directory, Map<String, FileDigest> files) throws Exception {
        File[] children = directory.listFiles();
        if (children == null) throw new IOException("The staged workspace could not be read.");
        Arrays.sort(children, (a, b) -> a.getName().compareTo(b.getName()));
        long total = 0;
        for (FileDigest d : files.values()) total += d.size;
        for (File child : children) {
            requirePrivateChild(root.getCanonicalFile(), child.getCanonicalFile());
            if (child.isDirectory()) { collectFiles(root, child, files); continue; }
            String name = root.toURI().relativize(child.toURI()).getPath();
            if (isSidecar(name)) continue;
            validatePath(name, false);
            if (files.size() >= MAX_FILES) throw new IOException("The workspace has too many files.");
            FileDigest digest = digest(child);
            files.put(name, digest);
            total = 0;
            for (FileDigest d : files.values()) total += d.size;
            if (total > MAX_BYTES) throw new IOException("The workspace exceeds the 512 MB limit.");
        }
    }

    private static FileDigest digest(File file) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        long size = 0;
        byte[] buffer = new byte[BUFFER_SIZE];
        try (InputStream input = new BufferedInputStream(new FileInputStream(file))) {
            int n;
            while ((n = input.read(buffer)) != -1) { size += n; if (size > MAX_BYTES) throw new IOException("A workspace file is too large."); sha.update(buffer, 0, n); }
        }
        return new FileDigest(size, hex(sha.digest()));
    }

    private static void copyTree(File source, File target, File sourceRoot) throws Exception {
        requirePrivateChild(sourceRoot.getCanonicalFile(), source.getCanonicalFile());
        if (!source.isDirectory()) throw new IOException("A company data folder is missing.");
        ensureDirectory(target);
        File[] files = source.listFiles();
        if (files == null) throw new IOException("A company data folder could not be read.");
        for (File file : files) {
            // Canonical and absolute equality prevents exporting symlinks into unrelated data.
            if (!file.getCanonicalFile().equals(file.getAbsoluteFile())) throw new IOException("Symbolic links are not supported in workspace exports.");
            if (file.isDirectory()) copyTree(file, new File(target, file.getName()), sourceRoot);
            else if (file.isFile() && !isSidecar(file.getName())) copyFile(file, new File(target, file.getName()));
        }
    }

    private static void copyFile(File source, File target) throws Exception {
        if (!source.isFile() || source.length() > MAX_BYTES) throw new IOException("A workspace file is missing or too large.");
        ensureDirectory(target.getParentFile());
        byte[] buffer = new byte[BUFFER_SIZE];
        try (InputStream input = new BufferedInputStream(new FileInputStream(source)); FileOutputStream output = new FileOutputStream(target)) {
            int n; long size = 0;
            while ((n = input.read(buffer)) != -1) { size += n; if (size > MAX_BYTES) throw new IOException("A workspace file is too large."); output.write(buffer, 0, n); }
            output.getFD().sync();
        }
    }

    private static void writeEntry(ZipOutputStream zip, String name, byte[] bytes) throws IOException {
        zip.putNextEntry(new ZipEntry(name)); zip.write(bytes); zip.closeEntry();
    }

    private static void validatePath(String name, boolean allowManifest) throws IOException {
        if (name == null || name.length() > 1024 || name.startsWith("/") || name.indexOf('\\') >= 0 || name.indexOf(':') >= 0 || name.matches(".*[\\x00-\\x1f\\x7f].*")) throw new IOException("The workspace contains an unsafe file path.");
        if (allowManifest && "manifest.json".equals(name)) return;
        if ("access.sqlite".equals(name)) return;
        String[] parts = name.split("/", -1);
        if (parts.length < 3 || parts.length > 16 || !"companies".equals(parts[0])) throw new IOException("The workspace contains an unexpected file path.");
        requireCompanyId(parts[1]);
        for (String part : parts) if (part.isEmpty() || ".".equals(part) || "..".equals(part) || part.length() > 255) throw new IOException("The workspace contains an unsafe file path.");
        if (isSidecar(name)) throw new IOException("The workspace contains a database journal instead of a complete database snapshot.");
    }

    private static boolean isSidecar(String name) { return name.matches("(?i).*\\.(sqlite|db)-(wal|shm)$"); }
    private static void requireCompanyId(String id) throws IOException { if (id == null || !id.matches(UUID_RE)) throw new IOException("The workspace contains an invalid company UUID."); }
    private static void requireBit(int value) throws IOException { if (value != 0 && value != 1) throw new IOException("A record has an invalid enabled/active value."); }
    private static void requireBooleanObject(JSONObject object) throws Exception {
        for (java.util.Iterator<String> keys = object.keys(); keys.hasNext();) if (!(object.get(keys.next()) instanceof Boolean)) throw new IOException("The workspace contains invalid permission or module settings.");
    }
    private static SQLiteDatabase openReadOnly(File file) throws IOException {
        if (!file.isFile()) throw new IOException("The workspace is missing a required database: " + file.getName());
        return SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
    }
    private static int countUsers(File file) throws Exception { SQLiteDatabase db = openReadOnly(file); try { return (int) count(db, "SELECT count(*) FROM users"); } finally { db.close(); } }
    private static long count(SQLiteDatabase db, String sql, String... args) throws IOException { try (Cursor c = db.rawQuery(sql, args)) { if (!c.moveToFirst()) throw new IOException("A required database record could not be read."); return c.getLong(0); } }
    private static String scalar(SQLiteDatabase db, String sql) { try (Cursor c = db.rawQuery(sql, null)) { return c.moveToFirst() ? c.getString(0) : null; } }
    private static Map<String, String> columns(String... values) { Map<String, String> result = new LinkedHashMap<>(); for (String value : values) { int i = value.indexOf(':'); result.put(value.substring(0, i), value.substring(i + 1)); } return result; }
    private static String hex(byte[] bytes) { StringBuilder out = new StringBuilder(bytes.length * 2); for (byte b : bytes) out.append(String.format(Locale.US, "%02x", b & 255)); return out.toString(); }
    private static String timestamp() { return new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new Date()); }
    private static void ensureDirectory(File dir) throws IOException { if (dir == null || (!dir.isDirectory() && !dir.mkdirs())) throw new IOException("A private workspace folder could not be created."); }
    private static void requirePrivateChild(File root, File target) throws IOException { if (!target.getPath().startsWith(root.getPath() + File.separator)) throw new IOException("The workspace path is outside private app storage."); }
    private static void removeEmptySidecars(File db) throws IOException {
        File wal = new File(db.getAbsolutePath() + "-wal");
        if (wal.exists() && wal.length() > 0) throw new IOException("The staged database still has pending journal data.");
        if (wal.exists()) wal.delete();
        File shm = new File(db.getAbsolutePath() + "-shm");
        if (shm.exists()) shm.delete();
    }
    private static void deletePrivateTree(File target, File privateRoot) throws IOException {
        if (!target.exists()) return;
        File canonical = target.getCanonicalFile();
        requirePrivateChild(privateRoot.getCanonicalFile(), canonical);
        if (target.isDirectory()) {
            File[] children = target.listFiles();
            if (children == null) throw new IOException("The private temporary folder could not be read.");
            for (File child : children) deletePrivateTree(child, privateRoot);
        }
        if (!target.delete() && target.exists()) throw new IOException("A private temporary file could not be removed.");
    }
    private static final class FileDigest { final long size; final String sha256; FileDigest(long size, String sha256) { this.size = size; this.sha256 = sha256; } }
    private static final class Company { final String id, name; final boolean enabled; Company(String id, String name, boolean enabled) { this.id = id; this.name = name; this.enabled = enabled; } }
}

