import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Navegar las finanzas modernas: El augurio de una odisea — Chamillion",
  description:
    "Un viaje con dinero real por los mercados que están reemplazando al sistema.",
};

export default function Post01() {
  return (
    <>
      {/* BANNER */}
      <div className={styles.bannerSection}>
        <Image
          className={styles.bannerImg}
          src="/assets/newsletter/banner-post-01.jpg"
          alt="Chamillion — The Daily"
          width={1568}
          height={700}
          priority
        />
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
        </div>

        <hr className={styles.dividerHeavy} />

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

        <p>
          Hacer algo al respecto no es fácil: el sistema está amañado. Los
          mercados donde compensar esta erosión son sistemática y
          deliberadamente opacos para quienes no pertenecen al selecto club. La
          banca de inversión{" "}
          <a
            href="https://financialcrimeacademy.org/fines-for-market-manipulation/"
            target="_blank"
            rel="noopener noreferrer"
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
          height={700}
          loading="lazy"
          className={styles.iframe}
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
          height={500}
          loading="lazy"
          className={styles.iframe}
          title="Capitalización de mercado de Stablecoins — DefiLlama API"
        />

        <div className={styles.highlightBox}>
          <p>
            Voy a explorarlos con 500 € de mi bolsillo, a la vista de todos. Y
            te voy a contar todo lo que aprenda por el camino.
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
              <br />
              las decisiones tomadas y los números al detalle.
            </span>
          </div>
          <div className={styles.planEntry}>
            <span className={styles.planLabel}>El contexto:</span>
            <span className={styles.planDesc}>
              Artículos complementarios extensos explicando las plataformas,
              <br />
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
        <p>Esta Newsletter constará de dos secciones:</p>

        <div className={styles.sectionsGrid}>
          <div className={styles.sectionItem}>
            <img
              className={styles.sectionIcon}
              src="/assets/newsletter/icon-cartera.jpg"
              alt="Posiciones"
            />
            <div className={styles.sectionContent}>
              <h3>Reporte de la Cartera</h3>
              <p>
                Actualizaciones con los números al detalle, y el por qué de cada
                cosa.
              </p>
            </div>
          </div>
          <div className={styles.sectionItem}>
            <img
              className={styles.sectionIcon}
              src="/assets/newsletter/icon-punto-de-mira.jpg"
              alt="Estrategias"
            />
            <div className={styles.sectionContent}>
              <h3>Punto de Mira</h3>
              <p>
                <em>Deep dives</em> en estrategias, mercados y agujeros donde
                exprimir ganancias.
              </p>
            </div>
          </div>
        </div>

        {/* HUB */}
        <div className={styles.hubBox}>
          <h3>
            <span className={styles.lockIcon}>&#x1f512;</span> Hub
          </h3>
          <p className={styles.hubIntro}>
            Si eres suscriptor aquí en Substack tendrás acceso a{" "}
            <a
              href="https://chamillion.site"
              target="_blank"
              rel="noopener noreferrer"
            >
              chamillion.site
            </a>
            , que reúne:
          </p>
          <ul className={styles.hubList}>
            <li>
              <strong>Versiones extendidas</strong> de la Newsletter con
              elementos interactivos
            </li>
            <li>
              <strong>Archivo</strong> de todas las publicaciones
            </li>
            <li>
              Estado de la <strong>Cartera a tiempo real:</strong> posiciones,
              estrategias en curso, plataformas y métodos
            </li>
            <li>
              <strong>Mapa de Conocimientos:</strong> artículos de cada
              estrategia, plataforma e idea
            </li>
            <li>
              Un <strong>glosario</strong> extendido para diseccionar lo que te
              pique, hasta los fundamentos
            </li>
          </ul>
        </div>

        <div className={styles.socialLink}>
          <p>
            Por último, el día a día y mi lado más personal en{" "}
            <a
              href="https://x.com/chamillionnnnn"
              target="_blank"
              rel="noopener noreferrer"
            >
              @chamillionnnnn en X
            </a>
          </p>
        </div>

        <hr className={styles.dividerHeavy} />

        {/* HERO IMAGE PLACEHOLDER */}
        <div className={styles.heroImageSection}>
          <div className={styles.heroPlaceholder}>
            <div className={styles.heroGradientOverlay} />
            <div className={styles.heroContent}>
              <div className={styles.heroEmoji}>&#x1f98e;</div>
              <p className={styles.heroLabel}>Wanderer above the Sea of Fog</p>
              <p className={styles.heroCaption}>
                Imagen generada con IA — Freepik Flux 1.1
              </p>
            </div>
          </div>
        </div>

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
      </article>
    </>
  );
}
