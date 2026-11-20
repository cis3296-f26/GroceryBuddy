import { supabase } from './supabase'
import { createApiClient } from './api-client'

export const api = createApiClient({ getSession: () => supabase.auth.getSession() })
