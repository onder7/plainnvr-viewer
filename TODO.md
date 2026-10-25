# PlainNVR Özel İzleme Uygulaması — AI Uygulama Planı (TODO)

Bu belge, bir AI kodlama ajanının adım adım takip edip projeyi baştan sona uygulayabilmesi için yazılmıştır. Her fazın kendi doğrulama (acceptance) kriteri vardır; bir faz bitmeden diğeri başlamamalıdır.

---

## 0. Proje Özeti ve Hedef

**Amaç:** PlainNVR tarafından ZFS havuzunda (`/mnt/DATA/nv1`) saklanan video kayıtlarını, `nvr.sqlite3` veritabanı üzerinden sorgulayan; kullanıcıya takvim/tarih seçici üzerinden tarih ve kamera filtreleyip seçilen segmentleri HTML5 video oynatıcıda izleteyen bir web uygulaması geliştirmek.

**Çalışma ortamı:** TrueNAS üzerinde Docker. ZFS havuzu konteynere **salt okunur (read-only)** bağlanır. Uygulama DB'yi okur, video dosyalarını stream eder; **hiçbir yere yazmaz** (kayıt sistemine müdahale etmez).

### Kaynak Veri Yapısı
- **Veri kökü:** `/mnt/DATA/nv1` — PlainNVR veri köküdür; hem config dosyalarını hem kamera klasörlerini içerir.
- **Config dosyaları (kamera DEĞİL, atlanacak):** `docker-compose.yml`, `go2rtc.json`, `go2rtc.log`, `nvr.sqlite3`.
- **Kamera klasörleri:** `/mnt/DATA/nv1/<kamera>/` — kamera başına düz bir klasör, içinde MP4'ler düz yatar (tarih alt klasörü YOK).
- **Video dosyaları:** `/mnt/DATA/nv1/<kamera>/YYYYMMDDTHHMMSS.mp4` (ISO 8601 basic format).
- **Veritabanı (`nvr.sqlite3`):** SADECE kamera tanımlarını ve sistem olay günlüğünü içerir. **Kayıt/zaman aralığı tablosu YOKTUR.**

> KRİTİK BULGU: Kayıt listesi veritabanından GELEMEZ. Backend `/mnt/DATA/nv1/<kamera>/`'i tarayıp dosya adlarından timestamp çözerek kayıt listesini üretmek zorundadır. DB sadece kamera listesi ve (opsiyonel) olay günlüğü için kullanılır.

