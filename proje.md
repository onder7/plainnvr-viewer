Evet, tamamen çalışır — üstelik bu TODO zaten tam olarak bunun için tasarlandı (Faz 7: Docker Compose + read-only mount). Çünkü PlainNVR'ın kendisi zaten bu TrueNAS'ta konteynerde (
docker-compose.yml
 ve go2rtc orada). Bizim viewer'ımız PlainNVR'ın yanında bir kardeş konteyner olur: PlainNVR yazar, biz salt okunur bağlanan aynı dataset'ten okuruz. Çakışma yok.

Birkaç pratik nokta:

TrueNAS SCALE mi CORE mu? SCALE (Linux tabanlı) Docker konteynerlerini "Custom App" arayüzünden native çalıştırır — bizim senaryomuz bu. CORE (FreeBSD tabanlı) Docker'ı native desteklemez, bir Linux VM gerektirir. Senin ortamında docker-compose.yml ve Linux sahiplikleri olduğu için neredeyse kesin SCALE. O yüzden sorun yok.
Dataset mount: Custom App'te storage bölümünde /mnt/DATA/nv1'i host path olarak verip "Read-only" kutusunu işaretliyoruz. Bu tek mount hem nvr.sqlite3'ü hem video klasörlerini kapsar (TODO'da Faz 7'de tek volume olarak yazdım).
İzinler: Dosyalar apps:nogroup sahipliğinde ama rwxrwxrwx (777), yani read-only mount + herhangi bir konteyner kullanıcısıyla okuma sorunsuz.
Port: Frontend (nginx) bir port yayımlar (örn. 8080), yerel ağdan tarayıcıyla açılır. Backend dahili kalır.
Auth (bilinmeyen #5) burada devreye giriyor: Sadece yerel ağdan erişip auth'süz bırakırsak konteyner konfigürasyonu en sade olur. Dışarıya açacaksan reverse proxy + login gerekir, konteyner karmaşıklığı artar. Yerel ağda tutmak bu iş için makul.
Özet: SCALE üzerinde Custom App olarak çalıştırırız, tek read-only dataset mount, bir port açarız. Faz 7 bunu docker-compose + env olarak hazırlıyor; TrueNAS Custom App arayüzüne de birebir uyar.

İstersen Faz 1'den uygulamaya başlayayım (varsayılan: auth'süz + tek oynatıcı), #5/#6'yı sonra ayarlarız. Başlayayım mı?


---

## Keşif Notları (TrueNAS SSH - 2026-10-25)

### Veritabanı Şeması
- `cameras`: id (32-hex), slug, name, rtsp_url, segment_seconds, enabled, ...
- `recorder_events`: Sadece olay günlüğü (kayıt tablosu DEĞİL)
- `users`, `sessions`, `app_settings`
- **KRİTİK:** Kayıtlar veritabanında yok, sadece dosya sisteminde

### Video Dosyaları
- **Format:** MP4
- **Dosya adı:** `YYYYMMDDTHHMMSS.mp4` (örn: `20261023T051004.mp4`)
- **Klasör yapısı:** Düz — `/mnt/DATA/nv1/<folder>/<dosya>.mp4` (tarih alt klasörü yok)

### Klasör Adlandırması (Tutarsız!)
Her kamera için 3 aday klasör taranır:
1. **Slug:** `cameras.slug` (örn: `okuldisalan`) — 4 kamerada
2. **Son oktet:** RTSP IP'nin son okteti (örn: `197` for `192.168.1.197`) — 18 kamerada
3. **Full IP:** IP noktalar→tire (örn: `192-168-1-197`) — 6 kamerada

Uygulama hepsini tarayıp birleştirir ve `(start, size)`'a göre dedupe eder.

### Örnek Veriler
- 18 kamera, hepsi `enabled=1`
- `segment_seconds`: 60 veya 300
- Segmentler düzenli aralıklı DEĞİL (end = next.start kullanılır)

### Güvenlik
- SQLite read-only mode: `file:nvr.sqlite3?mode=ro&uri=true`
- Docker volume: `/mnt/DATA/nv1:/mnt/DATA/nv1:ro`
- Path traversal koruması
