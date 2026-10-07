'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from './supabase'

export function createSupabaseBrowserClient() {
  const config = supabaseConfig()
  if (!config) return null
  return createBrowserClient(config.url, config.publishableKey)
}
