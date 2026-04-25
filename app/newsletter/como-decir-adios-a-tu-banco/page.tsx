import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPostsClient } from "@/lib/supabase/posts-client";
import PaywallGate from "@/components/paywall-gate";
import IframeWidget from "@/components/iframe-widget";
import PostJsonLd from "@/components/post-json-ld";
import PostFooter from "@/components/post-footer";
import ReadingProgress from "@/components/reading-progress";
import BackToTop from "@/components/back-to-top";
import Breadcrumbs from "@/components/breadcrumbs";
import WalletCollapsible from "./wallet-collapsible";
import EvmLink from "./evm-link";
import TocSidebar from "../toc-sidebar";
import styles from "../post.module.css";

const TOC_ENTRIES = [
  { id: "pase-de-entrada", label: "El pase de entrada", readTime: 3 },
  { id: "del-banco-a-la-wallet", label: "Del banco a la wallet", readTime: 2 },
  { id: "la-otra-cara", label: "La otra cara de la moneda", readTime: 2 },
  { id: "mi-decision", label: "Mi decisión", sub: true, readTime: 1 },
  { id: "manos-a-la-obra", label: "Manos a la obra", readTime: 1 },
];

const SLUG = "como-decir-adios-a-tu-banco";

// ── Helpers ──────────────────────────────────────────────────────

function usdcSvg(size: number) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fill="white"
        fontSize="17"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
      >
        $
      </text>
    </svg>
  );
}

function CryptoTag({ symbol }: { symbol: "ETH" | "USDC" }) {
  return (
    <span className={styles.cryptoTag}>
      {symbol === "ETH" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/widgets/post-02/evm-chains/logos/ethereum.svg"
          width={13}
          height={13}
          alt=""
          aria-hidden
          style={{ display: "block" }}
        />
      ) : (
        usdcSvg(13)
      )}
      {symbol}
    </span>
  );
}

function FavLink({
  href,
  domain,
  children,
}: {
  href: string;
  domain: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-domain={domain}
      className={styles.faviconLink}
      style={
        {
          "--fav": `url(https://www.google.com/s2/favicons?domain=${domain}&sz=16)`,
        } as CSSProperties
      }
    >
      {children}
    </a>
  );
}

function Paso({ n, label }: { n: number; label: string }) {
  return (
    <div className={styles.pasoHeading}>
      <span className={styles.pasoNum}>{n}</span>
      <span className={styles.pasoLabel}>{label}</span>
    </div>
  );
}

// ── Metadata ─────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Cómo decir adiós a tu banco",
  description:
    "500 euros en el banco, listos para el despliegue. El primer paso hacia los mercados sin intermediarios.",
  alternates: {
    canonical: `https://chamillion.site/newsletter/${SLUG}`,
  },
  openGraph: {
    title: "Cómo decir adiós a tu banco — Chamillion",
    description:
      "500 euros en el banco, listos para el despliegue. El primer paso hacia los mercados sin intermediarios.",
    images: [{ url: "/api/og?title=C%C3%B3mo+decir+adi%C3%B3s+a+tu+banco&subtitle=500+euros+en+el+banco%2C+listos+para+el+despliegue.+El+primer+paso+hacia+los+mercados+sin+intermediarios.&banner=https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-02-DxV4ecwMgOUXEiIeWJW433sNbYTLbe.jpeg", width: 1200, height: 630 }],
  },
};