### Doğrulanan Bulgular (TrueNAS SSH keşfi — salt okunur)
1. **Video formatı:** `.mp4` ✅
2. **Dosya adı timestamp biçimi:** `YYYYMMDDTHHMMSS.mp4` ✅ — örnek: `20261023T051004.mp4` → 2026-10-23 05:10:04. Çözüm: `datetime.strptime(stem, "%Y%m%dT%H%M%S")`.
3. **Klasör yapısı:** düz, `/mnt/DATA/nv1/<folder>/<dosya>.mp4`, tarih alt klasörü yok ✅
4. **Kamera→klasör mapping (KRİTİK — tutarsız ama çözülebilir):** Bir kameranın kayıtları **3 farklı adlı klasöre** yayılabilir. `fsindex` bir kamera için **3 aday klasörü de** tarayıp var olanları birleştirmeli, `start`+`size`'a göre dedupe etmeli:
   - **(a) Son-oktet numeric klasör** — `cameras.rtsp_url`'den host IP'sini al, son okteti klasör adı kullan. **18 kameranın hepsinde mevcut** (tutarlı ana şema). Örn: `rtsp://192.168.0.53:554/...` → klasör `53`.
   - **(b) Slug klasör** — `cameras.slug` adıyla. **Sadece 4 kamerada** mevcut (`okuldisalan`, `serviscikis`, `basket-sol-kamera`, `havuz`), ama bunlar **daha yeni kayıtlar** içeriyor (slug'a migration). Taranmazsa son kayıtlar kaçar.
   - **(c) Full-IP-dashed klasör** — host IP'de noktaları tireye çevir. **Sadece 6 kamerada** mevcut (`192-168-1-197` vb.), tutarsız. Örn: `192.168.0.53` → `192-168-0-53`.
   - IP ayrıştırma: `urllib.parse.urlparse(rtsp_url).hostname` (user:pass@ varsa otomatik ele). Son oktet: `host.rsplit('.',1)[-1]`. Dashed: `host.replace('.','-')`.
   - **Çarpışma uyarısı:** son-oktet iki kamerada aynıysa (örn. 192.168.0.53 ve 192.168.1.53) aynı klasöre düşerler. Bu veri setinde benzersiz, ama kod `folder→camera` map'ini `slug` > `full-IP-dashed` > `son-oktet` önceliğiyle kurarsa çakışma riski azalır. v1 için son-okset benzersiz, not olarak kalsın.
5. **Veri kökü karması:** `/mnt/DATA/nv1` config (`docker-compose.yml`, `go2rtc.json`, `go2rtc.log`, `nvr.sqlite3`) + kamera klasörlerini beraber içerir. `fsindex` sadece DB kameralarına eşleşen klasörleri tarar, config dosyalarını ve orphan klasörleri (DB'de olmayan, örn. silinmiş kamera artıkları) eleme.
6. **go2rtc:** PlainNVR canlı yayın için go2rtc kullanır (`go2rtc.json`, `live_view_mode='hls'`). Kayıtlı oynatma kapsam dışı — MP4'leri direkt serve ediyoruz.
7. **Segment bitişi:** dosya adları düzgün 60s aralıklı DEĞİL. `end` = sıradaki dosyanın `start`'ı; son segment için boş bırak (oynatıcı MP4 metadata'dan okur).
8. **Kamera sayısı:** 18 kamera, hepsi `enabled=1`. `segment_seconds` 60 veya 300.

### Bilinen SQLite Şeması (keşfedildi)
```
cameras            id TEXT PK | name | slug (unique) | rtsp_url | audio_url | enabled | segment_seconds | retention_days | schedule_json | record_audio | grayscale_mode | live_view_mode ('hls') | view_rotation | rtsp_transport | ptz_* | onvif_* | created_at | updated_at
recorder_events    id INTEGER PK | camera_id FK→cameras.id | level | message | created_at   ← OLAY GÜNLÜĞÜ (kayıt tablosu DEĞİL)
users              username PK | password_hash | created_at | updated_at
sessions           id PK | username FK→users | created_at | last_seen_at | expires_at
app_settings       key PK | value | updated_at
```
- `recorder_events.level` muhtemelen `info|warning|error` gibi — kamera başına olay akışı (opsiyonel özellik).

### Hâlâ Bilinmeyenler (AI Faz 1'de gerçek ortamda doğrulamalı)
1. ~~SQLite şeması~~ ✅ ÇÖZÜLDÜ.
2. ~~Video formatı~~ ✅ ÇÖZÜLDÜ (.mp4).
3. ~~Dosya adı timestamp biçimi~~ ✅ ÇÖZÜLDÜ (`YYYYMMDDTHHMMSS`).
4. ~~Kamera klasörü adlandırması~~ ✅ ÇÖZÜLDÜ (yukarıdaki "Doğrulanan Bulgular #4" — son-oktet/slug/full-IP-dashed, 3 klasör taranır).
5. **Erişim kimlik doğrulaması:** Uygulama yerel ağda mı, dışa açık mı? PlainNVR'ın `users` tablosu var ama bizim read-only viewer'ımız kendi login'ini mi yapsın, yoksa yerel ağda auth'süz mü kalsın?
6. **Eşzamanlı kamera:** Aynı anda birden fazla kamera mı oynatılacak, yoksa tek mi?

> AI, kalan bilinmeyenleri gerçek `/mnt/DATA/nv1` örneği üzerinde doğrulamadan "zaten çalışıyor" varsayımıyla bir fazı atlamasın.

---

## 1. Teknoloji Seçimi (Önerilen — proje.md sorusuna cevap)

| Katman | Seçim | Gerekçe |
|---|---|---|
| Backend | **Python 3.11 + FastAPI + Uvicorn** | SQLite'a hızlı erişim, async, otomatik OpenAPI docs, hafif. Flask yerine FastAPI çünkü streaming ve async video serving için daha uygun. |
| DB erişimi | **`sqlite3` stdlib, read-only mode** (`file:nvr.sqlite3?mode=ro&uri=true`) | Yazma riskini sıfırlar. ORM gerekmez (şema küçük ve sabit). |
| Frontend | **React 18 + Vite + TypeScript** | Next.js bu proje için fazla (SSR gerekmiyor). Vite hızlı, build çıktısı statik servis edilir. |
| Tarih seçici | **date-fns + bir takvim bileşeni** (örn. `react-calendar` veya `mantine` DatePicker) | Takvim görünümü proje.md'de açıkça isteniyor. |
| Video oynatıcı | **HTML5 `<video>`** (MP4/MKV için) **veya `hls.js`** (HLS segment için) | Format keşfinde (Faz 1) belirlenecek. |
| Konteyner | **Docker + docker-compose** | ZFS havuzunu read-only volume olarak bağlar. |

**Kabul kriteri:** AI bu stack'i kabul eder veya proje.md'ye not düşüp alternatif önerir; kullanıcı onayı olmadan farklı bir dil/framework seçemez.

---

## 2. Repo / Klasör Yapısı (hedef)

```
PlainNVR/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + router mount
│   │   ├── config.py            # Ayarlar (DB yolu, video kök yolu, env)
│   │   ├── db.py                # SQLite read-only connection helper
│   │   ├── fsindex.py           # /mnt/DATA/nv1 tarayıcı: dosya adından timestamp çöz, kayıt listesi üret (DB'de kayıt tablosu YOK)
│   │   ├── timestamp_parser.py  # Dosya adı timestamp biçimi (Faz 1'de tespit edilir, burada uygulanır)
│   │   ├── models.py            # Pydantic response modelleri
│   │   └── routers/
│   │       ├── cameras.py       # GET /api/cameras
│   │       ├── recordings.py     # GET /api/recordings?camera=&date=...&from=&to=
│   │       └── video.py          # GET /api/video/{id} → Range destekli stream
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Backend API çağrıları
│   │   ├── types.ts             # TypeScript tipleri (Camera, Recording)
│   │   ├── components/
│   │   │   ├── CalendarPicker.tsx
│   │   │   ├── CameraList.tsx
│   │   │   ├── RecordingList.tsx
│   │   │   └── VideoPlayer.tsx
│   │   ├── pages/
│   │   │   └── ViewerPage.tsx   # Ana sayfa: takvim + kamera + oynatıcı
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── TODO.md  (bu dosya)
```

---

## 3. Fazlar

### Faz 1 — Keşif & Doğrulama ✅ BÜYÜK KISMı TAMAM (TrueNAS SSH ile doğrulandı)
**Doğrulandı:** şema, format (.mp4), timestamp biçimi (`YYYYMMDDTHHMMSS`), klasör yapısı (düz), kamera→klasör mapping (3 aday klasör — TODO.md "Doğrulanan Bulgular #4"). 18 kamera, hepsi enabled.

**Kalan (kullanıcı tercihi):**
1. `timestamp_parser.py`'ı uygula: `datetime.strptime(stem, "%Y%m%dT%H%M%S")`. Gerçek dosya adlarıyla test et (`20261023T051004.mp4` → 2026-10-23 05:10:04). ✅ biçim biliniyor.
2. `fsindex.py` kamera→klasör çözümü: her kamera için 3 aday klasör dene — (a) `slug`, (b) `rtsp_url` host IP son okteti, (c) host IP dashes — var olanları tara, `start`+`size`'a göre dedupe.
3. Bulguları `proje.md`'nin sonuna "Keşif Notları" başlığı altına yaz (TODO.md'de zaten mevcut, özet aktar).

