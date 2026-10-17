# LmXMetro — Metronom ve Akort Aleti

Tarayıcıda çalışan, Türkçe ve İngilizce arayüzlü metronom ve enstrüman akort aleti. Ana sayfa iki araca bağlantı verir. Uygulama kaynakları `index.html`, `metronome.html` ve `tuner.html` dosyalarıdır.

## Metronom

- 30–300 BPM tempo ayarı, hazır tempolar ve dokunarak tempo belirleme.
- Birden fazla ölçüyü birleştirme, ölçüleri yeniden sıralama ve özel ölçüler oluşturma.
- Güçlü, orta, zayıf ve sessiz vuruşlar; ritmik alt bölümler.
- Ritimleri tarayıcıda kaydetme ve JSON dosyasıyla dışa/içe aktarma.
- Açık/koyu tema, geniş vuruş görünümü ve klavye kısayolları.

## Akort aleti

- Mikrofonla kromatik akort; gitar ve ukulele için tel hedefleri.
- Gitar için standart, Drop, DADGAD ve açık akortlar; ukulele için High G, Low G, D ve bariton seçenekleri.
- Çubuk ve kayan nota şeridi görünümleri; tel seçme ve referans sesi çalma.
- Ayarlanabilir A4 referans frekansı, açık/koyu tema ve TR/EN arayüz.

## Kullanım

Yayındaki adreslerden birini açın. Akort aletinde **Mikrofonu başlat** düğmesine basıp tarayıcıda mikrofon izni verin. Mikrofon erişimi için HTTPS veya yerel `localhost` ortamı gerekir. Metronom tarayıcıda doğrudan çalışır.

| Sayfa | Türkçe | English |
| --- | --- | --- |
| Ana sayfa | `/tr` | `/en` |
| Metronom | `/tr/metronome` | `/en/metronome` |
| Akort aleti | `/tr/tuner` | `/en/tuner` |

Metronom ritimleri ve uygulama tercihleri `localStorage` ile aynı tarayıcı ve site adresinde saklanır. Cihazlar arasında otomatik eşitlenmez; ritimleri taşımak için JSON dışa/içe aktarma özelliğini kullanın. Mikrofon izni tarayıcı tarafından yönetilir.

## Yayınlama ve teknoloji

Bu klasörü Vercel projesinin kökü olarak yayınlayın. `vercel.json` yukarıdaki adresleri `api/page.js` üzerinden ilgili HTML dosyasına yönlendirir; Türkçe ve İngilizce içerik aynı kaynak dosyalardan sunulur. `sitemap.xml` ve `robots.txt` projededir. Üretim alan adı değişirse HTML dosyalarındaki, `api/page.js` içindeki, site haritasındaki ve robots dosyasındaki adresleri birlikte güncelleyin.

HTML, CSS, JavaScript ve Web Audio API kullanılır. Ayrı bir uygulama derleme adımı veya üçüncü taraf JavaScript kütüphanesi gerekmez.

---

# LmXMetro — Metronome and Tuner

A browser-based metronome and instrument tuner with Turkish and English interfaces. The home page links to both tools. The application sources are `index.html`, `metronome.html`, and `tuner.html`.

## Metronome

- Adjustable tempo from 30 to 300 BPM, presets, and tap tempo.
- Combine and reorder multiple measures, including custom time signatures.
- Strong, medium, weak, and silent beats with rhythmic subdivisions.
- Save rhythms in the browser; export and import them as JSON files.
- Light and dark themes, expanded beat view, and keyboard shortcuts.

## Tuner

- Microphone-based chromatic tuning and string targets for guitar and ukulele.
- Standard, Drop, DADGAD, and open guitar tunings; High G, Low G, D, and baritone ukulele tunings.
- Bar and rolling-note displays; tap a string to select it and play a reference tone.
- Adjustable A4 reference frequency, light and dark themes, and TR/EN interface.

## Getting started

Open one of the deployed URLs. In the tuner, select **Start microphone** and allow microphone access in your browser. Microphone access requires HTTPS or local `localhost`. The metronome runs directly in the browser.

| Page | Turkish | English |
| --- | --- | --- |
| Home | `/tr` | `/en` |
| Metronome | `/tr/metronome` | `/en/metronome` |
| Tuner | `/tr/tuner` | `/en/tuner` |

Saved rhythms and preferences use `localStorage` on the same browser and site origin. They do not automatically sync across devices; use JSON export and import to transfer rhythms. Your browser manages microphone permission.

## Deployment and technology

Deploy this folder as the Vercel project root. `vercel.json` routes the URLs above through `api/page.js` to the HTML sources; Turkish and English content come from the same source files. The project includes `sitemap.xml` and `robots.txt`. If the production domain changes, update the URLs in the HTML files, `api/page.js`, the sitemap, and the robots file together.

Built with HTML, CSS, JavaScript, and the Web Audio API. No separate build step or third-party JavaScript library is required.
