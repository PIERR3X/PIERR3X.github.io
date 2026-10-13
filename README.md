# Portfolio – Pierluigi Maria Teotini

Sito statico (HTML, CSS, JavaScript, nessuna dipendenza da installare), pronto per GitHub Pages.

## Pubblicare su GitHub Pages

1. Su github.com crea un repository nuovo. Per avere l'indirizzo `https://TUOUSERNAME.github.io/` chiamalo esattamente `TUOUSERNAME.github.io`. Con qualsiasi altro nome il sito sarà su `https://TUOUSERNAME.github.io/nome-repo/`.
2. Carica **il contenuto** di questa cartella nella radice del repository (`index.html` deve stare alla radice): con "Add file > Upload files" oppure con git:
   ```
   git init && git add . && git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/TUOUSERNAME/NOME-REPO.git
   git push -u origin main
   ```
3. Nel repository vai su Settings > Pages, scegli "Deploy from a branch", branch `main`, cartella `/ (root)`, poi Save.
4. Dopo uno o due minuti il sito è online all'indirizzo mostrato in quella pagina.

## Struttura

- `index.html`: contenuti (un blocco `<article class="sheet">` per progetto).
- `assets/css/style.css`: stile, colori in cima al file (`:root`).
- `assets/js/flow.js`: animazione di apertura. `charts.js`: grafici. `main.js`: ingrandimento immagini.
- `assets/img/`: foto, loghi e figure. `assets/cv/`: PDF del CV.

## Modificare

- **Aggiungere una figura a un progetto:** copia l'immagine (meglio `.webp` o `.jpg`, larghezza massima 1600 px) in `assets/img/` e inserisci in `index.html`, dentro `<div class="story">`:
  ```html
  <figure>
    <img src="assets/img/NOME.webp" alt="Descrizione" loading="lazy">
    <figcaption><strong>Fig. 7</strong> Didascalia.</figcaption>
  </figure>
  ```
  Per avere più figure affiancate e ingrandibili al clic usa `<div class="gallery">` con più `<figure>`, come nel progetto V6.
- **Cambiare il CV:** sostituisci `assets/cv/Teotini_Pierluigi_CV.pdf` mantenendo il nome.
- **Cambiare i colori:** modifica le variabili in `:root` (tema chiaro) e nel blocco `prefers-color-scheme: dark` (tema scuro).

## Provare in locale

`python3 -m http.server 8000` nella cartella, poi apri http://localhost:8000
