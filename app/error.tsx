"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p className="text-gray-800">Something went wrong loading this page.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-500"
      >
        Try again
      </button>
    </div>
  );
}
