"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { CSSProperties } from "react";
import { getDemoBusiness, readDemoData } from "@/lib/demo-data";

type CardSnapshot = {
  customerId: string;
  businessId: string;
  customerName: string;
  businessName: string;
  stamps: number;
  goal: number;
  reward: string;
  primaryColor: string;
  accentColor: string;
};

const defaultColors = { primaryColor: "#FF6B5B", accentColor: "#FFF0E9" };

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
}

function readSnapshot(raw: string | null): CardSnapshot | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CardSnapshot>;
    if (
      typeof value.customerId !== "string" ||
      typeof value.businessId !== "string" ||
      typeof value.customerName !== "string" ||
      typeof value.businessName !== "string" ||
      typeof value.reward !== "string" ||
      !Number.isInteger(value.stamps) ||
      !Number.isInteger(value.goal) ||
      Number(value.goal) < 2 ||
      Number(value.goal) > 50
    ) {
      return null;
    }
    return {
      customerId: value.customerId,
      businessId: value.businessId,
      customerName: value.customerName,
      businessName: value.businessName,
      stamps: Math.max(0, Math.min(Number(value.goal), Number(value.stamps))),
      goal: Number(value.goal),
      reward: value.reward,
      primaryColor: isHexColor(value.primaryColor) ? value.primaryColor : defaultColors.primaryColor,
      accentColor: isHexColor(value.accentColor) ? value.accentColor : defaultColors.accentColor,
    };
  } catch {
    return null;
  }
}

export default function DemoCustomerCard({ customerId }: { customerId: string }) {
  const [card, setCard] = useState<CardSnapshot | null>(null);
  const [origin, setOrigin] = useState("");
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    // Load the private local DEMO record and the current origin after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    const data = readDemoData();
    const customer = data.customers.find((item) => item.id === customerId);
    const business = customer ? getDemoBusiness(data, customer.business_id) : null;
    if (customer && business) {
      setCard({
        customerId: customer.id,
        businessId: business.id,
        customerName: customer.full_name,
        businessName: business.name,
        stamps: customer.stamps,
        goal: business.loyalty_goal,
        reward: business.loyalty_reward,
        primaryColor: business.primary_color,
        accentColor: business.accent_color,
      });
      setIsLocal(true);
      return;
    }

    const snapshot = readSnapshot(new URLSearchParams(window.location.search).get("demo"));
    if (snapshot?.customerId === customerId) setCard(snapshot);
  }, [customerId]);

  const theme = {
    "--green": card?.primaryColor || defaultColors.primaryColor,
    "--green2": card?.accentColor || defaultColors.accentColor,
  } as CSSProperties;
  const cardUrl = card && origin
    ? `${origin}/tarjeta/${encodeURIComponent(card.customerId)}?demo=${encodeURIComponent(JSON.stringify(card))}`
    : "";

  if (!card) {
    return (
      <main>
        <section className="card">
          <div className="notice"><strong>MODO DEMO — Datos ficticios.</strong></div>
          <h1>Tarjeta no disponible</h1>
          <p className="muted">Esta tarjeta de prueba no está guardada en este navegador y el enlace no incluye una copia DEMO válida.</p>
          <Link href="/admin">Volver al panel</Link>
        </section>
      </main>
    );
  }

  const rewardReady = card.stamps >= card.goal;
  return (
    <main style={theme}>
      <header>
        <Link className="brand" href="/" aria-label="Fi.Lead inicio"><Image src="/fi-lead-logo.png" alt="Fi.Lead" width={140} height={54} priority /></Link>
        <span className="pill">Tarjeta de prueba</span>
      </header>
      <section className="card customer-card">
        <div className="notice">
          <strong>MODO DEMO — Cliente y negocio ficticios.</strong>
          <p className="small">
            {isLocal
              ? "Tarjeta local de solo prueba; los cambios solo existen en este navegador."
              : "Copia de tarjeta DEMO de solo lectura. No sincroniza sellos ni guarda datos en este dispositivo."}
          </p>
        </div>
        <div className="customer-card-head" style={{ marginTop: 18 }}>
          <span className="small">TARJETA DE FIDELIDAD · DEMO</span>
          <h1 style={{ color: "white", fontSize: "1.8rem" }}>{card.businessName}</h1>
          <h2 style={{ color: "white" }}>{card.customerName}</h2>
          <span className="small">Cliente de prueba · sin teléfono visible</span>
        </div>

        <h2 style={{ marginTop: 22 }}>Sellos: {card.stamps}/{card.goal}</h2>
        <div className="stamps" aria-label={`${card.stamps} de ${card.goal} sellos de prueba`}>
          {Array.from({ length: card.goal }, (_, index) => (
            <span className={`stamp ${index < card.stamps ? "filled" : ""}`} key={index}>
              {index < card.stamps ? "✓" : "·"}
            </span>
          ))}
        </div>
        <p className={rewardReady ? "success" : "muted"}>
          {rewardReady ? `Recompensa disponible: ${card.reward}` : `Recompensa al completar la meta: ${card.reward}`}
        </p>

        {cardUrl && (
          <>
            <h2 style={{ marginTop: 24 }}>Código QR individual</h2>
            <div className="qr-wrap">
              <QRCodeSVG value={cardUrl} size={208} level="M" title={`QR de la tarjeta DEMO de ${card.customerName}`} data-testid="qr-demo-customer-card" />
            </div>
            <p className="muted small" style={{ textAlign: "center" }}>
              El QR contiene solo una copia ficticia y de solo lectura de esta tarjeta.
            </p>
            <p style={{ textAlign: "center" }}>
              <Link href={cardUrl} data-testid="link-demo-qr-target">Abrir enlace de la tarjeta DEMO</Link>
            </p>
          </>
        )}
        <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
          <Link className="button secondary" href="/admin">Volver al panel DEMO</Link>
        </div>
      </section>
      <footer>Fi.Lead · tarjeta ficticia, sin cuenta ni base de datos.</footer>
    </main>
  );
}
