import { useLayoutEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/*
 * Reveal-once hook.
 *   none     → reduced motion / no IntersectionObserver: content just shows.
 *   armed    → hidden state applied BEFORE first paint (layout effect), so the
 *              content never flashes visible and then disappears.
 *   revealed → plays once and stays resolved.
 *
 * Also reveals when the node is already above the viewport (restored scroll
 * position, deep link, fast scroll) so content can never stay hidden.
 */
export default function useRevealOnce(ref, rootMargin) {
    const [state, setState] = useState('none');

    useLayoutEffect(() => {
        if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return undefined;
        if (typeof IntersectionObserver === 'undefined') return undefined;
        const node = ref.current;
        if (!node) return undefined;

        setState('armed');
        const io = new IntersectionObserver(
            (entries) => {
                const hit = entries.some(
                    (entry) => entry.isIntersecting || entry.boundingClientRect.top < 0,
                );
                if (hit) {
                    setState('revealed');
                    io.disconnect();
                }
            },
            { rootMargin },
        );
        io.observe(node);

        return () => io.disconnect();
    }, [ref, rootMargin]);

    return state;
}