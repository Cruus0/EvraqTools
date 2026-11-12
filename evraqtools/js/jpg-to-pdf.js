/**
 * EvraqTools - JPG → PDF Dönüştürücü (jpg-to-pdf.js)
 * Birden fazla görseli tek ve düzenli bir A4 PDF dokümanına dönüştürür.
 * jsPDF kütüphanesi ile tamamen tarayıcıda çalışır.
 */

class JpgToPdfConverter {
  constructor() {
    this.items = []; // { id, file, dataUrl, width, height, name, size }
    this.counter = 0;
  }

  // Görsel dosyalarını listeye ekler
  async addFiles(files) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const addedItems = [];

    for (let file of files) {
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
        continue;
      }

      this.counter++;
      const dataUrl = await EvraqUtils.readFileAsDataURL(file);
      const img = await EvraqUtils.loadImage(dataUrl);

      const item = {
        id: `img-${Date.now()}-${this.counter}`,
        file,
        dataUrl,
        width: img.width,
        height: img.height,
        name: file.name,
        size: file.size
      };

      this.items.push(item);
      addedItems.push(item);
    }

    return addedItems;
  }

  // Elemanı kaldırır
  removeItem(id) {
    const idx = this.items.findIndex(item => item.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    }
  }

  // Eleman sırasını değiştirir
  moveItem(id, direction) {
    const idx = this.items.findIndex(item => item.id === id);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = this.items[idx];
      this.items[idx] = this.items[idx - 1];
      this.items[idx - 1] = temp;
    } else if (direction === 'down' && idx < this.items.length - 1) {
      const temp = this.items[idx];
      this.items[idx] = this.items[idx + 1];
      this.items[idx + 1] = temp;
    }
  }

  // Tüm listeyi temizler
  clear() {
    this.items = [];
    this.counter = 0;
  }

  /**
   * PDF üretir ve indirir
   * @param {Object} options - { orientation: 'p'|'l'|'auto', margin: 10, pageSize: 'a4', quality: 0.9 }
   */
  async generatePdf(options = {}) {
    if (this.items.length === 0) {
      throw new Error('Lütfen en az bir görsel yükleyin.');
    }

    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error('PDF motoru yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    }

    const margin = options.margin !== undefined ? options.margin : 10; // mm
    const defaultOrientation = options.orientation || 'auto'; // 'p', 'l', or 'auto'
    const pageSize = options.pageSize || 'a4';

    // İlk sayfa yönlendirmesini belirle
    let initialOrientation = 'p';
    if (defaultOrientation === 'auto') {
      const first = this.items[0];
      initialOrientation = first.width > first.height ? 'l' : 'p';
    } else {
      initialOrientation = defaultOrientation;
    }

    const doc = new jsPDF({
      orientation: initialOrientation,
      unit: 'mm',
      format: pageSize,
      compress: true
    });

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      // Sayfa yönünü belirle
      let pageOrientation = defaultOrientation;
      if (defaultOrientation === 'auto') {
        pageOrientation = item.width > item.height ? 'l' : 'p';
      }

      if (i > 0) {
        doc.addPage(pageSize, pageOrientation);
      } else {
        // İlk sayfa yönlendirmesini güncelle gerekiyorsa
        if (doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight() && pageOrientation === 'p') {
          // jsPDF orientation fix
        }
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const printableWidth = pageWidth - (margin * 2);
      const printableHeight = pageHeight - (margin * 2);

      // En-boy oranına göre sığdır (aspect fit)
      const imgRatio = item.width / item.height;
      const printRatio = printableWidth / printableHeight;

      let renderWidth, renderHeight;
      if (imgRatio > printRatio) {
        renderWidth = printableWidth;
        renderHeight = printableWidth / imgRatio;
      } else {
        renderHeight = printableHeight;
        renderWidth = printableHeight * imgRatio;
      }

      // Sayfada ortala
      const x = margin + (printableWidth - renderWidth) / 2;
      const y = margin + (printableHeight - renderHeight) / 2;

      // jsPDF format ('JPEG' or 'PNG')
      const imgFormat = item.file.type.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(item.dataUrl, imgFormat, x, y, renderWidth, renderHeight, undefined, 'FAST');
    }

    return doc;
  }
}

window.JpgToPdfConverter = JpgToPdfConverter;
