import React from 'react';
import { Plus, Edit3, Copy, Trash2, Download, FileText, Calendar, Sparkles } from 'lucide-react';

export default function ResumeList({ resumes, onSelectResume, onCreateNew, onDuplicate, onDelete, loading }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-primary" /> Your Saved Resumes
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your tailored resume versions, duplicate templates, or create new targeted applications.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-btn flex items-center gap-2 transition-all shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Resume
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-mono text-text-muted">Loading your resumes...</div>
      ) : resumes.length === 0 ? (
        <div className="bg-[#111118] border border-border-subtle rounded-card p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-text-muted mx-auto" />
          <h4 className="font-bold text-sm text-text-primary">No Resumes Saved Yet</h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Get started by creating your first AI-optimized resume or selecting a pre-styled template.
          </p>
          <button
            onClick={onCreateNew}
            className="bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs px-4 py-2 rounded-btn inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Build My Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((res) => (
            <div
              key={res._id}
              className="bg-[#111118] border border-border-subtle hover:border-accent-primary/50 rounded-card p-5 space-y-4 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase bg-accent-primary/10 border border-accent-primary/20 text-accent-primary px-2 py-0.5 rounded">
                    {res.templateId || 'modern'}
                  </span>
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(res.updatedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-bold text-base text-text-primary group-hover:text-accent-primary transition-colors">
                  {res.title || 'Untitled Resume'}
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  Target Role: <span className="font-semibold text-text-primary">{res.targetRole || 'Software Engineer'}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectResume(res)}
                  className="bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border border-accent-primary/30 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicate(res._id)}
                    title="Duplicate Resume"
                    className="p-1.5 text-text-secondary hover:text-text-primary bg-background-elevated hover:bg-background-surface rounded border border-border-subtle transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDelete(res._id)}
                    title="Delete Resume"
                    className="p-1.5 text-text-muted hover:text-accent-danger bg-background-elevated hover:bg-accent-danger/10 rounded border border-border-subtle transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
