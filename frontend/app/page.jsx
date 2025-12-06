"use client"

import { Search, ArrowDown, Play, ArrowRight, Wifi, Cpu, Truck, MapPin, BarChart3, Leaf, Database, Cloud, Upload, CheckCircle, Bell, Users, Shield, Code } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

// Scroll Animation Hook
function useScrollAnimation() {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// Header Component
function Header() {
  return (
    <header className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 bg-[#f5f3ef]/90 backdrop-blur-sm rounded-full px-2 py-2 animate-fade-down">
        <div className="w-10 h-10 rounded-full bg-[#1a3a2f] flex items-center justify-center mr-2 hover:scale-110 transition-transform duration-300">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#c5e063]" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-all duration-300 hover:scale-105"
        >
          Home
        </Link>
        <Link
          href="/features"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-all duration-300 hover:scale-105"
        >
          Features
        </Link>
        <Link
          href="/docs"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-all duration-300 hover:scale-105"
        >
          API Docs
        </Link>
        <button className="p-2 hover:bg-[#1a3a2f]/10 rounded-full transition-all duration-300 hover:rotate-12">
          <Search className="w-5 h-5 text-[#1a3a2f]" />
        </button>
        <Link
          href="/pricing"
          className="px-4 py-2 text-sm font-medium text-[#1a3a2f] hover:bg-[#1a3a2f]/10 rounded-full transition-all duration-300 hover:scale-105"
        >
          Pricing
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-white bg-[#1a3a2f] rounded-full hover:bg-[#2a4a3f] transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Get Started
        </Link>
      </nav>
    </header>
  )
}

// Hero Section - Updated layout with animations
function HeroSection() {
  return (
    <section className="relative bg-[#f5f3ef] pt-4 px-4">
      <div className="relative min-h-[90vh] overflow-hidden rounded-[40px]">
        <div className="absolute inset-0">
          <Image
            src="/sustainable-waste-management-technology-green-envi.jpg"
            alt="EcoFlow Waste Management Platform"
            fill
            className="object-cover animate-slow-zoom"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a2f]/40 to-[#1a3a2f]/70" />
        </div>

        <Header />

        <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 flex justify-between items-start">
          <div className="max-w-3xl">
            <p
              className="text-white/80 text-lg mb-4 font-serif italic animate-fade-up opacity-0"
              style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              Waste Management API
            </p>
            <h1
              className="text-[8rem] md:text-[12rem] font-serif text-white leading-[0.85] tracking-tight animate-fade-up opacity-0"
              style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
            >
              Ec<span className="text-[#c5e063] animate-pulse-slow">o</span>Flow
            </h1>
            <p
              className="text-white/70 text-base max-w-md mt-8 leading-relaxed animate-fade-up opacity-0"
              style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
            >
              A complete backend solution for managing waste reporting and collection. Built on a modern JavaScript
              stack, providing a robust, scalable, and authenticated REST API.
            </p>
          </div>

          <div
            className="hidden lg:block animate-fade-left opacity-0"
            style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
          >
            <div className="relative">
              <div className="bg-[#1a3a2f] rounded-[24px] p-5 flex items-center gap-4 max-w-xs relative hover:scale-105 transition-transform duration-500 hover:shadow-2xl">
                <div>
                  <p className="text-white text-xl font-bold">8 Waste Types</p>
                  <p className="text-white/60 text-xs mt-1 max-w-[160px]">
                    Accurate classification: PLASTIC, E_WASTE, METAL, ORGANIC, and more
                  </p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1a3a2f] bg-[#c5e063] flex items-center justify-center animate-bounce-slow">
                    <Database className="w-5 h-5 text-[#1a3a2f]" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1a3a2f] bg-[#c5e063] flex items-center justify-center animate-bounce-slow"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Cloud className="w-5 h-5 text-[#1a3a2f]" />
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
        </div>

        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-fade-up opacity-0"
          style={{ animationDelay: "1s", animationFillMode: "forwards" }}
        >
          <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center animate-bounce-slow hover:bg-white/10 transition-colors cursor-pointer">
            <ArrowDown className="w-5 h-5 text-white" />
          </div>
          <button className="bg-[#f5f3ef] text-[#1a3a2f] px-6 py-3 rounded-full text-sm font-medium hover:bg-white hover:scale-105 hover:shadow-xl transition-all duration-300">
            View API Docs
          </button>
        </div>
      </div>

      <div className="relative z-20 bg-[#f5f3ef] -mt-8 mx-4 rounded-t-[32px] pt-2">
        <div className="bg-[#f5f3ef] rounded-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-[#1a3a2f] text-xl font-bold">Developer-Friendly</h3>
                  <p className="text-[#1a3a2f]/60 text-sm mt-1 max-w-[200px]">
                    Clean REST API with consistent endpoint structure
                  </p>
                </div>
                <div className="relative group">
                  <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-[#1a3a2f] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Code className="w-10 h-10 text-[#c5e063]" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#1a3a2f] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 max-w-md">
                <p className="text-[#1a3a2f] text-sm leading-relaxed">
                  Powered by{" "}
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden align-middle mx-1 bg-[#c5e063] hover:scale-110 transition-transform duration-300">
                    <Database className="w-5 h-5 text-[#1a3a2f]" />
                  </span>{" "}
                  Express.js, Prisma ORM, and PostgreSQL for enterprise-grade performance.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button className="bg-[#1a3a2f] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:scale-105 hover:shadow-lg transition-all duration-300">
                Waste Reporting
              </button>
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f] hover:text-white transition-all duration-300">
                Collector Workflow
              </button>
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f] hover:text-white transition-all duration-300">
                Clerk Auth
              </button>
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f] hover:text-white transition-all duration-300">
                AWS S3 Storage
              </button>
              <div className="flex-1" />
              <button className="border border-[#1a3a2f]/30 text-[#1a3a2f] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a3a2f] hover:text-white transition-all duration-300 group">
                Explore API
                <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const techStack = [
  {
    name: "Express.js Backend",
    description: "Modular, REST-style framework",
    impact: "ES Modules",
    image: "/nodejs-express-server-backend-development.jpg",
    featured: false,
    icon: Code,
  },
  {
    name: "Prisma & PostgreSQL",
    description: "Enterprise-grade data integrity",
    impact: "Type-safe ORM",
    image: "/postgresql-database-prisma-orm-data.jpg",
    featured: false,
    icon: Database,
  },
  {
    name: "AWS S3 Storage",
    description: "Scalable cloud image storage",
    impact: "10MB uploads",
    image: "/aws-cloud-storage-s3-bucket-files.jpg",
    featured: true,
    icon: Cloud,
  },
]

function TechnologySection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="bg-[#f5f3ef] px-4 py-20" ref={ref}>
      <div className="container mx-auto">
        <div
          className={`flex flex-wrap items-start justify-between gap-8 mb-12 px-2 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">Technical Stack</h2>
          <p className="text-[#1a3a2f]/70 text-sm max-w-md leading-relaxed">
            Built using modern, industry-standard technologies for speed, security, and reliability. Our robust backend
            powers waste reporting and collection at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {techStack.map((tech, index) => (
            <div
              key={tech.name}
              className={`group transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative rounded-[28px] overflow-hidden bg-[#e8e6e2] aspect-square mb-4">
                <Image
                  src={tech.image || "/placeholder.svg"}
                  alt={tech.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <button
                  className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${tech.featured ? "bg-[#1a3a2f] shadow-lg" : "bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"}`}
                >
                  <tech.icon className={`w-5 h-5 ${tech.featured ? "text-[#c5e063]" : "text-[#1a3a2f]"}`} />
                </button>
              </div>
              <div className="flex items-end justify-between px-1">
                <div>
                  <h3 className="text-[#1a3a2f] text-lg font-medium group-hover:text-[#2a5a4f] transition-colors">
                    {tech.name}
                  </h3>
                  <p className="text-[#1a3a2f]/50 text-sm mt-1">{tech.description}</p>
                  <p className="text-[#1a3a2f] font-bold mt-2">{tech.impact}</p>
                </div>
                <button className="w-12 h-12 bg-[#1a3a2f] rounded-full flex items-center justify-center hover:bg-[#c5e063] transition-all duration-300 hover:scale-110 shadow-lg group/btn">
                  <ArrowRight className="w-5 h-5 text-white group-hover/btn:text-[#1a3a2f] transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-12">
          <div className="w-2 h-2 rounded-full bg-[#1a3a2f]/30 hover:bg-[#1a3a2f] transition-colors cursor-pointer" />
          <div className="w-2 h-2 rounded-full bg-[#1a3a2f]/30 hover:bg-[#1a3a2f] transition-colors cursor-pointer" />
          <div className="w-8 h-2 rounded-full bg-[#1a3a2f]" />
        </div>

        <div
          className={`flex flex-wrap items-center gap-8 mt-16 pt-16 border-t border-[#1a3a2f]/10 px-2 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <p className="text-[#1a3a2f]/70 text-sm max-w-xs leading-relaxed">
            See how our API powers the complete waste reporting and collection workflow.
          </p>
          <h3 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">How It Works</h3>
        </div>
      </div>
    </section>
  )
}

function ProcessSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="bg-[#f5f3ef] px-4 py-16" ref={ref}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <div
              className={`relative rounded-[32px] overflow-hidden aspect-[4/3] group transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
            >
              <Image
                src="/mobile-app-waste-reporting-location-pin-map.jpg"
                alt="Waste reporting interface"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2f]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <h3 className="text-white text-3xl font-serif italic">Report Waste</h3>
              </div>
              <button className="absolute top-5 right-5 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-12 transition-all duration-300">
                <Upload className="w-4 h-4 text-[#1a3a2f]" />
              </button>
            </div>

            <div
              className={`relative rounded-[32px] overflow-hidden aspect-[4/3] group transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
            >
              <Image
                src="/waste-collector-worker-pickup-truck-verification.jpg"
                alt="Collector verification"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2f]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-white text-3xl font-serif italic">Collector Pickup</h3>
              </div>
              <button className="absolute top-5 right-5 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-12 transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-[#1a3a2f]" />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div
              className={`bg-[#e8e5e0] rounded-[32px] p-8 md:p-10 transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
            >
              <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f] leading-tight">Complete Workflow</h2>
              <p className="text-[#1a3a2f]/70 text-sm mt-6 max-w-md leading-relaxed">
                Users submit waste reports with required images and location details. Collectors mark reports as
                collected with proof images. A clear workflow moves reports from PENDING to COLLECTED status.
              </p>
              <div className="flex gap-8 mt-8">
                <div className="hover:scale-110 transition-transform duration-300 cursor-default">
                  <p className="text-3xl font-bold text-[#1a3a2f]">REST</p>
                  <p className="text-[#1a3a2f]/60 text-xs mt-1">Clean API design</p>
                </div>
                <div className="hover:scale-110 transition-transform duration-300 cursor-default">
                  <p className="text-3xl font-bold text-[#1a3a2f]">Clerk</p>
                  <p className="text-[#1a3a2f]/60 text-xs mt-1">Secure auth</p>
                </div>
                <div className="hover:scale-110 transition-transform duration-300 cursor-default">
                  <p className="text-3xl font-bold text-[#1a3a2f]">S3</p>
                  <p className="text-[#1a3a2f]/60 text-xs mt-1">Image storage</p>
                </div>
              </div>
            </div>

            <div
              className={`relative rounded-[32px] overflow-hidden aspect-[4/3] group transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
            >
              <Image
                src="/notification-bell-alert-mobile-app-success.jpg"
                alt="Real-time notifications"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[#1a3a2f]/20" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-white text-3xl font-serif italic">Real-time Alerts</h3>
              </div>
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 hover:bg-white/30 hover:scale-110 transition-all duration-300">
                <Bell className="w-6 h-6 text-white animate-wiggle" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const wasteCategories = [
  {
    title: "Plastic & Metal",
    description:
      "PLASTIC, METAL, and GLASS waste types. Accurate classification enables proper recycling and recovery of valuable materials.",
    tag: "High Recovery",
    image: "/plastic-bottles-metal-cans-recycling-waste-sorting.jpg",
  },
  {
    title: "Organic & Paper",
    description:
      "ORGANIC, PAPER, and TEXTILE categories. Our system tracks biodegradable and fiber-based waste for composting and recycling.",
    tag: "Biodegradable",
    image: "/organic-waste-composting-paper-cardboard-recycling.jpg",
  },
  {
    title: "E-Waste & Hazardous",
    description:
      "E_WASTE and HAZARDOUS materials require special handling. Full regulatory compliance with safe collection and disposal protocols.",
    tag: "Safe Handling",
    image: "/electronic-waste-e-waste-batteries-hazardous-dispo.jpg",
  },
]

function WasteStreamsSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="bg-[#f5f3ef] px-4 pb-16" ref={ref}>
      <div className="container mx-auto">
        <div
          className={`mb-12 px-2 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">8 Waste Categories</h2>
          <p className="text-[#1a3a2f]/70 text-sm max-w-lg mt-4 leading-relaxed">
            Accurate classification using types like PLASTIC, E_WASTE, METAL, ORGANIC, PAPER, GLASS, TEXTILE, and
            HAZARDOUS for proper waste management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wasteCategories.map((category, index) => (
            <div
              key={category.title}
              className={`bg-[#1a3a2f] rounded-[32px] p-6 relative overflow-hidden min-h-[420px] flex flex-col justify-between group transition-all duration-700 hover:scale-[1.02] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.title}
                fill
                className="object-cover opacity-50 transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a2f]/90 via-[#1a3a2f]/60 to-[#1a3a2f]/40" />

              <div className="relative z-10">
                <h3 className="text-white text-2xl font-serif italic">{category.title}</h3>
                <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-[280px]">{category.description}</p>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-[#c5e063]/80 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-[#1a3a2f]" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <span className="text-white/80 text-xs">{category.tag}</span>
                  </div>
                </div>
                {index === 0 && (
                  <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:bg-[#c5e063] transition-all duration-300">
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

function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="bg-[#f5f3ef] px-4 pb-16" ref={ref}>
      <div className="container mx-auto">
        <div
          className={`mb-12 px-2 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="text-5xl md:text-6xl font-serif italic text-[#1a3a2f]">Key Features</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Feature 1: Waste Reporting */}
          <div
            className={`bg-[#1a3a2f] rounded-[32px] p-8 group hover:scale-[1.02] transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#c5e063] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Upload className="w-6 h-6 text-[#1a3a2f]" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Comprehensive Waste Reporting</h3>
                <p className="text-white/60 text-sm mt-2">
                  Empowers citizens to actively participate in environmental efforts.
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                Easy reporting with intuitive forms
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                Required image upload for verified data
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                GPS coordinates or text address support
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />8 waste category classification
              </li>
            </ul>
          </div>

          {/* Feature 2: Collector Workflow */}
          <div
            className={`bg-[#1a3a2f] rounded-[32px] p-8 group hover:scale-[1.02] transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#c5e063] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Users className="w-6 h-6 text-[#1a3a2f]" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Dedicated Collector Workflow</h3>
                <p className="text-white/60 text-sm mt-2">
                  Specialized system to mobilize and track collection teams efficiently.
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                Role-based collector mode access
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                PENDING to COLLECTED status workflow
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                Collection proof image upload
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4 text-[#c5e063]" />
                Anti-fraud: no self-collection allowed
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 3: Secure Stack */}
          <div
            className={`bg-[#e8e5e0] rounded-[32px] p-6 group hover:scale-105 hover:shadow-xl transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="w-12 h-12 bg-[#1a3a2f] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Shield className="w-6 h-6 text-[#c5e063]" />
            </div>
            <h3 className="text-[#1a3a2f] text-lg font-bold">Secure & Scalable</h3>
            <p className="text-[#1a3a2f]/60 text-sm mt-2">
              Express.js, Prisma ORM, PostgreSQL, and AWS S3 for enterprise-grade security and reliability.
            </p>
          </div>

          {/* Feature 4: Real-time Notifications */}
          <div
            className={`bg-[#e8e5e0] rounded-[32px] p-6 group hover:scale-105 hover:shadow-xl transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="w-12 h-12 bg-[#1a3a2f] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Bell className="w-6 h-6 text-[#c5e063]" />
            </div>
            <h3 className="text-[#1a3a2f] text-lg font-bold">Real-time Notifications</h3>
            <p className="text-[#1a3a2f]/60 text-sm mt-2">
              Automated alerts for WASTE_REPORTED, WASTE_COLLECTED, and COLLECTOR_ENABLED status changes.
            </p>
          </div>

          {/* Feature 5: Developer-Friendly */}
          <div
            className={`bg-[#e8e5e0] rounded-[32px] p-6 group hover:scale-105 hover:shadow-xl transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="w-12 h-12 bg-[#1a3a2f] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Code className="w-6 h-6 text-[#c5e063]" />
            </div>
            <h3 className="text-[#1a3a2f] text-lg font-bold">Developer-Friendly</h3>
            <p className="text-[#1a3a2f]/60 text-sm mt-2">
              Clean REST API with x-user-id authentication, multipart/form-data support, and structured S3 storage.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="bg-[#1a3a2f] px-6 py-16" ref={ref}>
      <div
        className={`container mx-auto text-center transition-all duration-700 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <h2 className="text-4xl md:text-5xl font-serif italic text-white mb-6">Ready to integrate EcoFlow API?</h2>
        <p className="text-white/70 text-sm max-w-md mx-auto mb-8">
          Build verified, location-based waste reporting with our robust REST API. Features built-in collector workflow,
          role-based access, and secure authentication.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button className="bg-[#c5e063] text-[#1a3a2f] px-8 py-4 rounded-full font-medium hover:bg-[#d5f073] hover:scale-105 hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2 group">
            Get API Access
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white hover:text-[#1a3a2f] hover:scale-105 transition-all duration-300">
            View Documentation
          </button>
        </div>
      </div>
    </section>
  )
}

// Main Page Component
export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f3ef]">
      <HeroSection />
      <TechnologySection />
      <ProcessSection />
      <WasteStreamsSection />
      <FeaturesSection />
      <CTASection />
    </main>
  )
}