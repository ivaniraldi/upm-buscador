import ClientLayout from "./ClientLayout"

export const metadata = {
  title: "Buscador de Estándares",
  description: "Busca y explora estándares técnicos con IA",
  manifest: "/manifest.json",
  themeColor: "#0d1117",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Estándares",
  },
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Estándares" />
      </head>
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}


import './globals.css'