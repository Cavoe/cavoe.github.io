/* =========================================================================
   Partenaires — chargé depuis un tableur Google Sheets (export CSV)
   -------------------------------------------------------------------------
   Pour ajouter, modifier ou supprimer un partenaire : éditez UNIQUEMENT le
   tableur Google Sheets. Les pages Partenaires et Accueil se mettent à jour
   automatiquement.

   Le tableur doit être publié sur le web au format CSV
   (Fichier › Partager › Publier sur le web › format « .csv »).

   Remarque : le chargement nécessite que le site soit servi par un serveur
   (GitHub Pages, ou « python3 -m http.server » en local). En ouvrant un
   fichier directement (double-clic), le navigateur peut bloquer la requête.
   ========================================================================= */

const PARTENAIRES_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsqQUpbdHVuYCX8BsW3DGKGXs5peSc7MF4cAp1zBOyBiK5ZjDa4gLgPLLov4f7OgXYkWKUBhleku97/pub?gid=0&single=true&output=csv';

/* -------------------------------------------------------------------------
   Lecture du CSV
   ------------------------------------------------------------------------- */

/* Analyseur CSV complet : gère les guillemets, les virgules et les retours
   à la ligne à l'intérieur des cellules, ainsi que les guillemets échappés
   ("" à l'intérieur d'un champ entre guillemets). Renvoie un tableau de lignes,
   chaque ligne étant un tableau de champs (chaînes). */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } // guillemet échappé
        else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (c !== '\r') {
      field += c;
    }
  }
  // Dernier champ / dernière ligne
  row.push(field);
  rows.push(row);

  // On écarte les lignes entièrement vides (ex. retour à la ligne final)
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/* Normalise un intitulé de colonne pour le comparer sans se soucier des
   « (Obligatoire) »de la casse ou des espaces. */
function normalizeHeader(h) {
  return h
    .replace(/\(obligatoire\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/* Fait correspondre un intitulé de colonne au nom de champ interne. */
function headerToKey(header) {
  const n = normalizeHeader(header);
  if (n.includes('nom')) return 'name';
  if (n.includes('description')) return 'description';
  if (n.includes('lien du logo')) return 'logoLink';
  if (n.includes('lien du site')) return 'link';
  return null;
}

/* Transforme le texte CSV en tableau d'objets partenaires. */
function partnersFromCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];

  const keys = rows.shift().map(headerToKey);

  return rows
    .map((cells) => {
      const partner = {};
      keys.forEach((key, i) => {
        if (key) partner[key] = (cells[i] || '').trim();
      });
      return partner;
    })
    .filter((partner) => partner.name); // on ignore les lignes sans nom
}

/* -------------------------------------------------------------------------
   Affichage
   ------------------------------------------------------------------------- */

/* Un partenaire (réutilise le style .news__item) */
function partnerCard(partner) {
  return `
     <article class="card">
        <div>
            <img src="${partner.logoLink}" alt="" style="max-height:15vh; max-width:15vw;">
            <h3 style="height: 0; width: 0; opacity: 0">${partner.name}</h3>
        </div>
        <p>
            ${partner.description}
        </p>
        <p class="visit-partner-btn">
            <a class="btn btn--ghost" href="${partner.link}" target="_blank" rel="noopener">Visiter le site du ${partner.name}</a>
        </p>
     </article>`;
}

async function loadPartners() {
  const partnersEl = document.getElementById('partners-list');
  if (!partnersEl) return; // rien à remplir sur cette page

  let partners = [];
  try {
    const res = await fetch(PARTENAIRES_URL, { cache: 'no-cache' });

    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    partners = partnersFromCSV(text);
  } catch (err) {
    const msg = `La liste des partenaires n'a pas pu être chargé.`;
    partnersEl.after(document.createElement('p').innerHTML(msg));
    return;
  }

  partnersEl.innerHTML = partners.length
      ? partners.map(partnerCard).join('')
      : `<li><div><p class="justified">Aucun partenaire pour l'instant.</p></div></li>`;
}

document.addEventListener('DOMContentLoaded', loadPartners);
