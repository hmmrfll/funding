import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '');
  
  // Получаем хосты из переменных окружения или используем дефолтные значения
  const allowedHosts = env.VITE_ALLOWED_HOSTS ? 
    env.VITE_ALLOWED_HOSTS.split(',') : 
    ['localhost', '*.trycloudflare.com', '*.ngrok.io'];
    
  // Добавляем текущий проблемный хост, если он не включен
  if (!allowedHosts.includes('unexpected-route-national-assumed.trycloudflare.com')) {
    allowedHosts.push('unexpected-route-national-assumed.trycloudflare.com');
  }
  
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      allowedHosts
    }
  }
})