import type { Metadata } from "next";
import SuscribirseClient from "./suscribirse-client";

export const metadata: Metadata = {
  title: "Suscríbete — Chamillion",
  description: "Accede al contenido premium de Chamillion.",
};

export default function SuscribirsePage() {
  return <SuscribirseClient />;
}
