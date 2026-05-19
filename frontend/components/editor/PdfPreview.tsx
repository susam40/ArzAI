"use client";

interface PdfPreviewProps {
  content: string;
  title: string;
}

export default function PdfPreview({ content, title }: PdfPreviewProps) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        A4 Önizleme
      </p>
      <div className="a4-preview">
        <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-wide">{title}</h2>
        {content || (
          <p className="text-center text-muted-foreground italic">Dilekçe metni burada görünecek</p>
        )}
      </div>
    </div>
  );
}
