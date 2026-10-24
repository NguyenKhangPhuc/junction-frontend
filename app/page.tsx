'use client';

import { useState, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useArticles } from './hooks/useArticles';
import { RegionalDispatch, ArticleResponse } from './types/api';

/**
 * Curated Regional Dispatches Mock Data for Oulu, Tampere, Turku, Rovaniemi, and Espoo
 */
const fallbackRegionalDispatches: RegionalDispatch[] = [
  {
    id: 'oulu-1',
    city: 'Oulu',
    bureau: 'Oulu Bureau',
    coordinates: "65°01'N",
    category: 'Technology',
    topic: 'Bothnian Bay',
    title: 'Oulu: Quantum Computing Hub Opens Near Bothnian Bay',
    excerpt:
      'A consortium of wireless researchers and cryogenic engineers launch the largest non-capital supercomputing cluster in the Nordic zone.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBKRjelwsYdCGqp7Yh4Q_grOGdJN3z-vHSQqtjsu3e5jfOPucr1f-SO5qrEXB4OxV8RZVwyO_l30DpoVqVYpTgXUJ_hzmkRvsJah_iXvi0uGdR57vMkuM56ey5mTCPthnPnyvNewZJpzzNw0Az0erOHJ_1gdCMfHC2YFXmd0QLulkY2h-TL_MCt1PCcpoe_LOSBW2ywZSm3L9Boke8XN1mshKST3AgwWOzbrAfXsGOJ3M597A-DmMyfQg',
    imageAlt: 'Oulu technological hub near water',
    timeAgo: '2h ago',
    isRealData: false,
  },
  {
    id: 'helsinki-fallback',
    city: 'Helsinki',
    bureau: 'Helsinki Bureau',
    coordinates: "60°10'N",
    category: 'Urban Planning',
    topic: 'Capital District',
    title: 'Helsinki: Historic Harbor Revitalization Unveils Carbon-Neutral Promenade',
    excerpt:
      'The South Quay transformation integrates sea-water heat recovery and completely pedestrianized wooden public spaces along the Baltic coastline.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANOhuvCEUfzW4z1sqXAzoPwJP27lPhWxCgYpTOoLeYYysuKXlXvMRa6s_fGNdZQP6S21Cv8Y3APm3Iqgi87ozeqhV6g0Gn_rn9rLtz3_uo0EzI5rV8K6n6iKJQsH8DGiNM_D5Dxmix7nCKU3APXlW1uZ18BC2ZuINwvKkRd8B_Acr8G1gkFOnmlYSM04x8SmK9GDCAM9a165SOD4a4ARvyOFzWd4hWyJizOQ5HMBdk5Gipgtpj1DRo_A',
    imageAlt: 'Helsinki harbor revitalization',
    timeAgo: '15m ago',
    isRealData: false,
  },
  {
    id: 'tampere-1',
    city: 'Tampere',
    bureau: 'Tampere Bureau',
    coordinates: "61°29'N",
    category: 'Transit',
    topic: 'Pirkanmaa',
    title: 'Tampere: The Tramway Architecture Transforming Modern Urbanism',
    excerpt:
      'Connecting industrial heritage redbrick districts to lakeside residential zones, Tampere’s expanded rail sets a blueprint for secondary European cities.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDykeBrbSpy_gMopSR6sf0tPS8gVVPmX0Erv4Fz6OVJY88EdPiULnBEeTNfHuFIFUEhLBhObv4zv5Afo9lW09d6Z_m1q19OYuh71JrpYHd0D1OTg-bSrz0YgIaNv2l8V8JcGKAWqw7nz4NzSQZJjRr-Tomi-dgejIr5t2N05b19ymin7MYS5iYQ41IxmFLgLUK0F2wFZzwQtV1HjKqoAlaDgfzRpsbcPC6hen9X1uzgCmqqpgg80OXz1A',
    imageAlt: 'Tampere modern tram architecture',
    timeAgo: '3h ago',
    isRealData: false,
  },
  {
    id: 'turku-1',
    city: 'Turku',
    bureau: 'Turku Bureau',
    coordinates: "60°27'N",
    category: 'Maritime',
    topic: 'Southwest Finland',
    title: 'Turku: Autonomous Archipelago Shipping Trials Conclude Phase One',
    excerpt:
      'Zero-emission electric cargo barges navigating 20,000 islands along the archipelago corridor successfully log three months without human override.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBA2lsqDp4zreXqBfKqiz34ZKW4GxRJ_qhvxKKaqff0t_8-hQu7TWCV3adFlh5kGYtmbJXX7q1ZC6thj0JD43IWq92xT0TSP7WI5yK1oTABRsnQAErR-5uUNa_Vjd127QxQrWhp_kcLmnTt1-kdbjId6a8kxeUTNEQeMhqjPEWL0xDIxP93qICIVtoFCjNREiL0Rif9uwNDgngklQmkWilOsWmJycRjtsPvgX02I93Ezgqo4yn9roH9AA',
    imageAlt: 'Turku Aura River and maritime heritage',
    timeAgo: '4h ago',
    isRealData: false,
  },
  {
    id: 'rovaniemi-1',
    city: 'Rovaniemi',
    bureau: 'Rovaniemi Bureau',
    coordinates: "66°30'N",
    category: 'Indigenous Rights',
    topic: 'Lapland',
    title: 'Rovaniemi: Sámi Cultural Archive Digitizes Centuries of Oral Law',
    excerpt:
      'The northern university repository partners with Arctic communities to build an immutable cryptographic record of traditional land stewardship.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAjOQ5M2mOoTor0HrWSyfe58ifM-ntWbwxs-n-BpJSlb7hUlrn2a6dgdulxDCg-AT54QJ_o3Bp6V3E6J5ajdcoa37yV2BfR-mLfHEou5CWfEePzDSWw9T_zEtaGia_6x7gAeynCccM8l2mFJF2XxqDGAL0nZOWX9oFicoBtGfDNUf4u5M8Jnqxn8a02bP5tcejJnp-WOSpJNQ13mHRA5J43Rv0L-DBtxg_ZWeVjeUzhBT3CbS4N6FrzQ',
    imageAlt: 'Rovaniemi Arctic architecture',
    timeAgo: '5h ago',
    isRealData: false,
  },
  {
    id: 'espoo-1',
    city: 'Espoo',
    bureau: 'Espoo Bureau',
    coordinates: "60°12'N",
    category: 'Applied Sciences',
    topic: 'Uusimaa',
    title: 'Espoo: Deep Geothermal Boreholes Reach 6,400-Meter Basalt Heat',
    excerpt:
      'A district heating initiative in Otaniemi taps deep crust thermal reservoirs, delivering clean baseload energy to 30,000 households without combustion.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDaOiqOCid8zEWb7pTTC2bg2114OJ1Rxn7ty_VNaex_C0J1PX5QPZYsXMMr8LhaJuYxc-srRy3IvEr8ZFfFmaDMI4o2YQ6qjCujBoB0JaGv77-h29RikT2iAkZawHaDzcU2ijW3Dv6ZI_xGhDfnTeA5LHWTme9mANR9jc3DABpZ3xYc2toCD4S_94kSSvBjRA16A0Kxzt-mYhh7Vwq9xbKOpS1NPwLFDP4BuelIp7KwQuoB9cHeGnqBGQ',
    imageAlt: 'Espoo innovation ecosystem and university campus',
    timeAgo: '6h ago',
    isRealData: false,
  },
];

