'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="container empty-state"><h1>This page could not load.</h1><p>Your saved projects are safe. Try loading this view again.</p><button onClick={reset}>Try again</button></main>;}
