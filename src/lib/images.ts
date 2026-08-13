export function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Sadece görsel dosyası yükleyebilirsin"));
  }
  if (file.size > 2 * 1024 * 1024) {
    return Promise.reject(new Error("Görsel en fazla 2MB olabilir"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}
