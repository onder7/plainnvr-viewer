React 18, TypeScript, Vite ve Tailwind CSS kullanarak mevcut bir güvenlik kamerası (CCTV) izleme panelinin arayüzünü modernize et. 

Mevcut yapı 3 sütunlu düzene sahip ve bunu koruyacağız, ancak tasarımı enterprise (kurumsal) ve şık bir "Dark Mode / Modern Light" hibrit görünüme kavuşturmak istiyoruz.

Tasarım ve Mimari Gereksinimleri:
1. Genel Yerleşim (3 Sütunlu Grid Layout):
   - Sol Sütun (Kameralar Listesi): Sabit genişlikte, arama/filtreleme çubuğu olan, seçilen kameranın aktif/canlı durumunu belirten özel ikonlu (aktif nokta veya kamera ikonu) modern liste. Hover ve aktif durum efektleri belirgin olsun.
   - Orta Sütun (Takvim ve Kayıt Listesi): Üst kısımda modern, kompakt bir "react-calendar" takvimi. Alt kısımda seçilen tarihe ait video kayıtlarının listesi (Zaman damgası, dosya boyutu, oynat simgesi ve kart yapısı şeklinde). Kayıtlar listesi için özel scrollbar tasarımı yapılsın.
   - Sağ Sütun (Video Oynatıcı): Ekranın ana odak noktası. HTML5 video oynatıcı etrafında özel kontrol butonları (hızlandırma, ekranı kaplama, ekran görüntüsü alma hissi veren çerçeve), kayıt bilgisi (hangi kamera, hangi saat aralığı) gösteren şık bir başlık alanı.

2. UI / UX Detayları:
   - Modern bir dashboard hissi için Tailwind CSS kullanılacak (Glassmorphism detayları, yumuşak gölgeler `shadow-sm`, `rounded-xl` veya `rounded-2xl` köşeler).
   - Renk Paleti: Kurumsal güvenlik sistemlerine uygun profesyonel tonlar (Slate/Zinc gri tonları, aktif durumlar için şık bir Indigo veya Emerald vurgu rengi).
   - Responsive ve esnek bileşenler.
   - Kodları TypeScript tip güvenliğine uygun, modüler bileşenler halinde yaz.

   Tasarımı İyileştirmek İçin Küçük İpuçları (Tailwind ile):
Sol Sütun: Kameraların uzun listesini yönetmek için en üste küçük bir input (Arama çubuğu) ekleterek kameralar arasında hızlıca filtreleme yapılmasını sağlayabilirsiniz.

Orta Sütun: Kayıt listesini düz metin yerine Card (Kart) bileşenleri haline getirip, seçilen kaydın arka planının hafifçe renklenmesini (bg-indigo-50 veya koyu tema için bg-zinc-800) isteyebilirsiniz.

Sağ Sütun: Oynatıcı boşta olduğundayken ortada büyük şık bir video/kamera ikonu ve "Lütfen sol menüden bir kamera ve orta alandan kayıt seçin" yönlendirmesi modern bir hava katacaktır.