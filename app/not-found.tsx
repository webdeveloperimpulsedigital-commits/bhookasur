import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-slate-400 mb-4">Could not find requested resource</p>
      <Link href="/" className="px-4 py-2 bg-orange-600 text-white rounded-lg">
        Return Home
      </Link>
    </div>
  );
}
