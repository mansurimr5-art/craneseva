import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  console.log('VITE PROJECT ROOT:', process.cwd())
  console.log('SUPABASE URL FOUND:', Boolean(env.VITE_SUPABASE_URL))

  return {
    plugins: [react()],
  }
})