const cityFilters = [
  'All Bureaus',
  'Helsinki',
  'Oulu',
  'Tampere',
  'Turku',
  'Rovaniemi',
  'Espoo',
] as const;

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string>('All Bureaus');
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Real-time articles query from /api/articles for Helsinki bureau
  const { data: realArticles } = useArticles();

  // Combine real Helsinki articles with mock regional bureaus
  const dispatches = useMemo<RegionalDispatch[]>(() => {
    // If real articles exist from the backend, map them to Helsinki bureau cards
    if (realArticles && realArticles.length > 0) {
      const helsinkiRealDispatches: RegionalDispatch[] = realArticles.map(
        (article: ArticleResponse, index: number) => ({
          id: `helsinki-api-${article.id}`,
          city: 'Helsinki',
          bureau: 'Helsinki Bureau',
          coordinates: "60°10'N",
          category: 'Live Dispatch',
          topic: article.author ? `By ${article.author}` : 'Capital Wire',
          title: article.title,
          excerpt: article.content,
          imageUrl:
            index % 2 === 0
              ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuANOhuvCEUfzW4z1sqXAzoPwJP27lPhWxCgYpTOoLeYYysuKXlXvMRa6s_fGNdZQP6S21Cv8Y3APm3Iqgi87ozeqhV6g0Gn_rn9rLtz3_uo0EzI5rV8K6n6iKJQsH8DGiNM_D5Dxmix7nCKU3APXlW1uZ18BC2ZuINwvKkRd8B_Acr8G1gkFOnmlYSM04x8SmK9GDCAM9a165SOD4a4ARvyOFzWd4hWyJizOQ5HMBdk5Gipgtpj1DRo_A'
              : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvlIQx3xStUgcKMd1gHLFt_10nZcIRFZ2jAGvkNP0aqJr9lj6aEiPL-wnFBm-JHzrTOX7ql-L66mInYeaUb9_lpQ8NwKX4Do-fVQuebaKE3r47LK1iFIUvg0SNCiZKwf8Nj_karDJ5jUBKWsZIQpQ7uCfKASh-KNN_bRpNj2X-4NjAmJzB3bqCU0T_b1DxGXVgbFsVFIokZq9gizpRsC4rRDrMPX66D2tEAwyv84ZY7J0mJhZwdcqMDw',
          imageAlt: `Helsinki report: ${article.title}`,
          timeAgo: new Date(article.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          isRealData: true,
        })
      );

      // Replace mock Helsinki card with real data, keeping other mock bureaus
      const otherBureaus = fallbackRegionalDispatches.filter((d) => d.city !== 'Helsinki');
      return [...helsinkiRealDispatches, ...otherBureaus];
    }

    // Default to full mock fallback if backend is offline or empty
    return fallbackRegionalDispatches;
  }, [realArticles]);

  // Filtered dispatches based on active city button
  const filteredDispatches = useMemo(() => {
    if (selectedCity === 'All Bureaus') {
      return dispatches;
    }
    return dispatches.filter((item) => item.city.toLowerCase() === selectedCity.toLowerCase());
  }, [dispatches, selectedCity]);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!subscriptionEmail) return;
    setSubscriptionSuccess(true);
    setSubscriptionEmail('');
    setTimeout(() => setSubscriptionSuccess(false), 6000);
  };

  return (
    <div className="w-full pt-16 md:pt-20 bg-background text-on-surface">
      <div className="flex flex-col w-full">
        {/* -------------------------------------------------------------
         * EDITORIAL EDITION META BAR
         * ------------------------------------------------------------*/ }
        <section className="w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-margin pt-4 pb-6">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center gap-space-md flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-on-primary font-body text-[11px] leading-[16px] tracking-widest uppercase font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse" />
                LIVE WIRE
              </span>
              <span className="font-body text-[13px] leading-[18px] text-primary tracking-tight font-medium">
                Monday, October 28 • Nordic Edition • Vol. 142
              </span>
            </div>

            <div className="flex items-center gap-space-lg text-on-surface-variant font-body text-[11px] leading-[16px] uppercase tracking-wider flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updated 08:42 EET
              </span>

              <span className="hidden sm:inline-flex items-center gap-1">
                <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Gulf of Finland: 4°C Light Breeze
              </span>

              <span className="hidden lg:inline text-secondary font-body text-[12px] leading-[18px]">
                Independent Nordic Dispatches
              </span>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------
         * HERO SECTION: 2-COLUMN ASYMMETRIC GRID (5:7)
         * ------------------------------------------------------------*/ }
        <section className="w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-margin pb-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left Column: Exactly 3 stacked editorial items with square thumbnail */}
            <div className="lg:col-span-5 flex flex-col gap-space-lg">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="font-body text-[13px] leading-[18px] uppercase tracking-widest text-primary font-semibold">
                    Priority Wire
                  </h2>
                </div>
                <span className="font-body text-[12px] leading-[18px] text-secondary">
                  3 stories curated
                </span>
              </div>

              {/* Story 1 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col gap-space-sm border border-surface-container-high/40">
                <div className="flex flex-row items-start gap-space-md">
                  <div className="relative aspect-square w-28 sm:w-32 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                    <img
                      alt="Wind turbines in winter Nordic landscape"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHhiZ71mRAKW2IoQOjcKSUTpZAfwuvSx_vsKAJ34ijtOOlMp37VrVTIRB2VvbxsAzrt5rzpDQBMLaGTnjlinGDPU7kQDzaWBD-S5iSzHRy6cRKEyNDpHugxxcAaukYM8NRXixqr07wFxp2oxT_yk20VuCpMzQbfI74mFTlGApz7AwQG-WMlF793dXc4Cc2bwuOJr81lhrkBJMIXywVq08Ps3qwMEitKGZGNWZqywytJXpRBUxA3pfS8A"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface font-body text-[11px] font-semibold">
                        CLIMATE
                      </span>
                      <span className="text-secondary font-body text-[12px]">
                        • 12m ago
                      </span>
                    </div>
                    <span className="text-secondary font-body text-[12px] mt-1">
                      Bothnian Corridor
                    </span>
                    <div className="mt-auto pt-2 flex items-center text-primary font-body text-[11px] uppercase tracking-wider font-semibold group-hover:translate-x-1 transition-transform">
                      Read memo
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="font-headline text-[19px] leading-[26px] tracking-tight font-medium text-primary group-hover:text-secondary transition-colors">
                    Nordic Grid Synchronizes Baltic Subsea Interconnectors
                  </h3>
                  <p className="font-body text-[14px] leading-[22px] text-on-surface-variant mt-1.5 line-clamp-2">
                    High-voltage direct current lines beneath the sea floor reached record seasonal transmission capacity between Finland and Sweden this morning.
                  </p>
                </div>
              </article>

              {/* Story 2 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col gap-space-sm border border-surface-container-high/40">
                <div className="flex flex-row items-start gap-space-md">
                  <div className="relative aspect-square w-28 sm:w-32 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                    <img
                      alt="Quantum researcher in laboratory"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD89NKPS1sCc3_xRIB36nLIl31ZjEQW8p9VbMis-qCjuPhBLW-JyGCtO8ySv_QBMRJU_plV5dPxTwcVe4EkDEJOJYJaqsfD2M_fU-ZixR7fwylOF_B4TWYaWM4-PJLwQuLvMUCR78zxMqFb8Ut66H05kiLQJOi4CPwCDqij697V3SgLC5gdxa1Vz844ztu8q4w8Lv7Y1JCG4wFUpD_GiMzYKS2a8R_tdFHzKVkuUnSRAR-D5sIDYTDjqw"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface font-body text-[11px] font-semibold">
                        TECH
                      </span>
                      <span className="text-secondary font-body text-[12px]">
                        • 44m ago
                      </span>
                    </div>
                    <span className="text-secondary font-body text-[12px] mt-1">
                      Otaniemi Research Campus
                    </span>
                    <div className="mt-auto pt-2 flex items-center text-primary font-body text-[11px] uppercase tracking-wider font-semibold group-hover:translate-x-1 transition-transform">
                      Read memo
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="font-headline text-[19px] leading-[26px] tracking-tight font-medium text-primary group-hover:text-secondary transition-colors">
                    VTT Unveils 50-Qubit Dilution Architecture for Commercial Deployment
                  </h3>
                  <p className="font-body text-[14px] leading-[22px] text-on-surface-variant mt-1.5 line-clamp-2">
                    Finland’s technical research center validates novel silicon quantum processor architecture operating continuously at 15 millikelvin.
                  </p>
                </div>
              </article>

              {/* Story 3 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col gap-space-sm border border-surface-container-high/40">
                <div className="flex flex-row items-start gap-space-md">
                  <div className="relative aspect-square w-28 sm:w-32 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                    <img
                      alt="Contemporary Nordic architecture with citizens"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvlIQx3xStUgcKMd1gHLFt_10nZcIRFZ2jAGvkNP0aqJr9lj6aEiPL-wnFBm-JHzrTOX7ql-L66mInYeaUb9_lpQ8NwKX4Do-fVQuebaKE3r47LK1iFIUvg0SNCiZKwf8Nj_karDJ5jUBKWsZIQpQ7uCfKASh-KNN_bRpNj2X-4NjAmJzB3bqCU0T_b1DxGXVgbFsVFIokZq9gizpRsC4rRDrMPX66D2tEAwyv84ZY7J0mJhZwdcqMDw"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface font-body text-[11px] font-semibold">
                        SOCIETY
                      </span>
                      <span className="text-secondary font-body text-[12px]">
                        • 1h ago
                      </span>
                    </div>
                    <span className="text-secondary font-body text-[12px] mt-1">
                      Civic Welfare Digest
                    </span>
                    <div className="mt-auto pt-2 flex items-center text-primary font-body text-[11px] uppercase tracking-wider font-semibold group-hover:translate-x-1 transition-transform">
                      Read memo
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="font-headline text-[19px] leading-[26px] tracking-tight font-medium text-primary group-hover:text-secondary transition-colors">
                    The 30-Hour Work Horizon: Municipal Pilot Expands Across Central Finland
                  </h3>
                  <p className="font-body text-[14px] leading-[22px] text-on-surface-variant mt-1.5 line-clamp-2">
                    Seven regional administrative hubs publish quarterly productivity metrics after recalibrating standard civic service hours.
                  </p>
                </div>
              </article>
            </div>

            {/* Right Column: Featured Lead Headline Story with Prominent Photo */}
            <div className="lg:col-span-7 flex flex-col">
              <article className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col border border-surface-container-high/40">
                <div className="relative aspect-square w-full max-h-[460px] rounded-2xl overflow-hidden bg-surface-container-high">
                  <img
                    alt="Arctic tundra research facility"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4lAV2V4Ynmj__ZDmHzd3arWQoHK7Es6WfqEpcmYZC_b3V2s6GUHNGGPBlhmsaNo-EvL5o7t78X-e1ctVflbEO2UkEqiiXE4CbHFuIoDQf6srlni4gI49_7wmN8vzE0C1NSeR0uVq1QlPAyuRohaLZZsFkitKgsvUNyESCc-5P_2RKXsyeEqOYsHd1shSVGq6b3D1WB4bvl5J3h_Q07N7l-EHhj1wsN8OGVP8CIFKlW4AZ2v68A_j31w"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary text-on-primary font-body text-[11px] leading-[16px] uppercase tracking-wider font-semibold shadow">
                      Lead Story
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-body text-[11px] leading-[16px] uppercase tracking-wider font-semibold shadow">
                      Deep Dispatch
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1 rounded-full text-primary font-body text-[12px] leading-[18px]">
                    68°25&apos;N • Saariselkä
                  </div>
                </div>

                <div className="mt-space-lg flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-md text-secondary font-body text-[12px] leading-[18px] flex-wrap">
                    <span>By Eeva Kaartinen in Saariselkä</span>
                    <span>•</span>
                    <span>7 min read</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">Special Investigation</span>
                  </div>

                  <h1 className="font-headline text-[28px] md:text-[40px] leading-[34px] md:leading-[48px] tracking-tight font-normal text-primary group-hover:text-secondary transition-colors mt-1">
                    The Arctic Transition: How Northern Microclimates Are Reshaping Green Energy
                  </h1>

                  <p className="font-headline text-[20px] leading-[32px] text-on-surface-variant font-normal">
                    Inside the high-latitude experimental facilities operating beyond the Arctic Circle, extreme cold and prolonged solar absences have forced Finnish engineers to reinvent thermodynamic efficiency from the bedrock up.
                  </p>

                  <div className="pt-space-md mt-space-sm flex flex-wrap items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-body text-[11px] font-semibold uppercase tracking-wider">
                        Thermodynamics
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-body text-[11px] font-semibold uppercase tracking-wider">
                        Lapland
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-body text-[11px] font-semibold uppercase tracking-wider">
                        Sub-Zero Storage
                      </span>
                    </div>

                    <Link
                      href="/news"
                      className="inline-flex items-center gap-2 bg-primary text-on-primary px-space-lg py-2.5 rounded-xl font-body text-[13px] leading-[18px] uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-all shadow-sm"
                    >
                      <span>Read Full Coverage</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------
         * EDITORIAL DIVIDER BAR
         * ------------------------------------------------------------*/ }
        <div className="w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-margin py-2">
          <div className="h-px bg-surface-container-high w-full" />
        </div>

        {/* -------------------------------------------------------------
         * REGIONAL DISPATCHES / CITIES OF FINLAND SECTION
         * ------------------------------------------------------------*/ }
        <section className="w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-margin py-space-xl">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-body text-[11px] uppercase tracking-widest font-semibold">
                  Geographic Feed
                </span>
                <span className="font-body text-[12px] text-secondary">
                  6 Regional Bureaus
                </span>
                {realArticles && realArticles.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-body text-[10px] tracking-wider uppercase font-semibold">
                    Live Helsinki API Connected
                  </span>
                )}
              </div>

              <h2 className="font-headline text-[32px] md:text-[40px] leading-[38px] md:leading-[48px] text-primary tracking-tight font-normal">
                Dispatches from Finnish Cities
              </h2>

              <p className="font-body text-[16px] leading-[26px] text-on-surface-variant max-w-2xl font-normal">
                Direct field journalism from our dedicated urban correspondents. Un-blur any card to inspect immediate local developments.
              </p>
            </div>

            {/* City Navigation Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-end">
              {cityFilters.map((city) => {
                const active = selectedCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-full font-body text-[11px] uppercase tracking-wider font-semibold transition-all shadow-sm ${
                      active
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    {city}
                    {city === 'Helsinki' && realArticles && realArticles.length > 0 && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-on-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsive Grid with Framer Motion Layout Animation */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg"
          >
            <AnimatePresence mode="popLayout">
              {filteredDispatches.map((item) => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer bg-neutral-900 border border-surface-container-high/30"
                >
                  {/* Background Image with initial blur effect unblurring on hover */}
                  <img
                    alt={item.imageAlt}
                    className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105 group-hover:blur-none group-hover:scale-100 transition-all duration-700 ease-out"
                    src={item.imageUrl}
                  />

                  {/* Dark gradient vignette scrim overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-85 transition-opacity" />

                  {/* Top Metadata inside card */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-body text-[11px] leading-[16px] uppercase tracking-widest font-semibold">
                      {item.bureau}
                      {item.isRealData && (
                        <span className="ml-1 text-xs text-white underline">• LIVE</span>
                      )}
                    </span>
                    <span className="font-body text-[12px] leading-[18px] text-neutral-300 backdrop-blur-md px-2 py-0.5 rounded-full bg-black/40">
                      {item.coordinates}
                    </span>
                  </div>

                  {/* Content Overlay placed inside lower segment */}
                  <div className="absolute bottom-0 left-0 right-0 p-space-lg flex flex-col justify-end z-10 text-white">
                    <span className="font-body text-[11px] leading-[16px] uppercase tracking-widest text-neutral-300 mb-1 font-semibold">
                      {item.category} • {item.topic}
                    </span>

                    <h3 className="font-headline text-[24px] leading-[30px] tracking-tight font-medium text-white group-hover:translate-y-[-2px] transition-transform">
                      {item.title}
                    </h3>

                    <p className="font-body text-[14px] leading-[22px] text-neutral-300 mt-2 line-clamp-2">
                      {item.excerpt}
                    </p>

                    <div className="mt-3 flex items-center text-white font-body text-[11px] leading-[16px] uppercase tracking-wider font-semibold group-hover:text-neutral-200">
                      <span>Read full dispatch</span>
                      <svg
                        className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* -------------------------------------------------------------
         * EDITORIAL NEWSLETTER & BROADSHEET DISPATCH BANNER
         * ------------------------------------------------------------*/ }
        <section className="w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-margin pb-space-xl">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg lg:p-space-xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg border border-surface-container-high/40">
            <div className="max-w-xl space-y-space-xs">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-body text-[13px] leading-[18px] uppercase tracking-wider text-primary font-semibold">
                  The Pohjola Morning Dispatch
                </span>
              </div>

              <h3 className="font-headline text-[32px] leading-[38px] text-primary tracking-tight font-normal">
                Delivered at 06:00 EET. Zero algorithms, pure editorial rigor.
              </h3>

              <p className="font-body text-[14px] leading-[22px] text-on-surface-variant font-normal">
                Receive a concise executive brief on Nordic policy, technological discoveries from Helsinki to Oulu, and cultural critiques every weekday.
              </p>

              {subscriptionSuccess && (
                <div className="p-3 bg-surface-container-low rounded-xl text-primary font-body text-xs font-medium border border-primary/20">
                  ✓ Thank you for subscribing to Pohjola Post. The morning brief will arrive in your inbox at 06:00 EET.
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubscribe}
              className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm"
            >
              <div className="relative">
                <input
                  type="email"
                  required
                  value={subscriptionEmail}
                  onChange={(e) => setSubscriptionEmail(e.target.value)}
                  placeholder="reader@nordic-organization.fi"
                  className="h-11 px-4 rounded-xl bg-surface-container-low text-primary placeholder:text-on-surface-variant font-body text-[14px] leading-[22px] focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-80 border border-surface-container-high"
                />
              </div>

              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-primary text-on-primary font-body text-[13px] leading-[18px] uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
              >
                <span>Subscribe</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------------
       * EDITORIAL FOOTER
       * ------------------------------------------------------------*/ }
      <footer className="w-full bg-surface-container-lowest border-t border-surface-container-high/60 mt-space-xl">
        <div className="max-w-[1440px] mx-auto px-gutter-mobile lg:px-margin py-space-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-space-lg">
          <div className="space-y-space-xs">
            <div className="font-headline text-[24px] leading-[30px] text-primary tracking-tight font-medium">
              Pohjola Post
            </div>
            <p className="font-body text-[14px] leading-[22px] text-on-surface-variant max-w-md font-normal">
              Independent Nordic reporting, cultural inquiry, and authoritative regional analysis. Published daily in Helsinki.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-lg text-left sm:text-right">
            <div className="font-body text-[12px] leading-[18px] text-secondary space-y-space-xs">
              <p>© 2026 Pohjola Post Publishing Group. All editorial rights reserved.</p>
              <p className="font-body text-[11px] leading-[16px] uppercase tracking-widest text-on-surface-variant font-semibold">
                ISSN 2489-6349 • Press Council of Finland
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
