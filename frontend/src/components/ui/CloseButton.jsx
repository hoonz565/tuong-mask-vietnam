import { forwardRef } from 'react';
import { X } from 'lucide-react';

const CloseButton = forwardRef(function CloseButton({
  ariaLabel = 'Đóng',
  className = '',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      {...props}
      className={`group relative flex size-10 items-center justify-center border border-tertiary/20 text-tertiary transition-colors duration-200 hover:border-secondary focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-secondary ${className}`}
    >
      <span className="absolute -left-px -top-px size-2 border-l-2 border-t-2 border-tertiary/40 transition-colors duration-200 group-hover:border-secondary" aria-hidden="true" />
      <span className="absolute -bottom-px -right-px size-2 border-b-2 border-r-2 border-tertiary/40 transition-colors duration-200 group-hover:border-secondary" aria-hidden="true" />
      <X className="text-tertiary/60 transition-transform duration-200 group-hover:rotate-90 group-hover:text-secondary motion-reduce:transition-none" size={18} aria-hidden="true" />
    </button>
  );
});

export default CloseButton;
