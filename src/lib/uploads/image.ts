/**
 * معالجة الصور المرفوعة (خادم فقط):
 *   1) فكّ الترميز بصرامة = التحقق الحقيقي من المحتوى (لا ثقة بامتداد/ترويسة)
 *   2) حد بكسلات إدخال صارم ضد قنابل الضغط (decompression bombs)
 *   3) rotate() يصحّح الاتجاه من EXIF
 *   4) تصغير إلى 1600px كحد أقصى بلا تكبير
 *   5) إعادة ترميز WebP — يجرد كل EXIF/GPS ضمنياً (خصوصية) ويوحّد الصيغة
 * أي فشل فكّ ترميز = رفض صريح (fail closed).
 */
import sharp from 'sharp';
import {OUTPUT_MAX_DIMENSION, OUTPUT_WEBP_QUALITY} from './constants';

/** سقف بكسلات الإدخال (16383²) — كافٍ لصور الهواتف الحديثة ويمنع القنابل */
const MAX_INPUT_PIXELS = 268_402_689;

export interface ProcessedImage {
  readonly data: Buffer;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
  readonly mimeType: 'image/webp';
}

/** يعالج مخزن الصورة الخام أو يرمي خطأً (المُستدعي يترجمه لرمز API) */
export async function processUploadedImage(input: Buffer): Promise<ProcessedImage> {
  const result = await sharp(input, {
    failOn: 'error',
    limitInputPixels: MAX_INPUT_PIXELS
  })
    .rotate()
    .resize({
      width: OUTPUT_MAX_DIMENSION,
      height: OUTPUT_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({quality: OUTPUT_WEBP_QUALITY})
    .toBuffer({resolveWithObject: true});

  return {
    data: result.data,
    width: result.info.width,
    height: result.info.height,
    sizeBytes: result.info.size,
    mimeType: 'image/webp'
  };
}
