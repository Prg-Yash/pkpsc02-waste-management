import { ArrowRight } from "lucide-react"
import Image from "next/image"

const categories = [
  {
    title: "Organic Waste",
    description:
      "Food scraps, garden waste, and biodegradables. Our AI identifies and separates organic matter for composting and biogas generation, reducing landfill methane emissions.",
    tag: "Composting",
    image: "/organic-waste-composting-food-scraps-green-bin.jpg",
  },
  {
    title: "Recyclables",
    description:
      "Plastics, metals, paper, and glass. Computer vision sorts materials by type and quality, maximizing recovery rates and ensuring clean recycling streams.",
    tag: "High Recovery",
    image: "/recyclable-materials-plastic-paper-metal-sorting.jpg",
  },
  {
    title: "Hazardous Waste",
    description:
      "E-waste, batteries, chemicals, and medical waste. Special handling protocols ensure safe collection, transport, and disposal with full regulatory compliance.",
    tag: "Safe Handling",
    image: "/hazardous-waste-disposal-e-waste-batteries-safe.jpg",
  },
]

export function PlantCategories() {
  return (
    <section className="bg-[#f5f3ef] px-4 pb-16">
      <div className="container mx-auto">
        <div className="mb-12 px-2">
          <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">Waste Streams</h2>
          <p className="text-[#1a3a2f]/70 text-sm max-w-lg mt-4 leading-relaxed">
            Our intelligent system handles all waste categories, ensuring proper segregation and maximizing resource
            recovery while minimizing environmental impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <div
              key={category.title}
              className="bg-[#1a3a2f] rounded-[32px] p-6 relative overflow-hidden min-h-[420px] flex flex-col justify-between group"
            >
              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.title}
                fill
                className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2f]/90 via-[#1a3a2f]/60 to-[#1a3a2f]/40" />

              <div className="relative z-10">
                <h3 className="text-white text-2xl font-serif italic">{category.title}</h3>
                <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-[280px]">{category.description}</p>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-[#c5e063]/80 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-[#1a3a2f]" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <span className="text-white/80 text-xs">{category.tag}</span>
                  </div>
                </div>
                {index === 0 && (
                  <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 text-[#1a3a2f]" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}