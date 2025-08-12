// app/debug/env/page.tsx  (App Router 기준)
export default function EnvDebug() {
  return (
    <pre style={{padding:16}}>
      {JSON.stringify({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }, null, 2)}
    </pre>
  );
}