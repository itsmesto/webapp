package com.itsme.invoicey;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Picture;
import android.graphics.pdf.PdfDocument;
import android.graphics.pdf.PdfRenderer;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/** Creates a clean A4 PDF from exactly one document surface and checks every page. */
public final class PdfExport {
    private static final int A4_WIDTH_POINTS = 595;
    private static final int A4_HEIGHT_POINTS = 842;
    private static final int PAGE_MARGIN_LEFT_POINTS = 43;
    private static final int PAGE_MARGIN_RIGHT_POINTS = 42;
    private static final int PAGE_MARGIN_TOP_POINTS = 42;
    private static final int PAGE_MARGIN_BOTTOM_POINTS = 42;
    private static final int CONTENT_WIDTH_POINTS = A4_WIDTH_POINTS - PAGE_MARGIN_LEFT_POINTS - PAGE_MARGIN_RIGHT_POINTS;
    private static final int CONTENT_HEIGHT_POINTS = A4_HEIGHT_POINTS - PAGE_MARGIN_TOP_POINTS - PAGE_MARGIN_BOTTOM_POINTS;
    private PdfExport() {}
    public interface Callback { void complete(File file, JSONObject quality, Exception error); }

    public static void generate(WebView web, Context context, String name, Callback callback) {
        Handler main = new Handler(Looper.getMainLooper());
        main.post(() -> {
            File file = null;
            try {
                if (web.getWidth() <= 0 || web.getHeight() <= 0) throw new IOException("The document is not ready to export.");
                File dir = new File(context.getCacheDir(), "pdf-export");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("The document folder could not be created.");
                String safe = String.valueOf(name == null ? "Business_document" : name).replaceAll("[^A-Za-z0-9._-]", "_");
                if (safe.length() < 3) safe = "Business_document";
                file = File.createTempFile(safe + "-", ".pdf", dir);
                final File output = file;
                web.evaluateJavascript("(()=>{const old=document.getElementById('androidPdfExportHost');if(old)old.remove();const sources=[...document.querySelectorAll('#modalRoot .pdf-document')];if(sources.length!==1)return 'false|duplicate';const source=sources[0];const wrapper=source.closest('.print-wrap')||source;const host=document.createElement('div');host.id='androidPdfExportHost';host.className='android-pdf-export-host';const copy=wrapper.cloneNode(true);if(copy.querySelectorAll('.pdf-document').length!==1)return 'false|duplicate-copy';host.appendChild(copy);document.body.appendChild(host);document.documentElement.classList.add('android-pdf-export');document.body.classList.add('android-pdf-export');const doc=host.querySelector('.pdf-document');if(!doc)return 'false|document';if(doc.querySelectorAll('.doc-items-table').length!==1)return 'false|duplicate-table';const r=doc.getBoundingClientRect();const pageHeight=r.width*" + (CONTENT_HEIGHT_POINTS / (float) CONTENT_WIDTH_POINTS) + ";doc.style.minHeight=pageHeight+'px';doc.style.display='block';const bounds=doc.getBoundingClientRect();return 'true|'+bounds.width+'|'+bounds.height;})()", ready -> {
                    String payload = ready == null ? "" : ready.replace("\\\"", "").replace("\"", "");
                    if (!payload.startsWith("true|")) { completeAfterRestore(web, callback, output, null, new IOException("The printable document contains duplicate or invalid invoice content.")); return; }
                    String[] values = payload.split("\\|");
                    float cssWidth = values.length > 1 ? parseFloat(values[1], 0) : 0;
                    float cssHeight = values.length > 2 ? parseFloat(values[2], 0) : 0;
                    main.postDelayed(() -> render(web, output, cssWidth, cssHeight, callback), 180);
                });
            } catch (Exception error) {
                if (file != null) file.delete();
                callback.complete(null, null, error);
            }
        });
    }

    private static float parseFloat(String value, float fallback) {
        try { return Float.parseFloat(value); } catch (Exception ignored) { return fallback; }
    }

