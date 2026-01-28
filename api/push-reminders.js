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
function buildPayload(kind){
  const k = String(kind || '').toLowerCase();
  if (k === 'morning') {
    return JSON.stringify({
      title: "It's Morning 🌤️",
      body: 'Remember to record today’s entries to keep accurate records.',
      url: '/?tab=sales'
    });
  }
  if (k === 'evening') {
    return JSON.stringify({
      title: "It's Evening 🌥️",
      body: 'Before closing, record expenses and sales for accurate reports.',
      url: '/?tab=expenses'
    });
  }
  if (k === 'backup') {
    return JSON.stringify({
      title: 'Backup Reminder',
      body: 'Back-up your data using the 💾 button(very important!).',
      url: '/?tab=dashboard'
    });
  }
  if (k === 'no-entry') {
    return JSON.stringify({
      title: 'Reminder',
      body: 'You havent made any record yet, Record keeping brings accuracy 📐.',
      url: '/?tab=dashboard'
    });
  }
  if (k === 'monthly-report') {
    return JSON.stringify({
      title: 'Monthly Review',
      body: 'Export your General report for review and analysis.',
      url: '/?tab=dashboard'
    });
  }
  if (k === 'inventory-50') {
    return JSON.stringify({
      title: 'Inventory Planning',
      body: 'Planning to add stock? use the Inventory  📦',
      url: '/?tab=inventory'
    });
  }
  return JSON.stringify({
    title: 'Reminder',
    body: 'Keep your records updated for accurate reports.',
    url: '/?tab=dashboard'
  });
}
export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-webhook-secret');
    if (req.method === 'OPTIONS') return res.status(204).end();
  } catch {}
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const secret = req.headers['x-webhook-secret'] || (req.query && (req.query.secret || req.query.token)) || (req.body && (req.body.secret || req.body.token));
  const isCron = !!(req.headers['x-vercel-cron'] || req.headers['x-vercel-id']);
  if (!isCron && secret !== process.env.WEBHOOK_SECRET) return res.status(401).send('Unauthorized');
  const kind = (req.query && req.query.kind) || (req.body && req.body.kind) || 'morning';
  try {
    const { data: prefs, error: prefErr } = await supabase
      .from('push_preferences')
      .select('user_id,morning,evening,backup,destructive');
    let allowedIds = null;
    if (!prefErr && prefs && prefs.length > 0) {
      const k = String(kind || 'morning').toLowerCase();
      allowedIds = prefs.filter(p => {
        if (k === 'morning') return p.morning === true;
        if (k === 'evening') return p.evening === true;
        if (k === 'backup') return p.backup === true;
        if (k === 'no-entry') return p.morning === true;
        return true;
      }).map(p => p.user_id);
    }
    let subsQuery = supabase.from('push_subscriptions').select('*');
    if (Array.isArray(allowedIds) && allowedIds.length > 0) {
      subsQuery = subsQuery.in('user_id', allowedIds);
    }
    const { data: subs, error } = await subsQuery;
    if (error) return res.status(500).json({ error: error.message });
    if (!subs || subs.length === 0) return res.status(200).json({ message: 'No subscribers' });

    let targetSubs = subs;
    if (String(kind || '').toLowerCase() === 'no-entry') {
      function eatStartUTC() {
        const now = new Date();
        const eatNow = new Date(now.getTime() + 3 * 3600 * 1000);
        const Y = eatNow.getUTCFullYear(), M = eatNow.getUTCMonth(), D = eatNow.getUTCDate();
        return new Date(Date.UTC(Y, M, D, -3, 0, 0));
      }
      const startUTC = eatStartUTC();
      const endUTC = new Date(startUTC.getTime() + 24 * 3600 * 1000);
      const ids = subs.map(s => s.user_id);
      const { data: act } = await supabase.from('user_activity').select('user_id,last_open_at').in('user_id', ids);
      const openedToday = new Set();
      if (Array.isArray(act)) {
        for (const a of act) {
          if (a && a.last_open_at && new Date(a.last_open_at).getTime() >= startUTC.getTime()) {
            openedToday.add(a.user_id);
          }
        }
      }
      const entryToday = new Set();
      async function collectEntries(table, userField, dateField) {
        try {
          const { data } = await supabase
            .from(table)
            .select(`${userField},${dateField}`)
            .in(userField, ids)
            .gte(dateField, startUTC.toISOString())
            .lt(dateField, endUTC.toISOString());
          if (Array.isArray(data)) {
            for (const row of data) {
              if (row && row[userField]) entryToday.add(row[userField]);
            }
          }
        } catch {}
      }
      await Promise.all([
        collectEntries('sales', 'user_id', 'created_at'),
        collectEntries('expenses', 'user_id', 'created_at'),
        collectEntries('income', 'user_id', 'created_at'),
      ]);
      targetSubs = subs.filter(s => !openedToday.has(s.user_id) && !entryToday.has(s.user_id));
    }
    if (String(kind || '').toLowerCase() === 'inventory-50') {
      const now = new Date();
      const thresholdMs = 50 * 24 * 3600 * 1000;
      const ids = subs.map(s => s.user_id);
      const { data: act2 } = await supabase
        .from('user_activity')
        .select('user_id,last_inventory_prompt_at')
        .in('user_id', ids);
      const due = new Set();
      const present = new Set();
      if (Array.isArray(act2)) {
        for (const a of act2) {
          present.add(a.user_id);
          const last = a && a.last_inventory_prompt_at ? new Date(a.last_inventory_prompt_at).getTime() : 0;
          if (!last || (now.getTime() - last) >= thresholdMs) {
            due.add(a.user_id);
          }
        }
      }
      for (const id of ids) {
        if (!present.has(id)) due.add(id);
      }
      targetSubs = subs.filter(s => due.has(s.user_id));
      // Mark sent time (best-effort)
      try {
        const rows = targetSubs.map(s => ({ user_id: s.user_id, last_inventory_prompt_at: now.toISOString() }));
        if (rows.length > 0) {
          await supabase.from('user_activity').upsert(rows, { onConflict: 'user_id' });
        }
      } catch {}
    }

    const payload = buildPayload(kind);
    const sends = targetSubs.map(sub => {
      const cfg = { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } };
      return webpush.sendNotification(cfg, payload).catch(err => {
        if (err && err.statusCode === 410) {
          supabase.from('push_subscriptions').delete().eq('id', sub.id).then(()=>{});
        }
      });
    });
    await Promise.all(sends);
    return res.status(200).json({ success: true, devices: (targetSubs || []).length, kind });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
