'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Calendar,
  User,
  Stethoscope,
  Award,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { doctorsApi } from '@/services/api/doctors';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import DoctorChatBot from '@/components/ui/DoctorChatBot';
import type { DoctorResponse, DoctorSearchResponse } from '@/types/api';

// Mock data for offline functionality
const mockDoctors: DoctorResponse[] = [
  {
    id: '1',
    name: 'Adaora Okafor',
    email: 'adaora.okafor@clinicmail.com',
    phone_number: '+234-803-123-4567',
    specialization: 'Obstetrics & Gynecology',
    location: 'Lagos, Nigeria',
    availability_status: 'available',
    consultation_fee: 15000,
    rating: 4.8,
    experience_years: 12,
    years_of_experience: 12,
    bio: 'Specialist in maternal health and pregnancy care with over 12 years of experience.',
    education: 'MBBS, University of Lagos; MD, Johns Hopkins',
    hospital_affiliation: 'Lagos University Teaching Hospital',
    hospital: 'Lagos University Teaching Hospital',
    consultation_hours: '8:00 AM - 6:00 PM',
    license_number: 'MD-LAG-12345',
    languages: ['English', 'Yoruba'],
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Emeka Nwankwo',
    email: 'emeka.nwankwo@medicenter.com',
    phone_number: '+234-805-987-6543',
    specialization: 'Pediatrics',
    location: 'Abuja, Nigeria',
    availability_status: 'busy',
    consultation_fee: 12000,
    rating: 4.6,
    experience_years: 8,
    years_of_experience: 8,
    bio: 'Pediatric specialist focusing on child health and development.',
    education: 'MBBS, University of Nigeria; Pediatric Fellowship',
    hospital_affiliation: 'National Hospital Abuja',
    hospital: 'National Hospital Abuja',
    consultation_hours: '9:00 AM - 5:00 PM',
    license_number: 'MD-ABJ-23456',
    languages: ['English', 'Igbo'],
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Fatima Ibrahim',
    email: 'fatima.ibrahim@healthcenter.ng',
    phone_number: '+234-807-456-1234',
    specialization: 'Family Medicine',
    location: 'Kano, Nigeria',
    availability_status: 'available',
    consultation_fee: 10000,
    rating: 4.7,
    experience_years: 15,
    years_of_experience: 15,
    bio: 'Family medicine practitioner with expertise in primary care and preventive medicine.',
    education: 'MBBS, Ahmadu Bello University',
    hospital_affiliation: 'Aminu Kano Teaching Hospital',
    hospital: 'Aminu Kano Teaching Hospital',
    consultation_hours: '7:00 AM - 7:00 PM',
    license_number: 'MD-KAN-34567',
    languages: ['English', 'Hausa'],
    created_at: new Date().toISOString(),
  }
];

