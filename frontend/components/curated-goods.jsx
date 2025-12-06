import { ArrowRight, MapPin, BarChart3, Leaf } from "lucide-react"
import { PlantCategories } from "./plant-categories"

export function CuratedGoods() {
  return (
    <>
      <PlantCategories />

      <section className="bg-[#f5f3ef] px-4 pb-16">
        <div className="container mx-auto">
          <div className="bg-[#1a3a2f] rounded-[32px] p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#c5e063] rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[#1a3a2f]" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Citywide Coverage</h3>
                  <p className="text-white/60 text-sm mt-2">
                    Deploy smart bins across neighborhoods, commercial zones, and public spaces with real-time
                    monitoring and alerts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#c5e063] rounded-full flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-[#1a3a2f]" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Data Analytics</h3>
                  <p className="text-white/60 text-sm mt-2">
                    Comprehensive dashboards showing waste patterns, collection efficiency, and environmental impact
                    metrics.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#c5e063] rounded-full flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-6 h-6 text-[#1a3a2f]" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Sustainability Goals</h3>
                  <p className="text-white/60 text-sm mt-2">
                    Track progress toward zero-waste targets with carbon offset calculations and compliance reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1a3a2f] px-6 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif italic text-white mb-6">Ready to transform your city?</h2>
          <p className="text-white/70 text-sm max-w-md mx-auto mb-8">
            Join 50+ cities already using EcoFlow to optimize waste management. Schedule a demo to see how we can reduce
            costs and increase recycling rates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="bg-[#c5e063] text-[#1a3a2f] px-8 py-4 rounded-full font-medium hover:bg-[#d5f073] transition-colors inline-flex items-center gap-2">
              Request Demo
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-colors">
              Download Case Study
            </button>
          </div>
        </div>
      </section>
    </>
  )
}