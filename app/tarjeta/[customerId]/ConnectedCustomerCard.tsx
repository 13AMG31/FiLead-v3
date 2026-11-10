"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { getSupabase } from "@/lib/supabase";

type Card = {
  customer_name: string;
  stamps: number;
  loyalty_goal: number;
  loyalty_reward: string;
  business_name: string;
  business_slug: string;
};

// En modo conectado el parámetro de la URL es el código secreto (qr_token) del cliente.
export default function ConnectedCustomerCard({ token }: { token: string }) {
  const [card, setCard] = useState<Card | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    getSupabase()
      .rpc("get_customer_card", { p_token: token })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setStatus("error");
          return;
        }
        const row = (data as Card[] | null)?.[0];
        if (row) {
          setCard(row);
          setStatus("ready");
        } else {
          setStatus("missing");
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  if (status !== "ready" || !card) {
    return (
      <main>
        <section className="card customer-card">
          <h1>{status === "loading" ? "Cargando tarjeta…" : "Tarjeta no disponible"}</h1>
          {status === "missing" && <p className="muted">Este código no corresponde a ninguna tarjeta. Pide al negocio que te comparta tu enlace o QR de nuevo.</p>}
          {status === "error" && <p className="error">No pudimos cargar la tarjeta. Intenta de nuevo en unos minutos.</p>}
        </section>
      </main>
    );
  }

  const goal = card.loyalty_goal;
  const stamps = Math.max(0, Math.min(goal, card.stamps));
  const rewardReady = stamps >= goal;
  const cardUrl = origin ? `${origin}/tarjeta/${encodeURIComponent(token)}` : "";

  return (
    <main>
      <header>
        <Link className="brand" href="/" aria-label="Fi.Lead inicio"><Image src="/fi-lead-logo.png" alt="Fi.Lead" width={140} height={54} priority /></Link>
      </header>
      <section className="card customer-card">
        <div className="customer-card-head">
          <span className="small">TARJETA DE FIDELIDAD</span>
          <h1 style={{ color: "white", fontSize: "1.8rem" }}>{card.business_name}</h1>
          <h2 style={{ color: "white" }}>{card.customer_name}</h2>
        </div>

        <h2 style={{ marginTop: 22 }}>Sellos: {stamps}/{goal}</h2>
        <div className="stamps" aria-label={`${stamps} de ${goal} sellos`}>
          {Array.from({ length: goal }, (_, index) => (
            <span className={`stamp ${index < stamps ? "filled" : ""}`} key={index}>
              {index < stamps ? "✓" : "·"}
            </span>
          ))}
        </div>
        <p className={rewardReady ? "success" : "muted"}>
          {rewardReady ? `¡Recompensa disponible: ${card.loyalty_reward}!` : `Recompensa al completar los sellos: ${card.loyalty_reward}`}
        </p>

        {cardUrl && (
          <>
            <h2 style={{ marginTop: 24 }}>Tu código QR</h2>
            <div className="qr-wrap">
              <QRCodeSVG value={cardUrl} size={208} level="M" title={`QR de la tarjeta de ${card.customer_name}`} />
            </div>
            <p className="muted small" style={{ textAlign: "center" }}>
              Muestra este código en caja. Guarda este enlace, es tu tarjeta personal.
            </p>
          </>
        )}
        <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
          <Link className="button secondary" href={`/${card.business_slug}`}>Ver menú</Link>
        </div>
      </section>
      <footer>Fi.Lead · tarjeta de fidelidad digital.</footer>
    </main>
  );
}
