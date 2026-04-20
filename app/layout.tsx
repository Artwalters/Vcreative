import type { Metadata } from "next"
import "./globals.css"
import LenisScroll from "@/app/components/LenisScroll"
import Header from "@/app/components/Header"

export const metadata: Metadata = {
  title: "Vienna",
  description: "",
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="nl">
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <link rel="stylesheet" href="https://use.typekit.net/uvq1lml.css" />
      </head>
      <body>
          <LenisScroll />
          <Header />
          {children}
        </body>
    </html>
  )
}

export default RootLayout
