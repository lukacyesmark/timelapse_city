# Časosběr měst – kontext série (izometrický styl à la Age of Empires 2)

Tento soubor si Claude Code načte automaticky, když otevřeš složku `~/Documents/casosber/mesta` jako projekt. Je to „paměť“ série: styl, postup, čísla, poučení z chyb. Hotové vzory: **Budapest – 2,000 years in 6 minutes** (`zdroje-budapest/`) a **Delhi – 3,000 years** (`zdroje-dilli/`, aktuální kód: nový HUD, lineární populace, `tools/render_local.js`). Nové město vždy začni kopií `zdroje-dilli/`.

## 0. Jak tohle použít
**Pracuje se v lokální session** (aplikace Claude → Code → Local) se složkou `~/Documents/casosber/mesta` (klon repozitáře `timelapse_city`). Všechno se ukládá rovnou sem; hotové video do **`~/Documents/casosber/mesta/videa/<mesto>-final.mp4`**. Cloud jen výjimečně (bez GPU je render ~4–5 h a video se nedá stáhnout celé).

**Uživatel napíše jen:** „Vyrob časosběr města X.“ (případně období, hook, vlastní události).

**Claude pak POVINNĚ nejdřív (kolo 1, nic nerenderuje):**
1. **Návrh událostí** jako tabulka: rok · titulek (EN) · jedna věta (EN) · zlomová ano/ne · efekt/scéna (požár, povodeň, průvod, …). **Počet podle historie města a státu, ne podle šablony:** kratší historie ~30, bohatá historie 45–60. Hook, open loop („Wait for …“) a nejsilnější úsek ve druhé půlce označit.
2. **Očekávaná délka videa** (pružně **6–10 min**, podle počtu a hustoty událostí) – spočítat vzorcem z kap. 4 „Tempo“ (≈ 22 s intro/outro + Σ pauz + Σ mezer; v průměru ~11 s na událost → 30 událostí ≈ 6 min, 45 ≈ 8,5 min, 52 ≈ 10 min).
3. **Odhad času práce** (data, obsah, render ~15–25 min na Macu, zvuk ~5–10 min) a otázky z kap. 9.
4. Počkat na schválení / úpravy seznamu a délky. Teprve pak fáze B–H bez dalších dotazů.

## 1. Pravidla spolupráce (z minulých videí)
- Uživatel píše česky; **veškerý text ve videu je anglicky**. Popis a YouTube balíček dodat EN + CS.
- Fakta se nemění a nevymýšlejí. Odhady označit „~“ (populace) a v závěru je vypsat. Čísla před zveřejněním doporučit ověřit.
- **Populace:** jen několik spolehlivých opěrných bodů (sčítání lidu, uznávané odhady) a mezi nimi **lineární** nárůst; žádné vymyšlené propady/skoky. Při pochybnosti méně bodů.
- Claude **neslyší zvuk** a nevidí celé video: musí to říct a vypsat časy hlasitých efektů ke kontrole. Po renderu ověřit alespoň dekódováním vybraných snímků (viz kap. 7).
- Uživatel je na **Claude Pro** s omezeným týdenním limitem: nejdřív stručně napsat odhad, nečíst zbytečně velké soubory, kontrolovat přes kontaktní archy (4–6 snímků na jednom plátně), neposílat plnorozlišené snímky.
- Odpovědi stručné, bez omáčky. Po každé dlouhé práci shrnout: co je hotové, co ověřeno, co ne, co zkontrolovat.
- „Žádní lidé“ platilo jen v prvním zadání; od V2 jsou **drobní lidé, koně, lodě, letadla** výslovně vítané (kap. 5).
- Před zničením/přepsáním souborů se ptát; staré verze nechávat (`-v2`, `-v3`).

## 2. Hlavní cíl: retence na YouTube
Každé rozhodnutí o tempu, obrazu a zvuku podřídit tomu, aby divák nepřeskočil. Struktura:
1. **Hook (0:00–0:04):** nejdramatičtější záběr města (typicky katastrofa nebo zlom) + krátká věta (u Budapešti „Every bridge. Destroyed.“).
2. **Rewind (1,4 s):** rok letí pozpátku, budovy mizí, zvuk přetáčení.
3. **Slib (5 s):** „2,000 years. One river. Three cities that became one.“ (uprav pro město).
4. **Vrcholy každých 30–45 s;** nikdy dvě klidné události za sebou.
5. **Open loop kolem 1:30:** siluetka budoucí památky + „Wait for 1896“; splnit u příslušné události (odznak „PROMISE KEPT“).
6. **Nejsilnější úsek až ve druhé půlce** (válka/katastrofa se zpomalením a vrcholem hudby).
7. **Závěr:** záběr z hooku, rozdělení „minulost vs. dnes“ (svislý stěrač), poslední text „Which city should we rewind next?“.
8. Délka **6–10 min podle města** (Budapest 6:12, Delhi 6:05 = 10 966 snímků při 30 fps). Delší video = víc událostí, ne delší pauzy; vrcholy dál každých 30–45 s a open loop kolem 1:30 (u videa nad 8 min přidat druhý open loop kolem 5:00).

