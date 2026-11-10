"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  createDemoBusiness,
  createInitialDemoData,
  getActiveDemoWorkspace,
  readDemoData,
  resetDemoData,
  saveDemoData,
  type DemoData,
  type DemoCustomer,
  type DemoProduct,
} from "@/lib/demo-data";

const initialWorkspace = getActiveDemoWorkspace(createInitialDemoData());

function makeDemoId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.();
  return `${prefix}-${randomId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`}`;
}

export default function DemoAdmin() {
  const [data, setData] = useState<DemoData>(createInitialDemoData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState(initialWorkspace.business.name);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [primaryColor, setPrimaryColor] = useState(initialWorkspace.business.primary_color);
  const [accentColor, setAccentColor] = useState(initialWorkspace.business.accent_color);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [purchaseAmounts, setPurchaseAmounts] = useState<Record<string, string>>({});
  const [reward, setReward] = useState(initialWorkspace.business.loyalty_reward);
  const [goal, setGoal] = useState(String(initialWorkspace.business.loyalty_goal));
  const [busyCustomerId, setBusyCustomerId] = useState("");

  useEffect(() => {
    const saved = readDemoData();
    const active = getActiveDemoWorkspace(saved);
    // Hydrate this client-only DEMO state from localStorage after server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(saved);
    setBusinessName(active.business.name);
    setPrimaryColor(active.business.primary_color);
    setAccentColor(active.business.accent_color);
    setReward(active.business.loyalty_reward);
    setGoal(String(active.business.loyalty_goal));
  }, []);

  const workspace = getActiveDemoWorkspace(data);
  const business = workspace.business;

  function persist(next: DemoData) {
    try {
      saveDemoData(next);
      setData(next);
      setError("");
      return true;
    } catch {
      setError("El navegador no permitió guardar la demo. Comprueba que el almacenamiento local esté habilitado.");
      setMessage("");
      return false;
    }
  }

  function showError(text: string) {
    setError(text);
    setMessage("");
  }

  function selectBusiness(businessId: string) {
    const current = readDemoData();
    if (!current.businesses.some((item) => item.id === businessId)) return;
    const next = { ...current, active_business_id: businessId };
    if (!persist(next)) return;
    const active = getActiveDemoWorkspace(next);
    setBusinessName(active.business.name);
    setPrimaryColor(active.business.primary_color);
    setAccentColor(active.business.accent_color);
    setReward(active.business.loyalty_reward);
    setGoal(String(active.business.loyalty_goal));
    setPurchaseAmounts({});
    setMessage(`Negocio DEMO activo: ${active.business.name}.`);
  }

  function addBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = readDemoData();
    const next = createDemoBusiness(current, newBusinessName);
    if (next === current) {
      showError("Escribe un nombre para el nuevo negocio de prueba.");
      return;
    }
    const active = getActiveDemoWorkspace(next);
    if (!persist(next)) return;
    setNewBusinessName("");
    setBusinessName(active.business.name);
    setPrimaryColor(active.business.primary_color);
    setAccentColor(active.business.accent_color);
    setReward(active.business.loyalty_reward);
    setGoal(String(active.business.loyalty_goal));
    setMessage(`Negocio de prueba creado: ${active.business.name}. Sus datos empiezan separados.`);
  }

  function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = customerName.trim();
    const phone = customerPhone.trim();
    if (!name || !phone) return;
    const current = readDemoData();
    const activeBusiness = getActiveDemoWorkspace(current).business;
    if (current.customers.some((customer) =>
      customer.business_id === activeBusiness.id &&
      customer.phone.toLowerCase() === phone.toLowerCase()
    )) {
      showError("Ya existe un cliente de prueba con ese teléfono.");
      return;
    }

    const customer: DemoCustomer = {
      id: makeDemoId("demo-customer"),
      business_id: activeBusiness.id,
      full_name: name,
      phone,
      stamps: 0,
      qr_token: makeDemoId("qr"),
    };
    if (!persist({ ...current, customers: [customer, ...current.customers] })) return;
    setCustomerName("");
    setCustomerPhone("");
    setMessage("Cliente ficticio registrado en este navegador.");
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = productName.trim();
    const price = Number(productPrice);
    if (!name || !Number.isFinite(price) || price < 0) {
      showError("Escribe un nombre y un precio válido.");
      return;
    }
    const current = readDemoData();
    const activeBusiness = getActiveDemoWorkspace(current).business;
    const product: DemoProduct = {
      id: makeDemoId("demo-product"),
      business_id: activeBusiness.id,
      name,
      description: productDescription.trim() || null,
      price,
      is_available: true,
      category: null,
    };
    if (!persist({ ...current, products: [product, ...current.products] })) return;
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setMessage("Producto ficticio añadido al menú de demostración.");
  }

  function toggleProduct(product: DemoProduct) {
    const current = readDemoData();
    if (!persist({
      ...current,
      products: current.products.map((item) =>
        item.id === product.id ? { ...item, is_available: !item.is_available } : item,
      ),
    })) return;
    setMessage(
      product.is_available
        ? "Producto marcado como agotado en la demo."
        : "Producto disponible de nuevo en la demo.",
    );
  }

  function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = businessName.trim();
    if (!name || !/^#[\da-f]{6}$/i.test(primaryColor) || !/^#[\da-f]{6}$/i.test(accentColor)) {
      showError("Escribe un nombre y selecciona colores válidos.");
      return;
    }
    const current = readDemoData();
    const activeBusiness = getActiveDemoWorkspace(current).business;
    if (!persist({
      ...current,
      businesses: current.businesses.map((item) => item.id === activeBusiness.id
        ? { ...item, name, primary_color: primaryColor, accent_color: accentColor }
        : item),
    })) return;
    setMessage("Nombre y colores actualizados solo para esta demo.");
  }

  function saveLoyalty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextGoal = Number(goal);
    const nextReward = reward.trim();
    if (!Number.isInteger(nextGoal) || nextGoal < 2 || nextGoal > 50 || !nextReward) {
      showError("El objetivo debe ser de 2 a 50 sellos e incluir una recompensa.");
      return;
    }
    const current = readDemoData();
    const activeBusiness = getActiveDemoWorkspace(current).business;
    const next: DemoData = {
      ...current,
      businesses: current.businesses.map((item) => item.id === activeBusiness.id
        ? { ...item, loyalty_goal: nextGoal, loyalty_reward: nextReward }
        : item),
      customers: current.customers.map((customer) => ({
        ...customer,
        stamps: customer.business_id === activeBusiness.id
          ? Math.min(customer.stamps, nextGoal)
          : customer.stamps,
      })),
    };
    if (!persist(next)) return;
    setMessage("Programa de fidelización actualizado solo para esta demo.");
  }

  function changeStamps(customerId: string, amount: number) {
    const current = readDemoData();
    const customer = current.customers.find((item) => item.id === customerId);
    const activeBusiness = getActiveDemoWorkspace(current).business;
    if (!customer || customer.business_id !== activeBusiness.id) {
      showError("No se encontró este cliente ficticio.");
      return;
    }
    if (amount > 0 && customer.stamps >= activeBusiness.loyalty_goal) {
      showError("Canjea la recompensa disponible antes de añadir más sellos.");
      return;
    }
    const next: DemoData = {
      ...current,
      customers: current.customers.map((item) => item.id === customerId
        ? { ...item, stamps: Math.max(0, Math.min(activeBusiness.loyalty_goal, item.stamps + amount)) }
        : item),
    };
    if (!persist(next)) return;
    setMessage(amount > 0 ? "Sello ficticio añadido manualmente." : "Sello ficticio retirado.");
  }

  function registerPurchase(event: FormEvent<HTMLFormElement>, customerId: string) {
    event.preventDefault();
    const amount = Number(purchaseAmounts[customerId]);
    if (!Number.isFinite(amount) || amount <= 0) {
      showError("Escribe un importe de compra ficticio mayor que cero.");
      return;
    }
    const current = readDemoData();
    const customer = current.customers.find((item) => item.id === customerId);
    const activeBusiness = getActiveDemoWorkspace(current).business;
    if (!customer || customer.business_id !== activeBusiness.id) {
      showError("No se encontró este cliente ficticio.");
      return;
    }
    if (customer.stamps >= activeBusiness.loyalty_goal) {
      showError("Esta tarjeta ya tiene una recompensa pendiente de canje.");
      return;
    }

    setBusyCustomerId(customerId);
    const purchase = {
      id: makeDemoId("demo-purchase"),
      business_id: activeBusiness.id,
      customer_id: customerId,
      amount,
      purchased_at: new Date().toISOString(),
    };
    const next: DemoData = {
      ...current,
      purchases: [purchase, ...current.purchases],
      customers: current.customers.map((item) => item.id === customerId
        ? { ...item, stamps: Math.min(activeBusiness.loyalty_goal, item.stamps + 1) }
        : item),
    };
    if (persist(next)) {
      setPurchaseAmounts((values) => ({ ...values, [customerId]: "" }));
      setMessage(`Compra ficticia de $${amount.toFixed(2)} registrada; se añadió un sello a ${customer.full_name}.`);
    }
    setBusyCustomerId("");
  }

  function redeemReward(customerId: string) {
    const current = readDemoData();
    const customer = current.customers.find((item) => item.id === customerId);
    const activeBusiness = getActiveDemoWorkspace(current).business;
    if (!customer || customer.business_id !== activeBusiness.id || customer.stamps < activeBusiness.loyalty_goal) {
      showError("No hay una recompensa disponible para canjear.");
      return;
    }
    const redemption = {
      id: makeDemoId("demo-redemption"),
      business_id: activeBusiness.id,
      customer_id: customerId,
      reward: activeBusiness.loyalty_reward,
      redeemed_at: new Date().toISOString(),
    };
    const next: DemoData = {
      ...current,
      redemptions: [redemption, ...current.redemptions],
      customers: current.customers.map((item) => item.id === customerId ? { ...item, stamps: 0 } : item),
    };
    if (!persist(next)) return;
    setMessage(`Canje de prueba registrado para ${customer.full_name}: ${redemption.reward}.`);
  }

  function resetDemo() {
    try {
      resetDemoData();
      const initial = createInitialDemoData();
      const active = getActiveDemoWorkspace(initial);
      setData(initial);
      setBusinessName(active.business.name);
      setPrimaryColor(active.business.primary_color);
      setAccentColor(active.business.accent_color);
      setReward(active.business.loyalty_reward);
      setGoal(String(active.business.loyalty_goal));
      setNewBusinessName("");
      setCustomerName("");
      setCustomerPhone("");
      setProductName("");
      setProductDescription("");
      setProductPrice("");
      setPurchaseAmounts({});
      setError("");
      setMessage("La demo volvió a sus datos ficticios iniciales.");
    } catch {
      showError("El navegador no permitió restablecer los datos locales de la demo.");
    }
  }

  const theme = {
    "--green": business.primary_color,
    "--green2": business.accent_color,
  } as CSSProperties;

  return (
    <main style={theme}>
      <header>
        <Link className="brand" href="/" aria-label="Fi.Lead inicio"><Image src="/fi-lead-logo.png" alt="Fi.Lead" width={140} height={54} priority /></Link>
        <button className="secondary" type="button" onClick={resetDemo} data-testid="button-reset-demo">
          Restablecer demo
        </button>
      </header>

      <section className="notice" role="status" data-testid="status-demo-mode">
        <strong>MODO DEMO ACTIVO — Datos ficticios</strong>
        <p className="small">
          No hay conexión con Supabase ni una cuenta real. Todo se guarda únicamente
          en este navegador, separado de datos conectados. No introduzcas datos personales reales.
        </p>
      </section>

      <span className="eyebrow">Administración de prueba</span>
      <h1>Panel de tu negocio</h1>
      <p className="muted">Prueba clientes, compras, sellos y recompensas con datos ficticios locales.</p>
      {message && <p className="success" role="status" data-testid="status-demo-message">{message}</p>}
      {error && <p className="error" role="alert" data-testid="status-demo-error">{error}</p>}

      <section className="card">
        <h2>Negocios ficticios aislados</h2>
        <label>Negocio de prueba activo
          <select
            value={data.active_business_id}
            onChange={(event) => selectBusiness(event.target.value)}
            data-testid="select-demo-business"
          >
            {data.businesses.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        <p className="muted small">Cada negocio conserva por separado su menú, clientes, compras, sellos y canjes.</p>
        <form onSubmit={addBusiness}>
          <label>Crear otro negocio DEMO
            <input
              value={newBusinessName}
              onChange={(event) => setNewBusinessName(event.target.value)}
              placeholder="Café de prueba B"
              required
              data-testid="input-demo-new-business"
            />
          </label>
          <button className="secondary" type="submit" data-testid="button-demo-create-business">Crear negocio ficticio</button>
        </form>
      </section>

      <section className="card">
        <div className="row">
          <div>
            <span className="pill">Negocio ficticio de prueba</span>
            <h2 style={{ marginTop: 10 }}>{business.name}</h2>
            <p className="muted small">Menú demo: <Link href={`/${business.slug}`}>/{business.slug}</Link></p>
          </div>
          <Link className="button secondary" href="/demo">Ver menú de ejemplo</Link>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Personalizar negocio de prueba</h2>
          <form onSubmit={saveBusiness}>
            <label>Nombre ficticio del negocio
              <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required data-testid="input-demo-business-name" />
            </label>
            <label>Color principal
              <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} data-testid="input-demo-primary-color" />
            </label>
            <label>Color de acento
              <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} data-testid="input-demo-accent-color" />
            </label>
            <div className="palette-presets">
              <span className="helper">Combinaciones rápidas</span>
              <div className="palette-list">
                {[
                  ["Fi.Lead", "#FF6B5B", "#FFF0E9"],
                  ["Café", "#8A5A44", "#F5E8DC"],
                  ["Bosque", "#34745B", "#E5F1E9"],
                  ["Lavanda", "#8065A8", "#F0EAF8"],
                  ["Azul", "#477A9E", "#E7F1F7"],
                  ["Mostaza", "#B7832F", "#FAF0D9"],
                  ["Rosa", "#C65D83", "#FBEAF0"],
                  ["Grafito", "#45434B", "#ECEBED"],
                ].map(([name, primary, accent]) => (
                  <button key={name} type="button" className="palette-choice" title={name} aria-label={`Usar paleta ${name}`} onClick={() => { setPrimaryColor(primary); setAccentColor(accent); }}>
                    <span style={{ background: primary }} /><span style={{ background: accent }} />
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" data-testid="button-demo-save-business">Guardar negocio demo</button>
          </form>
        </section>

        <section className="card">
          <h2>Programa de fidelización demo</h2>
          <form onSubmit={saveLoyalty}>
            <label>Sellos para la recompensa
              <input type="number" min="2" max="50" value={goal} onChange={(event) => setGoal(event.target.value)} required data-testid="input-demo-loyalty-goal" />
            </label>
            <label>Recompensa ficticia
              <input value={reward} onChange={(event) => setReward(event.target.value)} required data-testid="input-demo-reward" />
            </label>
            <button type="submit" data-testid="button-demo-save-loyalty">Guardar programa demo</button>
          </form>
        </section>
      </div>

      <section className="card">
        <h2>Agregar producto de prueba</h2>
        <form onSubmit={addProduct}>
          <label>Nombre
            <input value={productName} onChange={(event) => setProductName(event.target.value)} required data-testid="input-demo-product-name" />
          </label>
          <label>Descripción
            <input value={productDescription} onChange={(event) => setProductDescription(event.target.value)} data-testid="input-demo-product-description" />
          </label>
          <label>Precio
            <input type="number" min="0" step="0.01" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} required data-testid="input-demo-product-price" />
          </label>
          <button type="submit" data-testid="button-demo-add-product">Guardar producto demo</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Menú ficticio ({workspace.products.length})</h2>
        {workspace.products.length === 0 ? (
          <p className="muted">Todavía no hay productos en esta demo.</p>
        ) : workspace.products.map((product) => (
          <div className="product" key={product.id} data-testid={`row-demo-product-${product.id}`}>
            <div>
              <b>{product.name}</b>
              <div className="muted small">${Number(product.price).toFixed(2)} · {product.is_available ? "Disponible en demo" : "Agotado en demo"}</div>
              {product.description && <div className="muted small">{product.description}</div>}
            </div>
            <button className="secondary" type="button" onClick={() => toggleProduct(product)} data-testid={`button-demo-toggle-${product.id}`}>
              {product.is_available ? "Marcar agotado" : "Volver a publicar"}
            </button>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Registrar cliente de prueba</h2>
        <p className="muted small">Usa nombres y teléfonos inventados. Estos registros se quedan en este navegador.</p>
        <form onSubmit={addCustomer}>
          <label>Nombre de prueba
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Cliente de prueba 03" required data-testid="input-demo-customer-name" />
          </label>
          <label>Teléfono ficticio
            <input type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="555-0103" required data-testid="input-demo-customer-phone" />
          </label>
          <button type="submit" data-testid="button-demo-add-customer">Registrar cliente demo</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Clientes ficticios y recompensas ({workspace.customers.length})</h2>
        {workspace.customers.length === 0 ? (
          <p className="muted">Aún no hay clientes de prueba.</p>
        ) : workspace.customers.map((customer) => {
          const rewardReady = customer.stamps >= business.loyalty_goal;
          const purchases = workspace.purchases.filter((purchase) => purchase.customer_id === customer.id);
          const redemptions = workspace.redemptions.filter((redemption) => redemption.customer_id === customer.id);
          return (
            <div className="product" key={customer.id} data-testid={`row-demo-customer-${customer.id}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{customer.full_name}</b> <span className="pill">Prueba</span>
                <div className="muted small">{customer.phone} · {customer.stamps}/{business.loyalty_goal} sellos</div>
                <div className="stamps" aria-label={`${customer.stamps} de ${business.loyalty_goal} sellos de prueba`}>
                  {Array.from({ length: business.loyalty_goal }, (_, index) => (
                    <span className={`stamp ${index < customer.stamps ? "filled" : ""}`} key={index}>
                      {index < customer.stamps ? "✓" : "·"}
                    </span>
                  ))}
                </div>
                {rewardReady && <p className="success small" data-testid={`status-demo-reward-ready-${customer.id}`}>Recompensa lista: {business.loyalty_reward}</p>}

                <form className="purchase-form" onSubmit={(event) => registerPurchase(event, customer.id)}>
                  <label>Importe de compra ficticio
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={purchaseAmounts[customer.id] ?? ""}
                      onChange={(event) => setPurchaseAmounts((values) => ({ ...values, [customer.id]: event.target.value }))}
                      required
                      data-testid={`input-demo-purchase-${customer.id}`}
                    />
                  </label>
                  <button type="submit" disabled={rewardReady || busyCustomerId === customer.id} data-testid={`button-demo-purchase-${customer.id}`}>
                    Registrar compra y añadir sello
                  </button>
                </form>

                <details className="purchase-history">
                  <summary>Historial de prueba: {purchases.length} compras · {redemptions.length} canjes</summary>
                  {purchases.length > 0 && <ul>{purchases.map((purchase) => (
                    <li key={purchase.id}>Compra ficticia de ${purchase.amount.toFixed(2)} · {new Date(purchase.purchased_at).toLocaleString()}</li>
                  ))}</ul>}
                  {redemptions.length > 0 && <ul>{redemptions.map((redemption) => (
                    <li key={redemption.id}>Canje: {redemption.reward} · {new Date(redemption.redeemed_at).toLocaleString()}</li>
                  ))}</ul>}
                </details>
              </div>

              <div className="row customer-actions">
                <button className="secondary" type="button" onClick={() => changeStamps(customer.id, -1)} disabled={customer.stamps === 0} data-testid={`button-demo-minus-${customer.id}`}>
                  − sello
                </button>
                <button type="button" onClick={() => changeStamps(customer.id, 1)} disabled={rewardReady} data-testid={`button-demo-add-stamp-${customer.id}`}>
                  Añadir sello manual
                </button>
                {rewardReady && (
                  <button className="danger" type="button" onClick={() => redeemReward(customer.id)} data-testid={`button-demo-redeem-${customer.id}`}>
                    Canjear recompensa
                  </button>
                )}
                <Link className="button secondary" href={`/tarjeta/${encodeURIComponent(customer.id)}`} data-testid={`link-demo-card-${customer.id}`}>
                  Ver tarjeta y QR
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <footer>Fi.Lead · demo local con datos ficticios. No usar para registrar clientes reales.</footer>
    </main>
  );
}
