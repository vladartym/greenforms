import { useEffect } from "react"
import { Link } from "react-router-dom"

import {
  BrandLogo,
  PillButton,
  H1,
  Body,
} from "@/components/brand"
import Grainient from "@/components/Grainient"

export default function Home() {
  useEffect(() => {
    const html = document.documentElement
    const previous = html.style.scrollbarGutter
    html.style.scrollbarGutter = "auto"
    return () => {
      html.style.scrollbarGutter = previous
    }
  }, [])

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#0c4a2f] text-white">
      <video
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full animate-in fade-in-0 object-cover duration-1000 ease-out"
      >
        <source src="/static/videos/landing.mp4" type="video/mp4" />
      </video>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light"
      >
        <Grainient
          color1="#2E8550"
          color2="#10633F"
          color3="#F6E6D1"
          colorBalance={0}
          timeSpeed={0.18}
          warpStrength={1.2}
          warpFrequency={4.0}
          warpAmplitude={60.0}
          blendSoftness={0.2}
          grainAmount={0.7}
          grainScale={1.2}
          grainAnimated
          contrast={1.3}
          saturation={1}
          zoom={0.85}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "220px 220px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(180deg, rgba(12,74,47,0.45) 0%, rgba(12,74,47,0) 22%, rgba(12,74,47,0) 100%)",
            "radial-gradient(55% 40% at 50% 55%, rgba(12,74,47,0.55) 0%, rgba(12,74,47,0) 70%)",
          ].join(", "),
        }}
      />
      <header className="relative z-10 flex animate-in fade-in-0 slide-in-from-top-2 items-center justify-between px-6 py-4 duration-700 ease-out fill-mode-backwards sm:px-10">
        <BrandLogo variant="white" className="h-6 sm:h-7" />
        <nav className="flex items-center gap-3">
          <PillButton
            asChild
            size="sm"
            variant="ghost"
            className="hidden sm:inline-flex"
          >
            <Link to="/login">Log in</Link>
          </PillButton>
          <PillButton asChild size="sm" variant="inverted">
            <Link to="/signup">Sign up</Link>
          </PillButton>
        </nav>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10">
        <div className="w-full max-w-3xl text-center">
          <H1 className="animate-in fade-in-0 slide-in-from-bottom-4 text-balance text-white text-[clamp(2.25rem,7vw,56px)] leading-[1.05] tracking-[-0.01em] drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)] duration-[900ms] delay-150 ease-out fill-mode-backwards">
            Make forms people love to fill.
          </H1>
          <Body className="mx-auto mt-6 max-w-xl animate-in fade-in-0 slide-in-from-bottom-4 text-pretty text-white text-[clamp(1.125rem,3.2vw,20px)] leading-[1.45] drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] duration-[900ms] delay-300 ease-out fill-mode-backwards">
            A minimal, conversational form builder. Ready in minutes.
          </Body>
          <div className="mt-10 flex animate-in fade-in-0 slide-in-from-bottom-4 items-center justify-center duration-[900ms] delay-500 ease-out fill-mode-backwards">
            <PillButton asChild variant="inverted" size="lg">
              <Link to="/signup">Get Started</Link>
            </PillButton>
          </div>
        </div>
      </section>
    </main>
  )
}
