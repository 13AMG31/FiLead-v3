import { isSupabaseConfigured } from "@/lib/supabase";
import ConnectedCustomerCard from "./ConnectedCustomerCard";
import DemoCustomerCard from "./DemoCustomerCard";

export default async function CustomerCardPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  // Con Supabase conectado, el parámetro es el código secreto del cliente; sin Supabase, la demo local.
  if (isSupabaseConfigured()) return <ConnectedCustomerCard token={customerId} />;
  return <DemoCustomerCard customerId={customerId} />;
}
