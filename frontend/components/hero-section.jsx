import { ArrowDown, Play } from "lucide-react"
import { Header } from "./header"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative bg-[#f5f3ef] pt-4 px-4">
      <div className="relative min-h-[90vh] overflow-hidden rounded-[40px]">
        <div className="absolute inset-0">
          <Image
            src="/smart-city-waste-management-urban-recycling-bins.jpg"
            alt="Smart urban waste management system"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a2f]/40 to-[#1a3a2f]/70" />
        </div>

        <Header />

        <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl">
            <p className="text-white/80 text-lg mb-4 font-serif italic">Smart Cities</p>
            <h1 className="text-[8rem] md:text-[12rem] font-serif text-white leading-[0.85] tracking-tight">
              Ec
              <span className="text-[#c5e063]">o</span>
              Flow
            </h1>
            <p className="text-white/70 text-base max-w-md mt-8 leading-relaxed">
              Revolutionizing urban waste management with IoT-powered smart bins, AI-driven segregation, and optimized
              collection routes. Making cities cleaner, greener, and more sustainable.
            </p>
          </div>

          <div className="absolute left-6 bottom-32">
            <div className="relative">
              <div className="bg-[#1a3a2f] rounded-[24px] p-5 flex items-center gap-4 max-w-xs relative">
                <div>
                  <p className="text-white text-xl font-bold">40% Less</p>
                  <p className="text-white/60 text-xs mt-1 max-w-[160px]">
                    Collection costs with AI-optimized routing and smart bin monitoring
                  </p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1a3a2f] bg-[#c5e063] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#1a3a2f]" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1a3a2f] bg-[#c5e063] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#1a3a2f]" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#1a3a2f] rounded-full" />
                <div className="absolute -top-4 -right-4 w-8 h-8 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-16 h-16 rounded-full bg-transparent shadow-[inset_-8px_-8px_0_#1a3a2f]"
                    style={{ filter: "none" }}
                  />
                </div>
              </div>
              <svg className="absolute -top-2 right-0 w-10 h-10" viewBox="0 0 40 40" fill="none">
                <path d="M40 0C40 22.0914 22.0914 40 0 40H40V0Z" fill="#1a3a2f" />
              </svg>
            </div>
          </div>

          <div className="absolute right-24 bottom-40">
            <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="absolute right-6 bottom-24">
            <button className="bg-[#f5f3ef] text-[#1a3a2f] px-6 py-3 rounded-full text-sm font-medium hover:bg-white transition-colors">
              Request a Demo
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 bg-[#f5f3ef] -mt-8 mx-4 rounded-t-[32px] pt-2">
        <div className="bg-[#f5f3ef] rounded-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-[#1a3a2f] text-xl font-bold">Smarter Cities</h3>
                  <p className="text-[#1a3a2f]/60 text-sm mt-1 max-w-[200px]">
                    Technology-driven solutions for urban waste challenges
                  </p>
                </div>
                <div className="relative">
                  <div className="w-20 h-20 rounded-[20px] overflow-hidden">
                    <Image
                      src="/iot-smart-bin-sensor-technology-waste.jpg"
                      alt="Smart bin technology"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#1a3a2f] rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 max-w-md">
                <p className="text-[#1a3a2f] text-sm leading-relaxed">
                  Our AI-powered system{" "}
                  <span className="inline-block w-10 h-10 rounded-full overflow-hidden align-middle mx-1">
                    <Image
                      src="/ai-waste-sorting-robot-recycling.jpg"
                      alt="AI sorting"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </span>{" "}
                  automates waste segregation, reducing contamination by 85% and increasing recycling rates.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button className="bg-[#1a3a2f] text-white px-5 py-2.5 rounded-full text-sm font-medium">
                Smart Bins
              </button>
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f]/5 transition-colors">
                Route Optimization
              </button>
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f]/5 transition-colors">
                AI Segregation
              </button>
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f]/5 transition-colors">
                Analytics
              </button>
              <div className="flex-1" />
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f]/5 transition-colors">
                See All
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}