**Kabul kriteri:** `timestamp_parser.py` örnek dosya adlarını doğru tarihe çeviriyor; `fsindex` bir kameranın 3 aday klasöründen var olanları birleştirip dedupe ediyor.

### Faz 2 — Backend İskelet & DB/Dosya Sistemi Okuma
**Görevler:**
1. `backend/requirements.txt`: `fastapi`, `uvicorn[standard]`.
2. `config.py`: `NVR_DB_PATH`, `NVR_VIDEO_ROOT` env'den okur (default `/mnt/DATA/nv1`).
3. `db.py`: read-only SQLite connection (`uri=True, mode=ro`), her istek için yeni connection (SQLite thread safety).
4. `models.py`: `Camera` (DB'den), `Recording` (dosya sisteminden: `{id, camera_id, start, end, file_path, size}`) Pydantic modelleri. Şemayı docstring olarak ekle.
5. `fsindex.py`: kamera→klasör + dosya tarama. Detaylar:
   - **Aday klasörler (3):** kamera için — (a) `slug`, (b) `rtsp_url` host IP son okteti (`urllib.parse.urlparse(rtsp_url).hostname` → `host.rsplit('.',1)[-1]`), (c) host IP dashes (`host.replace('.','-')`). `NVR_VIDEO_ROOT` altında var olanları topla.
   - **Config eleme:** `NVR_VIDEO_ROOT` altındaki `docker-compose.yml`, `go2rtc.json`, `go2rtc.log`, `nvr.sqlite3` ve orphan klasörleri (hiçbir kameraya eşleşmeyen) kamera sanma.
   - **Dedupe:** aynı kamera için 3 klasörden gelen dosyaları `start`+`size`'a göre tekilleştir (migration sırasında aynı kayıt iki klasörde olabilir).
   - **`end`:** `start + segment_seconds` varsayma (düzgün aralıklı değil). `end` = sıradaki dosyanın `start`'ı; son segment boş.
   - **Verimlilik:** tarih parametresi varsa her aday klasörde `glob(f"{folder}/{YYYYMMDD}T*.mp4")` ile sadece o günü tara; tüm havuzu tarama.
6. `routers/cameras.py`: `GET /api/cameras` → DB'den tüm kameraları döner.
7. `routers/recordings.py`: `GET /api/recordings?camera_id=&date=YYYY-MM-DD` (opsiyonel `from`/`to` ISO8601) → **`fsindex.py`'ı çağırır** (DB'de kayıt tablosu olmadığı için). `id` olarak dosya yolunun hash'ini veya güvenli kodlanmış yolunu kullan.
8. `main.py`: CORS (frontend origin), router'ları mount, `/api/health` endpoint.

