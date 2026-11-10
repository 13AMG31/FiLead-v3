"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import type { CSSProperties } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { readDemoData } from "@/lib/demo-data";

type Business = { id:string; name:string; slug:string; loyalty_goal:number; loyalty_reward:string; primary_color?:string; accent_color?:string };
type Product = { id:string; name:string; description:string|null; price:number; is_available:boolean; category:string|null };

export default function PublicMenu() {
  const params = useParams<{slug:string}>();
  const [business,setBusiness] = useState<Business|null>(null);
  const [products,setProducts] = useState<Product[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  useEffect(() => {
    let alive = true;
    if (!isSupabaseConfigured()) {
      const demo = readDemoData();
      const demoBusiness = demo.businesses.find((item) => params.slug === item.slug);
      if (demoBusiness) {
        // Refresh route data from the browser's local DEMO store after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBusiness(demoBusiness);
        setProducts(demo.products.filter((product) =>
          product.business_id === demoBusiness.id && product.is_available
        ));
      } else {
        setBusiness(null);
        setError("Esta ruta solo muestra el negocio ficticio de la demo mientras Supabase no esté conectado.");
      }
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    async function load() {
      try {
        const supabase = getSupabase();
        const {data:b, error:be} = await supabase.from("businesses").select("id,name,slug,loyalty_goal,loyalty_reward").eq("slug",params.slug).single();
        if (be) throw be;
        const {data:p,error:pe} = await supabase.from("products").select("id,name,description,price,is_available,category").eq("business_id",b.id).eq("is_available",true).order("created_at");
        if (pe) throw pe;
        if (alive) { setBusiness(b); setProducts(p ?? []); }
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "No se pudo cargar el menú."); }
      finally { if (alive) setLoading(false); }
    }
    if (params.slug) load();
    return () => { alive=false; };
  },[params.slug]);
  if (loading) return <main><p>Cargando menú…</p></main>;
  if (error || !business) return <main><section className="card"><h1>Menú no disponible</h1><p className="error">{error || "No encontramos este negocio."}</p><Link href="/">Volver</Link></section></main>;
  const theme = {
    "--green": business.primary_color || "#FF6B5B",
    "--green2": business.accent_color || "#FFF0E9",
  } as CSSProperties;
  return <main>
    <header style={theme}><Link className="brand" href="/" aria-label="Fi.Lead inicio"><Image src="/fi-lead-logo.png" alt="Fi.Lead" width={140} height={54} priority /></Link><span className="pill">{isSupabaseConfigured() ? "Menú digital" : "MODO DEMO · datos ficticios"}</span></header>
    <section className="card" style={theme}>
      {!isSupabaseConfigured() && <div className="notice"><strong>DEMO — Negocio y productos ficticios.</strong><p className="small">Los datos se guardan solo en este navegador y no se conectan con una base de datos.</p></div>}
      <span className="eyebrow">Menú digital</span><h1>{business.name}</h1>
      <p className="muted">Consulta nuestros productos disponibles.</p><hr/>
      <h2>Productos</h2>
      {products.length===0 ? <p className="muted">Este negocio todavía no ha publicado productos.</p> : products.map(p=><div className="product" key={p.id}><div><b>{p.name}</b>{p.description && <div className="muted small">{p.description}</div>}</div><span className="price">${Number(p.price).toFixed(2)}</span></div>)}
      <hr/><h2>Recompensas</h2><p className="muted">Pregunta al personal cómo participar en el programa: {business.loyalty_goal} sellos para obtener {business.loyalty_reward || "una recompensa"}.</p>
    </section>
    <footer>Menú publicado con Fi.Lead.</footer>
  </main>;
}
