import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycjyodvxbzpholsggujb.supabase.co';
const supabaseKey = 'sb_publishable_YQdnuEb4dN5w7DBIemyH1g_aRVZO-p2';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveToSupabase(ownerId: string, collection: string, data: any) {
  try {
    const { error } = await supabase
      .from('data_store')
      .upsert(
        {
          id: `${collection}_${ownerId}`,
          collection,
          owner_id: ownerId,
          data,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
    if (error) console.error(`Erro ao salvar ${collection}:`, error.message);
  } catch (e) {
    console.error(`Erro ao salvar ${collection}:`, e);
  }
}

export async function loadFromSupabase(ownerId: string, collection: string) {
  try {
    const { data, error } = await supabase
      .from('data_store')
      .select('data')
      .eq('id', `${collection}_${ownerId}`)
      .maybeSingle(); // usa maybeSingle em vez de single (nao da erro 406 quando vazio)
    if (error) {
      console.warn(`Sem dados para ${collection}/${ownerId}`);
      return null;
    }
    return data?.data ?? null;
  } catch (e) {
    return null;
  }
}

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export async function debouncedSave(ownerId: string, collection: string, data: any) {
  const key = `${collection}_${ownerId}`;
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(() => {
    saveToSupabase(ownerId, collection, data);
  }, 1500);
}

export async function saveUserProfile(profile: any) {
  try {
    const docId = profile.email.toLowerCase().replace(/[.@]/g, '_');
    const { error } = await supabase
      .from('data_store')
      .upsert(
        {
          id: `accounts_${docId}`,
          collection: 'accounts',
          owner_id: docId,
          data: profile,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
    if (error) console.error('Erro ao salvar perfil:', error.message);
  } catch (e) {
    console.error('Erro ao salvar perfil:', e);
  }
}

export async function loadAthletesByCoach(coachEmail: string) {
  try {
    const { data, error } = await supabase
      .from('data_store')
      .select('data')
      .eq('collection', 'accounts');
    if (error || !data) return [];
    return data
      .map((row: any) => row.data)
      .filter((account: any) =>
        account?.coachEmail?.toLowerCase() === coachEmail.toLowerCase()
      );
  } catch (e) {
    console.error('Erro ao buscar atletas:', e);
    return [];
  }
}

export async function loadAllAthletesData(athleteIds: string[], collection: string) {
  try {
    if (!athleteIds.length) return [];
    const ids = athleteIds.map(id => `${collection}_${id}`);
    const { data, error } = await supabase
      .from('data_store')
      .select('data')
      .in('id', ids);
    if (error || !data) return [];
    return data.flatMap((row: any) =>
      Array.isArray(row.data) ? row.data : []
    );
  } catch (e) {
    console.error(`Erro ao carregar ${collection} dos atletas:`, e);
    return [];
  }
}

export function subscribeToData(
  collection: string,
  ownerId: string,
  callback: (data: any) => void
) {
  const channel = supabase
    .channel(`${collection}_${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'data_store',
        filter: `id=eq.${collection}_${ownerId}`
      },
      (payload: any) => {
        if (payload.new?.data) callback(payload.new.data);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
