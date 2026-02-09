'use client';
import React, { useState, useEffect } from 'react';
import Preloader from '../components/Preloader';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 100 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const Features = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Preloader />;

  const coreFeatures = [
  {
    icon: "🎓",
    title: "Complete University Coverage",
    description: "All faculties covered - Engineering, Medicine, Business, Architecture, IT, and beyond! Every department, every semester, every module.",
    highlight: "100% Free Access"
  },
  {
    icon: "🌍",
    title: "Multilingual Support",
    description: "Learn in your comfort zone! Content available in Sinhala, Tamil, and English - because knowledge shouldn&apos;t have language barriers.",
    highlight: "Three Languages"
  },
  {
    icon: "📱",
    title: "Access Anywhere",
    description: "Web platform, mobile app (APK available), and GitHub repository - study on your phone, laptop, or contribute to the codebase!",
    highlight: "Cross-Platform"
  },
  {
    icon: "🔓",
    title: "No Barriers Entry",
    description: "No login required, no paywalls, no premium accounts. Just pure, accessible education for every Sri Lankan student.",
    highlight: "Open Access"
  }
];


  const contentTypes = [
    {
      icon: "🎥",
      title: "Kuppi Videos",
      description: "Student-taught video sessions where complex topics become crystal clear",
      examples: ["Lecture explanations", "Concept breakdowns", "Problem-solving sessions"]
    },
    {
      icon: "📚",
      title: "Study Materials",
      description: "Comprehensive notes and resources created by students who aced the subjects",
      examples: ["Handwritten notes", "Digital summaries", "Quick reference guides"]
    },
    {
      icon: "📖",
      title: "Student Books",
      description: "Recommended textbooks and reference materials shared by the community",
      examples: ["Course textbooks", "Reference materials", "Supplementary readings"]
    },
    {
      icon: "❓",
      title: "Model Questions",
      description: "Practice makes perfect! Past papers and model questions to test your knowledge",
      examples: ["Past exam papers", "Practice questions", "Sample solutions"]
    }
  ];

  const contributionWays = [
  {
    step: "01",
    title: "Share Your Kuppi",
    description: "Upload videos, notes, or materials via @KuppihubBot on Telegram or provide YouTube links",
    action: "Submit Content",
    link: "https://t.me/KuppihubBot"
  },
  {
    step: "02",
    title: "Create Your Profile",
    description: "Become a recognized Kuppi teacher - build your reputation in the community",
    action: "Build Profile",
    link: "/add-kuppi" // replace with your actual route
  },
  {
    step: "03",
    title: "Code Contributions",
    description: "Fork our GitHub repo, add features, and submit pull requests to improve the platform",
    action: "Contribute Code",
    link: "https://github.com/kuppihub"
  },
  {
    step: "04",
    title: "Community Building",
    description: "Spread the word, help organize content, and grow the Sri Lankan student community",
    action: "Join Movement",
    link: "/add-kuppi" // replace with your actual route
  }
];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Hero Section */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <div className=" text-gray-800 p-6 md:p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl md:text-4xl font-bold mb-6">
              Features That Make Us Special ✨
            </h1>
            {/* <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-4xl mx-auto">
              Built by University of Moratuwa CSE23 batch students, for ALL Sri Lankan university students. 
              Because education should be free, accessible, and community-driven!
            </p> */}
          </div>
        </motion.section>

        {/* Core Features */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 ">
            🚀 Core Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white/80 backdrop-blur-lg p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:bg-white/90 group"
              >
                <div className="flex items-start mb-4">
                  <span className="text-5xl mr-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-500 px-3 py-1 rounded-full text-sm font-medium">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Content Types */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12  bg-clip-text ">
            📚 What You Can Find & Share
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {contentTypes.map((type, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:bg-white/90 group"
              >
                <div className="text-center mb-4">
                  <span className="text-4xl block mb-2 transform group-hover:scale-110 transition-transform duration-300">
                    {type.icon}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-400 transition-colors">
                    {type.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {type.description}
                </p>
                <div className="space-y-2">
                  {type.examples.map((example, idx) => (
                    <div key={idx} className="flex items-center text-xs text-gray-500">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      {example}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How to Contribute */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text ">
            🤝 How You Can Contribute
          </h2>
     <div className="grid gap-6 md:grid-cols-2">
  {contributionWays.map((way, index) => (
    <motion.div
      key={index}
      variants={fadeUp}
      className="bg-white/80 backdrop-blur-lg p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 hover:bg-white/90 group"
    >
      <div className="flex items-start">
        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mr-6 group-hover:scale-110 transition-transform duration-300">
          {way.step}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-400 transition-colors">
            {way.title}
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed group-hover:text-gray-900 transition-colors">
            {way.description}
          </p>
          {/* Action Button */}
          <a
            href={way.link}
            target={way.link.startsWith("http") ? "_blank" : "_self"}
            rel={way.link.startsWith("http") ? "noopener noreferrer" : ""}
            className="inline-block bg-blue-100 text-blue-500 px-4 py-2 rounded-lg text-sm font-medium group-hover:bg-blue-200 transition-colors"
          >
            {way.action}
          </a>
        </div>
      </div>
    </motion.div>
  ))}
</div>
        </motion.section>

        {/* Organization Structure */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className=" text-gray-800 p-8 rounded-xl shadow-xl">
            <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
              🗂️ How We Organize Everything
            </h2>
            <div className="grid gap-6 md:grid-cols-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl mb-2">🏛️</div>
                <h3 className="font-bold mb-2">Faculty</h3>
                <p className="text-gray-600 text-sm">Engineering, Medicine, Business, Architecture, IT...</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-bold mb-2">Department</h3>
                <p className="text-gray-800 text-sm">Computer Science, Civil, Mechanical, etc.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-bold mb-2">Semester</h3>
                <p className="text-gray-800 text-sm">Year 1 Sem 1, Year 2 Sem 2, etc.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="text-3xl mb-2">📚</div>
                <h3 className="font-bold mb-2">Module</h3>
                <p className="text-gray-800 text-sm">Individual subjects with their Kuppis</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Vision Statement */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="bg-white/80 backdrop-blur-lg p-8 md:p-12 rounded-xl shadow-xl border border-white/50 text-center">
            <h2 className="text-3xl font-bold mb-6 bg-clip-text ">
              🇱🇰 Our Vision for Sri Lanka
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-4xl mx-auto mb-6">
              Together we learn, together we grow, together we build the future of Sri Lanka. 
              Every student helping every student - because when we share knowledge, we multiply success.
            </p>
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-lg">
              <p className="text-blue-500 font-medium">
                &quot;Empowering Sri Lankan students to face the future world as knowledgeable, 
                united, and unstoppable individuals who lift each other up!&quot;
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-green-500 to-blue-400 text-white p-8 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Ready to Join the Revolution? 🚀</h2>
            <p className="text-green-100 mb-6">
              Whether you need help or want to help others - there&apos;s a place for you in Kuppi Hub!
            </p>
      <div className="space-y-4">
  {/* Email */}
  <p className="text-white font-medium">
    📧 Contact:{" "}
    <a
      href="mailto:kuppihub@cse23.org"
      className="underline hover:text-blue-200"
    >
      kuppihub@cse23.org
    </a>
  </p>

  {/* Telegram Bot */}
  <p className="text-white font-medium">
    🤖 Telegram Bot:{" "}
    <a
      href="https://t.me/KuppihubBot"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-blue-200"
    >
      @KuppihubBot
    </a>
  </p>

  {/* GitHub */}
  <p className="text-green-100 text-sm italic">
    P.S: We&apos;re open source on{" "}
    <a
      href="https://github.com/kuppihub"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-green-200"
    >
      GitHub
    </a>{" "}
    - come build the future with us! 💻
  </p>
</div>

          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Features;