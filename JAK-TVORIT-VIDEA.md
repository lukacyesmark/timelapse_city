# Jak tvořit videa „Časosběr města“ (návod)

Praktický postup od zadání po nahrání na YouTube. Doplňuje `CLAUDE.md` (styl a pravidla série); hotové vzory jsou `zdroje-budapest/` a `zdroje-dilli/`.

---

## 1. Kde pracovat: lokálně, ne v cloudu
| | Lokální session (Mac) | Cloudová session |
|---|---|---|
| Render obrazu (6 min, 1080p) | ~10–20 min (GPU, hardwarové H.264) | ~4–5 h (bez GPU) |
| Zvuk | ~5–10 min | ~35 min |
| Výsledné video | rovnou ve složce na Macu | nedá se stáhnout celé (limit 30 MB na soubor v chatu, výstupy nejsou v gitu) |
| Stahování dat (OSM, výšky) | funguje (curl) | často blokované síťovou politikou |

**Doporučení:** v aplikaci Claude → Code → **Local**, pracovní složka `~/Documents/casosber/mesta` (klon repozitáře `timelapse_city`). Cloud jen na úpravy kódu a náhledy.

## 2. Zadání a první kolo
Stačí napsat: **„Vyrob časosběr města <MĚSTO>.“** (volitelně období, hook, vlastní události).

Claude pak **nic nerenderuje** a nejdřív pošle:
1. **návrh událostí** (tabulka rok · titulek EN · věta EN · zlomová · scéna), počet podle historie města a státu (~30 až 60);
2. **očekávanou délku** videa, pružně 6–10 min (zhruba 11 s na událost + 22 s intro a outro);
3. odhad času a otázky (hook, open loop, stahování dat).

Projdete seznam, upravíte, schválíte. Pak Claude udělá zbytek sám a hotové video uloží do **`~/Documents/casosber/mesta/videa/<mesto>-final.mp4`**.

## 3. Postup (fáze)
1. **Data** – nová složka `zdroje-<mesto>/` (kopie posledního města).
   - Výšky: `fetch_dem.py` (AWS Terrarium z=13, bbox ~16–22 km).
   - Řeka, mosty, silnice: Overpass/OSM (`fetch_osm.py` + prep). **Když OSM nejde** → „varianta B“ jako u Dillí: `prep_synth.py` (řeka z ručně zadané střednice, mosty a hlavní tepny ručně, ulice generované). V popisu videa pak neuvádět © OSM.
2. **Obsah** – přepsat konstanty (`CLAUDE.md` kap. 6.3): `LAT0/LON0`, `NUC` (jádra a růst), `PARKS`, `DESTR`, památky (`addLandmarks`, sprity v `spr.js`), hradby, `EVENTS`, `POPT`, `RULERS` (název + podtitul + barvy vlajky), `CITY`, `BRX`, scénky `buildActs`, hudební epochy v `audio_*.html`.
3. **Náhledy** – kontaktní archy 4–6 snímků (`tools/shot.js`, `tools/dbg.js`, `tools/sheet.py`). Opravit, co je špatně, teprve pak renderovat.
4. **Render automaticky (doporučeno):** v jednom terminálu `python3 server2.py`, ve druhém `npm i -D playwright` (jednou) a `node tools/render_local.js audio_<xx>.html <mesto>`. Otevře se okno Chrome (nechat viditelné), vyrenderuje obraz, zvuk, spojí je a zkopíruje do `~/Documents/casosber/mesta/videa/`.
   **Ručně:** `python3 server2.py` → Chrome `http://localhost:8766/run.html` → konzole (⌘⌥J):
   ```js
   await exportTimeline(); await startEncode()
   ```
   Záložka **v popředí**. Výstup `out/<mesto>-silent.mp4`.
5. **Zvuk + spojení** – `http://localhost:8766/audio_<xx>.html` → konzole:
   ```js
   await makeAudio(); await muxVideo('out/<mesto>-silent.mp4', '<mesto>-final.mp4')
   ```
   Záložka **v popředí** (na pozadí trvá výpočet mnohonásobně déle).
6. **Kontrola** (`CLAUDE.md` kap. 7): MP4 má `ftyp/moov/mdat` a dvě stopy, zvuk je o ~5 s delší, špička 0,89, žádné vzorky ≥ 32000, RMS po 30 s, 6 snímků z hotového videa, seznam hlasitých efektů (`out/*-loud.json`).
7. **YouTube balíček** – `youtube.md`: 3 názvy EN, koncept thumbnailu, popis EN + CS s kapitolami z `out/timeline_*.json`, zdroje dat, poznámka o stylizaci, seznam věcí k ověření.

## 4. Pravidla obsahu
- Veškerý text ve videu **anglicky**, komunikace česky.
- Fakta se nevymýšlejí. Nejistá čísla označit „~“ a vypsat k ověření.
- **Populace:** jen několik spolehlivých opěrných bodů (sčítání lidu, uznávané odhady) a mezi nimi **lineární** nárůst. Žádné vymyšlené propady ani skoky.
- Války a katastrofy bez zranění a krvavých detailů. Jen kouř, požáry, drobné figurky.
- Hook do 4 s, vrchol každých 30–45 s, open loop kolem 1:30, nejsilnější úsek ve druhé půlce, konec stěračem „dnes vs. hook“ a otázkou „Which city should we rewind next?“.

## 5. Vzhled (stav od Dillí)
Izometrický svět zůstává (`CLAUDE.md` kap. 4). HUD je upravený podle pražského vzoru („PRAGUE – 3D Timelapse“):
- vlevo nahoře vlajka + vládce + podtitul + název města (EB Garamond);
- vpravo nahoře ikonka člověka + populace, pod ní minimapa;
- vlevo dole velký letopočet (EB Garamond, starobylé číslice);
- titulek události VERZÁLKAMI, serifem, s jemným stínem; podtitul pod ním;
- sytější barvy (`saturate(1.3)`), oranžové akcenty střech; časová osa zůstává.

## 6. Pasti (poučení z Dillí)
- **Sprity památek:** šířka plátna `newSpr(w, …)` musí být ≥ `a + b` (součet rozměrů půdorysu), jinak se památka ořízne a vypadá malá.
- Po každé změně JS zvýšit `?v=` v `run.html`.
- Headless Chromium neumí H.264 v WebCodecs: v cloudu použít `tools/pump.js` (JPEG → ffmpeg). Na Macu stačí `startEncode()`.
- `pkill -f <něco>` v cloudu může zabít i vlastní shell. Ukončovat procesy podle PID.
- Soubory > 30 MB nejdou poslat do chatu a > 100 MB nejdou do gitu. Proto video renderovat tam, kde má zůstat (lokálně).
- Sčítání lidu a čísla v textech (mosty, uprchlíci, výšky staveb) ověřit před zveřejněním.

## 7. Kontrolní seznam před nahráním
- [ ] Video 6–7 min, 1080p30, H.264 + AAC, zvuk bez přebuzení.
- [ ] Shlédnuté celé video se zvukem (Claude zvuk neslyší!): hlasité efekty podle `*-loud.json`.
- [ ] Ověřená čísla a data označená „~“.
- [ ] Názvy, thumbnail a popis s kapitolami z `youtube.md`.
