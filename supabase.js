const SUPABASE_URL = 'https://uvbgtpzimszpoerbchvl.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OvYDRejGB95XmQvAJoEADw_28-TsFGs';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);