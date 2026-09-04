// ============================================================================
// FamilyPicks — webhook de Stripe (STUB)
//
// Estado: el modelo de datos (public.subscriptions) ya está listo. Esta función
// es el punto donde Stripe se conectará más adelante. NO está terminada.
//
// Cuando se integre Stripe:
//   1. Definir STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET como secrets:
//        supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...
//   2. Verificar la firma con stripe.webhooks.constructEventAsync(...)
//   3. En customer.subscription.created / updated / deleted:
//        - mapear el price -> 'premium' | 'vip'
//        - upsert en public.subscriptions con el service_role key
//        - el trigger subscriptions_sync_plan actualiza profiles.plan solo
//   4. Desplegar:  supabase functions deploy stripe-webhook --no-verify-jwt
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // salta la RLS: solo aquí
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // TODO(stripe): verificar firma con STRIPE_WEBHOOK_SECRET antes de confiar.
  // const sig = req.headers.get("stripe-signature");
  // const event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secret);

  return new Response(
    JSON.stringify({ ok: false, message: "stripe-webhook: pendiente de integrar" }),
    { status: 501, headers: { "content-type": "application/json" } },
  );

  // Ejemplo de lo que hará al recibir un evento de suscripción:
  //
  // await supabase.from("subscriptions").upsert({
  //   user_id: userId,
  //   plan: priceToPlan(subscription.items.data[0].price.id),
  //   status: subscription.status,
  //   current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  //   cancel_at_period_end: subscription.cancel_at_period_end,
  //   provider: "stripe",
  //   provider_customer_id: subscription.customer as string,
  //   provider_subscription_id: subscription.id,
  // }, { onConflict: "provider_subscription_id" });
});
