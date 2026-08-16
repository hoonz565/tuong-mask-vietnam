function resolveMaskImage(imageUrl) {
  if (!imageUrl || imageUrl.startsWith('/')) return imageUrl;
  if (imageUrl.startsWith('http')) {
    const { pathname } = new URL(imageUrl);
    return pathname.startsWith('/static/images/') ? pathname : imageUrl;
  }
  return `/${imageUrl}`;
}

function setFallbackImage(event, imageUrl) {
  const fileName = imageUrl?.split('/').pop();
  const fallbackPath = fileName ? `/static/images/${fileName}` : '/static/images/placeholder.png';

  if (event.currentTarget.src !== window.location.origin + fallbackPath) {
    event.currentTarget.src = fallbackPath;
  } else {
    event.currentTarget.src = '/static/images/placeholder.png';
  }
}

export default function MaskSelectorGrid({
  masks,
  selectedMaskId,
  onSelect,
  isMaskDisabled = () => false,
  getButtonLabel = (mask) => `Chọn mặt nạ ${mask.name}`,
  compact = false,
}) {
  return (
    <div className={`shrink-0 overflow-y-auto overscroll-contain pr-2 custom-scrollbar ${compact ? 'h-72 lg:h-96' : 'max-h-[65vh]'}`}>
      <div className={`grid auto-rows-max grid-cols-4 gap-0 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-7 xl:grid-cols-7 ${compact ? '' : 'pb-12'}`}>
        {masks.map((mask) => {
          const selected = selectedMaskId === mask.id;
          const disabled = isMaskDisabled(mask);

          return (
            <button
              key={mask.id}
              type="button"
              onClick={() => onSelect(mask)}
              disabled={disabled}
              title={disabled ? 'Chưa có template Try-On' : undefined}
              className={`group relative flex w-full aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden border p-1 transition-all disabled:cursor-not-allowed disabled:opacity-75 ${selected ? 'border-secondary bg-secondary/10' : 'border-tertiary/10 bg-inverse/20 hover:border-tertiary/30'}`}
              aria-pressed={selected}
              aria-label={getButtonLabel(mask)}
            >
              <div className="absolute left-0 top-0 size-1.5 border-l border-t border-tertiary/40 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:size-1/2 group-hover:border-secondary" />
              <div className="absolute right-0 top-0 size-1.5 border-r border-t border-tertiary/40 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:size-1/2 group-hover:border-secondary" />
              <div className="absolute bottom-0 left-0 size-1.5 border-b border-l border-tertiary/40 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:size-1/2 group-hover:border-secondary" />
              <div className="absolute bottom-0 right-0 size-1.5 border-b border-r border-tertiary/40 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:size-1/2 group-hover:border-secondary" />

              <img
                src={resolveMaskImage(mask.image_url)}
                alt=""
                className={`size-full object-contain transition-transform duration-300 ${selected ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}
                onError={(event) => setFallbackImage(event, mask.image_url)}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
