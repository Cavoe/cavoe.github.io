/* =========================================================================
   SCRIPT PARTAGÉ — en-tête, pied de page et menu
   -------------------------------------------------------------------------
   L'en-tête et le pied de page sont définis UNE SEULE FOIS ici, puis injectés
   dans chaque page. Tu ne modifies la navigation qu'à un seul endroit.

   Pour ajouter / retirer / renommer une page : modifie le tableau NAV_LINKS.
   ========================================================================= */

const SITE_NAME = "CAVOE";
const SITE_TAGLINE = "Découvrir · Comprendre · Partager";
const SITE_BASELINE = "Collections d'accessoires autour du vin et œnophiles";
const LOGO_SRC = "assets/titre-cavoe.png";

const NAV_LINKS = [
    { href: "index.html",      label: "Accueil" },
    { href: "evenements.html", label: "Événements" },
    { href: "reglement.html", label: "Règlement" },
];

/* Page courante, pour surligner le bon lien */
const current = location.pathname.split("/").pop() || "index.html";

/* ---- En-tête ------------------------------------------------------------ */
function buildHeader() {
    const links = NAV_LINKS.map((l) => {
        const active = l.href === current ? ' aria-current="page"' : "";
        return `<li><a href="${l.href}"${active}>${l.label}</a></li>`;
    }).join("");

    return `
    <header class="site-header">
      <nav class="nav wrap" aria-label="Navigation principale">
        <a class="brand" href="index.html" aria-label="${SITE_NAME} — accueil">
          <img src="${LOGO_SRC}" alt="Cavoe">
        </a>
        <button class="nav__toggle" aria-expanded="false" aria-controls="menu">☰ Menu</button>
        <ul class="nav__links" id="menu">
          ${links}
        </ul>
      </nav>
    </header>`;
}

/* ---- Pied de page ------------------------------------------------------- */
function buildFooter() {
    const year = new Date().getFullYear();

    return `
    <footer class="site-footer">
      <div class="wrap footer__grid">
        <div>
          <p>${SITE_NAME}</p>
          <p style="color:#d8d2c6;">${SITE_BASELINE}.</p>
          <p class="footer__tagline">${SITE_TAGLINE}</p>
        </div>
        <div>
          <p>Nous connaître</p>
          <a href="bureau.html">Le bureau</a>
        </div>
        <div>
          <p>Nous contacter</p>
          <a href="mailto:cavoe+contact@proton.me">cavoe+contact@proton.me</a>
        </div>
      </div>
      <div class="wrap footer__bottom">
        <p>© ${year} ${SITE_NAME} — <a href="mentions-legales.html">Mentions légales</a></p>
        <p>Association loi 1901 — RNA n° W441007735</p>
        <p>L'abus d'alcool est dangereux pour la santé, à consommer avec modération</p>
      </div>
    </footer>`;
}

/* ---- Injection + interactions ------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    const headerSlot = document.getElementById("site-header");
    const footerSlot = document.getElementById("site-footer");
    if (headerSlot) headerSlot.innerHTML = buildHeader();
    if (footerSlot) footerSlot.innerHTML = buildFooter();

    // Menu mobile
    const toggle = document.querySelector(".nav__toggle");
    const menu = document.getElementById("menu");
    if (toggle && menu) {
        toggle.addEventListener("click", () => {
            const open = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(open));
        });
    }
});
