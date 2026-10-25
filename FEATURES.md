# PlainNVR Viewer - Özellikler

## 🎯 Genel Bakış
PlainNVR Viewer, TrueNAS SCALE üzerinde çalışan PlainNVR NVR sistemi için modern, kullanıcı dostu bir web arayüzüdür.

## ✨ Ana Özellikler

### 1. 📹 Canlı Görüntü
- **HLS Streaming**: go2rtc üzerinden gerçek zamanlı kamera görüntüsü
- **hls.js Entegrasyonu**: Düşük gecikmeli, yüksek kaliteli stream
- **Otomatik Yeniden Bağlanma**: Ağ kesintilerinde otomatik toparlanma
- **Video Kontrolleri**: Oynat/Duraklat, Ses kontrolü
- **Multi-Kamera Desteği**: Kameralar arası hızlı geçiş

### 2. 🗓️ Kayıt Arşivi
- **Takvim Bazlı Navigasyon**: Kayıt olan günleri görsel olarak belirleme
- **Zaman Damgası**: Her kayıt için başlangıç-bitiş saati
- **Dosya Boyutu**: Kayıt dosyalarının boyut bilgisi
- **Video Oynatıcı**: HTTP Range desteği ile hızlı ileri/geri sarma
- **Kayıt Toplam İstatistik**: Seçili gündeki toplam kayıt boyutu

### 3. 🔐 Güvenlik
- **JWT Authentication**: Token tabanlı güvenli oturum yönetimi
- **Salt Okunur Mod**: Veritabanına yazma erişimi kapalı
- **Token Süresi Dolma**: Otomatik oturum sonlandırma
- **Read-Only SQLite**: immutable=1 bayrak ile veri güvenliği

### 4. 📊 Sistem Bilgileri
- **Disk Kullanımı**: Header'da gerçek zamanlı disk doluluk oranı
- **Otomatik Güncelleme**: Her 30 saniyede bir disk durumu kontrolü
- **Görsel İndikatör**: Progress bar ile disk kullanımı gösterimi
- **Detaylı Bilgi**: Kullanılan/Toplam alan (GB cinsinden)

### 5. 📹 Kamera Detayları
- **Kayıt Zamanlaması**:
  - 7/24 Sürekli Kayıt
  - Haftalık Program (Gün ve saat bazında)
  - Başlangıç-Bitiş saatleri
- **Retention (Saklama Süresi)**: Kayıtların kaç gün saklandığı bilgisi
- **Canlı Durum**: Aktif kameraların göstergesi

### 6. 🎨 Modern Arayüz
- **Glassmorphism Tasarım**: Saydam cam efektli modern UI
- **Dark Theme**: Göz dostu koyu tema
- **Responsive Design**: Mobil, tablet ve masaüstü uyumlu
- **Smooth Animations**: Akıcı geçişler ve animasyonlar
- **Keyboard Navigation**: Klavye ile hızlı erişim

## 🏗️ Teknik Detaylar

### Backend (FastAPI)
- **Framework**: FastAPI 0.104.1
- **Authentication**: JWT + PassLib
- **Database**: SQLite (Read-Only)
- **Live Streaming**: go2rtc proxy (HLS)
- **Dependencies**: httpx, uvicorn, pydantic

### Frontend (React + TypeScript)
- **Framework**: React 19.3.1 + TypeScript 6.0.3
- **Build Tool**: Vite 8.3.4
- **HLS Player**: hls.js 1.5.8
- **Date Handling**: date-fns 4.4.0
- **Calendar**: react-calendar 6.0.1
- **Bundle Size**: ~267 KB (gzipped)

### Deployment
- **Container**: Docker + Docker Compose
- **Backend Port**: 8000
- **Frontend Port**: 8080
- **Reverse Proxy**: Nginx (Alpine)
- **Restart Policy**: unless-stopped

