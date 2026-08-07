"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Preloader from "../components/Preloader";
import { optionalAuthFetch } from "@/lib/auth-fetch";
interface Kuppi {
  id: number;
  moduleId: number;
  title: string;
  description: string;
}

export default function ModuleKuppiPage() {
  const params = useParams();
  const moduleId = params?.moduleId;
  const [kuppis, setKuppis] = useState<Kuppi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleId) return;
    optionalAuthFetch(`/api/kuppis?moduleId=${moduleId}`)
      .then((res) => res.json())
      .then((data) => setKuppis(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) return <Preloader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Available Kuppis</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kuppis.map((kuppi) => (
          <div
            key={kuppi.id}
            className="p-4 bg-white shadow rounded-xl hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{kuppi.title}</h2>
            <p className="text-gray-600">{kuppi.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
