'use client';

/**
 * DirectorParallax — премиальный интерактивный блок с глубоким 3D-параллаксом.
 *
 * Стек: React + TypeScript + Next.js (App Router). Анимация: GSAP ScrollTrigger + Lenis.
 * Стили вынесены в DirectorParallax.css (без Tailwind).
 *
 * Параллакс работает ТОЛЬКО на десктопе (>=992px). На планшетах/телефонах он
 * отключается (через gsap.matchMedia + transform:none !important в CSS), а композиция
 * перестраивается в вертикальный список — чтобы не было дёрганий при скролле на тач-устройствах.
 *
 * Зависимости (npm): gsap, lenis
 *   npm i gsap lenis
 * Картинку-вырезку директора положите в /public (по умолчанию /director.webp).
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './DirectorParallax.css';

interface BadgeData {
  /** Угол: tl — левый верх, tr — правый верх, bl — левый низ, br — правый низ */
  corner: 'tl' | 'tr' | 'bl' | 'br';
  text: string;
}

/** Порядок в массиве = порядок вертикального списка на мобильных */
const BADGES: BadgeData[] = [
  { corner: 'tl', text: 'Основатель TTTMarketing' },
  { corner: 'tr', text: 'Работа с 200+ бизнесами' },
  { corner: 'bl', text: 'Эксперт: Facebook и Google Ads' },
  { corner: 'br', text: '20+ лет в маркетинге и продажах' },
];

interface DirectorParallaxProps {
  /** Путь к вырезанному портрету (PNG/WebP с прозрачным фоном). Лежит в /public. */
  imageSrc?: string;
  imageAlt?: string;
  fullName?: string;
  title?: string;
}

export default function DirectorParallax({
  imageSrc = '/director.webp',
  imageAlt = 'Танирбергенов Тимур Тимурович — директор и основатель TTT Marketing',
  fullName = 'Танирбергенов Тимур Тимурович',
  title = 'Директор',
}: DirectorParallaxProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------------------------------------------------------------------
    // 1. Lenis — плавный скролл, синхронизированный с ScrollTrigger
    //    (smoothTouch по умолчанию выключен → на мобильных нативный скролл)
    // ---------------------------------------------------------------------
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      // gsap.ticker отдаёт время в секундах, Lenis ждёт миллисекунды
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // ---------------------------------------------------------------------
    // 2. Параллакс. Всё внутри gsap.context(scope) — селекторы ограничены
    //    этой секцией, а ctx.revert() при размонтировании убивает ТОЛЬКО
    //    наши триггеры/твины и очищает инлайн-стили (не трогая чужие).
    // ---------------------------------------------------------------------
    let media: gsap.MatchMedia | undefined;

    const ctx = gsap.context(() => {
      if (reduceMotion) return;

      media = gsap.matchMedia();

      // Десктоп: глубокий 3D-параллакс. На <992px твины не создаются вовсе.
      media.add('(min-width: 992px)', () => {
        const scrollTrigger = {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        } as const;
        const ease = 'none';

        // Задний план (ФИО + огромный заголовок) — двигается медленнее всего
        gsap.fromTo(
          '.dp-layer-bg',
          { yPercent: 4 },
          { yPercent: -4, ease, scrollTrigger }
        );

        // Средний план (фигура + свечение) — средняя скорость
        gsap.fromTo(
          '.dp-layer-mid',
          { yPercent: 9 },
          { yPercent: -9, ease, scrollTrigger }
        );

        // Передний план (плашки) — быстрее всего, эффект «вылета» по дуге
        gsap.fromTo('.dp-badge--tl', { x: 24, y: 80 }, { x: -16, y: -90, ease, scrollTrigger });
        gsap.fromTo('.dp-badge--tr', { x: -24, y: 80 }, { x: 16, y: -90, ease, scrollTrigger });
        gsap.fromTo('.dp-badge--bl', { x: 24, y: -80 }, { x: -16, y: 90, ease, scrollTrigger });
        gsap.fromTo('.dp-badge--br', { x: -24, y: -80 }, { x: 16, y: 90, ease, scrollTrigger });
      });
    }, sectionRef);

    // ---------------------------------------------------------------------
    // 3. Cleanup — обязательно при уходе со страницы / размонтировании
    // ---------------------------------------------------------------------
    return () => {
      media?.revert();
      ctx.revert();
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <section className="dp-section" ref={sectionRef} aria-label={`${title} TTT Marketing`}>
      <div className="dp-stage">
        {/* ----- Задний план: ФИО + заголовок ----- */}
        <div className="dp-layer dp-layer-bg">
          <p className="dp-fio">{fullName}</p>
          <h2 className="dp-title">{title}</h2>
        </div>

        {/* ----- Средний план: пульсирующее свечение + фигура ----- */}
        <div className="dp-layer dp-layer-mid">
          <div className="dp-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dp-figure" src={imageSrc} alt={imageAlt} draggable={false} />
        </div>

        {/* ----- Передний план: интерактивные плашки ----- */}
        <div className="dp-layer dp-layer-fg">
          {BADGES.map((badge) => (
            <div className={`dp-badge dp-badge--${badge.corner}`} key={badge.corner}>
              <div className="dp-badge__card" tabIndex={0}>
                <span className="dp-dot" aria-hidden="true" />
                <span className="dp-badge__text">{badge.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