export default async function Post02() {
  let isPremium = false;
  try {
    const postsDb = createPostsClient();
    const { data: post } = await postsDb
      .from("posts")
      .select("premium")
      .eq("slug", SLUG)
      .single();
    isPremium = post?.premium ?? false;
  } catch {
    // Supabase unreachable — default to non-premium
  }

  const teaser = (
    <>
      <p>500 euros en el banco, listos para el despliegue. ¿Ahora qué?</p>
      <p>
        Como ya he mencionado en el{" "}
        <span className={styles.postPreview}>
          <Link href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea">
            post que presenta la newsletter
          </Link>
          <span className={styles.postPreviewCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.postPreviewImg}
              src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-01-XRge08UEXKueBFhB7eTjVfOSEvg9Ma.jpeg"
              alt=""
              aria-hidden
            />
            <span className={styles.postPreviewBody}>
              <span className={styles.postPreviewTitle}>
                Navegar las finanzas modernas: El augurio de una odisea
              </span>
              <span className={styles.postPreviewSub}>
                Un viaje con dinero real por los mercados que están reemplazando al sistema.
              </span>
            </span>
          </span>
        </span>
        , el objetivo último de esta cartera es demostrar que hay
        más y mejores oportunidades fuera de un banco o una cartera de inversión
        tradicional.
      </p>
      <hr className={styles.divider} />
    </>
  );

  return (
    <>
      <ReadingProgress />
      <BackToTop />
      <Breadcrumbs title="Cómo decir adiós a tu banco" />
      <TocSidebar entries={TOC_ENTRIES} />

      {/* BANNER */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerWrapper}>
          <Image
            className={styles.bannerImg}
            style={{ objectPosition: "center 75%" }}
            src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-02-DxV4ecwMgOUXEiIeWJW433sNbYTLbe.jpeg"
            alt="Chamillion — Cómo decir adiós a tu banco"
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
          <h1>Cómo decir adiós a tu banco</h1>
          <p className={styles.articleSubtitle}>Reporte de la Cartera — #1</p>
          <div className={styles.postMeta}>20 mar 2026 · 8 min</div>
        </div>

        <hr className={styles.dividerHeavy} />

        <PaywallGate isPremium={isPremium} teaser={teaser}>

          <p>500 euros en el banco, listos para el despliegue. ¿Ahora qué?</p>

          <p>
            Como ya he mencionado en el{" "}
            <span className={styles.postPreview}>
              <Link href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea">
                post que presenta la newsletter
              </Link>
              <span className={styles.postPreviewCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.postPreviewImg}
                  src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-01-XRge08UEXKueBFhB7eTjVfOSEvg9Ma.jpeg"
                  alt=""
                  aria-hidden
                />
                <span className={styles.postPreviewBody}>
                  <span className={styles.postPreviewTitle}>
                    Navegar las finanzas modernas: El augurio de una odisea
                  </span>
                  <span className={styles.postPreviewSub}>
                    Un viaje con dinero real por los mercados que están reemplazando al sistema.
                  </span>
                </span>
              </span>
            </span>
            , el objetivo último de esta cartera es demostrar que
            hay más y mejores oportunidades fuera de un banco o una cartera de
            inversión tradicional.
          </p>

          <p>
            En este primer{" "}
            <span className={styles.postPreview}>
              <Link href="/newsletter">Reporte de la Cartera</Link>
              <span className={styles.postPreviewCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.postPreviewImg}
                  src="/assets/newsletter/sections/reporte-de-la-cartera.jpeg"
                  alt=""
                  aria-hidden
                />
                <span className={styles.postPreviewBody}>
                  <span className={styles.postPreviewTitle}>
                    Reporte de la Cartera
                  </span>
                  <span className={styles.postPreviewSub}>
                    Actualización al detalle de mis nuevas posiciones, y de cómo van las actuales.
                  </span>
                </span>
              </span>
            </span>, voy a crearla paso a paso. Enseñaré cómo acceder a
            estos mercados de la manera más barata, cómoda y segura.
          </p>

          <div className={styles.subtleBox}>
            <p>
              ⚠️ A día de hoy, no puedo decir que esto sea (aún) para
              cualquiera. Requiere tiempo, estudio y tolerancia al riesgo. Al
              fin y al cabo, todo lo nuevo aún no está cimentado, y ser el
              conejillo de indias tiene su riesgo. Pero también su recompensa.
            </p>
          </div>

          <hr className={styles.divider} />

          {/* === EL PASE DE ENTRADA === */}
          <h1 id="pase-de-entrada">El pase de entrada: una conexión a internet</h1>

          <p>
            Ignorando alguna que otra excepción (que puede ser usada a lo largo
            del camino), toda la innovación en inversión se está construyendo
            sobre una <em>blockchain</em>.
          </p>

          <iframe
            src="/widgets/post-02/blockchain-anim/index.html"
            loading="lazy"
            className={`${styles.iframe} ${styles.iframeBlockchainAnim}`}
            title="Blockchain en vivo — cómo se forman los bloques"
          />

          <p>
            Una blockchain no es más que una base de datos, con la diferencia de
            que es <strong>pública</strong>, y <strong>abierta</strong>:
            cualquiera con un dispositivo e internet puede cambiar un dato
            — siempre y cuando siga las reglas propuestas.
          </p>

          <p>
            Esta configuración es perfecta para montar mercados financieros (por
            razones de las que hablaremos otro día).
          </p>

          <p>
            Esta newsletter es de finanzas, así que no vamos a indagar mucho a
            nivel técnico. Basta con saber que hay cientos de <em>redes</em>{" "}
            (blockchains). Cada una almacena unos datos y tiene unas reglas.
          </p>

          <p>
            De cara a lo que nos importa — los mercados — la mayoría se agrupan
            en una categoría muy concreta, con reglas similares; las llamadas
            EVM.
          </p>

          <IframeWidget
            src="/widgets/post-02/evm-chains/index.html"
            widgetId="evm-chains"
            className={`${styles.iframe} ${styles.iframeEvmChains}`}
            title="Redes EVM — Comparativa de blockchains"
          />

          <p className={styles.widgetCaption}>
            Ethereum es el estandarte del sector, pero su época de comisiones
            altas hizo que surgiesen muchas nuevas.
          </p>

          <div className={styles.pullquote}>
            <p>
              Si tienes una cuenta en un bróker de inversión tradicional
              probablemente te importe una mierda si está programada en Python,
              Java, o C++… Todos funcionan bien y son seguros.
              <br /><br />
              Pero en este caso, el ecosistema aún no es cien por cien
              confiable. Surgen agujeros de seguridad. La infraestructura
              importa, y sus reglas influyen en el funcionamiento de los
              mercados que alberga.
            </p>
          </div>

          <p>
            Es importante considerar la plataforma de inversión, pero también la
            blockchain. Porque suele dar lo mismo, hasta que deja de darlo{" "}
            <FavLink href="https://defillama.com/hacks" domain="defillama.com">
              (Historial de hacks — DefiLlama)
            </FavLink>
            . Iré explicando cada elección que tome.
          </p>

          <p>
            Bien. Está claro: cuidado con dónde metes el dinero. Eso no es
            novedad. ¿Cómo se accede? ¿Cómo se crea una cuenta?
          </p>

          <hr className={styles.divider} />

          {/* === DEL BANCO A LA WALLET === */}
          <h1 id="del-banco-a-la-wallet">Del banco a la wallet</h1>

          <WalletCollapsible>
              <p>
                Las explicaciones a continuación son sólo las que creo
                indispensables. Si quieres indagar más a un nivel técnico o tienes
                dudas, estaré encantado de ayudarte.
              </p>

              <Paso n={1} label="La cuenta" />

              <div className={styles.stepBlock}>
                <ul className={styles.hubList}>
                  <li>
                    Descargar una wallet. Es el programa para interactuar con la(s)
                    blockchain(s). Usar una u otra no supone (casi) diferencia:

                    <div className={styles.walletPicks}>
                      <a
                        href="https://metamask.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.walletPick}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.walletPickLogo}
                          src="https://www.google.com/s2/favicons?domain=metamask.io&sz=64"
                          alt=""
                          aria-hidden
                        />
                        <div>
                          <div className={styles.walletPickName}>Metamask</div>
                          <div className={styles.walletPickNote}>La más famosa</div>
                        </div>
                      </a>
                      <a
                        href="https://rabby.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.walletPick}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.walletPickLogo}
                          src="https://www.google.com/s2/favicons?domain=rabby.io&sz=64"
                          alt=""
                          aria-hidden
                        />
                        <div>
                          <div className={styles.walletPickName}>Rabby Wallet</div>
                          <div className={styles.walletPickNote}>Mejor experiencia, probablemente</div>
                        </div>
                      </a>
                    </div>

                    <p className={styles.walletPickDisclaimer}>
                      Cualquier otra es válida. Pero que sea Open Source (de código
                      abierto) es —en mi opinión— indispensable.
                    </p>
                  </li>
                  <li>Seguir los pasos para crear la cartera. Son sencillos.</li>
                  <li>Apuntar las 12 palabras secretas.</li>
                </ul>

                <div className={styles.warningBox}>
                  <p>
                    <strong>Las 12 palabras son cruciales.</strong>{" "}
                    Generan el número secreto que da acceso a la cartera.
                    <br /><br />
                    <em>
                      En la blockchain no hay &ldquo;He olvidé mi contraseña&rdquo;.
                      No hay mensaje de{" "}
                      <strong>Aviso: Alguien ha iniciado sesión en tu cuenta</strong>.
                    </em>
                    <br /><br />
                    <strong>Sin la clave, nadie en el mundo puede recuperarla.</strong>
                    {" "}Escribirlas en papel y boli. Nunca en digital.
                  </p>
                </div>

                <div className={styles.stepDone}>
                  <svg className={styles.stepDoneIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  La wallet está lista.
                </div>
              </div>

              <Paso n={2} label="El intermediario" />

              <div className={styles.stepBlock}>
                <p>
                  Pasar 500 € de un banco a una wallet requiere lo mismo que cualquier
                  cambio de divisa: un <em>intermediario</em>.
                </p>

                <Image
                  className={styles.heroImg}
                  src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/post-02-intermediarios-zRqcFcQwcb7m3LuQSnwuIUR3jEqyIa.png"
                  alt="La casa de cambio de un aeropuerto, la terminal de un trader en Wall Street y la parada de taxis"
                  width={1024}
                  height={686}
                  loading="lazy"
                  sizes="(max-width: 860px) 100vw, 860px"
                />

                <p className={styles.imgCaption}>
                  La casa de cambio de un aeropuerto, la terminal sofisticada de un
                  trader de Wall Street o el que te cambia euros por pesos en la
                  parada de taxis. Todos tienen el mismo propósito.
                </p>

                <p>
                  Puede ser una entidad, una persona o un programa automatizado — y
                  como es un negocio muy lucrativo, la competencia por ofrecerte el
                  mejor precio es brutal.
                </p>

                <p>
                  En mi caso he elegido{" "}
                  <FavLink href="https://www.kraken.com" domain="kraken.com">
                    Kraken
                  </FavLink>
                  , un exchange de criptomonedas de mucha reputación. Tiene una
                  interfaz clara sin margen de errores, comisiones muy bajas y me
                  permite documentar a la perfección la compra (de cara a compromisos
                  fiscales futuros).
                </p>

                <p>El proceso es relativamente sencillo:</p>

                <ol className={styles.orderedList}>
                  <li>Creas una cuenta: email, contraseña, identificación, etc.</li>
                  <li>Depositas por tarjeta o transferencia.</li>
                  <li>
                    Conviertes los euros a la criptomoneda que desees.{" "}
                    (<strong>En mi caso he elegido <CryptoTag symbol="ETH" /> como punto de
                    partida</strong>).
                  </li>
                  <li>Retiras dicha criptomoneda a tu wallet.</li>
                </ol>
              </div>

              <Paso n={3} label="El retiro" />

              <div className={styles.stepBlock}>
                <p>El intermediario te pedirá una dirección como destino final.</p>

                <p>
                  Toda wallet tiene una <strong>clave pública</strong> (similar a un
                  IBAN en una cuenta de banco). Empieza por 0x, y sigue con 40
                  caracteres.
                </p>

                <p>En mi caso es:</p>

                <div className={styles.walletWrapper}>
                  <a
                    href="https://debank.com/profile/0x32a0CAD9E987F82be1173f3b38a415853898a480"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.walletBlock}
                  >
                    0x32a0CAD9E987F82be1173f3b38a415853898a480
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ marginLeft: "auto", flexShrink: 0 }}
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  <div className={styles.walletHintToggle}>
                    <svg className={styles.walletHintChevron} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <div className={styles.walletHint}>
                    <p className={styles.walletHintInner}>
                      Si haces click en la dirección, verás mi cartera en un
                      explorador de blockchains EVM. Como he mencionado antes,{" "}
                      <strong>la blockchain es pública</strong>.
                    </p>
                  </div>
                </div>

                <p>
                  <strong>Esta es la dirección a la que enviar los fondos.</strong>{" "}
                  Es válida para todas las redes EVM de la wallet.
                </p>

                <p>
                  Kraken pedirá escoger la red concreta de retiro. He elegido{" "}
                  <EvmLink chain="arbitrum" widgetId="evm-chains">Arbitrum</EvmLink>, que es reputada, suficientemente segura y barata.
                </p>
              </div>
          </WalletCollapsible>

          <hr className={styles.divider} />

          {/* === LA OTRA CARA DE LA MONEDA === */}
          <h1 id="la-otra-cara"><em>La otra cara de la moneda</em></h1>

          <p>
            Algo que aprendes a interiorizar a medida que te adentras en el
            mundo financiero es que <strong>todo es un activo</strong>. Incluso
            el dinero.
          </p>

          <IframeWidget
            src="/widgets/post-02/value-axis/index.html"
            widgetId="value-axis"
            className={`${styles.iframe} ${styles.iframeValueAxis}`}
            title="Con divisa vs Sin divisa — Por qué necesitamos dinero"
          />

          <p className={styles.widgetCaption}>
            El concepto de dinero (divisa) es un punto de referencia para
            valorar las cosas. Medio kilo de pollo vale 5&nbsp;EUR, un corte de
            pelo 20&nbsp;EUR y un coche 10&nbsp;000&nbsp;EUR.
          </p>

          <p>
            Todos entendemos su utilidad. Permite saltarse el trueque y tener
            un punto común para apoyarse.
          </p>

          <p>
            Lo que mucha gente no considera es que se trata de un activo más: el Euro puede,{" "}
            <em>en sí mismo</em>, volverse más o menos valioso.
          </p>

          <IframeWidget
            src="/widgets/post-02/eur-value/index.html"
            widgetId="eur-value"
            className={`${styles.iframe} ${styles.iframeEurValue}`}
            title="Valor del Euro — cómo fluctúa la divisa"
          />

          <p className={styles.widgetCaption}>
            La divisa es la referencia, el nodo central. Si esta se devalúa,
            los productos se ajustan: se desplaza la escala.
          </p>

          <p>
            Cuando se trata de vivir — cobrar sueldo, pagar gastos, etc — no
            tiene sentido usar otra divisa que no sea la de tu jurisdicción.
          </p>

          <p>
            Pero a la hora de <strong>ahorrar</strong> (guardar valor
            excedente) cometemos el error de olvidar que hay opciones. Escoger
            la divisa correcta sobre la que basar tu futura cartera de inversión
            o sistema de ahorro es importante.
          </p>

          <p>
            La blockchain pone de manifiesto este fenómeno. No tiene
            jurisdicción. La línea entre dinero, divisa, token, etc se difumina.
            De nuevo —y aquí más claro que nunca— <em><strong>todo es un activo.</strong></em>
          </p>

          <p>
            La fricción para convertir una criptomoneda a otra es mínima, y las
            comisiones son prácticamente nulas. Es como convertir una foto de PNG a
            JPEG.
          </p>

          <p>Esto da mucho más poder de decisión.</p>

          <hr className={styles.divider} />

          {/* === MI DECISIÓN === */}
          <h2 id="mi-decision">Mi decisión</h2>

          <p>
            El retiro de Kraken fue en <CryptoTag symbol="ETH" />. Sin embargo,{" "}
            <CryptoTag symbol="ETH" /> fluctúa demasiado para usarlo como divisa.
          </p>

          <p>
            <CryptoTag symbol="USDC" /> es una criptomoneda que replica el valor del
            dólar estadounidense. Esta será la divisa que escojo{" "}
            (<strong>por ahora</strong>) para la cartera.
          </p>

          <p>
            Para hacer la conversión <CryptoTag symbol="ETH" />→<CryptoTag symbol="USDC" />, he utilizado{" "}
            <FavLink href="https://swap.defillama.com" domain="defillama.com">
              DeFiLlama Swap
            </FavLink>
            .
          </p>

          <p>
            Existen otras monedas que replican el euro, pero la liquidez, las oportunidades y la
            infraestructura están construidas alrededor del dólar.
          </p>

          <p>
            <em>
              *He reservado 0.0017 <CryptoTag symbol="ETH" /> (~5 euros) para pagar comisiones
              futuras (el llamado gas), aunque 1 o 2 euros bastarían.
            </em>
          </p>

          <div className={styles.portfolioCard}>
            <div className={styles.portfolioCardTitle}>Cartera inicial — mar 2026</div>
            <div className={styles.portfolioRow}>
              {usdcSvg(22)}
              <span className={styles.portfolioRowName}>USDC</span>
              <span className={styles.portfolioRowAmount}>620.00</span>
            </div>
            <div className={styles.portfolioRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/widgets/post-02/evm-chains/logos/ethereum.svg"
                width={22}
                height={22}
                alt=""
                aria-hidden
                style={{ display: "block", flexShrink: 0 }}
              />
              <span className={styles.portfolioRowName}>ETH</span>
              <span className={styles.portfolioRowAmount}>0.0017</span>
            </div>
            <div className={styles.portfolioCardFooter}>
              <span className={styles.portfolioCardFooterLabel}>Total</span>
              <span className={styles.portfolioCardFooterValue}>~540 EUR</span>
            </div>
            <div className={styles.portfolioCardNote}>
              Los 40 € de más son pura suerte: entre el retiro{" "}
              <CryptoTag symbol="ETH" /> de Kraken y el cambio a{" "}
              <CryptoTag symbol="USDC" /> esperé un par de días. ETH subió, y me
              llevé la diferencia.
            </div>
          </div>

          <hr className={styles.dividerHeavy} />

          {/* === MANOS A LA OBRA === */}
          <h1 id="manos-a-la-obra">Manos a la obra</h1>

          <p>
            Con este setup da comienzo mi cartera. A partir de ahora, cada mes
            publicaré un nuevo{" "}
            <span className={styles.postPreview}>
              <Link href="/newsletter">Reporte de la Cartera</Link>
              <span className={styles.postPreviewCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.postPreviewImg}
                  src="/assets/newsletter/sections/reporte-de-la-cartera.jpeg"
                  alt=""
                  aria-hidden
                />
                <span className={styles.postPreviewBody}>
                  <span className={styles.postPreviewTitle}>
                    Reporte de la Cartera
                  </span>
                  <span className={styles.postPreviewSub}>
                    Actualización al detalle de mis nuevas posiciones, y de cómo van las actuales.
                  </span>
                </span>
              </span>
            </span>{" "}
            donde mostraré los avances al detalle.
          </p>

          <p>
            No tengo objetivos de rentabilidad concretos, simplemente encontrar
            oportunidades y compartirlas. Es mejor cuidar la siembra y no
            contar los frutos.
          </p>

          <Image
            className={styles.closingImg}
            src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-02-DxV4ecwMgOUXEiIeWJW433sNbYTLbe.jpeg"
            alt="Impression, soleil levant — Claude Monet"
            width={1568}
            height={700}
            loading="lazy"
            sizes="(max-width: 860px) 100vw, 860px"
          />

          <p>
            Decía en el{" "}
            <span className={styles.postPreview}>
              <Link href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea">
                post de bienvenida
              </Link>
              <span className={styles.postPreviewCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.postPreviewImg}
                  src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-01-XRge08UEXKueBFhB7eTjVfOSEvg9Ma.jpeg"
                  alt=""
                  aria-hidden
                />
                <span className={styles.postPreviewBody}>
                  <span className={styles.postPreviewTitle}>
                    Navegar las finanzas modernas: El augurio de una odisea
                  </span>
                  <span className={styles.postPreviewSub}>
                    Un viaje con dinero real por los mercados que están reemplazando al sistema.
                  </span>
                </span>
              </span>
            </span>{" "}
            que esto prevee ser una odisea. Y toda odisea empieza con un primer
            paso bastante aburrido: <em>preparar la mochila</em>.
          </p>

          <p>
            <strong className={styles.closingBold}>
              La mochila está lista. Ahora, con wallet en mano -y un sinfín de
              ideas en el tintero- toca ganar dinero.
            </strong>
          </p>

          <div className={styles.finalQuote}>
            <p>
              Gracias por estar aquí desde el principio. Esto acaba de empezar.
              Nos vemos en el próximo <strong>Reporte de la Cartera</strong>
            </p>
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

        <PostFooter slug={SLUG} title="Cómo decir adiós a tu banco" />
      </article>
      <PostJsonLd
        title="Cómo decir adiós a tu banco"
        description="500 euros en el banco, listos para el despliegue. El primer paso hacia los mercados sin intermediarios."
        slug={SLUG}
        date="2026-03-20"
        bannerPath="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-02-DxV4ecwMgOUXEiIeWJW433sNbYTLbe.jpeg"
      />
    </>
  );
}
