import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUserProfile } from '@/lib/db/profiles'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// Lock para prevenir múltiplas chamadas simultâneas de refreshProfile
let refreshProfileInProgress = false

interface AuthState {
  user: (SupabaseUser & { profile?: Profile }) | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: async () => {
        const currentState = get()
        if (currentState.isLoading && currentState.user) {
          // Já está inicializando ou já inicializado
          return
        }

        set({ isLoading: true })
        try {
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
            return
          }

          // Get profile (com proteção contra loops já implementada)
          const profile = await getCurrentUserProfile()
          
          set({
            user: session.user,
            profile: profile,
            isAuthenticated: true,
            isLoading: false,
          })

          // Listen to auth changes (apenas uma vez - o listener persiste)
          let listenerInitialized = false
          if (!listenerInitialized) {
            listenerInitialized = true
            supabase.auth.onAuthStateChange(async (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                const profile = await getCurrentUserProfile()
                set({
                  user: session.user,
                  profile: profile,
                  isAuthenticated: true,
                })
              } else if (event === 'SIGNED_OUT') {
                set({
                  user: null,
                  profile: null,
                  isAuthenticated: false,
                })
              }
            })
          }
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          if (data.user && data.session) {
            // Aguardar um pouco para garantir que o perfil está disponível
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Primeiro, garantir que o perfil existe
            try {
              const ensureResponse = await fetch('/api/profile/ensure', {
                method: 'POST',
                credentials: 'include',
              })
              
              if (ensureResponse.ok) {
                const ensureData = await ensureResponse.json()
                console.log('Profile ensured:', ensureData)
              }
            } catch (ensureError) {
              console.error('Error ensuring profile:', ensureError)
            }
            
            // Aguardar mais um pouco após garantir
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Get profile - tentar múltiplas vezes se necessário
            let profile = await getCurrentUserProfile()
            
            // Se não encontrou, tentar novamente
            if (!profile) {
              await new Promise(resolve => setTimeout(resolve, 500))
              profile = await getCurrentUserProfile()
            }
            
            console.log('Profile loaded after login:', profile)
            
            set({
              user: data.user,
              profile: profile,
              isAuthenticated: true,
              isLoading: false,
            })
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true })
        try {
          // 1. Criar usuário no Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
            },
          })

          if (error) throw error

          if (!data.user) {
            throw new Error('Signup não retornou usuário')
          }

          // 2. Criar perfil e créditos manualmente (não depende mais dos triggers)
          const displayName = name || data.user.user_metadata?.name || email.split('@')[0] || 'User'
          const role: 'admin' | 'user' = email === 'emenmurromua@gmail.com' ? 'admin' : 'user'

          // Criar perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              name: displayName,
              email: email,
              role: role,
            })

          // IMPORTANTE: Se houver erro ao criar perfil, não quebrar o signup
          // O usuário já foi criado no auth, então o signup foi bem-sucedido
          if (profileError) {
            console.error('⚠️ Erro ao criar perfil (signup continuou):', profileError.message)
            // Tentar criar via API como fallback
            try {
              await fetch('/api/profile/ensure', {
                method: 'POST',
                credentials: 'include',
              })
            } catch (apiError) {
              console.error('⚠️ Erro ao criar perfil via API:', apiError)
            }
          }

          // Criar registro de créditos (se não existir)
          try {
            const { error: creditsError } = await supabase
              .from('user_credits')
              .insert({
                user_id: data.user.id,
                balance: 0,
                total_loaded: 0,
                total_consumed: 0,
              })
              .select()
              .single()

            if (creditsError && creditsError.code !== '23505') { // Ignorar erro de duplicata
              console.warn('⚠️ Erro ao criar créditos (não crítico):', creditsError.message)
            }
          } catch (creditsErr) {
            console.warn('⚠️ Erro ao criar créditos (não crítico):', creditsErr)
          }

          // 3. Buscar perfil criado
          await new Promise(resolve => setTimeout(resolve, 500))
          const profile = await getCurrentUserProfile()
          
          set({
            user: data.user,
            profile: profile,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
          })
        } catch (error) {
          console.error('Error logging out:', error)
        }
      },

      refreshProfile: async () => {
        // Prevenir múltiplas chamadas simultâneas
        if (refreshProfileInProgress) {
          console.log('⚠️ [AuthStore] Refresh já em progresso, ignorando...')
          return
        }

        const currentState = get()
        if (currentState.profile && !currentState.isLoading) {
          // Já tem perfil e não está carregando, não precisa recarregar
          console.log('✅ [AuthStore] Perfil já carregado, ignorando refresh')
          return
        }

        refreshProfileInProgress = true
        console.log('🔄 [AuthStore] Iniciando refresh do perfil...')
        
        try {
          // Limpar perfil atual primeiro
          set({ profile: null })
          
          // Aguardar um pouco para garantir que o estado foi limpo
          await new Promise(resolve => setTimeout(resolve, 100))
        
          // Primeiro, garantir que o perfil existe
          try {
            // Get session token
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
              console.log('⚠️ [AuthStore] Sem sessão, não é possível carregar perfil')
              return
            }
            
            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            }
            
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`
            }
            
            console.log('📡 [AuthStore] Chamando API /api/profile/ensure...')
            const response = await fetch('/api/profile/ensure', {
              method: 'POST',
              credentials: 'include',
              cache: 'no-store',
              headers,
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log('✅ [AuthStore] Profile ensured:', data)
              
              // Se a API retornou o perfil, usar ele
              if (data.profile) {
                console.log('✅ [AuthStore] Perfil recebido da API:', data.profile)
                set({ profile: data.profile })
                return
              }
            } else {
              console.error('❌ [AuthStore] Erro ao garantir perfil:', response.status, response.statusText)
            }
          } catch (error) {
            console.error('❌ [AuthStore] Erro ao garantir perfil:', error)
          }
          
          // Depois, carregar o perfil diretamente (forçar para ignorar cooldown)
          console.log('🔍 [AuthStore] Carregando perfil diretamente (forçado)...')
          const profile = await getCurrentUserProfile(true) // Forçar carregamento
          console.log('📊 [AuthStore] Profile refreshed:', profile)
          
          if (profile) {
            console.log('✅ [AuthStore] Perfil carregado com sucesso:', {
              id: profile.id,
              name: profile.name,
              role: profile.role
            })
            set({ profile })
          } else {
            // Se ainda não carregou, tentar mais uma vez após delay
            console.log('⚠️ [AuthStore] Perfil não carregado, tentando novamente...')
            await new Promise(resolve => setTimeout(resolve, 500))
            const retryProfile = await getCurrentUserProfile(true) // Forçar novamente
            console.log('📊 [AuthStore] Profile retry:', retryProfile)
            if (retryProfile) {
              console.log('✅ [AuthStore] Perfil carregado na segunda tentativa')
              set({ profile: retryProfile })
            } else {
              console.error('❌ [AuthStore] Falha ao carregar perfil após múltiplas tentativas')
            }
          }
        } finally {
          refreshProfileInProgress = false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist minimal data, session is handled by Supabase
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