## 3. Postup práce (fáze)
| Fáze | Co | Poznámka |
|---|---|---|
| A | Odhad + upřesnění (město, období, ohraničení záběru) | max 1 kolo otázek |
| B | Data: výšky terénu, řeka, mosty, silnice (kap. 6) | skripty `fetch.py`, `prep.py` |
| C | Obsah: události, tabulky, růst města, katastrofy, památky | přepsat konstanty (kap. 6.3) |
| D | Náhledy: kontaktní arch 4–6 snímků | uživatel často řekne „rovnou celé“ |
| E+F | Render obrazu + zvuk + spojení automaticky: `python3 server2.py` a v druhém terminálu `node tools/render_local.js audio_xx.html <mesto>` (Playwright + systémový Chrome, okno viditelné) → kopie do `~/Documents/casosber/mesta/videa/` | ~15–30 min; ručně viz `zdroje-dilli/README.md` |
| G | Kontrola: struktura MP4, dvě stopy, dekódované snímky, rozbor hlasitosti | kap. 7 |
| H | YouTube balíček: 3 názvy EN, thumbnail koncept, popis EN+CS s kapitolami z časové osy | kap. 8 |

## 4. Vizuální styl (musí zůstat stejný napříč městy)
**Kamera a svět:** pevný izometrický pohled 2:1 (sever míří doprava nahoru, `sx=(e+n)·k`, `sy=(e−n)·k/2 − h·k·VS`), Dunaj/řeka dělí obraz úhlopříčně. Terén je WebGL (síť 768², výškový model z AWS Terrarium z=13, hillshade, voda s animací). Při zlomových událostech kamera plynule najede (zoom 0,5–1,0 px/m), v pauze lehce plave (zoom +5 %), mezi událostmi se oddálí o ~34 %.
**Budovy:** procedurální sprity po epochách (chýše → římské → středověké → osmanské → barokní → historismus → meziválečné → panelové → moderní + vily), stíny směrem dolů doprava, stylizovaný, ne fotorealistický vzhled. Město roste z „jader“ (funkce roku `urbanYear`), zničení (požár, povodeň, válka) mění budovy na suť a znovu se staví.
**Světlo:** tónování podle epochy (antika okrová, osmanská tyrkysová, 19. stol. sépiová, 20. stol. chladná, dnes čistá), noc jen u vybraných událostí; **světla (okna, ulice, mosty, hlavní památky) i požáry se kreslí až po nočním ztmavení**.
**HUD (1920×1080) – stav od Dillí, podle vzoru „PRAGUE – 3D Timelapse“:**
- vlevo nahoře: **vlajka** (pruhy barev státu/dynastie) + **vládce** (EB Garamond 56 px) + podtitul (34 px) + název města (30 px) – tabulka `RULERS` má `[rok, název, podtitul, [barvy vlajky]]`;
- vpravo nahoře: ikonka člověka + **populace** (EB Garamond 58 px), pod ní minimapa jako v AoE2 (diamant 300×150, zlatý rámeček);
- vlevo dole: **velký letopočet** (EB Garamond 112 px, starobylé číslice);
- při události: **TITULEK VERZÁLKAMI** (EB Garamond 70 px, zlomové zlatě, jemný stín, poloprůhledný přechod místo boxu) + jednovětné vysvětlení 40 px;
- obraz: `saturate(1.3) contrast(1.04)` po vykreslení světa, sytější oranžové akcenty střech;
- bannery „NEW AGE – …“ (bordó s zlatým rámem) u hlavních předělů;
- popisky míst (orange pin + černý štítek 32 px);
- **časová osa:** tmavý pruh y 874–960, linka y=916 (8 px), rysky nad linkou (zlomové 26 px bílé, ostatní 13 px), **letopočty pod linkou** (24 px zlatě, minimální odstup 84 px, priorita: Today, nejvýraznější události), bez překryvu s ryskami. Tohle už jednou způsobilo stížnost.
**Barvy:** akcent `#ffb347` (oranžový), zlatá `#c9a44c`, tmavý podklad `rgba(6,8,12,.62)`.
**Tempo:** pauza u události 8,2 s (zlomová) / 4,8 s (běžná), válečná klidně 11 s (u 8–10min videa lze pauzy nechat stejné a přidat události); mezera mezi událostmi `3,4 + log2(1 + rozpětí_let/20)` s; zpomalení kolem událostí je „správně“, plynutí času mezi nimi zrychlené.

