// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wgnolespawumadgdqcgy.supabase.co'; // Pegue no seu painel do Supabase
const supabaseAnonKey = 'sb_publishable_0Hi5x4Ukagy5Luzp1aWN7Q_Oi16UR0t'; // Pegue no seu painel

export const supabase = createClient(supabaseUrl, supabaseAnonKey);