**Kabul kriteri:** `uvicorn app.main:app --reload` çalışıyor; `curl localhost:8000/api/cameras` 18 kamerayı geçerli JSON döndürüyor; `curl ".../api/recordings?camera_id=<okuldisalan-id>&date=2026-10-25"` gerçek video dosyalarını `{start, end, file_path}` ile listeliyor — `okuldisalan`'ın hem `197` hem `okuldisalan` klasörlerinden gelen kayıtlar birleştirilmiş ve dedupe edilmiş, tarihler doğru.

### Faz 3 — Video Streaming Endpoint
**Görevler:**
1. `routers/video.py`: `GET /api/video/{recording_id}` → `recording_id`'yi `fsindex.py`'ın ürettiği güvenli kodlanmış yola çöz, `FileResponse` ile **HTTP Range** desteği (seek/ilerisarıma için zorunlu). (DB'de kayıt tablosu olmadığı için yol `fsindex`'ten gelir; mapping kararlı olmalı — aynı dosya her zaman aynı id vermeli.)
2. Yol doğrulama: dosya `NVR_VIDEO_ROOT` altında mı? (path traversal koruması — `Path.resolve()` + prefix kontrolü).
3. Format kötüye kullanımı: bilinmeyen format için `415` dön, MP4/HLS için doğru `Content-Type`.

**Kabul kriteri:** Tarayıcıda `<video src="/api/video/123">` oynuyor; video oynatıcıda ileri/geri sarma (seek) çalışıyor; `/mnt/DATA/nv1` dışından bir yol isteği `403` dönüyor.

### Faz 4 — Frontend İskelet
**Görevler:**
1. `npm create vite@latest frontend -- --template react-ts`.
2. `api/client.ts`: `fetch` sarmalayıcı, tip güvenli `getCameras()`, `getRecordings(cameraId, date)`.
3. `types.ts`: backend modelleriyle birebir.
4. `App.tsx` + `pages/ViewerPage.tsx`: 3 sütunlu düzen (sol: kamera listesi, orta: takvim + kayıt listesi, sağ: video oynatıcı).
5. Vite proxy: `vite.config.ts`'te `/api` → `http://localhost:8000`.

