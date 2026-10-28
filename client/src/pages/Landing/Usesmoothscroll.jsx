import { useEffect } from 'react';
import Lenis from 'lenis';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/*
 * Inertia ("lerp") smooth scrolling for the landing page only.
 * Lenis drives the real window scroll position, so position: sticky, the hero
 * scroll sequence, IntersectionObserver and scroll listeners keep working.
 * Destroyed on unmount, so app routes keep native scrolling.
 *
 * Tuning: lower lerp = floatier/longer glide, higher = snappier.
 */
export default function useSmoothScroll() {
    useEffect(() => {
        if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return undefined;

        const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });

        let frame = 0;
        const raf = (time) => {
            lenis.raf(time);
            frame = window.requestAnimationFrame(raf);
        };
        frame = window.requestAnimationFrame(raf);

        // In-page anchors (#multi-business etc.) glide with the same inertia.
        const onClick = (event) => {
            const link = event.target.closest?.('a[href^="#"]');
            const hash = link?.getAttribute('href');
            if (!hash || hash.length < 2) return;
            const target = document.querySelector(hash);
            if (!target) return;
            event.preventDefault();
            const nav = document.querySelector('.landing-nav');
            lenis.scrollTo(target, { offset: -((nav?.offsetHeight ?? 0) + 16) });
        };
        document.addEventListener('click', onClick);

        return () => {
            document.removeEventListener('click', onClick);
            window.cancelAnimationFrame(frame);
            lenis.destroy();
        };
    }, []);
}