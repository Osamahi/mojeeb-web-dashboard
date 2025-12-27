/**
 * Mojeeb Minimal Rich Text Editor
 * Clean, minimal WYSIWYG editor using TipTap
 * Features: Bold, Italic, Lists, Links - matching minimal aesthetic
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 150,
  maxHeight = 500,
  className,
}: RichTextEditorProps) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('rich_text_editor.placeholder');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for minimal aesthetic
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none',
          'focus:outline-none',
          'text-neutral-950 placeholder:text-neutral-400',
          'px-4 py-3'
        ),
        'data-placeholder': defaultPlaceholder,
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Update disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Minimal Toolbar - Responsive touch targets */}
      <div className="flex items-center gap-1 sm:gap-1 p-2 border border-neutral-300 border-b-0 rounded-t-md bg-neutral-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={cn(
            'p-2.5 sm:p-1.5 rounded transition-colors',
            'hover:bg-neutral-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
            'flex items-center justify-center',
            editor.isActive('bold') ? 'bg-neutral-300' : 'bg-transparent'
          )}
          title={t('rich_text_editor.bold')}
          aria-label={t('rich_text_editor.toggle_bold')}
        >
          <Bold className="w-4 h-4 text-neutral-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={cn(
            'p-2.5 sm:p-1.5 rounded transition-colors',
            'hover:bg-neutral-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
            'flex items-center justify-center',
            editor.isActive('italic') ? 'bg-neutral-300' : 'bg-transparent'
          )}
          title={t('rich_text_editor.italic')}
          aria-label={t('rich_text_editor.toggle_italic')}
        >
          <Italic className="w-4 h-4 text-neutral-700" />
        </button>
        <div className="w-px h-4 bg-neutral-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={cn(
            'p-2.5 sm:p-1.5 rounded transition-colors',
            'hover:bg-neutral-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
            'flex items-center justify-center',
            editor.isActive('bulletList') ? 'bg-neutral-300' : 'bg-transparent'
          )}
          title={t('rich_text_editor.bullet_list')}
          aria-label={t('rich_text_editor.toggle_bullet_list')}
        >
          <List className="w-4 h-4 text-neutral-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={cn(
            'p-2.5 sm:p-1.5 rounded transition-colors',
            'hover:bg-neutral-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
            'flex items-center justify-center',
            editor.isActive('orderedList') ? 'bg-neutral-300' : 'bg-transparent'
          )}
          title={t('rich_text_editor.numbered_list')}
          aria-label={t('rich_text_editor.toggle_numbered_list')}
        >
          <ListOrdered className="w-4 h-4 text-neutral-700" />
        </button>
      </div>

      {/* Editor Content */}
      <div
        className={cn(
          'border border-neutral-300 rounded-b-md bg-white',
          'focus-within:ring-2 focus-within:ring-brand-cyan/20 focus-within:border-brand-cyan',
          'transition-colors duration-200',
          'overflow-y-auto',
          disabled && 'bg-neutral-50 cursor-not-allowed'
        )}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
      >
        <EditorContent editor={editor} placeholder={defaultPlaceholder} />
      </div>
    </div>
  );
};
