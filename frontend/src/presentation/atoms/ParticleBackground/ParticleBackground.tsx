/**
 * ParticleBackground Component - Battle.Net Quiz Platform
 *
 * Beautiful animated particle background for the landing page.
 * Uses CSS animations for performance and theme-aware colors.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import styles from './ParticleBackground.module.css';

interface Particle {
	id: number;
	x: number;
	y: number;
	size: number;
	duration: number;
	delay: number;
	opacity: number;
}

export const ParticleBackground: React.FC = () => {
	const containerRef = useRef<HTMLDivElement>(null);

	// Generate particles with random properties
	const particles = useMemo<Particle[]>(() => {
		const count = 50;
		return Array.from({ length: count }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 4 + 2,
			duration: Math.random() * 20 + 15,
			delay: Math.random() * 10,
			opacity: Math.random() * 0.5 + 0.1,
		}));
	}, []);

	return (
		<div ref={containerRef} className={styles.particleContainer} aria-hidden="true">
			{/* Floating Particles (transparent, no color) */}
			{particles.map((particle) => (
				<div
					key={particle.id}
					className={styles.particle}
					style={
						{
							// Position, Größe, Animation, Opazität als CSS-Variablen
							'--particle-x': `${particle.x}%`,
							'--particle-y': `${particle.y}%`,
							'--particle-size': `${particle.size}px`,
							'--particle-duration': `${particle.duration}s`,
							'--particle-delay': `${particle.delay}s`,
							'--particle-opacity': particle.opacity,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	);
};
