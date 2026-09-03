/* =========================================================================
   AGENDA — chargé depuis un tableur Google Sheets (export CSV)
   -------------------------------------------------------------------------
   Pour ajouter, modifier ou supprimer un événement : éditez UNIQUEMENT le
   tableur Google Sheets. Les pages Actualités et Accueil se mettent à jour
   automatiquement, et le tri « à venir / passés » se fait selon la date du jour.

   Le tableur doit être publié sur le web au format CSV
   (Fichier › Partager › Publier sur le web › format « .csv »).
   Les colonnes attendues (l'ordre importe peu, le repérage se fait par nom) :
     Titre · Catégorie · Date de début · Date de fin · Horaire · Lieu ·
     Description · Conditions d'accès · Cible · Lien · Libellé du lien

   Remarque : le chargement nécessite que le site soit servi par un serveur
   (GitHub Pages, ou « python3 -m http.server » en local). En ouvrant un
   fichier directement (double-clic), le navigateur peut bloquer la requête.
   ========================================================================= */

const EVENTS_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS05m2_d41dN59bvs64Gk0JLRjybkBdCi8yYy0MH5T3TfU4HJ7IcbUHhq62BXrQP_QS1CbvLqcu9qn8/pub?gid=0&single=true&output=csv';

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
   « (Obligatoire) », du format « AAAA-MM-JJ », de la casse ou des espaces. */
function normalizeHeader(h) {
  return h
    .replace(/\(obligatoire\)/gi, '')
    .replace(/aaaa-mm-jj/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/* Fait correspondre un intitulé de colonne au nom de champ interne. */
function headerToKey(header) {
  const n = normalizeHeader(header);
  if (n.includes('titre')) return 'title';
  if (n.includes('catégorie') || n.includes('categorie')) return 'tag';
  if (n.includes('date de début') || n.includes('date de debut'))
    return 'start';
  if (n.includes('date de fin')) return 'end';
  if (n.includes('horaire')) return 'time';
  if (n.includes('lieu')) return 'location';
  if (n.includes('description')) return 'description';
  if (n.includes('condition') || n.includes('accès') || n.includes('acces'))
    return 'access';
  if (n.includes('cible')) return 'audience';
  if (n.includes('libellé') || n.includes('libelle')) return 'linkLabel'; // avant « lien »
  if (n.includes('lien du site')) return 'link';
  if (n.includes('lien de l\'illustration')) return 'image';
  return null;
}

/* Transforme le texte CSV en tableau d'objets événement. */
function eventsFromCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];

  const keys = rows.shift().map(headerToKey);

  return rows
    .map((cells) => {
      const ev = {};
      keys.forEach((key, i) => {
        if (key) ev[key] = (cells[i] || '').trim();
      });
      return ev;
    })
    .filter((ev) => ev.title); // on ignore les lignes sans titre
}

/* -------------------------------------------------------------------------
   Affichage
   ------------------------------------------------------------------------- */

function parseDate(iso) {
  return new Date(iso + 'T00:00:00');
}

/* Formatage d'une date (ou d'une plage) en français */
function frDate(startISO, endISO) {
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  const s = parseDate(startISO);
  if (endISO && endISO !== startISO) {
    const e = parseDate(endISO);
    const sameMonth =
      s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth)
      return `du ${s.getDate()} au ${e.toLocaleDateString('fr-FR', opts)}`;
    return `du ${s.toLocaleDateString('fr-FR', opts)} au ${e.toLocaleDateString('fr-FR', opts)}`;
  }
  return s.toLocaleDateString('fr-FR', opts);
}

/* Un élément d'agenda (réutilise le style .news__item) */
function eventCard(ev) {
  const dateLabel = frDate(ev.start, ev.end);
  const meta = [ev.location, ev.access, ev.audience]
    .filter(Boolean)
    .join(' · ');
  return `
    <li class="news__item${ev.image ? ' news__item--img' : ''}">
      <div class="news__date">
        ${dateLabel}
        ${ev.time ? `<span class="event-time">${ev.time}</span>` : ''}
      </div>
      ${ev.image ? `<div class="news__media"><img src="${ev.image}" alt="" loading="lazy"></div>` : ''}
      <div>
        ${ev.tag ? `<span class="tag">${ev.tag}</span>` : ''}
        <h3>${ev.title}</h3>
        ${ev.description ? `<p class="justified">${ev.description}</p>` : ''}
        ${meta ? `<p class="event-meta justified">${meta}</p>` : ''}
        ${ev.link ? `<p class="event-link"><a href="${ev.link}" target="_blank" rel="noopener">${ev.linkLabel || 'En savoir plus'} →</a></p>` : ''}
      </div>
    </li>`;
}

async function loadEvents() {
  const upEl = document.getElementById('agenda-upcoming');
  const pastEl = document.getElementById('agenda-past');
  const homeEl = document.getElementById('home-events');
  if (!upEl && !pastEl && !homeEl) return; // rien à remplir sur cette page

  let events;
  try {
    const res = await fetch(EVENTS_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    events = eventsFromCSV(text);
  } catch (err) {
    const msg = `L'agenda n'a pas pu être chargé mais vous pouvez nous contacter à cavoe+contact@proton.me .`;
    [upEl, pastEl, homeEl].forEach((el) => {
      if (el) {
        el.after(document.createElement('p').innerHTML(msg));
      }
    });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keyDate = (ev) => parseDate(ev.end || ev.start);

  const upcoming = events
    .filter((ev) => keyDate(ev) >= today)
    .sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const past = events
    .filter((ev) => keyDate(ev) < today)
    .sort((a, b) => parseDate(b.start) - parseDate(a.start));

  if (upEl) {
    upEl.innerHTML = upcoming.length
      ? upcoming.map(eventCard).join('')
      : `<li><div><p class="justified">Aucun rendez-vous programmé pour l'instant.</p></div></li>`;
  }
  if (pastEl) {
    pastEl.innerHTML = past.length
      ? past.map(eventCard).join('')
      : `<li><div><p class="event-meta justified">Aucun événement passé pour le moment.</p></div></li>`;
  }
  if (homeEl) {
    const latest = [...events]
      .sort((a, b) => keyDate(b) - keyDate(a))
      .slice(0, 3);
    homeEl.innerHTML = latest.map(eventCard).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadEvents);
