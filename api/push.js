import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  if (req.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  const { type, table } = req.body || {};
  const record = (req.body && (req.body.record || req.body.old_record || req.body.old)) || {};
  const userId = record && record.user_id;
  if (!userId) return res.status(200).json({ message: 'No user' });
  try {
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);
    if (error || !subs || subs.length === 0) {
      return res.status(200).json({ message: 'No devices found' });
    }
    let payload;
    if (String(type || '').toUpperCase() === 'DELETE') {
      try {
        const { data: pref, error: prefErr } = await supabase
          .from('push_preferences')
          .select('destructive')
          .eq('user_id', userId)
          .single();
        if (!prefErr && pref && pref.destructive === false) {
          return res.status(200).json({ success: true, devices: 0, skipped: 'destructive disabled' });
        }
      } catch {}
      const entity = String(table || '').toLowerCase();
      const desc =
        entity === 'sales' ? (record.product_name || record.productName || 'Sale') :
        entity === 'expenses' ? (record.description || 'Expense') :
        entity === 'income' ? (record.source || 'Income') :
        entity === 'products' ? (record.name || 'Product') :
        (entity || 'Item');
      payload = JSON.stringify({
        title: 'Item Deleted',
        body: `Deleted: ${desc} — Please review if unintended.`,
        url: '/?tab=' + (entity || 'dashboard')
      });
    } else {
      payload = JSON.stringify({
        title: 'New Sale Recorded!',
        body: `Item: ${record.product_name || record.productName || 'Product'} \nAmount: ${record.total_price || record.totalPrice || 0}`,
        url: '/?tab=sales'
      });
    }
    const sends = subs.map(sub => {
      const cfg = { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } };
      return webpush.sendNotification(cfg, payload).catch(err => {
        if (err && err.statusCode === 410) {
          supabase.from('push_subscriptions').delete().eq('id', sub.id).then(()=>{});
        }
      });
    });
    await Promise.all(sends);
    return res.status(200).json({ success: true, devices: subs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
