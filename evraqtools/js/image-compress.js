/**
 * EvraqTools - Görsel Sıkıştırma Motoru (image-compress.js)
 * HTML5 Canvas API ile tarayıcı içinde kayıpsız/kontrollü sıkıştırma sağlar.
 */

class ImageCompressor {
  /**
   * Bir görseli belirtilen kalite ve boyut sınırlarına göre sıkıştırır.
   * @param {File|Blob} file - Sıkıştırılacak görsel dosyası
   * @param {Object} options - { quality: 0.8, maxWidth: 1920, maxHeight: 1920, mimeType: 'image/jpeg' }
   * @returns {Promise<Object>}
   */
  static async compress(file, options = {}) {
    const quality = options.quality !== undefined ? options.quality : 0.8;
    const maxWidth = options.maxWidth || 2560;
    const maxHeight = options.maxHeight || 2560;
    const mimeType = options.mimeType || 'image/jpeg';

    const dataUrl = await EvraqUtils.readFileAsDataURL(file);
    const img = await EvraqUtils.loadImage(dataUrl);

    let { width, height } = img;

    // En-Boy oranını koruyarak yeniden boyutlandırma
    if (width > maxWidth || height > maxHeight) {
      if (width / height > maxWidth / maxHeight) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    // Canvas oluştur
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Şeffaf PNG ise ve JPEG'e çevriliyorsa arka planı beyaz yap
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    // Görseli çiz
    ctx.drawImage(img, 0, 0, width, height);

    // Blob çıktısı al
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    const resultDataUrl = canvas.toDataURL(mimeType, quality);
    const originalSize = file.size;
    const newSize = blob ? blob.size : 0;
    const savingPercent = EvraqUtils.getSavingPercent(originalSize, newSize);

    return {
      blob,
      dataUrl: resultDataUrl,
      width,
      height,
      originalSize,
      newSize,
      savingPercent,
      mimeType,
      fileName: file.name
    };
  }

  /**
   * Hedef dosya boyutuna (KB cinsinden) ulaşmak için akıllı iteratif sıkıştırma yapar.
   * Örnek: targetKb = 500 (E-Devlet için)
   */
  static async compressToTargetSize(file, targetKb, options = {}) {
    const targetBytes = targetKb * 1024;
    
    // Eğer dosya zaten hedeften küçükse ve boyut korunmak isteniyorsa
    if (file.size <= targetBytes && !options.forceRecompress) {
      return this.compress(file, { quality: 0.92, ...options });
    }

    let minQ = 0.1;
    let maxQ = 0.95;
    let bestResult = null;
    let currentMaxWidth = options.maxWidth || 2048;

    // İkili arama (Binary search) ile en iyi kaliteyi bul
    for (let i = 0; i < 5; i++) {
      const midQ = (minQ + maxQ) / 2;
      const res = await this.compress(file, {
        quality: midQ,
        maxWidth: currentMaxWidth,
        maxHeight: currentMaxWidth,
        mimeType: options.mimeType || 'image/jpeg'
      });

      bestResult = res;

      if (res.newSize > targetBytes) {
        maxQ = midQ;
        // Eğer en düşük kalitede dahi büyük kalıyorsa boyutları da küçült
        if (midQ <= 0.25) {
          currentMaxWidth = Math.round(currentMaxWidth * 0.75);
        }
      } else {
        minQ = midQ;
        // Hedefe yeterince yakınsa dur (%15 tolerans)
        if (res.newSize >= targetBytes * 0.85) {
          break;
        }
      }
    }

    return bestResult;
  }
}

window.ImageCompressor = ImageCompressor;
