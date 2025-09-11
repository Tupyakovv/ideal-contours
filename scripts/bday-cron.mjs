// scripts/bday-cron.mjs
import admin from 'firebase-admin';

const sa = JSON.parse(process.env.GCP_SA_KEY);
admin.initializeApp({
  credential: admin.credential.cert(sa),
});
const db = admin.firestore();
const messaging = admin.messaging();

function startOfDay(d){ const t=new Date(d); t.setHours(0,0,0,0); return t; }
function nextBirthdayDate(birthStr, baseDate){
  if(!birthStr) return null;
  const [y,m,d] = birthStr.split('-').map(Number);
  if(!y||!m||!d) return null;
  const base = startOfDay(baseDate);
  let bd = new Date(base.getFullYear(), (m||1)-1, d||1);
  bd.setHours(0,0,0,0);
  if (bd < base) bd.setFullYear(bd.getFullYear()+1);
  return bd;
}

async function run(){
  const today = startOfDay(new Date());
  const target = new Date(today); target.setDate(target.getDate()+3);

  const studios = await db.collection('studios').get();
  for (const s of studios.docs){
    const data = s.data() || {};
    const clients = data.clients || [];
    const upcoming = clients.filter(c=>{
      const bd = nextBirthdayDate(c.birth, today);
      return !!bd && bd.getTime() === target.getTime();
    });
    if (!upcoming.length) continue;

    // токены из подпапки studios/{id}/tokens/{token}
    const tSnap = await db.collection('studios').doc(s.id).collection('tokens').get();
    const tokens = tSnap.docs.map(d=>d.id);
    if (!tokens.length) continue;

    const names = upcoming.slice(0,3).map(c=>c.fio || 'Без имени').join(', ');
    const more  = upcoming.length>3 ? ` и ещё ${upcoming.length-3}` : '';
    const body  = `Через 3 дня: ${names}${more}.`;

    await messaging.sendEachForMulticast({
      tokens,
      notification: { title: '🎂 Скоро ДР клиента', body },
      data: { type: 'birthday' },
    });
    console.log(`Sent to studio ${s.id}: ${tokens.length} tokens, ${upcoming.length} birthdays`);
  }
}

run().then(()=>{ console.log('done'); process.exit(0); })
     .catch(e=>{ console.error(e); process.exit(1); });
