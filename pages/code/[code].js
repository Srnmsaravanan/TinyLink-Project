import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Stats() {
  const router = useRouter();
  const { code } = router.query;
  const [data, setData] = useState(null);

  useEffect(()=>{
    if (!code) return;
    fetch('/api/links/' + code).then(r=>{
      if (r.status === 200) return r.json();
      throw new Error('not found');
    }).then(setData).catch(()=>setData(null));
  }, [code]);

  if (!code) return <div>Loading...</div>;
  if (!data) return <div>Not found or loading...</div>;

  return (
    <div style={{ maxWidth:800, margin:'20px auto' }}>
      <h1>Stats — {data.code}</h1>
      <p><strong>Target:</strong> <a href={data.target_url}>{data.target_url}</a></p>
      <p><strong>Clicks:</strong> {data.clicks}</p>
      <p><strong>Last clicked:</strong> {data.last_clicked || '-'}</p>
      <p><strong>Created at:</strong> {data.created_at}</p>
    </div>
  );
}
