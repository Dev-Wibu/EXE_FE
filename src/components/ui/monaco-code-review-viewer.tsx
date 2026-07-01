import React, { useEffect, useState, useRef } from "react";
import Editor, { useMonaco, Monaco } from "@monaco-editor/react";
import { type editor } from "monaco-editor";

export interface CodeIssue {
  filename: string;
  lineNumber: number;
  severity: string;
  description: string;
}

interface MonacoCodeReviewViewerProps {
  content: string;
  language: string;
  issues: CodeIssue[];
  theme?: string;
}

// Generate an eye icon SVG encoded for CSS background
const eyeIconSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOffIconSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

export function MonacoCodeReviewViewer({ content, language, issues, theme }: MonacoCodeReviewViewerProps) {
  const monaco = useMonaco();
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Record<number, boolean>>({});
  
  // Ref to hold the current zones so we can remove them
  const viewZonesRef = useRef<Record<number, string>>({});
  const decorationsRef = useRef<string[]>([]);
  
  // Ensure the CSS classes for glyphs exist
  useEffect(() => {
    if (!document.getElementById('monaco-review-styles')) {
      const style = document.createElement('style');
      style.id = 'monaco-review-styles';
      style.innerHTML = `
        .bug-glyph-margin-icon {
          background-image: url('${eyeIconSvg}');
          background-repeat: no-repeat;
          background-position: center;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .bug-glyph-margin-icon:hover {
          opacity: 1;
        }
        .bug-glyph-margin-icon-expanded {
          background-image: url('${eyeOffIconSvg}');
          background-repeat: no-repeat;
          background-position: center;
          cursor: pointer;
        }
        .monaco-issue-zone-container {
          padding: 8px 16px 8px 32px;
          border-top: 1px solid rgba(239, 68, 68, 0.2);
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
          background-color: rgba(239, 68, 68, 0.05);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          box-shadow: inset 4px 0 0 rgba(239, 68, 68, 0.5);
          z-index: 10;
        }
        .monaco-issue-zone-container.warning {
          border-color: rgba(245, 158, 11, 0.2);
          background-color: rgba(245, 158, 11, 0.05);
          box-shadow: inset 4px 0 0 rgba(245, 158, 11, 0.5);
        }
        .monaco-issue-zone-container.info {
          border-color: rgba(59, 130, 246, 0.2);
          background-color: rgba(59, 130, 246, 0.05);
          box-shadow: inset 4px 0 0 rgba(59, 130, 246, 0.5);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const updateDecorations = () => {
    if (!editorInstance || !monaco) return;
    
    const newDecorations = issues.map(issue => {
      const isExpanded = expandedIssues[issue.lineNumber];
      return {
        range: new monaco.Range(issue.lineNumber, 1, issue.lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: isExpanded ? 'bug-glyph-margin-icon-expanded' : 'bug-glyph-margin-icon',
          glyphMarginHoverMessage: { value: 'Click to view issue detail' }
        }
      };
    });
    
    const decs = editorInstance.deltaDecorations(decorationsRef.current, newDecorations);
    decorationsRef.current = decs;
  };

  const updateViewZones = () => {
    if (!editorInstance) return;
    
    editorInstance.changeViewZones((changeAccessor) => {
      // Remove all existing zones
      Object.values(viewZonesRef.current).forEach(id => {
        changeAccessor.removeZone(id);
      });
      viewZonesRef.current = {};
      
      // Add expanded zones
      issues.forEach(issue => {
        if (expandedIssues[issue.lineNumber]) {
          const domNode = document.createElement('div');
          
          let severityClass = 'critical';
          let badgeColor = 'bg-red-500';
          let textColor = 'text-red-700 dark:text-red-300';
          if (issue.severity === 'WARNING') {
            severityClass = 'warning';
            badgeColor = 'bg-amber-500';
            textColor = 'text-amber-700 dark:text-amber-300';
          } else if (issue.severity === 'INFO') {
            severityClass = 'info';
            badgeColor = 'bg-blue-500';
            textColor = 'text-blue-700 dark:text-blue-300';
          }
          
          domNode.className = `monaco-issue-zone-container ${severityClass}`;
          
          domNode.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="${badgeColor} text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">${issue.severity}</span>
                <span class="text-xs font-semibold ${textColor}">Issue on line ${issue.lineNumber}</span>
              </div>
              <p class="text-sm ${textColor} mt-1">${escapeHtml(issue.description)}</p>
            </div>
          `;
          
          const zoneId = changeAccessor.addZone({
            afterLineNumber: issue.lineNumber,
            heightInLines: 4,
            domNode: domNode,
            marginDomNode: null
          });
          
          viewZonesRef.current[issue.lineNumber] = zoneId;
        }
      });
    });
  };

  // Safe HTML escaping for description
  const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  useEffect(() => {
    updateDecorations();
    updateViewZones();
  }, [expandedIssues, issues, editorInstance, monaco]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    setEditorInstance(editor);
    
    // Listen for clicks on the glyph margin
    editor.onMouseDown((e) => {
      if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          // Check if there is an issue at this line
          const hasIssue = issues.some(iss => iss.lineNumber === lineNumber);
          if (hasIssue) {
            setExpandedIssues(prev => ({
              ...prev,
              [lineNumber]: !prev[lineNumber]
            }));
          }
        }
      }
    });
  };
  
  // Format the content correctly if it came from the DB with escaped newlines
  const formattedContent = content ? content.replace(/\\\\n/g, '\\n') : "";

  return (
    <Editor
      height="100%"
      language={language}
      value={formattedContent}
      theme={theme}
      onMount={handleEditorDidMount}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        lineNumbers: "on",
        folding: true,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
        renderLineHighlight: "none",
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        glyphMargin: true, // Enable glyph margin for the eye icon!
      }}
    />
  );
}
