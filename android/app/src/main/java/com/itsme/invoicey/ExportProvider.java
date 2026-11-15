package com.itsme.invoicey;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Arrays;

/** Read-only provider for files the user explicitly chooses to share. */
public final class ExportProvider extends ContentProvider {
    private File root() { return new File(getContext().getCacheDir(), "share"); }
    private File resolve(Uri uri) throws FileNotFoundException {
        String relative = uri.getPath();
        if (relative == null) throw new FileNotFoundException("Missing export path");
        File file;
        try { file = new File(root(), relative.startsWith("/") ? relative.substring(1) : relative).getCanonicalFile(); }
        catch (Exception error) { throw new FileNotFoundException("Invalid export path"); }
        try { if (!file.getPath().startsWith(root().getCanonicalPath() + File.separator)) throw new FileNotFoundException("Invalid export path"); }
        catch (Exception error) { throw new FileNotFoundException("Invalid export path"); }
        if (!file.isFile()) throw new FileNotFoundException("Export file not found");
        return file;
    }
    @Override public boolean onCreate() { root().mkdirs(); return true; }
    @Override public String getType(Uri uri) { String name = uri.getLastPathSegment(); if (name != null && name.toLowerCase().endsWith(".pdf")) return "application/pdf"; if (name != null && name.toLowerCase().endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; return "application/octet-stream"; }
    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException { if (!"r".equals(mode)) throw new FileNotFoundException("Read-only export"); return ParcelFileDescriptor.open(resolve(uri), ParcelFileDescriptor.MODE_READ_ONLY); }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        try { File file = resolve(uri); String[] columns = projection == null ? new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE} : projection; MatrixCursor result = new MatrixCursor(columns); Object[] row = new Object[columns.length]; for (int i=0;i<columns.length;i++) row[i] = OpenableColumns.DISPLAY_NAME.equals(columns[i]) ? file.getName() : OpenableColumns.SIZE.equals(columns[i]) ? file.length() : null; result.addRow(row); return result; } catch (Exception error) { return null; }
    }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
    @Override public Uri insert(Uri uri, ContentValues values) { return null; }
}

