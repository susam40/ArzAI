"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { htmlToMarkdownInline, markdownToEditorHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content: string;
  onChange: (text: string) => void;
  editable?: boolean;
  className?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  editable = true,
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Dilekçe metnini burada düzenleyin..." }),
    ],
    content: markdownToEditorHtml(content),
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdownInline(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = htmlToMarkdownInline(editor.getHTML());
    if (content !== current) {
      editor.commands.setContent(markdownToEditorHtml(content));
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white shadow-card", className)}>
      <div className="flex flex-wrap gap-1 border-b bg-slate-50/80 p-2">
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-white hover:text-foreground"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Kalın
        </button>
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-white hover:text-foreground"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          İtalik
        </button>
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-white hover:text-foreground"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Madde
        </button>
      </div>
      <EditorContent editor={editor} className="editor-prose px-4 py-3" />
    </div>
  );
}
