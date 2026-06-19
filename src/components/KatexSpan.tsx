import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface KatexSpanProps {
  tex: string;
  displayMode?: boolean;
}

const KatexSpan: React.FC<KatexSpanProps> = ({ tex, displayMode = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(tex, containerRef.current, {
          throwOnError: false,
          displayMode: displayMode,
          trust: true,
        });
      } catch (err) {
        console.error('Katex render error:', err);
      }
    }
  }, [tex, displayMode]);

  return <span ref={containerRef} />;
};

export default KatexSpan;