## 📂 Klasör Yapısı
```
plainnvr-viewer/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py          # JWT authentication
│   │   │   ├── cameras.py       # Kamera listesi
│   │   │   ├── recordings.py    # Kayıt listesi
│   │   │   ├── video.py         # Video stream
│   │   │   ├── system.py        # Disk kullanımı
│   │   │   └── live.py          # Canlı görüntü (go2rtc proxy)
│   │   ├── db.py                # SQLite yardımcıları
│   │   ├── models.py            # Pydantic modeller
│   │   ├── auth.py              # JWT yardımcıları
│   │   ├── config.py            # Konfigürasyon
│   │   └── main.py              # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx       # Disk kullanımı + Developer credit
│   │   │   ├── CameraInfo.tsx   # Schedule + Retention bilgisi
│   │   │   ├── CameraList.tsx
│   │   │   ├── CalendarPicker.tsx
│   │   │   ├── RecordingList.tsx
│   │   │   └── VideoPlayer.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ViewerPage.tsx   # Kayıt arşivi
│   │   │   └── LiveViewPage.tsx # Canlı görüntü
│   │   ├── api/
│   │   │   └── client.ts        # API çağrıları
│   │   ├── types.ts             # TypeScript types
│   │   ├── App.tsx              # Ana uygulama + Navigation
│   │   └── index.css            # Global stiller
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## 🚀 Kurulum

### Gereksinimler
- TrueNAS SCALE
- PlainNVR kurulu ve çalışıyor
- Docker + Docker Compose
- Git

### Adımlar
```bash
# 1. Repository'yi klonla
cd /mnt/DATA/nv1
git clone https://github.com/onder7/plainnvr-viewer.git
cd plainnvr-viewer

# 2. Environment değişkenlerini ayarla
cat > .env << EOF
VIEWER_PASSWORD=YourSecurePassword
JWT_SECRET=your-long-random-jwt-secret-here
NVR_DB_PATH=/mnt/DATA/nv1/nvr.sqlite3
NVR_VIDEO_ROOT=/mnt/DATA/nv1
EOF

# 3. Build ve başlat
docker compose build --no-cache
docker compose up -d

# 4. Durumu kontrol et
docker compose ps
```

### Erişim
- **Web Arayüzü**: http://your-truenas-ip:8080
- **API Docs**: http://your-truenas-ip:8000/docs
- **Varsayılan Şifre**: .env dosyasındaki VIEWER_PASSWORD

## 🔄 Güncelleme
```bash
cd /mnt/DATA/nv1/plainnvr-viewer
git pull
docker compose build --no-cache
docker compose up -d
```

## 🎯 Kullanım

### Kayıtları İzleme
1. Web arayüzüne giriş yap
2. "📼 Kayıtlar" sekmesinde kal
3. Sol panelden kamera seç
4. Takvimden gün seç
5. Kayıt listesinden video seç
6. Oynatıcıda izle

### Canlı Görüntü
1. "📹 Canlı Görüntü" sekmesine geç
2. Sol panelden kamera seç
3. HLS stream otomatik başlar
4. Video kontrollerini kullan

### Kamera Bilgileri
- Sol alt köşede kamera detayları
- Kayıt zamanlaması
- Saklama süresi bilgisi

## 🛠️ Geliştirici

**Önder Aköz**  
📧 onder7@gmail.com  
🔗 [GitHub](https://github.com/onder7)

## 📝 Notlar

- Tüm API endpoint'leri JWT token gerektirir
- Video dosyaları `/mnt/DATA/nv1/<camera-slug>/` klasörlerinde aranır
- go2rtc servisi localhost:1984'te çalışmalıdır
- Disk kullanımı `/mnt/DATA/nv1` mount point'inden hesaplanır

## 🐛 Sorun Giderme

### Backend logları
```bash
docker compose logs backend
```

### Frontend logları
```bash
docker compose logs frontend
```

### Restart
```bash
docker compose restart
```

### Tam yeniden başlatma
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 📄 Lisans
Bu proje açık kaynak kodludur ve MIT lisansı altındadır.

---
**Not**: PlainNVR Viewer, PlainNVR NVR sisteminin resmi bir ürünü değildir. Bağımsız bir topluluk projesidir.
