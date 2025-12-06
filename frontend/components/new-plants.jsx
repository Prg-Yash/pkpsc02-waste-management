import { ArrowRight, Wifi, Cpu, Truck } from "lucide-react"
import Image from "next/image"

const services = [
  {
    name: "Smart Collection",
    description: "IoT-enabled bins with fill-level sensors",
    impact: "40% cost reduction",
    image: "/smart-waste-bin-iot-sensor-urban-city-street.jpg",
    featured: false,
    icon: Wifi,
  },
  {
    name: "AI Segregation",
    description: "Computer vision-powered waste sorting",
    impact: "95% accuracy",
    image: "/ai-robotic-waste-sorting-conveyor-belt-recycling.jpg",
    featured: false,
    icon: Cpu,
  },
  {
    name: "Route Optimization",
    description: "Real-time fleet management & routing",
    impact: "30% fuel savings",
    image: "/garbage-truck-fleet-smart-city-waste-collection.jpg",
    featured: true,
    icon: Truck,
  },
]

export function NewPlants() {
  return (
    <section className="bg-[#f5f3ef] px-4 py-20">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-8 mb-12 px-2">
          <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">Our Technology</h2>
          <p className="text-[#1a3a2f]/70 text-sm max-w-md leading-relaxed">
            Tackling improper waste disposal in urban areas with cutting-edge technology. Our integrated platform
            optimizes collection, automates segregation, and maximizes recycling efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {services.map((service) => (
            <div key={service.name} className="group">
              <div className="relative rounded-[28px] overflow-hidden bg-[#e8e6e2] aspect-square mb-4">
                <Image
                  src={service.image || "/placeholder.svg"}
                  alt={service.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
                    service.featured
                      ? "bg-[#1a3a2f] shadow-lg"
                      : "bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
                  }`}
                >
                  <service.icon className={`w-5 h-5 ${service.featured ? "text-[#c5e063]" : "text-[#1a3a2f]"}`} />
                </button>
              </div>
              <div className="flex items-end justify-between px-1">
                <div>
                  <h3 className="text-[#1a3a2f] text-lg font-medium">{service.name}</h3>
                  <p className="text-[#1a3a2f]/50 text-sm mt-1">{service.description}</p>
                  <p className="text-[#1a3a2f] font-bold mt-2">{service.impact}</p>
                </div>
                <button className="w-12 h-12 bg-[#1a3a2f] rounded-full flex items-center justify-center hover:bg-[#2a4a3f] transition-all hover:scale-105 shadow-lg">
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-12">
          <div className="w-2 h-2 rounded-full bg-[#1a3a2f]/30" />
          <div className="w-2 h-2 rounded-full bg-[#1a3a2f]/30" />
          <div className="w-8 h-2 rounded-full bg-[#1a3a2f]" />
        </div>

        <div className="flex flex-wrap items-center gap-8 mt-16 pt-16 border-t border-[#1a3a2f]/10 px-2">
          <p className="text-[#1a3a2f]/70 text-sm max-w-xs leading-relaxed">
            See how our integrated platform transforms urban waste management from collection to recycling.
          </p>
          <h3 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">How It Works</h3>
        </div>
      </div>
    </section>
  )
}   