## 5. Vrstva života (lidé, koně, lodě, letadla) – lekce z V2→V3
Uživatel to chtěl, ale první verze byla špatně:
- **Problikávání:** (a) barva koně v povoze se měnila každý snímek; (b) figurky se vracely na začátek krátkých úseků silnic; (c) skupiny v událostech musely za pár vteřin urazit kilometry.
- Pravidla: chůze/klus se **odvozují z ušlé vzdálenosti** (fáze = 2π·dráha/délka_kroku), délka kroku chodce 16 m, koně 26 m; rychlosti ve světových metrech: chodec 12, kůň (klus) 34, povoz 24, tank 18, auto 60, tramvaj 40; používat jen silnice delší než 260 m; na koncích cest plynulé zesvětlení; při rychlém plynutí roků (>12 let/s) agenty skrýt (fade).
- **Málo, ale pěkně:** ~150 chodců, 16 jezdců, 12 povozů, 70 aut (hustota podle roku) v okolí města; ve scénách jen skupiny 8–48 jednotek, plus lodě podle epochy, ovce, ptáci, kouř z komínů, pontonový most, tramvaje.
- Scénky mají jen **malé přibližování** (délka dráhy = rychlost × délka scény), jinak působí jako teleportace.
- Letecké scény: ambientní přelety v obrazových souřadnicích (dvouplošník → vrtulové → tryskáč/dopravní), **nálet** (siréna, bombardéry, bomby, flak, reflektory) a finále (3 stíhačky s trikolórou).

## 6. Co se mění pro nové město
### 6.1 Data (skripty v `zdroje-budapest/`)
- `fetch.py`: ohraničení (S,W,N,E ≈ 16×18 km), dlaždice Terrarium z=13 (`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/x/y.png`), Overpass dotazy (řeka, pojmenované mosty, silnice trunk…tertiary).
- `prep.py`: sešití OSM vodních polygonů (hrany bboxu uzavírá po obvodu), mosty (osa z PCA pojmenovaných cest), zjednodušené silnice (RDP 6 m).
- **Overpass:** vyžaduje hlavičku User-Agent, často vrací 504 (opakovat, zmenšit dotaz); zrcadla nefungovala. Python na tomto Macu nemá certifikáty → používej `curl`.
- **Když OSM vůbec nejde** (Dillí v cloudu): „varianta B“ = `zdroje-dilli/prep_synth.py` (řeka z ručně zadané střednice, mosty a hlavní tepny ručně podle známých souřadnic, ulice generované mřížky); v popisu pak neuvádět © OSM a říct to uživateli.
- **Pokud OSM nevrátí celou řeku:** `core.js` rozšíří vodu zaplavením z DEM (výška < 96,7 m, otevření morfologií). Prahy jsou vázané na Dunaj; pro jiné město upravit `RIV` a práh.
- Terrarium je **DSM (včetně budov)** – „relativní výšky“ města jsou nadsazené (Pešť ~18–25 m nad řekou); povodeň proto počítat z blízkosti vody (`waterFar`), ne z výšky.

### 6.2 Kód (mapa)
| Soubor | Role |
|---|---|
| `core.js` | projekce, načtení DEM/vody, albedo, WebGL terén a shader (voda, povodeň, urbanizace) |
| `world.js` | **jádra města** `NUC` + poloměry růstu v čase, `urbanYear`, silnice, mosty |
| `spr.js` | procedurální izometrické sprity (styly 0–22) a památky (`castle`, `palace`, `parliament`…) |
| `build.js` | rozmístění budov (mřížka po zónách), životní cykly, **katastrofy `DESTR`**, `addLandmarks`, hradby (kontury terénu), `drawItems` |
| `agents.js` | lidé, koně, lodě, auta, letadla, scénky `buildActs`, nálet |
| `show.js` | **`EVENTS`**, tabulky `POPT/RULERS/CITY/BRX`, časová osa, stav v čase, tónování/noc/světla, FX, HUD |
| `run.html` | inicializace, `renderFrame`, `exportTimeline`, kódování MP4 (30 fps, 12 Mbps) |
| `audio_bp.html` | hudba po epochách, SFX z `timeline_bp.json`, normalizace, mux do MP4 |
| `server2.py` | lokální server (PUT ukládání, HTTP Range kvůli přetáčení videa) |
Spuštění: `cd zdroje-xxx && python3 server2.py` (port 8766) → `http://localhost:8766/run.html`; `window.startEncode()`; po uložení `audio_bp.html` → `makeAudio()` a `muxVideo('out/…-silent.mp4','…-final.mp4')`. Skripty mají `?v=` na cache-busting, po každé změně zvýšit.

