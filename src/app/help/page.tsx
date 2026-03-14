import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help | Kuppi Hub",
  description: "Help center for Kuppi Hub.",
};

export default function HelpPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-gray-600 mb-8">
        Guides and tutorials to help you use Kuppi Hub.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">How to Add a New Kuppi</h2>
        <p className="text-sm text-gray-600 mb-4">
          Watch this short guide to learn how to create and upload a new Kuppi.
        </p>
        <div className="w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-md bg-black aspect-video">
          <video className="w-full h-full object-contain" controls preload="metadata">
            <source
              src="https://github.com/Kuppihub/CDN/releases/download/v1.0.0/how-add-new-kuppi.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      <p className="text-sm text-gray-600">
        Return to <Link className="text-blue-600 hover:underline" href="/">Home</Link>.
      </p>
    </main>
  );
}
