import { Search } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 bg-[#f5f3ef]/90 backdrop-blur-sm rounded-full px-2 py-2">
        <div className="w-10 h-10 rounded-full bg-[#1a3a2f] flex items-center justify-center mr-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#c5e063]" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-colors"
        >
          Home
        </Link>
        <Link
          href="/solutions"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-colors"
        >
          Solutions
        </Link>
        <Link
          href="/about"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-colors"
        >
          About
        </Link>
        <button className="p-2 hover:bg-[#1a3a2f]/10 rounded-full transition-colors">
          <Search className="w-5 h-5 text-[#1a3a2f]" />
        </button>
        <Link
          href="/cities"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-colors"
        >
          Cities
        </Link>
        <Link
          href="/contact"
          className="px-4 py-2 text-sm font-medium text-white bg-[#1a3a2f] rounded-full hover:bg-[#2a4a3f] transition-colors"
        >
          Contact
        </Link>
      </nav>
    </header>
  )
}