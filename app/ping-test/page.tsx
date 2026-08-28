'use client'; //only client side rendering

import { useEffect, useState } from 'react';

export default function PingTest() {
  const [result, setResult] = useState<string>('Loading...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ping`)
      .then((res) => res.json())
      .then((data) => setResult(JSON.stringify(data, null, 2)))
      .catch((err) => setResult(`Error: ${err.message}`));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>API Connection Test</h1>
      <pre>{result}</pre>
    </div>
  );
}