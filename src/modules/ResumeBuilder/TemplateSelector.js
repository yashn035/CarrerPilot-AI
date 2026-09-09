import React from 'react';
import { Check, Sparkles, Layout, Feather, FileText, Palette } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Tech',
    description: 'Clean layout with royal blue accents, modern typography, and badge skills.',
    badge: 'Popular',
    icon: Layout,
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'professional',
    name: 'Executive Professional',
    description: 'Classic centered header, serif typography, and formal divider lines.',
    badge: 'Classic',
    icon: FileText,
    color: 'from-slate-700 to-slate-900'
  },
  {
    id: 'minimal',
    name: 'Minimal Mono',
    description: 'Distraction-free monospaced theme optimized for high ATS parser readability.',
    badge: 'ATS Optimized',
    icon: Feather,
    color: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'creative',
    name: 'Creative Studio',
    description: 'Vibrant purple gradient header and modern rounded skill badges.',
    badge: 'Creative',
    icon: Palette,
    color: 'from-purple-600 to-pink-600'
  }
];

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-primary" /> Select Visual Template
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          Switch styles seamlessly anytime. All your resume content automatically reflows into the chosen layout.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          const Icon = tmpl.icon;
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl.id)}
              className={`cursor-pointer rounded-card p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-background-surface border-accent-primary shadow-xl shadow-accent-primary/10 ring-1 ring-accent-primary'
                  : 'bg-[#111118] border-border-subtle hover:border-text-muted hover:bg-background-surface'
              }`}
            >
              <div>
                {/* Top Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${tmpl.color} text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected ? (
                    <span className="bg-accent-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-muted font-mono bg-background-elevated px-2 py-0.5 rounded">
                      {tmpl.badge}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-text-primary mb-1">{tmpl.name}</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">{tmpl.description}</p>
              </div>

              {/* Miniature Layout Preview Box */}
              <div className="border border-border-subtle rounded-btn p-3 bg-[#0A0A0F] space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className={`h-2.5 rounded w-2/3 bg-gradient-to-r ${tmpl.color}`}></div>
                <div className="h-1.5 bg-border-subtle rounded w-full"></div>
                <div className="h-1.5 bg-border-subtle rounded w-4/5"></div>
                <div className="flex gap-1 pt-1">
                  <div className="h-2 w-6 bg-accent-primary/20 rounded"></div>
                  <div className="h-2 w-6 bg-accent-primary/20 rounded"></div>
                  <div className="h-2 w-6 bg-accent-primary/20 rounded"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
