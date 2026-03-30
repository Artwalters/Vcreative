import type { Metadata } from "next"
import "./globals.css"
import LenisScroll from "@/app/components/LenisScroll"
import Header from "@/app/components/Header"
import Footer from "@/app/components/Footer"

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
      <body>
          <LenisScroll />
          <Header />
          {children}
          <Footer />
        </body>
    </html>
  )
}

export default RootLayout
