# PlainNVR Viewer

PlainNVR kayıtlarını tarih ve kameraya göre filtreleyip izletebileceğiniz, salt okunur (read-only) bir web uygulaması.

## Özellikler

- 📹 Tüm kameraları listele
- 📅 Takvim üzerinden tarih seç (kayıt olan günler vurgulanır)
- 🎬 Seçilen güne ait video segmentlerini oynat
- 🔒 Salt okunur (read-only) — PlainNVR verilerine müdahale etmez
- 🐳 Docker ile kolay kurulum

## Mimari

- **Backend:** Python 3.11 + FastAPI
  - SQLite veritabanını read-only modda okur
  - Dosya sistemini tarayarak kayıt listesini oluşturur
  - HTTP Range desteği ile video streaming
  
- **Frontend:** React 18 + TypeScript + Vite
  - Takvim görünümü (react-calendar)
  - 3 sütunlu düzen: kameralar | takvim+kayıtlar | oynatıcı
  - HTML5 video oynatıcı

## Gereksinimler

- Docker ve Docker Compose
- TrueNAS SCALE (veya Linux + ZFS)
- PlainNVR'ın `/mnt/DATA/nv1` yolunda kurulu olması

## Kurulum

### 1. Depoyu klonlayın

```bash
git clone https://github.com/onder7/plainnvr-viewer
cd PlainNVR
```

### 2. TrueNAS'ta Docker Compose ile çalıştırın

```bash
docker compose up -d
```

### 3. Tarayıcıdan erişin

```
http://<truenas-ip>:8080
```

## Geliştirme

### Backend geliştirme

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API dokümantasyonu: `http://localhost:8000/docs`

### Frontend geliştirme

```bash
cd frontend
npm install
npm run dev
```

Geliştirme sunucusu: `http://localhost:5173`

## Yapılandırma

`docker-compose.yml` içindeki environment değişkenleri:

- `NVR_VIDEO_ROOT`: PlainNVR veri kökü (varsayılan: `/mnt/DATA/nv1`)
- `NVR_DB_PATH`: SQLite veritabanı yolu (varsayılan: `/mnt/DATA/nv1/nvr.sqlite3`)

### Giriş ve oturum

Viewer artık kullanıcı adı olmadan tek bir environment şifresiyle korunur. Proje kökünde `.env` dosyası oluşturup aşağıdaki değerleri değiştirin:

```env
VIEWER_PASSWORD=senin_sifreni
JWT_SECRET=uzun-rastgele-bir-jwt-secret
```

Frontend giriş formu `/api/auth/login` endpointinden JWT alır ve tarayıcının `localStorage` alanında saklar. Kamera, takvim ve kayıt endpointleri Bearer token ister; HTML5 video oynatıcısının Range/seek desteğini korumak için video isteği tokenı URL query parametresi olarak taşır. Token süresi dolduğunda uygulama otomatik olarak login ekranına döner.

## Klasör Adlandırması

PlainNVR'da klasör adlandırması tutarsızdır. Bu uygulama her kamera için 3 aday klasörü tarar:

1. **Slug klasör:** `cameras.slug` (örn: `okuldisalan`)
2. **Son oktet klasör:** RTSP IP'sinin son okteti (örn: `197` for `192.168.1.197`)
3. **Full IP klasör:** IP'de noktalar tire (örn: `192-168-1-197`)

Dosyalar otomatik birleştirilir ve yinelemeler temizlenir.

## Güvenlik

- Backend **hiçbir zaman** PlainNVR veritabanına veya video dosyalarına yazmaz
- SQLite `mode=ro` (read-only) ile açılır
- Docker volume read-only (`:ro`) mount edilir
- Video endpoint path traversal koruması içerir

## Bilinen Sınırlamalar

- Auth/login yok (yerel ağ için tasarlandı)
- Tek oynatıcı (çoklu kamera desteklenmez)
- Canlı yayın yok (sadece kayıtlı segmentler)
- Çok büyük tarih aralıkları performans sorunu yaratabilir

## Lisans

MIT
