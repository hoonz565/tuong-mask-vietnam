function safeName(value) {
  return String(value || 'tuong-mask')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function downloadBlob(blob, template, extension = 'png') {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName(template?.name)}-try-on.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareBlob(blob, template) {
  const file = new File([blob], `${safeName(template?.name)}-try-on.png`, { type: blob.type || 'image/png' });
  const shareData = {
    title: `Mặt nạ Tuồng: ${template?.name || ''}`,
    text: 'Ảnh được tạo cục bộ bằng AI Virtual Try-On của Tuồng Digital Archive.',
    files: [file],
  };
  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    await navigator.share(shareData);
    return 'shared';
  }
  downloadBlob(blob, template);
  return 'downloaded';
}
