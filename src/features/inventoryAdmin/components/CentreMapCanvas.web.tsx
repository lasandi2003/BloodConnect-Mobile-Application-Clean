import React, { useEffect, useRef } from 'react';
import type { CentreMapCanvasProps } from './CentreMapCanvas';
export default function CentreMapCanvas({ html, onMessage, onError }: CentreMapCanvasProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && typeof event.data === 'string') onMessage(event.data);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onMessage]);
  return <iframe ref={frame} srcDoc={html} title="Select donation centre location" sandbox="allow-scripts allow-popups" referrerPolicy="strict-origin-when-cross-origin" onError={onError} style={{ flex: 1, width: '100%', minHeight: 280, border: 0 }} />;
}
