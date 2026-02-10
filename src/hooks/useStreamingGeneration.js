import { useState, useRef, useCallback } from 'react';

export function useStreamingGeneration() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const startGeneration = useCallback(async (message, options = {}) => {
    setIsStreaming(true);
    setStreamedText('');
    setError(null);

    const token = localStorage.getItem('access_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'https://api.atomiktrading.io';

    let accumulated = '';

    try {
      abortRef.current = new AbortController();
      const response = await fetch(`${apiUrl}/api/v1/aria/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          mode: 'strategy_builder',
          input_type: 'text',
          ...options
        }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'error') {
                setError(parsed.error);
                break;
              }
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamedText(accumulated);
              }
              if (parsed.type === 'done' && parsed.code) {
                // Final message with extracted code
                accumulated = parsed.code;
                setStreamedText(accumulated);
              }
            } catch (e) {
              // Not JSON, treat as raw text
              accumulated += data;
              setStreamedText(accumulated);
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }

    return accumulated;
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return { isStreaming, streamedText, error, startGeneration, stopGeneration };
}
