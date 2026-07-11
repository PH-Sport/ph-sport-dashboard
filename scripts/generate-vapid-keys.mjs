// Genera un par de claves VAPID para las notificaciones web push (Fase B).
// Reejecutable, pero OJO: regenerar invalida todas las suscripciones existentes.
//
//   node scripts/generate-vapid-keys.mjs
//
// Requiere `web-push` (dep de la edge function). Si no está instalado localmente:
//   npx web-push generate-vapid-keys
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n=== Claves VAPID (guárdalas bien; la privada es un secreto) ===\n');
console.log('VAPID_PUBLIC_KEY  =', keys.publicKey);
console.log('VAPID_PRIVATE_KEY =', keys.privateKey);
console.log('\n--- Dónde pegarlas ---');
console.log('1) Vercel (Production + Preview):');
console.log('     NEXT_PUBLIC_VAPID_PUBLIC_KEY = <la pública>');
console.log('2) Supabase → Edge Functions → send-push-notification → Secrets:');
console.log('     VAPID_PUBLIC_KEY  = <la pública>');
console.log('     VAPID_PRIVATE_KEY = <la privada>');
console.log('     VAPID_SUBJECT     = mailto:soporte@phsport.app');
console.log('');
