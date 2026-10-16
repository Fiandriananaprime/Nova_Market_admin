import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className = '' }: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label={t('Close modal')} onClick={onClose}/>
    <div role="dialog" aria-modal="true" aria-label={title} className={`relative z-10 flex max-h-[80vh] w-full flex-col rounded-2xl border border-border bg-card shadow-2xl ${className}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-border p-5">
        <h3 className="font-semibold text-secondary-foreground">{title}</h3>
        <button type="button" onClick={onClose} aria-label={t('Close modal')} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><X className="h-4 w-4" aria-hidden="true"/></button>
      </div>
      <div className="overflow-y-auto p-5">{children}</div>
      {footer && <div className="flex shrink-0 gap-2 p-5 pt-0">{footer}</div>}
    </div>
  </div>;
}
