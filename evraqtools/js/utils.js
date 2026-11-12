/**
 * EvraqTools - Ortak Yardımcı Fonksiyonlar (utils.js)
 * Tüm işlemler istemci (browser) tarafında güvenli bir şekilde yürütülür.
 */

// Dosya boyutunu insan tarafından okunabilir formata dönüştürür (KB, MB vb.)
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Yüzde tasarruf hesaplar
function getSavingPercent(originalBytes, newBytes) {
  if (!originalBytes || originalBytes <= 0) return 0;
  if (newBytes >= originalBytes) return 0;
  const diff = originalBytes - newBytes;
  return Math.round((diff / originalBytes) * 100);
}

// Dosyayı DataURL olarak okur (Promise)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

// Dosyayı ArrayBuffer olarak okur (Promise - PDF ve ikili işlemler için)
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Dosya ikili olarak okunamadı.'));
    reader.readAsArrayBuffer(file);
  });
}

// Resim URL veya DataURL'ini Image nesnesine yükler
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
    img.src = src;
  });
}

// Blob nesnesini kullanıcıya indirir
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// Toast Bildirimi Göster
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, duration);
}

// Sürükle-bırak (Dropzone) yöneticisi
function setupDropzone(dropzoneEl, inputEl, onFilesSelected) {
  if (!dropzoneEl || !inputEl) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('drag-over');
    }, false);
  });

  dropzoneEl.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  });

  dropzoneEl.addEventListener('click', (e) => {
    if (e.target !== inputEl) {
      inputEl.click();
    }
  });

  inputEl.addEventListener('change', () => {
    if (inputEl.files && inputEl.files.length > 0) {
      onFilesSelected(inputEl.files);
    }
  });
}

// Sayfa yüklendiğinde global yardımcıları window'a bağla
window.EvraqUtils = {
  formatBytes,
  getSavingPercent,
  readFileAsDataURL,
  readFileAsArrayBuffer,
  loadImage,
  downloadBlob,
  showToast,
  setupDropzone
};
