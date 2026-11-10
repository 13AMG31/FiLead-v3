"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { createInitialDemoData, getActiveDemoWorkspace, readDemoData, type DemoData } from "@/lib/demo-data";

export default function Demo() {
  const [data, setData] = useState<DemoData>(createInitialDemoData);

  useEffect(() => {
    // Hydrate this client-only DEMO preview from localStorage after server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(readDemoData());
  }, []);

  const workspace = getActiveDemoWorkspace(data);
  const theme = {
    "--green": workspace.business.primary_color,
    "--green2": workspace.business.accent_color,
  } as CSSProperties;

  return (
    <main>
      <header style={theme}>
        <Link className="brand" href="/" aria-label="Fi.Lead inicio"><Image src="/fi-lead-logo.png" alt="Fi.Lead" width={140} height={54} priority /></Link>
        <span className="pill">Menú DEMO · datos ficticios</span>
      </header>
      <section className="card" style={theme}>
        <div className="notice">
          <strong>MODO DEMO — Todos los datos son ficticios.</strong>
          <p className="small">Este menú se carga desde el almacenamiento local de este navegador; no consulta Supabase.</p>
        </div>
        <span className="eyebrow">Cafetería de demostración</span>
        <h1>{workspace.business.name}</h1>
        <p className="muted">Vista previa del negocio y de los productos disponibles para clientes.</p>
        <hr />
        <h2>Menú</h2>
        {workspace.products.filter((item) => item.is_available).length === 0 ? (
          <p className="muted">No hay productos disponibles en esta demo.</p>
        ) : workspace.products.filter((item) => item.is_available).map((item) => (
          <div className="product" key={item.id}>
            <div><b>{item.name}</b><div className="muted small">{item.description}</div></div>
            <span className="price">${Number(item.price).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <h2>Recompensas</h2>
        <p className="muted">
          {workspace.business.loyalty_goal} sellos para obtener {workspace.business.loyalty_reward}.
        </p>
        <Link className="button secondary" href="/admin">Volver al panel de prueba</Link>
      </section>
      <footer>Vista previa DEMO. No se registran ventas ni datos reales.</footer>
    </main>
  );
}