    private static void render(WebView web, File file, float cssWidth, float cssHeight, Callback callback) {
        try {
            Picture picture = web.capturePicture();
            int contentWidth = picture.getWidth();
            int contentHeight = picture.getHeight();
            if (contentWidth <= 0 || contentHeight <= 0) throw new IOException("The printable document has no rendered content.");
            // The cloned document reports its exact bounds. Crop any viewport tail
            // before slicing so a second blank page can never be emitted.
            if (cssWidth > 0 && cssHeight > 0) {
                int documentHeight = Math.round(cssHeight * contentWidth / cssWidth);
                if (documentHeight > 0 && documentHeight < contentHeight) contentHeight = documentHeight;
            }
            float scale = CONTENT_WIDTH_POINTS / (float) contentWidth;
            float sourcePageHeight = CONTENT_HEIGHT_POINTS / scale;
            PdfDocument document = new PdfDocument();
            try {
                int pageNo = 0;
                float pageStart = 0;
                while (pageStart < contentHeight - 1 && pageNo < 500) {
                    float pageEnd = Math.min(contentHeight, pageStart + sourcePageHeight);
                    if (pageEnd <= pageStart + 1) break;
                    PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(A4_WIDTH_POINTS, A4_HEIGHT_POINTS, pageNo + 1).create());
                    Canvas canvas = page.getCanvas();
                    canvas.drawColor(Color.WHITE);
                    canvas.save();
                    canvas.clipRect(PAGE_MARGIN_LEFT_POINTS, PAGE_MARGIN_TOP_POINTS, A4_WIDTH_POINTS - PAGE_MARGIN_RIGHT_POINTS, A4_HEIGHT_POINTS - PAGE_MARGIN_BOTTOM_POINTS);
                    // Draw the one full document once for this exact non-overlapping
                    // source range. Do not paint a separate header or replay a second
                    // document: both caused duplicate tables on page two.
                    canvas.translate(PAGE_MARGIN_LEFT_POINTS, PAGE_MARGIN_TOP_POINTS);
                    canvas.scale(scale, scale);
                    canvas.translate(0, -pageStart);
                    picture.draw(canvas);
                    canvas.restore();
                    document.finishPage(page);
                    pageStart = pageEnd;
                    pageNo++;
                }
                if (pageNo == 0 || pageStart < contentHeight - 1) throw new IOException("The printable document could not be paginated completely.");
                try (FileOutputStream output = new FileOutputStream(file)) { document.writeTo(output); }
            } finally { document.close(); }
            completeAfterRestore(web, callback, file, validate(file), null);
        } catch (Exception error) { completeAfterRestore(web, callback, file, null, error); }
    }

    private static void completeAfterRestore(WebView web, Callback callback, File file, JSONObject quality, Exception error) {
        web.evaluateJavascript("(()=>{document.documentElement.classList.remove('android-pdf-export');document.body.classList.remove('android-pdf-export');const host=document.getElementById('androidPdfExportHost');if(host)host.remove();return 'ok';})()", ignored -> {
            if (error != null && file != null) file.delete();
            callback.complete(error == null ? file : null, quality, error);
        });
    }

    public static JSONObject validate(File file) throws Exception {
        if (file == null || !file.isFile() || file.length() < 100) throw new IOException("The PDF is empty or incomplete.");
        JSONArray details = new JSONArray(); int width = 0, height = 0, blank = 0, black = 0, pages;
        try (PdfRenderer renderer = new PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY))) {
            pages = renderer.getPageCount();
            if (pages < 1 || pages > 500) throw new IOException("The PDF has an invalid number of pages.");
            for (int i = 0; i < pages; i++) {
                try (PdfRenderer.Page page = renderer.openPage(i)) {
                    width = page.getWidth(); height = page.getHeight();
                    if (Math.abs(width - A4_WIDTH_POINTS) > 3 || Math.abs(height - A4_HEIGHT_POINTS) > 3) throw new IOException("PDF page " + (i + 1) + " is not A4 portrait (" + width + " × " + height + " points).");
                    Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                    try {
                        bitmap.eraseColor(Color.WHITE); page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);
                        int[] pixels = new int[width * height]; bitmap.getPixels(pixels, 0, width, 0, 0, width, height);
                        int dark = 0, ink = 0;
                        for (int pixel : pixels) { int r = Color.red(pixel), g = Color.green(pixel), b = Color.blue(pixel); if (r < 20 && g < 20 && b < 20) dark++; if (r < 245 || g < 245 || b < 245) ink++; }
                        if (ink < 20) blank++; if (dark > pixels.length * .999) black++;
                        details.put(new JSONObject().put("page", i + 1).put("width", width).put("height", height).put("inkPixels", ink).put("blackPixels", dark));
                    } finally { bitmap.recycle(); }
                }
            }
        }
        if (blank > 0) throw new IOException("The PDF contains blank pages and was not exported.");
        if (black > 0) throw new IOException("The PDF contains black pages and was not exported.");
        return new JSONObject().put("pages", pages).put("width", width).put("height", height).put("blankPages", blank).put("blackPages", black).put("pageDetails", details);
    }
}

