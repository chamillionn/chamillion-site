import ChameleonEye from "@/components/chameleon-eye";

export default function Home() {
  return (
    <>
      <ChameleonEye />
      <div className="landing">
        <h1 className="logo">chamillion</h1>
        <p className="tagline">
          DeFi, mercados crypto y transparencia on-chain.
        </p>
        <p className="desc">
          <strong>500 € iniciales + 100 €/mes</strong> invertidos en mercados
          DeFi.
          <br />
          Todo documentado. Todo verificable. Sin pedir permiso.
        </p>
        <a
          className="cta"
          href="https://chamillion.substack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Suscríbete en Substack
        </a>
        <p className="status">en construcción</p>
      </div>
    </>
  );
}
