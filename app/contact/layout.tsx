import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact opnemen met Vienna. Laat een bericht achter en je hoort binnen één werkdag terug.',
}

const ContactLayout = ({ children }: { children: React.ReactNode }) => children

export default ContactLayout
