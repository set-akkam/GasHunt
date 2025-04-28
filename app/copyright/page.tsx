"use client";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import { useState, FormEvent, useEffect } from "react";
import { useLanguage } from "../providers/LanguageProvider";
import { useAuth } from "../providers/AuthProvider";

interface DMCAFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Translations {
  copyright: {
    title: string;
    subtitle: string;
    sections: {
      ownership: {
        title: string;
        content: string;
      };
      userContent: {
        title: string;
        content: string;
      };
      thirdParty: {
        title: string;
        content: string;
      };
    };
    contact: {
      title: string;
      content: string;
      button: string;
    };
  };
}

// DMCA Form Modal Component
const DMCAFormModal = ({ isOpen, onClose }: DMCAFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    contactInfo: "",
    goodFaithStatement: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const generateTicketNumber = () => {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `DMCA-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Generate a ticket number
    const newTicketNumber = generateTicketNumber();
    setTicketNumber(newTicketNumber);

    // Create ticket data
    const ticketData = {
      ticketNumber: newTicketNumber,
      submittedAt: new Date().toISOString(),
      status: "pending" as const,
      userName: user?.name || formData.contactInfo.split('\n')[0] || 'Anonymous',
      userEmail: user?.email || '',
      description: formData.description,
      location: formData.location,
      contactInfo: formData.contactInfo
    };

    // Get existing tickets from localStorage
    const existingTickets = JSON.parse(localStorage.getItem('dmcaTickets') || '[]');
    
    // Add new ticket
    localStorage.setItem('dmcaTickets', JSON.stringify([...existingTickets, ticketData]));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setTicketNumber(null);
    setFormData({
      description: "",
      location: "",
      contactInfo: "",
      goodFaithStatement: false
    });
    onClose();
  };

  if (!isOpen) return null;

  if (ticketNumber) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#1c7b47]">DMCA Notice Submitted Successfully</h2>
            <p className="text-gray-600 mb-4">Your ticket number is:</p>
            <p className="text-xl font-mono font-bold mb-6 text-[#1c7b47]">{ticketNumber}</p>
            <p className="text-gray-600 mb-6">
              Please save this number for your records. Our legal team will review your notice and contact you within 2-3 business days.
            </p>
            <button
              onClick={handleClose}
              className="bg-[#1c7b47] text-white px-6 py-2 rounded-lg hover:bg-[#156a3d] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-[#1c7b47]">Submit DMCA Takedown Notice</h2>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Warning: Submitting a false DMCA notice may lead to legal consequences. Please ensure all information provided is accurate and truthful.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Description of Copyrighted Work
            </label>
            <textarea
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1c7b47] focus:border-transparent"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the copyrighted work being infringed..."
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Location of Infringing Material
            </label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1c7b47] focus:border-transparent"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="URL or description of where the infringing content is located"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Your Contact Information
            </label>
            <textarea
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1c7b47] focus:border-transparent"
              rows={3}
              value={formData.contactInfo}
              onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
              placeholder={user ? `Name: ${user.name}\nEmail: ${user.email}\nAdditional contact info...` : "Your name, address, phone number, and email..."}
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              required
              checked={formData.goodFaithStatement}
              onChange={(e) => setFormData({...formData, goodFaithStatement: e.target.checked})}
              className="mt-1"
            />
            <label className="text-gray-700">
              I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
            </label>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#1c7b47] text-white rounded-lg hover:bg-[#156a3d] transition flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit DMCA Notice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Copyright() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load translations
    fetch(`/locales/${language}/common.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Error loading translations:', err));
  }, [language]);

  if (!translations) {
    return null; // Or a loading spinner
  }

  const sections = [
    {
      title: translations.copyright.sections.ownership.title,
      content: translations.copyright.sections.ownership.content
    },
    {
      title: translations.copyright.sections.userContent.title,
      content: translations.copyright.sections.userContent.content
    },
    {
      title: translations.copyright.sections.thirdParty.title,
      content: translations.copyright.sections.thirdParty.content
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6e6e6] to-white">
      {/* Hero Section */}
      <div className="w-full bg-[#1c7b47] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h1
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-4xl md:text-5xl font-bold mb-4 text-white text-center"
          >
            {translations.copyright.title}
          </motion.h1>
          <motion.p
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-xl text-red-200 text-center max-w-3xl mx-auto"
          >
            {translations.copyright.subtitle}
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="space-y-8"
        >
          {sections.map((section, index) => (
            <motion.div
              key={index}
              variants={fadeInFromBottom}
              custom={index * 0.2}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition duration-300"
            >
              <h2 className="text-2xl font-bold mb-4 text-[#1c7b47]">{section.title}</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* DMCA Section */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="mt-16"
        >
          <motion.div
            variants={fadeInFromBottom}
            custom={1}
            className="bg-[#1c7b47] rounded-xl p-8 text-center"
          >
            <h2 className="text-2xl font-bold mb-4 text-white">{translations.copyright.contact.title}</h2>
            <p className="text-red-200 mb-6 max-w-2xl mx-auto">
              {translations.copyright.contact.content}
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-[#1c7b47] px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#e6e6e6] transition"
            >
              {translations.copyright.contact.button}
            </button>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            variants={fadeInFromBottom}
            custom={1.2}
            className="mt-8 text-center"
          >
            <p className="text-gray-700 mb-2">
              For copyright inquiries, please contact:
            </p>
            <p className="text-[#1c7b47] font-semibold">
              copyright@gashunt.com
            </p>
            <p className="text-gray-600 mt-6">
              Last updated: March 27, 2024
            </p>
          </motion.div>
        </motion.div>

        <DMCAFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
} 