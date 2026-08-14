export const PHOTO_LAYOUTS = Object.freeze([
  { id: 'square', label: 'Vuông', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Chân dung', width: 1080, height: 1350 },
  { id: 'strip', label: 'Photo strip', width: 900, height: 1600 },
]);

function drawCover(context, image, x, y, width, height) {
  const sourceAspect = image.width / image.height;
  const targetAspect = width / height;
  let sx = 0;
  let sy = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  if (sourceAspect > targetAspect) {
    sourceWidth = image.height * targetAspect;
    sx = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetAspect;
    sy = (image.height - sourceHeight) / 2;
  }
  context.drawImage(image, sx, sy, sourceWidth, sourceHeight, x, y, width, height);
}

function drawArchiveFrame(context, layout, image, template) {
  const margin = layout.id === 'strip' ? 56 : 48;
  context.fillStyle = '#14171f';
  context.fillRect(0, 0, layout.width, layout.height);
  context.strokeStyle = '#ff1919';
  context.lineWidth = 10;
  context.strokeRect(22, 22, layout.width - 44, layout.height - 44);
  context.strokeStyle = '#ebe5ce';
  context.lineWidth = 2;
  context.strokeRect(36, 36, layout.width - 72, layout.height - 72);

  const footerHeight = layout.id === 'strip' ? 180 : 130;
  const imageHeight = layout.height - margin * 2 - footerHeight;
  if (layout.id === 'strip') {
    const gap = 14;
    const panelHeight = (imageHeight - gap * 2) / 3;
    for (let panel = 0; panel < 3; panel += 1) {
      drawCover(context, image, margin, margin + panel * (panelHeight + gap), layout.width - margin * 2, panelHeight);
    }
  } else {
    drawCover(context, image, margin, margin, layout.width - margin * 2, imageHeight);
  }

  context.fillStyle = '#ebe5ce';
  context.font = '700 34px Arial, sans-serif';
  context.fillText((template?.name || 'MẶT NẠ TUỒNG').toUpperCase(), margin, layout.height - 78);
  context.fillStyle = '#ff1919';
  context.font = '600 18px Arial, sans-serif';
  context.fillText('TUỒNG DIGITAL ARCHIVE · ON-DEVICE TRY-ON', margin, layout.height - 42);
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Không thể xuất ảnh Photobooth.'));
    }, type, quality);
  });
}

export async function composeCapture(sourceBlob, layoutId, template, type = 'image/png') {
  const layout = PHOTO_LAYOUTS.find((item) => item.id === layoutId) || PHOTO_LAYOUTS[0];
  const bitmap = await createImageBitmap(sourceBlob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = layout.width;
    canvas.height = layout.height;
    const context = canvas.getContext('2d', { alpha: false });
    drawArchiveFrame(context, layout, bitmap, template);
    return await canvasToBlob(canvas, type, 0.94);
  } finally {
    bitmap.close();
  }
}