const mockSpecializations = [
  'Obstetrics & Gynecology',
  'Pediatrics', 
  'Family Medicine',
  'Internal Medicine',
  'Cardiology',
  'Dermatology',
  'Psychiatry'
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();
  }, []);

  const fetchDoctors = async (filters?: {
    specialization?: string;
    location?: string;
    availability_status?: string;
  }) => {
    try {
      setLoading(true);
      console.log('[Doctors] Fetching doctors with filters:', filters);
      
      const response = await doctorsApi.getAll({
        ...filters,
        limit: 20,
      });
      
      console.log('[Doctors] API response:', response);
      
      if (response.data) {
        setDoctors(response.data.results);
        console.log('[Doctors] Set doctors from API:', response.data.results.length);
      } else {
        // Fallback with mock data if API fails
        setDoctors(mockDoctors);
        addToast('Using sample data - API connection pending', 'info');
        console.log('[Doctors] Using mock data - no API response');
      }
    } catch (error) {
      console.error('[Doctors] Error fetching doctors:', error);
      setDoctors(mockDoctors);
      addToast('Using sample data - Check your connection', 'error');
      console.log('[Doctors] Using mock data due to error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      console.log('[Doctors] Fetching specializations');
      const response = await doctorsApi.getSpecializations();
      console.log('[Doctors] Specializations response:', response);
      
      if (response.data) {
        setSpecializations(response.data);
      } else {
        setSpecializations(mockSpecializations);
        console.log('[Doctors] Using mock specializations - no API response');
      }
    } catch (error) {
      console.error('[Doctors] Error fetching specializations:', error);
      setSpecializations(mockSpecializations);
      console.log('[Doctors] Using mock specializations due to error');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDoctors({
        specialization: selectedSpecialization,
        location: selectedLocation,
        availability_status: availabilityFilter,
      });
      return;
    }

    try {
      setIsSearching(true);
      const response = await doctorsApi.search(searchQuery);
      if (response.data) {
        setDoctors(response.data.results);
      }
    } catch (error) {
      addToast('Search failed. Please try again.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = () => {
    fetchDoctors({
      specialization: selectedSpecialization,
      location: selectedLocation,
      availability_status: availabilityFilter,
    });
  };

  const handleConsultationRequest = async (doctorId: string, message: string) => {
    if (!user) {
      addToast('Please log in to request consultation', 'error');
      return;
    }

    try {
      const response = await doctorsApi.requestConsultation(doctorId, {
        doctor_id: doctorId,
        message: message,
        urgency_level: 'medium'
      });

      if (response.data) {
        addToast('Consultation request sent successfully! 🩺', 'success');
      }
    } catch (error) {
      addToast('Failed to send consultation request', 'error');
      console.error('Consultation request error:', error);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-orange-600 bg-orange-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAvailabilityStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Find Qualified Doctors
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Connect with certified medical professionals for expert consultation
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search doctors, specializations, or hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {isSearching ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Specialization
                      </label>
                      <select
                        value={selectedSpecialization}
                        onChange={(e) => {
                          setSelectedSpecialization(e.target.value);
                          setTimeout(handleFilterChange, 100);
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Specializations</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="Enter location"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Availability
                      </label>
                      <select
                        value={availabilityFilter}
                        onChange={(e) => {
                          setAvailabilityFilter(e.target.value);
                          setTimeout(handleFilterChange, 100);
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Doctors</option>
                        <option value="available">Available Now</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No doctors found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
                {/* Doctor Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      {doctor.profile_image ? (
                        <img
                          src={doctor.profile_image}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        doctor.availability_status === 'available' ? 'bg-green-500' :
                        doctor.availability_status === 'busy' ? 'bg-orange-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        Dr. {doctor.name}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {doctor.specialization}
                      </p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getAvailabilityColor(doctor.availability_status)}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {formatAvailabilityStatus(doctor.availability_status)}
                      </div>
                    </div>
                  </div>

                  {/* Rating and Experience */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {doctor.rating?.toFixed(1) || '4.8'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({Math.floor(Math.random() * 50) + 10} reviews)
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Award className="w-4 h-4 mr-1" />
                      {doctor.years_of_experience || 8}+ years
                    </div>
                  </div>

                  {/* Hospital and Location */}
                  {doctor.hospital && (
                    <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {doctor.hospital}
                      {doctor.location && `, ${doctor.location}`}
                    </div>
                  )}

                  {/* Consultation Fee */}
                  {doctor.consultation_fee && (
                    <div className="mt-3 text-lg font-semibold text-green-600 dark:text-green-400">
                      ₦{doctor.consultation_fee.toLocaleString()} consultation
                    </div>
                  )}
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                  {expandedDoctor === doctor.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-4"
                    >
                      {doctor.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {doctor.bio}
                        </p>
                      )}
                      
                      {doctor.languages && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Languages:</p>
                          <div className="flex flex-wrap gap-1">
                            {doctor.languages.map((lang) => (
                              <span
                                key={lang}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        {doctor.license_number && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <span className="font-medium mr-2">License:</span>
                            {doctor.license_number}
                          </div>
                        )}
                        {doctor.email && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            {doctor.email}
                          </div>
                        )}
                        {doctor.phone_number && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            {doctor.phone_number}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      {expandedDoctor === doctor.id ? 'Show Less' : 'View Details'}
                    </button>
                    <button
                      onClick={() => handleConsultationRequest(doctor.id, 'I would like to schedule a consultation')}
                      disabled={doctor.availability_status === 'offline'}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Consult
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Doctor Chatbot */}
      <DoctorChatBot
        onRequestConsultation={(message) => {
          if (doctors.length > 0) {
            const availableDoctor = doctors.find(d => d.availability_status === 'available');
            if (availableDoctor) {
              handleConsultationRequest(availableDoctor.id, message);
            } else {
              addToast('No doctors currently available. We\'ll connect you with the next available doctor.', 'info');
            }
          }
        }}
      />
    </div>
  );
}