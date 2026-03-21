import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PaywallGate from "@/components/paywall-gate";
import styles from "../post.module.css";

const SLUG = "como-decir-adios-a-tu-banco";

/* Draft note — visible placeholder for WIP sections */
function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ background: "rgba(255,200,0,0.15)", padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "monospace", color: "var(--text-secondary)", border: "1px dashed rgba(255,200,0,0.4)" }}>
      {children}
    </p>
  );
}

export const metadata: Metadata = {
  title: "Cómo decir adiós a tu banco",
  description:
    "500 euros en el banco, listos para el despliegue. El primer paso hacia los mercados sin intermediarios.",
  openGraph: {
    title: "Cómo decir adiós a tu banco — Chamillion",
    description:
      "500 euros en el banco, listos para el despliegue. El primer paso hacia los mercados sin intermediarios.",
    images: [{ url: "/assets/newsletter/banner-post-02.jpeg" }],
  },
};

export default async function Post02() {
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

  const teaser = (
    <>
      <p>
        500 euros en el banco, listos para el despliegue. ¿Ahora qué?
      </p>

      <p>
        Como ya he mencionado en el{" "}
        <Link href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea">
          post que presenta esta newsletter
        </Link>
        , el objetivo último de esta cartera pública es demostrar que hay más
        y mejores oportunidades fuera de un banco, bróker o cartera de
        inversión tradicional.
      </p>

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
            style={{ objectPosition: "center 30%" }}
            src="/assets/newsletter/banner-post-02.jpeg"
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
          <p className={styles.articleSubtitle}>
            500 euros en el banco, listos para el despliegue. ¿Ahora qué?
          </p>
          <div className={styles.postMeta}>20 mar 2026 · 8 min</div>
        </div>

        <hr className={styles.dividerHeavy} />

        <PaywallGate isPremium={isPremium} teaser={teaser}>

        <Note>((Notas: Para los links, añadir junto al mismo el favicon del sitio del link, que parezca una mención más interactiva))</Note>

        <p>
          500 euros en el banco, listos para el despliegue. ¿Ahora qué?
        </p>

        <p>
          Como ya he mencionado en el{" "}
          <Link href="/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea">
            post que presenta esta newsletter
          </Link>
          , el objetivo último de esta cartera pública es demostrar que hay más
          y mejores oportunidades fuera de un banco, bróker o cartera de
          inversión tradicional.
        </p>
        <Note>((Algo catchy que haga al lector tener ganas de meterse porque aquí es donde está el dinero))</Note>

        <p>
          En este primer Reporte de la Cartera, pondré el contexto para acceder
          a estos mercados de la manera más barata, cómoda y segura, enseñando
          el setup de mi cartera de inicio, paso a paso.
        </p>

        <div className={styles.subtleBox}>
          <p>
            <em>
              Las explicaciones a continuación son las que creo estrictamente
              necesarias para tener confianza y conocimiento de causa. Si
              quieres indagar más a un nivel técnico o tienes dudas, estar
              encantado de ayudarte.
            </em>
          </p>
        </div>

        <p>
          A día de hoy, no puedo decir que esto sea (aún) para cualquiera.
          Requiere tiempo, estudio y tolerancia al riesgo. Al fin y al cabo,
          todo lo nuevo aún no está cimentado, y ser el conejillo de indias
          tiene su riesgo. Pero también su recompensa.
        </p>

        <hr className={styles.divider} />

        {/* === EL PASE DE ENTRADA === */}
        <h1>El pase de entrada: una conexión a internet</h1>

        <p>
          Ignorando alguna que otra excepción (que puede ser usada a lo largo
          del camino), toda la innovación en inversión se está construyendo
          sobre una blockchain.
        </p>

        <iframe
          src="/widgets/post-02/money-flow/index.html"
          loading="lazy"
          className={`${styles.iframe} ${styles.iframeMoneyFlow}`}
          title="El viaje del dinero — Del banco a los mercados descentralizados"
        />

        <p>
          Una blockchain no es más que una base de datos, con la diferencia de
          que es <strong>pública</strong>, y cualquiera puede cambiar un dato —
          siempre y cuando siga las reglas propuestas. Esta configuración es
          perfecta para montar un mercado por varias razones, de las que
          hablaremos otro día.
        </p>

        <p>
          Esta newsletter es de finanzas, así que no voy a indagar mucho a
          nivel técnico.
        </p>
        <Note>((Crear un artículo premium en el futuro hub de chamillion.site hablando de la blockchain a nivel técnico y referenciarlo aquí))</Note>

        <p>
          Basta con saber que hay cientos de <em>redes</em> (blockchains).
          Cada una almacena unos datos y tiene unas reglas.
          <br />
          De cara a lo que nos importa — los mercados — la mayoría se agrupan
          en una categoría muy concreta, con reglas similares; las llamadas
          EVM.
          <br />
          Son:
        </p>

        <ul className={styles.hubList}>
          <li>Ethereum</li>
          <li>Polygon</li>
          <li>Arbitrum</li>
          <li>HyperEVM</li>
          <li>Optimism</li>
          <li>Plasma</li>
          <li>Y un largo etc</li>
        </ul>

        <Note>((Para la versión Premium, cambiar esta enumeración por una tabla interactiva con logos/iconos de las blockchains. Para cada blockchain al hacer hover se verán datos comparativos: nº txs/segundo, y otras métricas relevantes. Para substack una imagen estática del mismo))</Note>

        <div className={styles.pullquote}>
          <p>
            <em>
              Si tienes una cuenta en un bróker de inversión tradicional
              probablemente te importe una mierda si está programada en Python,
              Java, o en Árabe… Todos funcionan bien y son seguros.
              <br />
              Pero en este caso, el ecosistema aún no es cien por cien
              confiable. Surgen agujeros de seguridad. La infraestructura
              importa, y sus reglas influyen en cómo funcionan los mercados que
              alberga.
            </em>
          </p>
        </div>

        <p>
          A la hora de decidir dónde invertir será importante considerar la
          plataforma, pero también la blockchain. Porque suele dar lo mismo,
          hasta que deja de darlo. Iré explicando cada elección que tome.
        </p>

        <p>
          Bien. Está claro: cuidado con dónde metes el dinero. Eso no es
          novedad.
          <br />
          ¿Cómo se accede? ¿Cómo se crea una cuenta?
        </p>

        <hr className={styles.divider} />

        {/* === DEL BANCO A LA WALLET === */}
        <h2>Del banco a la wallet</h2>

        <p>
          <em>
            Si ya sabes cómo montar una wallet (o ya tienes una) puedes
            ignorar esta sección.
          </em>
        </p>
        <Note>((Salto a la siguiente sección))</Note>

        <h3>Paso 1: La cuenta</h3>

        <p>El proceso es simple:</p>

        <ul className={styles.hubList}>
          <li>
            Descargar una wallet. Es el programa para interactuar con la(s)
            blockchain(s). Usar una u otra no supone (casi) diferencia.
            <ul className={styles.hubList}>
              <li>
                La más famosa es{" "}
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-domain="metamask.io"
                >
                  Metamask
                </a>
              </li>
              <li>
                <a
                  href="https://rabby.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-domain="rabby.io"
                >
                  Rabby Wallet
                </a>
                {" "}es mejor, probablemente
              </li>
              <li>
                Cualquier otra es válida. Pero que sea Open Source es, en mi
                opinión, indispensable.
              </li>
            </ul>
          </li>
          <li>
            Seguir los pasos para crear la cartera. Apuntar las 12 palabras
            secretas.
          </li>
        </ul>

        <div className={styles.highlightBox}>
          <p>
            ⚠️ Las 12 palabras secretas son cruciales. Generan el número
            secreto que da acceso a la cartera.
            <br />
            <br />
            En la blockchain no hay{" "}
            <em>&ldquo;He olvidado mi contraseña&rdquo;</em>.
            <br />
            No hay mensaje de{" "}
            <em>
              &ldquo;Aviso: Alguien ha iniciado sesión en tu cuenta&rdquo;
            </em>
            .
            <br />
            <br />
            El número secreto es la llave que desbloquea el dinero. Sin él,
            nadie en el mundo puede recuperarlo.
            <br />
            <br />
            <strong>
              Nunca apuntarlas en una nota del móvil, un gestor de contraseñas
              o cualquier otro formato digital.
            </strong>
            {" "}Escribirlas en papel y boli.
          </p>
        </div>

        <p>Ya está. La wallet está lista. Ahora toca mover el dinero.</p>

        <h3>Paso 2: El intermediario</h3>

        <p>
          La casa de cambio de un aeropuerto, la terminal sofisticada de un
          trader en Wall Street o el hombre que te ofrece cambiar euros por
          pesos en la parada de taxis. Todos con el mismo propósito.
        </p>

        <p>
          Pasar 500 € de un banco a una wallet requiere lo mismo que cualquier
          cambio de divisa: un intermediario.
        </p>

        <Image
          className={styles.heroImg}
          src="/assets/newsletter/post-02-intermediarios.png"
          alt="Intermediarios entre el banco y los mercados descentralizados"
          width={1024}
          height={686}
          loading="lazy"
          sizes="(max-width: 860px) 100vw, 860px"
        />

        <p>
          Puede ser una entidad, una persona o un programa automatizado — y
          como es un negocio muy lucrativo, la competencia por ofrecerte el
          mejor precio es brutal.
        </p>

        <p>
          En mi caso he elegido{" "}
          <a
            href="https://www.kraken.com"
            target="_blank"
            rel="noopener noreferrer"
            data-domain="kraken.com"
          >
            Kraken
          </a>
          , un exchange de criptomonedas de mucha reputación. Tiene una
          interfaz clara sin margen de errores, comisiones muy bajas y me
          permite documentar a la perfección la compra de cara a Hacienda.
        </p>

        <p>El proceso es relativamente sencillo:</p>

        <ul className={styles.hubList}>
          <li>
            Creas una cuenta: email, contraseña, identificación, etc.
          </li>
          <li>
            Ingresas fondos de tu banco, por métodos de pago tradicionales
            como tarjeta o transferencia.
          </li>
          <li>
            Conviertes los euros a la criptomoneda que desees. En mi caso he
            elegido ETH como punto de partida.
            <Note>((Añadir logo ETH))</Note>
          </li>
          <li>Retiras dicha criptomoneda a tu wallet.</li>
        </ul>

        <h3>Paso 3: El retiro</h3>

        <p>
          Sea cual sea el método de intercambio, el destino final es la wallet
          recién creada.
          <br />
          Esta tiene una clave pública (similar a un IBAN en una cuenta de
          banco). Esta es la dirección a la que tienen que llegar los fondos.
        </p>

        <p>
          En mi caso es{" "}
          <code>0x32a0CAD9E987F82be1173f3b38a415853898a480</code>.
        </p>
        <Note>((Hacer la dirección interactiva: al hovearla sale opción de abrir chamillion.site/v donde verificar los saldos))</Note>

        <p>
          Cualquiera puede explorar la blockchain (como he mencionado antes, es
          pública) e introduciendo esta dirección, ver mis saldos y movimientos
          a tiempo real.
        </p>

        <p>
          Introduces la dirección como destino, completas el intercambio, y el
          dinero aparece en la wallet.
        </p>

        <hr className={styles.divider} />

        {/* === LA OTRA CARA DE LA MONEDA === */}
        <h2><em>La otra cara de la moneda</em></h2>

        <p>
          Algo que aprendes a interiorizar a medida que te adentras en el mundo
          financiero es que todo es un activo.
        </p>

        <p>
          El concepto de dinero (divisa) es un punto de referencia para darle
          valor numérico a las cosas.
          <br />
          Medio kilo de pollo vale 5 EUR, un corte de pelo 20 EUR y un coche
          10 000 EUR.
        </p>

        <Note>((Infográfico interactivo HTML que visualice que la divisa es la referencia sobre productos/servicios para mostrar su valor. En substack, versión estática/imagen))</Note>

        <p>
          Todos entendemos la utilidad de una divisa. Permite saltarse el
          trueque y a la hora de comprar o vender un producto tener una
          referencia sobre la que apoyarse.
        </p>

        <p>
          Lo que mucha gente no considera es que el Euro es un activo más.
          Puede, en sí mismo, volverse más o menos valioso. Su función como
          divisa es ser lo más estable posible, pero lo cierto es que solo lo
          puede ser hasta cierto punto. Y hay docenas de otras divisas que
          tratan de hacer lo mismo que el euro.
        </p>

        <Note>((Foto del gráfico del Euro index en substack. Para la versión premium un gráfico propio con los mismos datos))</Note>

        <p>
          El sistema está configurado para que, en un principio, el euro sea tu
          divisa por defecto. Tu sueldo te llega en euros, y almacenas tu
          ahorro en euros en el banco.
          <br />
          La mayoría de bancos no ofrecen la posibilidad de cambiar de divisa
          fácilmente.
        </p>

        <p>
          La blockchain en cambio no tiene jurisdicción. No hay una divisa por
          defecto. Además, la fricción para pasar de una a otra es mínima, y
          las comisiones prácticamente nulas.
          <br />
          Cambiar de una criptomoneda a otra no es más difícil que convertir
          una foto de PNG a JPEG.
        </p>

        <p>Esto nos da mucho más poder de decisión.</p>

        <hr className={styles.divider} />

        {/* === MI DECISIÓN === */}
        <h3>Mi decisión</h3>

        <p>
          Tener una pequeña cantidad de ETH es necesario para pagar las
          comisiones de la red (el llamado <em>gas</em>). He reservado
          0.0017 ETH (~5 euros).
        </p>

        <p>
          El resto lo he convertido a USDC, una criptomoneda que replica el
          valor del dólar estadounidense. ¿Por qué dólares y no euros? Porque
          la inmensa mayoría de los mercados descentralizados operan en
          dólares. Es la divisa franca de este ecosistema. Existen stablecoins
          en euros, pero la liquidez, las oportunidades y la infraestructura
          están construidas alrededor del dólar. Ir contra eso sería nadar a
          contracorriente sin motivo.
        </p>

        <p>
          Y aquí viene un detalle importante: este intercambio de ETH a USDC
          no lo he hecho en Kraken. Lo he hecho directamente en la blockchain,
          usando{" "}
          <a
            href="https://swap.defillama.com"
            target="_blank"
            rel="noopener noreferrer"
            data-domain="defillama.com"
          >
            DefiLlama Swap
          </a>
          {" "}— un agregador que busca la mejor ruta de intercambio entre
          distintos mercados descentralizados.
        </p>

        <p><strong>El punto de partida:</strong></p>
        <p>
          Con todo esto, la cartera tiene:
          <br />
          — 620 USDC
          <br />
          — 0.0017 ETH
        </p>

        <p>
          Son unos 540 EUR. Los 40 € de más son pura suerte: entre que retiré
          ETH de Kraken y lo cambié a USDC pasaron un par de días, ETH subió,
          y me llevé la diferencia.
        </p>

        <hr className={styles.divider} />

        {/* === MANOS A LA OBRA === */}
        <h2>Manos a la obra</h2>

        <p>
          Con este setup da comienzo mi cartera. A partir de ahora, cada mes
          publicaré un nuevo Reporte de la Cartera donde mostraré los avances
          al detalle.
        </p>

        <p>
          No tengo objetivos de rentabilidad concretos. Los mercados son
          sistemas complejos fruto de decisiones humanas, y por tanto escapan a
          la ciencia dura. Creo firmemente que el foco de un buen inversor debe
          estar en afilar el hacha y no en la cantidad de leña obtenida.
        </p>

        <p>
          Decía en el primer post que esto es una odisea. Y toda odisea empieza
          con un primer paso bastante aburrido: preparar la mochila.
          <br />
          La mochila está lista. Ahora, con wallet en mano y un sinfín de
          ideas en el tintero, toca ganar dinero.
        </p>

        <p>
          Gracias por estar aquí desde el principio. Esto acaba de empezar.
          <br />
          Nos vemos en el próximo reporte.
        </p>

        <hr className={styles.dividerHeavy} />

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
