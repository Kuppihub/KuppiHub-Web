"use client";

import { useEffect, useState } from "react";
import Preloader from "../components/Preloader";
import Image from "next/image";
import { motion } from "framer-motion";

interface Student {
  id: number;
  name: string;
  image_url: string | null;
  linkedin_url: string | null;
  faculty: string;
  department: string;
  video_count: number;
  modules_done: string[];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("./api/tutors"); // adjust endpoint if needed
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        // Sort: tutors with images first, then by kuppi count desc
        const sortedStudents = data.students.sort((a: Student, b: Student) => {
          const aHasImage = Boolean(a.image_url);
          const bHasImage = Boolean(b.image_url);
          if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;
          return b.video_count - a.video_count;
        });
        setStudents(sortedStudents);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) return <Preloader />;
  if (error) return <p className="text-red-500 text-center mt-4">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Students Who Did Kuppi
          </span>💙
        </h1>

        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          A big shoutout to students who completed Kuppi sessions! Your efforts and dedication are inspiring.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {students.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-300"
            >
              <div className="relative aspect-square w-full overflow-hidden">
<Image
  src={
    student.image_url
      ? decodeURIComponent(student.image_url) // fix double encoding
      : "/tutor.png" // fallback if null
  }
  alt={student.name}
  fill
  className="object-cover rounded-full"
/>


              </div>

              <div className="p-4">
                <h2 className="text-base font-semibold text-gray-800 text-center">
                  {student.name}
                </h2>
                <p className="text-xs text-gray-600 mt-1 mb-1 text-center">
                  {student.faculty} - {student.department}
                </p>
                <p className="text-xs text-gray-500 mb-3 text-center">
                  Done: {student.video_count} Kuppis
                </p>

                {student.modules_done.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-gray-600">
                    {student.modules_done.map((module, idx) => (
                      <li key={idx}>{module}</li>
                    ))}
                  </ul>
                )}

                {student.linkedin_url && (
                  <div className="text-center mt-4">
                    <a
                      href={student.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs hover:bg-blue-700 transition"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
