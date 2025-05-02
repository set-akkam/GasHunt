// DMCA Ticket Management Page
// This page provides an admin interface for managing DMCA takedown requests
"use client";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../../animations/variants";
import { useState, useEffect } from "react";
import Link from 'next/link';

// Interface defining the structure of a DMCA ticket
interface DMCATicket {
  ticketNumber: string;      // Unique identifier for the ticket
  submittedAt: string;       // Timestamp of submission
  status: "pending" | "in_review" | "resolved" | "rejected";  // Current status of the ticket
  userName: string;          // Name of the submitter
  userEmail: string;         // Email of the submitter
  description: string;       // Description of the copyright infringement
  location: string;          // URL or location of infringing material
  contactInfo: string;       // Additional contact information
}

export default function DMCATicketsPage() {
  // State management for tickets and UI
  const [tickets, setTickets] = useState<DMCATicket[]>([]);  // List of all DMCA tickets
  const [filter, setFilter] = useState<"all" | "pending" | "in_review" | "resolved" | "rejected">("all");  // Current filter selection
  const [selectedTicket, setSelectedTicket] = useState<DMCATicket | null>(null);  // Currently selected ticket for detailed view
  const [isLoading, setIsLoading] = useState(true);  // Loading state indicator

  // Load tickets from localStorage on component mount
  useEffect(() => {
    const loadTickets = () => {
      const storedTickets = JSON.parse(localStorage.getItem('dmcaTickets') || '[]');
      setTickets(storedTickets);
      setIsLoading(false);
    };

    loadTickets();

    // Listen for storage changes to sync across tabs
    window.addEventListener('storage', loadTickets);
    return () => window.removeEventListener('storage', loadTickets);
  }, []);

  // Filter tickets based on current filter selection
  const filteredTickets = filter === "all" 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filter);

  // Get appropriate color classes based on ticket status
  const getStatusColor = (status: DMCATicket["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_review": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
    }
  };

  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Update ticket status and persist to localStorage
  const updateTicketStatus = (ticketNumber: string, newStatus: DMCATicket["status"]) => {
    const updatedTickets = tickets.map(t => 
      t.ticketNumber === ticketNumber 
        ? { ...t, status: newStatus }
        : t
    );
    setTickets(updatedTickets);
    localStorage.setItem('dmcaTickets', JSON.stringify(updatedTickets));
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e6e6e6] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1c7b47]"></div>
      </div>
    );
  }

  // Main page layout
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6e6e6] to-white">
      {/* Hero section with page title */}
      <div className="w-full bg-[#1c7b47] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h1
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-3xl md:text-4xl font-bold mb-4 text-white text-center"
          >
            DMCA Ticket Management
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Button to submit new DMCA notice */}
        <div className="mb-8">
          <Link 
            href="/copyright" 
            className="inline-block bg-[#1c7b47] text-white px-6 py-3 rounded-lg hover:bg-[#156a3d] transition"
          >
            Submit New DMCA Notice
          </Link>
        </div>

        {/* Status filter buttons */}
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
          {["all", "pending", "in_review", "resolved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status 
                  ? "bg-[#1c7b47] text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Empty state message */}
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-600 mb-4">No DMCA tickets submitted yet</h3>
            <p className="text-gray-500">
              Submit a new DMCA notice using the button above.
            </p>
          </div>
        ) : (
          /* Tickets list with status cards */
          <div className="grid grid-cols-1 gap-6">
            {filteredTickets.map((ticket) => (
              <motion.div
                key={ticket.ticketNumber}
                variants={fadeInFromBottom}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1c7b47] mb-2">
                      {ticket.ticketNumber}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Submitted on {formatDate(ticket.submittedAt)}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ").charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-[#1c7b47] text-white px-4 py-2 rounded-lg hover:bg-[#156a3d] transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600"><span className="font-medium">Submitted by:</span> {ticket.userName}</p>
                    <p className="text-gray-600"><span className="font-medium">Email:</span> {ticket.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><span className="font-medium">Location:</span> {ticket.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1c7b47] mb-2">{selectedTicket.ticketNumber}</h2>
                <p className="text-gray-500">Submitted on {formatDate(selectedTicket.submittedAt)}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Status update section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as DMCATicket["status"];
                    updateTicketStatus(selectedTicket.ticketNumber, newStatus);
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                  }}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Submitter information section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Submitter Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Name:</span> {selectedTicket.userName}</p>
                  <p><span className="font-medium">Email:</span> {selectedTicket.userEmail}</p>
                  <p className="whitespace-pre-wrap"><span className="font-medium">Contact Info:</span> {selectedTicket.contactInfo}</p>
                </div>
              </div>

              {/* Complaint details section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-4"><span className="font-medium">Description:</span></p>
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Location of infringing material section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Location of Infringing Material</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="break-all">{selectedTicket.location}</p>
                </div>
              </div>

              {/* Modal action buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  className="px-6 py-2 bg-[#1c7b47] text-white rounded-lg hover:bg-[#156a3d] transition"
                >
                  Send Update Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 