# Hiqu

Gerçek kullanıcı hesapları, arkadaşlık sistemi ve yazılı sohbet ile Discord benzeri mesajlaşma uygulaması.

## Özellikler

- **Kayıt / Giriş** — E-posta, kullanıcı adı ve şifre ile hesap oluşturma
- **Arkadaş sistemi** — İstek gönder, kabul et, reddet, engelle
- **DM sohbet** — Arkadaşlarla gerçek zamanlı direkt mesaj
- **Sunucular** — Oluştur, davet koduyla katıl, metin kanalları
- **Kanal sohbeti** — Sunucu kanallarında gerçek zamanlı mesajlaşma
- **Presence** — Çevrimiçi / boşta / rahatsız etmeyin durumları

## Başlatma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## Kullanım

1. **Kayıt Ol** sekmesinden hesap oluştur
2. Başka bir tarayıcı/sekmede ikinci hesap aç
3. **Arkadaş Ekle** ile karşı tarafın kullanıcı adını gir
4. Karşı taraf **Bekleyen** sekmesinden isteği kabul etsin
5. DM veya sunucu kanallarından mesajlaş

### Sunucu

- **+** butonu → sunucu oluştur (otomatik `#general` kanalı)
- **Pusula** butonu → davet kodu ile katıl
- Ayarlardan davet kodunu paylaş

## Teknolojiler

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Socket.io

**Backend:** Node.js, Express, Socket.io, bcryptjs, JSON veritabanı

## Scripts

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Backend + frontend |
| `npm run build` | Production build |
| `npm run start` | Production backend |
