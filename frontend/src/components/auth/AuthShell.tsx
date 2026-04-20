import * as React from "react"

import { BrandLogo, Body, H1 } from "@/components/brand"
import Grainient from "@/components/Grainient"

type AuthShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh bg-white text-brand-ink">
      <aside className="relative hidden w-1/2 overflow-hidden bg-[#0c4a2f] text-white md:block">
        <video
          aria-hidden
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full animate-in fade-in-0 object-cover object-left duration-1000 ease-out"
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
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <a href="/" aria-label="Home">
            <BrandLogo variant="white" className="h-7" />
          </a>
          <p className="font-sans text-[22px] leading-[1.3] text-white/95 max-w-sm drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
            Make forms people love to fill.
          </p>
        </div>
      </aside>

      <section className="flex w-full flex-col md:w-1/2">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10 md:hidden">
          <a href="/" aria-label="Home">
            <BrandLogo variant="black" className="h-6" />
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <H1 className="text-[clamp(1.75rem,5vw,32px)] leading-[1.2]">
              {title}
            </H1>
            {subtitle ? (
              <Body className="mt-3 text-brand-ink/70 text-[16px]">
                {subtitle}
              </Body>
            ) : null}
            <div className="mt-8">{children}</div>
            {footer ? (
              <div className="mt-6 text-sm text-brand-ink/70">{footer}</div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
