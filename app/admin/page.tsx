"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import DemoAdmin from "./DemoAdmin";

type User = { id:string; email?:string };
type Business = { id:string; name:string; slug:string; loyalty_goal:number; loyalty_reward:string };
type Product = { id:string; name:string; description:string|null; price:number; is_available:boolean };
type Customer = { id:string; full_name:string; phone:string; stamps:number; qr_token:string };
type Member = { email:string; role:string };

function ConnectedAdmin() {
  const [user,setUser] = useState<User|null>(null);
  const [business,setBusiness] = useState<Business|null>(null);
  const [products,setProducts] = useState<Product[]>([]);
  const [customers,setCustomers] = useState<Customer[]>([]);
  const [members,setMembers] = useState<Member[]>([]);
  const [myRole,setMyRole] = useState("");
  const [memberEmail,setMemberEmail] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [businessName,setBusinessName] = useState("");
  const [slug,setSlug] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [productName,setProductName] = useState("");
  const [productDesc,setProductDesc] = useState("");
  const [productPrice,setProductPrice] = useState("");
  const [customerName,setCustomerName] = useState("");
  const [customerPhone,setCustomerPhone] = useState("");
  const [reward,setReward] = useState("Una bebida gratis");
  const [goal,setGoal] = useState("10");

  const supabase = getSupabase();

  async function loadData(uid:string) {
    const {data:membership,error:me} = await supabase.from("business_members").select("business_id,role").eq("user_id",uid).limit(1).maybeSingle();
    if (me) throw me;
    if (!membership) { setBusiness(null); return; }
    const {data:b,error:be} = await supabase.from("businesses").select("id,name,slug,loyalty_goal,loyalty_reward").eq("id",membership.business_id).single();
    if (be) throw be;
    const {data:p,error:pe} = await supabase.from("products").select("id,name,description,price,is_available").eq("business_id",b.id).order("created_at");
    if (pe) throw pe;
    const {data:c,error:ce} = await supabase.from("customers").select("id,full_name,phone,stamps,qr_token").eq("business_id",b.id).order("created_at",{ascending:false});
    if (ce) throw ce;
    setMyRole(membership.role);
    // El equipo es opcional: si aún no se ejecutó la actualización del esquema, no rompe el panel.
    const {data:team}=await supabase.rpc("list_business_members");
    setMembers((team as Member[]|null)??[]);
    setBusiness(b); setProducts(p??[]); setCustomers(c??[]); setReward(b.loyalty_reward); setGoal(String(b.loyalty_goal));
  }

  useEffect(() => {
    let alive=true;
    supabase.auth.getUser().then(async ({data})=>{
      if (!alive) return;
      setUser(data.user as User|null);
      if (data.user) { try { await loadData(data.user.id); } catch(e) { setError(e instanceof Error?e.message:"Error cargando datos."); } }
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setUser(session?.user as User|null);
      if (!session?.user) { setBusiness(null); setProducts([]); setCustomers([]); }
      else { loadData(session.user.id).catch(e=>setError(e instanceof Error?e.message:"Error cargando datos.")); }
    });
    return ()=>{alive=false;subscription.unsubscribe();};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function run(action:()=>Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch(e) { setError(e instanceof Error?e.message:"Ocurrió un error."); }
    finally { setBusy(false); }
  }
  async function signIn(e:FormEvent) {
    e.preventDefault();
    await run(async()=>{ const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error; setMessage("Sesión iniciada."); });
  }
  async function signUp(e:FormEvent) {
    e.preventDefault();
    await run(async()=>{ const {data,error}=await supabase.auth.signUp({email,password}); if(error) throw error; if(data.session) setUser(data.user as User); setMessage("Cuenta creada. Si Supabase solicita confirmar el correo, revisa tu bandeja antes de iniciar sesión."); });
  }
  async function createBusiness(e:FormEvent) {
    e.preventDefault();
    await run(async()=>{
      const {error}=await supabase.rpc("create_my_business",{p_name:businessName,p_slug:slug.toLowerCase().trim().replace(/[^a-z0-9-]/g,"-")});
      if(error) throw error;
      setMessage("Negocio creado correctamente.");
      if(user) await loadData(user.id);
    });
  }
  async function addProduct(e:FormEvent) {
    e.preventDefault(); if(!business) return;
    await run(async()=>{
      const {error}=await supabase.from("products").insert({business_id:business.id,name:productName,description:productDesc||null,price:Number(productPrice),is_available:true});
      if(error) throw error; setProductName("");setProductDesc("");setProductPrice(""); await loadData(user!.id);
    });
  }
  async function toggleProduct(p:Product) {
    await run(async()=>{const {error}=await supabase.from("products").update({is_available:!p.is_available}).eq("id",p.id);if(error)throw error;await loadData(user!.id);});
  }
  async function addCustomer(e:FormEvent) {
    e.preventDefault(); if(!business) return;
    await run(async()=>{const {error}=await supabase.from("customers").insert({business_id:business.id,full_name:customerName,phone:customerPhone,stamps:0});if(error)throw error;setCustomerName("");setCustomerPhone("");await loadData(user!.id);});
  }
  async function changeStamps(c:Customer,delta:number) {
    if(!business) return;
    await run(async()=>{
      const next=Math.max(0,Math.min(business.loyalty_goal,c.stamps+delta));
      const {error}=await supabase.from("customers").update({stamps:next}).eq("id",c.id);
      if(error)throw error; await loadData(user!.id);
    });
  }
  async function saveLoyalty() {
    if(!business) return;
    await run(async()=>{const {error}=await supabase.from("businesses").update({loyalty_goal:Number(goal),loyalty_reward:reward}).eq("id",business.id);if(error)throw error;await loadData(user!.id);setMessage("Programa actualizado.");});
  }
  async function addMember(e:FormEvent) {
    e.preventDefault();
    await run(async()=>{
      const {error}=await supabase.rpc("add_business_member",{p_email:memberEmail,p_role:"owner"});
      if(error) throw error;
      setMemberEmail(""); setMessage("Socio agregado al negocio.");
      await loadData(user!.id);
    });
  }
  async function signOut() { await run(async()=>{const {error}=await supabase.auth.signOut();if(error)throw error;}); }

  return <main>
    <header><Link className="brand" href="/" aria-label="Fi.Lead inicio"><Image src="/fi-lead-logo.png" alt="Fi.Lead" width={140} height={54} priority /></Link>{user && <button className="secondary" onClick={signOut}>Cerrar sesión</button>}</header>
    <span className="eyebrow">Tu espacio de trabajo</span><h1>Tu negocio, más cerca de tus clientes.</h1>
    <p className="muted">Administra tu menú y lleva el control de tus recompensas desde un solo lugar.</p>
    {message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
    {!user ? <div className="grid">
      <section className="card"><h2>Iniciar sesión</h2><form onSubmit={signIn}><label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Contraseña<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={busy}>Entrar</button></form></section>
      <section className="card"><h2>Crear cuenta de administrador</h2><p className="muted small">Crea una cuenta para administrar tu primer negocio.</p><form onSubmit={signUp}><label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Contraseña (mínimo 8 caracteres)<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required /></label><button className="secondary" disabled={busy}>Crear cuenta</button></form></section>
    </div> : !business ? <section className="card"><h2>Configura tu primer negocio</h2><form onSubmit={createBusiness}><label>Nombre del negocio<input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Ej. La Estación Café" required /></label><label>Identificador para el enlace<input value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))} placeholder="la-estacion-cafe" pattern="[a-z0-9-]+" required /><span className="muted small">Su menú quedará en: tudominio.com/{slug || "tu-negocio"}</span></label><button disabled={busy}>Crear negocio</button></form></section> : <>
      <section className="card"><div className="row"><div><span className="pill">Negocio activo</span><h2 style={{marginTop:10}}>{business.name}</h2><p className="muted small">Enlace público: <a href={`/${business.slug}`} target="_blank" rel="noreferrer">/{business.slug}</a></p></div><button className="secondary" onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/${business.slug}`)}>Copiar enlace del menú</button></div></section>
      <div className="grid">
        <section className="card"><h2>Agregar producto</h2><form onSubmit={addProduct}><label>Nombre<input value={productName} onChange={e=>setProductName(e.target.value)} required /></label><label>Descripción<input value={productDesc} onChange={e=>setProductDesc(e.target.value)} /></label><label>Precio<input type="number" min="0" step="0.01" value={productPrice} onChange={e=>setProductPrice(e.target.value)} required /></label><button disabled={busy}>Guardar producto</button></form></section>
        <section className="card"><h2>Programa de fidelización</h2><form onSubmit={e=>{e.preventDefault();saveLoyalty();}}><label>Sellos para recompensa<input type="number" min="2" max="50" value={goal} onChange={e=>setGoal(e.target.value)} required /></label><label>Recompensa<input value={reward} onChange={e=>setReward(e.target.value)} required /></label><button disabled={busy}>Guardar programa</button></form></section>
      </div>
      <section className="card"><h2>Menú ({products.length})</h2>{products.length===0?<p className="muted">Todavía no hay productos.</p>:products.map(p=><div className="product" key={p.id}><div><b>{p.name}</b><div className="muted small">${Number(p.price).toFixed(2)} · {p.is_available?"Disponible":"Agotado"}</div></div><button className="secondary" onClick={()=>toggleProduct(p)} disabled={busy}>{p.is_available?"Marcar agotado":"Volver a publicar"}</button></div>)}</section>
      <section className="card" style={{marginTop:16}}><h2>Registrar cliente</h2><p className="muted small">En esta versión, el personal registra al cliente y administra sus sellos desde este panel. Usa datos de prueba hasta definir el aviso de privacidad del negocio.</p><form onSubmit={addCustomer}><label>Nombre<input value={customerName} onChange={e=>setCustomerName(e.target.value)} required /></label><label>Teléfono<input type="tel" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} required /></label><button disabled={busy}>Registrar cliente</button></form></section>
      <section className="card" style={{marginTop:16}}><h2>Clientes y sellos ({customers.length})</h2>{customers.length===0?<p className="muted">Aún no hay clientes registrados.</p>:customers.map(c=><div className="product" key={c.id}><div style={{flex:1}}><b>{c.full_name}</b><div className="muted small">{c.phone} · {c.stamps}/{business.loyalty_goal} sellos</div><div className="stamps">{Array.from({length:business.loyalty_goal},(_,i)=><span className={`stamp ${i<c.stamps?"filled":""}`} key={i}>{i<c.stamps?"✓":"·"}</span>)}</div></div><div className="row"><a className="button secondary" href={`/tarjeta/${encodeURIComponent(c.qr_token)}`} target="_blank" rel="noreferrer">Ver tarjeta y QR</a><button className="secondary" onClick={()=>changeStamps(c,-1)} disabled={busy||c.stamps===0}>−</button><button onClick={()=>changeStamps(c,1)} disabled={busy||c.stamps>=business.loyalty_goal}>+ sello</button>{c.stamps>=business.loyalty_goal&&<button className="danger" onClick={()=>changeStamps(c,-business.loyalty_goal)} disabled={busy}>Canjear</button>}</div></div>)}</section>
      <section className="card" style={{marginTop:16}}><h2>Equipo ({members.length})</h2>{members.map(m=><div className="product" key={m.email}><div><b>{m.email}</b><div className="muted small">{m.role==="owner"?"Dueño":"Personal"}</div></div></div>)}{myRole==="owner"&&<><p className="muted small" style={{marginTop:12}}>Tu socio primero debe crear su cuenta en esta misma página (/admin). Después escribe aquí su correo para darle acceso a este negocio.</p><form onSubmit={addMember}><label>Correo de tu socio<input type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} required /></label><button disabled={busy}>Agregar socio</button></form></>}</section>
    </>}
    <footer>Fi.Lead · MVP cloud inicial. Configura políticas, privacidad y respaldo antes de operar comercialmente.</footer>
  </main>;
}

export default function Admin() {
  if (!isSupabaseConfigured()) {
    return <DemoAdmin />;
  }
  return <ConnectedAdmin />;
}
