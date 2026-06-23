'use client';

import React, { useState } from 'react';

interface Project {
  id: string;
  title: string;
  category: string;
  desc: string;
  color: string;
  metric: string;
}

export default function ProjectGrid() {
  const [filter, setFilter] = useState('ALL');

  const categories = ['ALL', 'BRANDING', 'DIGITAL', 'MOTION', 'EXPERIMENT'];

  const projects: Project[] = [
    {
      id: 'core-ledger',
      title: 'FINTECH LEDGER CORE',
      category: 'BRANDING',
      desc: 'Monochromatic cream identity system for high-contrast creatives.',
      color: 'bg-[#1a1917]',
      metric: 'v1.0.0 STABLE',
    },
    {
      id: 'p2p-transfers',
      title: 'INSTANT P2P TRANSFERS',
      category: 'DIGITAL',
      desc: 'Inertia-driven secure funds delegation engine.',
      color: 'bg-[#0f1214]',
      metric: '0.04 SEC LATENCY',
    },
    {
      id: 'cube-auth',
      title: '3D LOGO PRELOADER',
      category: 'MOTION',
      desc: 'Hardware accelerated logo cube with letter masks.',
      color: 'bg-[#181216]',
      metric: '60 FPS ANIMATED',
    },
    {
      id: 'ai-anomalies',
      title: 'AI ANOMALIES SEARCH',
      category: 'EXPERIMENT',
      desc: 'Realtime spend scoring algorithm with alert triggers.',
      color: 'bg-[#121815]',
      metric: '98% ACCURACY',
    },
  ];

  const filteredProjects =
    filter === 'ALL' ? projects : projects.filter((p) => p.category === filter);

  return (
    <section className="w-full py-24 px-6 md:px-24 bg-bg-main flex flex-col gap-12">
      {/* Category Filter list */}
      <div className="flex flex-col gap-4 border-b border-border-glass pb-8">
        <span className="font-mono text-[9px] tracking-widest text-text-muted">
          FILTER WORK CATEGORIES / METRICS
        </span>
        
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`font-display text-[10px] tracking-widest uppercase px-5 py-2.5 rounded-none font-bold border transition-all duration-300 cursor-pointer ${
                filter === cat
                  ? 'bg-accent-cream text-bg-main border-accent-cream'
                  : 'bg-transparent text-accent-cream border-border-glass hover:border-accent-cream/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div
      className="group relative border border-border-glass flex flex-col justify-between h-[360px] md:h-[480px] p-8 md:p-12 overflow-hidden select-none bg-bg-surface transition-all duration-300 hover:border-accent-cream/40"
    >
      {/* Background card design */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className={`absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity duration-300 ${project.color}`}
        />
      </div>

      {/* Card Header details */}
      <div className="relative z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-text-muted">
        <span>[{project.category}]</span>
        <span>{project.metric}</span>
      </div>

      {/* Card Footer details */}
      <div className="relative z-10 flex flex-col gap-3">
        <h3 className="text-xl md:text-3xl font-display font-black text-white group-hover:text-accent-cream transition-colors duration-300">
          {project.title}
        </h3>
        <p className="text-xs md:text-sm text-text-muted max-w-sm leading-relaxed">
          {project.desc}
        </p>
      </div>

      {/* Subtle indicator dot */}
      <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-accent-cream rounded-none scale-0 group-hover:scale-100 transition-transform duration-300" />
    </div>
  );
}
