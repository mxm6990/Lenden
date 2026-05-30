import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.lenden.invest',
  appName: 'LenDen',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#080a09',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
