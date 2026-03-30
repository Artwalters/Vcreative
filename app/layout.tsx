import type { Metadata } from "next"
import "./globals.css"
import LenisScroll from "@/app/components/LenisScroll"

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
          {children}
        </body>
    </html>
  )
}

export default RootLayout
