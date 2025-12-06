import { ArrowRight, Play } from "lucide-react"
import Image from "next/image"

export function IndoorCollection() {
  return (
    <section className="bg-[#f5f3ef] px-4 py-16">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] group">
              <Image
                src="/smart-bin-dashboard-monitoring-fill-level-iot.jpg"
                alt="Smart bin monitoring dashboard"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2f]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <h3 className="text-white text-3xl font-serif italic">Smart Monitoring</h3>
              </div>
              <button className="absolute top-5 right-5 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-[#1a3a2f]" />
              </button>
            </div>

            <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] group">
              <Image
                src="/automated-waste-segregation-facility-conveyor.jpg"
                alt="Automated waste segregation"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2f]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-white text-3xl font-serif italic">Automated Sorting</h3>
              </div>
              <button className="absolute top-5 right-5 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-[#1a3a2f]" />
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="bg-[#e8e5e0] rounded-[32px] p-8 md:p-10">
              <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f] leading-tight">
                Urban Waste Challenge
              </h2>
              <p className="text-[#1a3a2f]/70 text-sm mt-6 max-w-md leading-relaxed">
                Cities generate over 2 billion tonnes of waste annually. Improper disposal leads to environmental
                pollution, health hazards, and resource wastage. Our technology transforms this challenge into
                opportunity through intelligent automation.
              </p>
              <div className="flex gap-8 mt-8">
                <div>
                  <p className="text-3xl font-bold text-[#1a3a2f]">85%</p>
                  <p className="text-[#1a3a2f]/60 text-xs mt-1">Recycling rate achieved</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#1a3a2f]">50+</p>
                  <p className="text-[#1a3a2f]/60 text-xs mt-1">Cities deployed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#1a3a2f]">2M+</p>
                  <p className="text-[#1a3a2f]/60 text-xs mt-1">Tonnes diverted</p>
                </div>
              </div>
            </div>

            <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] group">
              <Image
                src="/recycling-facility-workers-sorting-waste-green.jpg"
                alt="Recycling facility operations"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#1a3a2f]/20" />
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 hover:bg-white/30 transition-all hover:scale-105">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}