### 6.3 Konstanty k přepsání
`LAT0/LON0` (střed), `BB`, `NUC` (jádra a růst), `PARKS`, `DESTR` (požáry, povodně, války s `y, c, r, frac, delay, fire`), `addLandmarks`, `addWalls`, `EVENTS` (rok, `t`, `x`, `key`, `cam[lat,lon,zoom]`, `drift`, `night`, `pins`, `age`, `fx`), `POPT`, `RULERS`, `CITY`, `BRX` (roky mostů a zničení), `TINT`, `ERAS` fonty, `buildActs` (scénky podle města), zvukové epochy `EP` v `audio_bp.html`, přelety/lodě podle místní geografie.
Pro město bez velké řeky vyměnit „Dunaj“ za místní motiv (pobřeží, moře, hradby), ale zachovat osu, HUD a styl.

## 7. Kontrola kvality (povinná)
1. Struktura MP4 (`ftyp/moov/mdat`), dvě stopy, délky (video ~371,9 s, zvuk o ~5 s delší kvůli dozvuku).
2. Dekódovat v `<video>` (server s Range) a vykreslit 4–6 snímků na jedno plátno: hook, římská doba, vrchol 19. stol., válka, finále, závěrečný stěrač.
3. Rozbor WAV: špička 0,89 (−1 dBFS), žádné vzorky ≥32000, RMS po 30 s.
4. Uvést uživateli časy hlasitých efektů (`*-loud.json`).
5. Výslovně vypsat, co se **nezkontrolovalo** (celé video, zvuk, plynulost pohybu).

## 8. YouTube balíček (po renderu)
3 názvy EN („X: 2,000 Years in 6 Minutes“, „Watch X Grow from … to …“, „The City That …“), koncept thumbnailu (split screen zničeno/dnes, max. 3 slova „2,000 YEARS“), popis EN + CS s **kapitolami z přesné časové osy** (`timeline_bp.json`), zdroje dat (© OpenStreetMap contributors, ODbL; AWS Terrain Tiles) a poznámka „procedurální hudba, stylizované půdorysy“. Svislá „shorts“ (9:16, 20–30 s) jen na požádání; potřebují vlastní rozložení textu.

## 9. Co se ptát uživatele (a nic víc)
V kole 1 (kap. 0) spolu s návrhem událostí a délky: 1. Které město a které období? 2. Hook a open loop – souhlas s návrhem? 3. Seznam událostí a délka videa – úpravy? 4. Povolit stahování dat (OSM, výšky)? Vše ostatní rozhodnout a uvést v souhrnu.

## 10. Odhad nákladů (hrubý)
- Strojový čas při znovupoužití kódu: data 10–20 min, render obrazu ~5 min, zvuk 3–10 min (až 25 min, když je záložka na pozadí), mux ~1 min.
- Největší část je **práce s obsahem a laděním** (události, růst, katastrofy, památky, opravy po náhledech). Budapešť (první město) trvala několik hodin a velký objem tokenů; další město s hotovým kódem má být řádově levnější. Odhad uživateli vždy napsat před startem a doporučit nejdřív cenově nenáročný krok.

## 11. Poučení / pasti (neopakovat)
- Přepsat argumenty funkcí (`lmk(items, name, lat, lon, y0, y1, sc)`): jedna zbloudilá `0` rozbila měřítko památek.
- `Int16Array` nestačí na ID desek (použij `Int32Array`) – platí i pro planetární sérii.
- Dlouhý výpočet zvuku neběží dobře na pozadí (trval 30+ min); držet záložku v popředí.
- Po každé změně JS znovu načíst stránku s novým `?v=`; jinak dostaneš starý kód.
- Pozor na velký výstup: kontaktní archy dělat jen malé, komprimované.
- Nálet/válečné scény: žádná zranění, žádné krvavé detaily; „drobné figurky“ ano.
- **Sprity památek:** šířka plátna `newSpr(w, …)` musí být ≥ `a + b` (součet rozměrů půdorysu), jinak se památka ořízne a vypadá malá. Rozměry spritů jsou v metrech.
- Sprite/landmark nové země navrhnout podle skutečných rozměrů (výška věže, délka fasády) a zkontrolovat zblízka (`tools/dbg.js`) před renderem.
- Headless Chromium neumí H.264 ve WebCodecs (jen VP9); lokálně proto `render_local.js` se systémovým Chrome (headful). V cloudu `tools/pump.js` (JPEG → ffmpeg), ale ~4–5 h.
- Soubory > 30 MB nejdou poslat do chatu a > 100 MB nejdou do gitu (`out/` je v `.gitignore`) → video vždy renderovat tam, kde má zůstat.
- `pkill -f …` může zabít i vlastní shell; procesy ukončovat podle PID.