**Kabul kriteri:** `npm run dev` çalışıyor; kamera listesi backend'den geliyor ve ekranda görünüyor.

### Faz 5 — Takvim & Tarih Filtreleme
**Görevler:**
1. `CalendarPicker.tsx`: ay görünümü takvim; günleri seçilebilir yap.
2. Kayıt olan günleri vurgula: `GET /api/dates?camera_id=&year=&month=` endpoint'i ekle — **`fsindex.py`'ı kullanır**, o kamerada o ayda kayıt olan günlerin set'ini döner (DB'de kayıt tablosu yok). Frontend bunu takvimde işaretler.
3. Tarih seçilince `RecordingList` o günün segmentlerini yükler.

**Kabul kriteri:** Takvimde kayıt olan günler işaretli; bir gün seçince sağdaki listede o günün segmentleri saat sırasıyla görünüyor.

### Faz 6 — Video Oynatıcı
**Görevler:**
1. `VideoPlayer.tsx`: HTML5 `<video controls>`; `src` = `/api/video/{id}`.
2. HLS ise `hls.js` entegre et (Faz 1 keşfine göre).
3. Segment seçilince otomatik yükle, önceki videoyu temizle (memory leak önlemi).
4. Opsiyonel: çoklu kamera — aynı anda iki oynatıcı (Faz 1 keşfinde "çoklu kamera" istenirse).

**Kabul kriteri:** Segment tıklayınca video oynuyor; sarma çalışıyor; segment değişince eski video bellek tutmuyor.

### Faz 7 — Docker & Dağıtım
**Görevler:**
1. `backend/Dockerfile`: Python slim, `pip install -r requirements.txt`, `CMD uvicorn app.main:app --host 0.0.0.0 --port 8000`.
2. `frontend/Dockerfile`: çok-aşamalı (node build → nginx statik serve), `/api`'i backend'e `proxy_pass` ile yönlendir.
3. `docker-compose.yml`: iki servis (`backend`, `frontend`), `backend` tek read-only volume: `/mnt/DATA/nv1:/mnt/DATA/nv1:ro`. Bu tek mount hem `nvr.sqlite3`'ü hem video klasörlerini kapsar (ikisi de aynı kökte). `NVR_VIDEO_ROOT=/mnt/DATA/nv1`, `NVR_DB_PATH=/mnt/DATA/nv1/nvr.sqlite3`.
4. `.env.example`: `NVR_DB_PATH`, `NVR_VIDEO_ROOT` örnekleri.

**Kabul kriteri:** `docker compose up` ile uygulama açılıyor; takvim + oynatıcı tam çalışıyor; konteyner içinden video dosyalarına yazma denemesi `Read-only file system` hatası veriyor (yazma koruması doğrulandı).

### Faz 8 — Doğrulama & Belgeleme
**Görevler:**
1. README.md: kurulum, env değişkenleri, docker komutları.
2. Bilinen sınırlar: read-only mount, çok büyük tarih aralıklarında performans.
3. (Kullanıcı istemezse test yazma — ama manuel doğrulama komutlarını README'ye koy.)

**Kabul kriteri:** Temiz bir `docker compose up` ile sıfırdan çalışan sistem; README'deki adımları takip eden biri uygulamayı ayağa kaldırabiliyor.

---

## 4. AI Çalışma Kuralları

- **Tek seferde tek faz.** Bir fazın kabul kriteri doğrulanmadan sonraki faza geçme.
- **Bilinmeyeni varsayma.** Faz 1 keşfinden önce şema veya format hakkında varsayımda bulunma; gerekirse kullanıcıya sor.
- **Yazma koruması.** Backend hiçbir koşulda `nvr.sqlite3`'e veya `/mnt/DATA/nv1`'a yazmamalı. SQLite daima `mode=ro`.
- **Path traversal.** Video endpoint'inde her dosya yolunu `NVR_VIDEO_ROOT` içinde resolve et; dışarıysa `403`.
- **Kullanıcı onayı.** Faz 1 keşfi dışında, teknoloji/değişiklik kararları kullanıcıya sorulmadan değiştirilmez.
