import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import PaywallGate from "@/components/paywall-gate";
import styles from "../post.module.css";

const SLUG = "navegar-las-finanzas-modernas-el-augurio-de-una-odisea";

export const metadata: Metadata = {
  title: "Navegar las finanzas modernas: El augurio de una odisea",
  description:
    "Un viaje con dinero real por los mercados que están reemplazando al sistema.",
  openGraph: {
    title: "Navegar las finanzas modernas: El augurio de una odisea — Chamillion",
    description:
      "Un viaje con dinero real por los mercados que están reemplazando al sistema.",
    images: [{ url: "/assets/newsletter/banner-post-01.jpeg" }],
  },
};

export default async function Post01() {
  let isPremium = false;
  try {
    const supabase = await createClient();
    const { data: post } = await supabase
      .from("posts")
      .select("premium")
      .eq("slug", SLUG)
      .single();
    isPremium = post?.premium ?? false;
  } catch {
    // Supabase unreachable — default to non-premium (show full content)
  }

  /* Teaser: banner + header + first paragraphs (always visible) */
  const teaser = (
    <>
      <p>
        El dinero vale menos cada día: <em>se diluye</em>, y con él su
        definición.
      </p>

      <p>
        El orden financiero mundial se asfixia bajo su propio peso, y cada
        ciclo necesita más gasolina para seguir funcionando. Los bancos
        centrales imprimen, los gobiernos se endeudan, y la factura se reparte
        silenciosamente entre todos.
      </p>

      <p>Pero eso ya lo sabes.</p>

      <hr className={styles.divider} />
    </>
  );

  return (
    <>
      {/* BANNER */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerWrapper}>
          <Image
            className={styles.bannerImg}
            src="/assets/newsletter/banner-post-01.jpeg"
            alt="Chamillion — The Daily"
            width={1568}
            height={700}
            priority
            sizes="(max-width: 860px) 100vw, 860px"
          />
        </div>
      </div>

      {/* ARTICLE */}
      <article className={styles.article}>
        <div className={styles.articleHeader}>
          <h1>
            Navegar las finanzas modernas:
            <br />
            El augurio de una odisea
          </h1>
          <p className={styles.articleSubtitle}>
            Un viaje con dinero real por los mercados que están reemplazando al
            sistema.
          </p>
          <div className={styles.postMeta}>26 ene 2025 · 8 min</div>
        </div>

        <hr className={styles.dividerHeavy} />

        <PaywallGate isPremium={isPremium} teaser={teaser}>

        <p>
          El dinero vale menos cada día: <em>se diluye</em>, y con él su
          definición.
        </p>

        <p>
          El orden financiero mundial se asfixia bajo su propio peso, y cada
          ciclo necesita más gasolina para seguir funcionando. Los bancos
          centrales imprimen, los gobiernos se endeudan, y la factura se reparte
          silenciosamente entre todos.
        </p>

        <p>Pero eso ya lo sabes.</p>

        <hr className={styles.divider} />

        <p>
          Hacer algo al respecto no es fácil: el sistema está amañado. Los
          mercados donde compensar esta erosión son sistemática y
          deliberadamente opacos para quienes no pertenecen al selecto club. La
          banca de inversión{" "}
          <a
            href="https://financialcrimeacademy.org/fines-for-market-manipulation/"
            target="_blank"
            rel="noopener noreferrer"
            data-domain="financialcrimeacademy.org"
          >
            tiene y usa información privilegiada constantemente
          </a>
          .
        </p>

        <p>
          Mientras tanto, el resto solo accedemos a una fracción de los
          productos financieros disponibles — y cada vez menos.
        </p>

        <div className={styles.pullquote}>
          <p>
            En Europa, por ejemplo, la regulación{" "}
            <a
              href="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=celex%3A32014L0065"
              target="_blank"
              rel="noopener noreferrer"
              data-domain="eur-lex.europa.eu"
            >
              MiFID II
            </a>{" "}
            restringe el acceso a multitud de productos financieros para
            &ldquo;inversores profesionales&rdquo; — una meritocrática
            catalogación que requiere, entre otras cosas, tener 500.000 € en tu
            cuenta o haber trabajado en el sector bancario.
          </p>
        </div>

        {/* Embed: Retail vs Institucional */}
        <iframe
          src="/widgets/post-01/retail-vs-inst-esma/index.html"
          loading="lazy"
          className={`${styles.iframe} ${styles.iframeRetail}`}
          title="Comparativa Inversor Retail vs Institucional — Datos ESMA"
        />

        <p>
          Mientras tanto, existen mercados donde nadie te pide permiso, y cada
          operación es pública y verificable. Donde{" "}
          <strong>
            tú te llevas la rentabilidad y el intermediario la comisión
          </strong>
          , no al revés.
        </p>

        <p>
          Donde los productos financieros más innovadores se están creando a un
          ritmo vertiginoso, y cualquiera con una conexión a internet puede
          acceder. Sin barreras y sin engaños.
        </p>

        {/* Embed: Stablecoins chart */}
        <iframe
          src="/widgets/post-01/stablecoins-mcap/index.html"
          loading="lazy"
          className={`${styles.iframe} ${styles.iframeStablecoins}`}
          title="Capitalización de mercado de Stablecoins — DefiLlama API"
        />

        <div className={styles.highlightBox}>
          <p>
            Voy a explorarlos con 500 € de mi bolsillo, a la vista de todos. Y
            contaré todo lo que aprenda por el camino.
          </p>
        </div>

        <hr className={styles.divider} />

        {/* EL PLAN */}
        <h3 className={styles.planHeading}>El Plan</h3>

        <div className={styles.planBox}>
          <div className={styles.planEntry}>
            <span className={styles.planLabel}>La cartera:</span>
            <span className={styles.planDesc}>
              500 € iniciales + 100 € al mes.
            </span>
          </div>
          <div className={styles.planEntry}>
            <span className={styles.planLabel}>El seguimiento:</span>
            <span className={styles.planDesc}>
              Cada semana, una actualización con el estado de cada posición,
              las decisiones tomadas y los números al detalle.
            </span>
          </div>
          <div className={styles.planEntry}>
            <span className={styles.planLabel}>El contexto:</span>
            <span className={styles.planDesc}>
              Artículos complementarios extensos explicando las plataformas,
              los mercados y las estrategias desde los fundamentos.
            </span>
          </div>
          <div className={styles.planFooter}>
            Sin ensaladas de palabras ni tecnicismos.
            <br />
            Todo público. Todo verificable.
          </div>
        </div>

        {/* ¿POR QUÉ 500? */}
        <h2>¿Por qué 500?</h2>
        <p>
          Creo que no importa tanto con cuánto empieces, sino lo que vayas
          aportando y las habilidades que adquieras por el camino. Estos dos
          factores son los que hacen <em>compound</em> con el tiempo, y en el
          largo plazo tendrán mucho más peso.
        </p>
        <p>
          500 € es solo el punto de partida. Es suficiente para que las
          comisiones no se coman los resultados desde el primer día, y es una
          cantidad que cualquiera puede reunir.
        </p>

        <hr className={styles.divider} />

        {/* TRANSPARENCIA */}
        <h2>Transparencia</h2>
        <p>
          <strong>
            El valor de un proyecto financiero reside en si gana dinero
          </strong>
          . Si dejo margen para la ambigüedad o te pido que confíes ciegamente,
          estaría siendo deshonesto.
        </p>
        <p>
          En el mundo <em>on-chain</em> la transparencia es fácil. Las
          direcciones de wallets serán públicas. Cada operación, cada posición,
          cada ganancia y cada pérdida verificables por cualquiera, en cualquier
          momento.
        </p>
        <p>
          Si en algún momento uso plataformas centralizadas donde la
          verificación <em>on-chain</em> no sea posible, haré todo lo posible
          por documentarlo con el mismo nivel de detalle.
        </p>

        <hr className={styles.divider} />

        {/* DÓNDE SEGUIR EL TRAYECTO */}
        <h1>Dónde seguir el trayecto</h1>

        {/* NEWSLETTER */}
        <div className={styles.highlightBox}>
          <a
            className={styles.headingLink}
            href="https://chamillion.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>
              <svg className={styles.headingIcon} viewBox="0 0 448 511.471" fill="currentColor">
                <path d="M0 0h448v62.804H0V0zm0 229.083h448v282.388L223.954 385.808 0 511.471V229.083zm0-114.542h448v62.804H0v-62.804z"/>
              </svg>
              Newsletter
              <span className={styles.headingArrow}>&rarr;</span>
            </h3>
          </a>
          <p className={styles.highlightIntro}>Constará de dos secciones:</p>

          <div className={styles.sectionsGrid}>
            <a
              className={styles.sectionCard}
              href="https://chamillion.substack.com/s/reporte-de-la-cartera"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.sectionIcon}
                src="/assets/newsletter/icon-cartera.svg"
                alt="Reporte de la Cartera"
                width={80}
                height={80}
              />
              <div className={styles.sectionContent}>
                <h3>Reporte de la Cartera</h3>
                <p>
                  Actualizaciones con los números al detalle, y el por qué de
                  cada cosa.
                </p>
              </div>
              <span className={styles.sectionArrow}>&rarr;</span>
            </a>
            <a
              className={styles.sectionCard}
              href="https://chamillion.substack.com/s/punto-de-mira"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.sectionIcon}
                src="/assets/newsletter/icon-punto-de-mira.svg"
                alt="Punto de Mira"
                width={80}
                height={80}
              />
              <div className={styles.sectionContent}>
                <h3>Punto de Mira</h3>
                <p>
                  <em>Deep dives</em> en estrategias, mercados y agujeros
                  donde exprimir ganancias.
                </p>
              </div>
              <span className={styles.sectionArrow}>&rarr;</span>
            </a>
          </div>
        </div>

        {/* HUB */}
        <div className={styles.hubBox}>
          <h3>
            <svg className={styles.headingIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.24 2 7 4.24 7 7v3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v3H9V7c0-1.65 1.35-3 3-3z"/>
            </svg>
            Hub
          </h3>
          <p className={styles.hubIntro}>
            Si decides indagar más y suscribirte tendrás acceso a{" "}
            <a href="/hub">
              chamillion.site
            </a>
            , que reúne:
          </p>
          <ul className={styles.hubList}>
            <li>
              <strong>Versiones extendidas de la Newsletter</strong> con
              elementos interactivos
            </li>
            <li>
              <strong>Archivo</strong> de todas las publicaciones
            </li>
            <li>
              Estado de la <strong>Cartera a tiempo real:</strong> posiciones,
              estrategias en curso, plataformas y métodos empleados
            </li>
            <li>
              <strong>Mapa de Conocimientos:</strong>
              <ul className={styles.hubSublist}>
                <li>
                  <strong>Artículos</strong> de cada estrategia, plataforma e
                  idea
                </li>
                <li>
                  Un <strong>glosario</strong> extendido, para que puedas
                  diseccionar lo que te pique, hasta los fundamentos
                </li>
              </ul>
            </li>
            <li>
              <strong>Comunidad</strong>
              <ul className={styles.hubSublist}>
                <li>
                  Espacios de miembros para discusiones e ideas
                </li>
                <li>
                  Canales de comunicación directos conmigo para lo que necesites
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <a
          className={styles.socialLink}
          href="https://x.com/chamillionnnnn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className={styles.socialLinkIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className={styles.socialLinkText}>
            El día a día y mi lado más personal en <strong>@chamillionnnnn</strong>
          </span>
          <span className={styles.socialLinkArrow}>→</span>
        </a>

        <hr className={styles.dividerHeavy} />

        {/* HERO IMAGE */}
        <Image
          className={styles.heroImg}
          src="/assets/newsletter/wanderer-post-01.png"
          alt="Wanderer above the Sea of Fog — Camaleón"
          width={1920}
          height={1080}
          loading="lazy"
          sizes="(max-width: 860px) 100vw, 860px"
        />

        <div className={styles.closingText}>
          <p>
            El dinero se diluye, y los mercados de capitales tradicionales se
            desmoronan con él. De sus restos se están construyendo unos
            cimientos que lo reemplazarán.
          </p>
        </div>

        <div className={styles.finalQuote}>
          <p>
            Un sistema financiero que nadie autorizó, y que nadie puede parar.
          </p>
        </div>

        <div className={styles.closingText}>
          <p>Esta newsletter es un asiento en primera fila.</p>
        </div>

        <div className={styles.welcome}>
          <h3>Bienvenidos.</h3>
        </div>

        <div className={styles.disclaimer}>
          Nada de lo publicado en esta newsletter constituye asesoramiento
          financiero, de inversión, legal o fiscal. El contenido se proporciona
          únicamente con fines educativos e informativos. Las inversiones en
          criptomonedas y productos financieros conllevan riesgos
          significativos, incluyendo la pérdida total del capital invertido.
          Cada lector es responsable de realizar su propia investigación y
          consultar con profesionales cualificados antes de tomar cualquier
          decisión financiera. Los resultados pasados no garantizan resultados
          futuros.
        </div>

        </PaywallGate>

        {/* Back to archive */}
        <div style={{
          textAlign: "center",
          padding: "40px 0 0",
          borderTop: "1px solid var(--border)",
          marginTop: 40,
        }}>
          <a
            href="/newsletter"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 13,
              color: "var(--text-secondary)",
              textDecoration: "none",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}
          >
            &larr; Volver al archivo
          </a>
        </div>
      </article>
    </>
  );
}
