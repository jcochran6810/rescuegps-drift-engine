// ===================================================================
// Supabase Client Configuration - DEVELOPMENT ENVIRONMENT
// ===================================================================
// This file initializes the Supabase client with your DEV project credentials
// Project: universal-hazard-dev
// ===================================================================

import { createClient } from "@supabase/supabase-js";

// DEV environment credentials
const supabaseUrl = "https://grcsrldrkryrfjsildej.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY3NybGRya3J5cmZqc2lsZGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjYxNjIsImV4cCI6MjA4MDQ0MjE2Mn0.VrvfuyNm-OYKchzxmN-LLj4Zrco0l_Vzm8nh32vijPs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("✅ Supabase client initialized (DEV):", supabaseUrl);
