# Delhi – 3,000 years in 6 minutes (zdroje-dilli)

Časosběr města **Dillí** ve stylu série (izometrický pohled à la Age of Empires 2), postavený podle `CLAUDE.md` na kódu z `zdroje-budapest`.
Veškerý text ve videu je anglicky. Délka ~6:05 (10 966 snímků při 30 fps).

## Spuštění (lokálně, Chrome/Edge/Safari desktop)
**Automaticky:** `python3 server2.py` a ve druhém terminálu `npm i -D playwright && node tools/render_local.js audio_dl.html delhi` → `~/Documents/casosber/mesta/videa/delhi-final.mp4` (okno Chrome nechat viditelné).

**Ručně:**
```bash
cd zdroje-dilli && mkdir -p out && python3 server2.py      # http://localhost:8766
```
1. `http://localhost:8766/run.html` → po „ready …“ v konzoli `await window.exportTimeline()` (uloží `out/timeline_dl.json`) a potom `await window.startEncode()` (H.264 přímo v prohlížeči → `out/delhi-silent.mp4`; ~5–10 min).
   V prohlížeči bez H.264 enkodéru (např. headless Chromium) spadne na VP9; `startEncode({from, to, name})` umí i rozsah snímků.
2. `http://localhost:8766/audio_dl.html` (záložka v popředí!) → `await window.makeAudio()` (uloží `out/delhi-audio.wav` a `out/delhi-loud.json` = časy hlasitých efektů) → `await window.muxVideo('out/delhi-silent.mp4','delhi-final.mp4')`.
3. Alternativa bez prohlížečového enkodéru: `tools/pump.js` (Playwright + ffmpeg) renderuje snímky přes JPEG pipe do libx264; `tools/shot.js` / `tools/dbg.js` / `tools/sheet.py` dělají kontrolní snímky a kontaktní archy.

Po každé změně JS zvýšit `?v=` v `run.html`.

## Data – POZOR, varianta B (bez OSM)
Overpass API (OSM) byl v cloudovém prostředí nedostupný, proto:
* **Výškový model** je skutečný (AWS Terrarium z=13, `fetch_dem.py`, bbox S28.50 W77.11 N28.70 E77.31, ~22 × 20 km).
* **Jamuna, mosty a silnice jsou syntetické** (`prep_synth.py`): řeka je vyhlazená střednice ručně zadaná podle známých poloh (šířka stylizovaná), čtyři mosty jsou umístěné přibližně, hlavní tepny (Ring Road, Mathura Road, Rajpath, Chandni Chowk, …) jsou ručně zadané polyliny a drobné ulice jsou generované mřížky. **Není to geodetická přesnost.**
* Až bude Overpass dostupný, lze spustit `fetch_osm.py` (uloží do `raw/`) a napsat k němu `prep` jako u Budapešti; `core.js` má vypnuté dolévání vody z DEM (`const added = 0`), protože Jamuna je polygon.

## Co je odhad / co ověřit před zveřejněním
* Populace: jen málo opěrných bodů (před 1881 hrubé odhady: ~20 tis. 1200, ~100 tis. 1300, ~400 tis. 1650–1700, ~140 tis. 1800; 1881–2011 sčítání lidu; 2025 ≈ 22 mil. odhad) a mezi nimi **lineární** nárůst. Žádné vymyšlené propady (Daulatábád, Timur) – ověřit/zpřesnit podle zdrojů.
* Roky mostů: Old Yamuna Bridge 1866, ITO Bridge ~1965 a Nizamuddin Bridge ~1971 (**ověřit**), DND Flyway 2001.
* Tradiční data: Lal Kot ~1060, Qila Rai Pithora ~1180, ~900 př. n. l. Painted Grey Ware (Purana Qila).
* Půdorysy památek a hradeb jsou stylizované (polygony zadané ručně), orientace spritů je pevná.
* Hook „Half a million. One summer.“ (1947) vychází z odhadů uprchlíků (~0,5 mil.), ověřit zdroj.

## Struktura
`core.js` projekce/terén/shader · `world.js` jádra města (`NUC`), parky, silnice/mosty · `spr.js` sprity budov a památek · `build.js` rozmístění budov, `DESTR` (1398, 1739, 1857), hradby · `agents.js` lidé/koně/lodě/vlak/letadla a scénky `buildActs` · `show.js` `EVENTS`, tabulky, HUD, FX · `run.html` render a export · `audio_dl.html` procedurální hudba a SFX · `fonts/`, `lib/` lokální fonty a knihovny (bez CDN).
