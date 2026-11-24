export const dummySalonSettings = {
  salonName: "Royal Grooming Lounge",
  salonNameGu: "રોયલ ગ્રુમિંગ લાઉન્જ",
  tagline: "Premium Haircuts & Grooming",
  taglineGu: "પ્રીમિયમ હેરકટ અને ગ્રુમિંગ",
  isQueueOpen: true,
  openingHours: "9:00 AM - 9:00 PM",
  maxCapacity: 25,
  bufferMinutes: 5,
  avgWaitMinutes: 20,
  currentlyWaiting: 3,
  activeBarbersCount: 3,
};

// 3 Sample Barbers requested by user: Ravi, Amit, and Imran
export const dummyBarbers = [
  {
    id: 'barber-ravi',
    name: 'Ravi',
    nameGu: 'રવિ',
    chair: 1,
    status: 'active',
    specialty: 'Master Stylist & Beard Specialist',
    specialtyGu: 'માસ્ટર સ્ટાઈલિસ્ટ અને દાઢી નિષ્ણાત',
    experience: '6 Years',
    avatar: '✂️'
  },
  {
    id: 'barber-amit',
    name: 'Amit',
    nameGu: 'અમિત',
    chair: 2,
    status: 'active',
    specialty: 'Classic Cuts & Fades',
    specialtyGu: 'ક્લાસિક કટ અને ફેડ્સ',
    experience: '4 Years',
    avatar: '💈'
  },
  {
    id: 'barber-imran',
    name: 'Imran',
    nameGu: 'ઇમરાન',
    chair: 3,
    status: 'active',
    specialty: 'Hair Color & Styling Expert',
    specialtyGu: 'હેર કલર અને સ્ટાઇલિંગ નિષ્ણાત',
    experience: '5 Years',
    avatar: '✂️'
  }
];

export const dummyServices = [
  {
    id: 'srv-1',
    name_en: 'Signature Haircut',
    name_gu: 'સિગ્નેચર હેરકટ',
    duration: 30,
    price: 200,
    category: 'Hair',
    description_en: 'Consultation, wash, precision cut, and styling.',
    description_gu: 'કન્સલ્ટેશન, વૉશ, પ્રિસિઝન કટ અને સ્ટાઈલિંગ.'
  },
  {
    id: 'srv-2',
    name_en: 'Beard Trim & Shape',
    name_gu: 'દાઢી ટ્રીમ અને શેપ',
    duration: 20,
    price: 150,
    category: 'Beard',
    description_en: 'Razor line-up, hot towel prep, and oil treatment.',
    description_gu: 'રેઝર લાઇન-અપ, ગરમ ટુવાલ પ્રેપ અને ઓઇલ ટ્રીટમેન્ટ.'
  },
  {
    id: 'srv-3',
    name_en: 'Refreshing Hair Wash & Style',
    name_gu: 'હેર વૉશ અને બ્લો-ડ્રાય',
    duration: 15,
    price: 120,
    category: 'Hair',
    description_en: 'Deep scalp cleansing, conditioning, and blow-dry.',
    description_gu: 'સ્કેલ્પ ક્લીન્ઝિંગ, કન્ડિશનિંગ અને બ્લો-ડ્રાય.'
  },
  {
    id: 'srv-4',
    name_en: 'Herbal Head Massage',
    name_gu: 'હર્બલ હેડ મસાજ',
    duration: 20,
    price: 180,
    category: 'Spa',
    description_en: 'Relaxing hot almond oil head and shoulder pressure point massage.',
    description_gu: 'ગરમ બદામ તેલથી માથા અને ખભાની આરામદાયક માલિશ.'
  },
  {
    id: 'srv-5',
    name_en: 'Face D-Tan & Scrub',
    name_gu: 'ફેસ ડી-ટેન અને સ્ક્રબ',
    duration: 30,
    price: 350,
    category: 'Facial',
    description_en: 'Skin brightening herbal pack with steam and exfoliating scrub.',
    description_gu: 'સ્ટીમ અને સ્ક્રબ સાથે સ્કીન બ્રાઇટનિંગ હર્બલ પેક.'
  },
  {
    id: 'srv-6',
    name_en: 'Hair Color / Highlights',
    name_gu: 'હેર કલર / હાઇલાઇટ્સ',
    duration: 45,
    price: 500,
    category: 'Color',
    description_en: 'Ammonia-free organic color touch-up and wash.',
    description_gu: 'એમોનિયા-મુક્ત ઓર્ગેનિક કલર ટચ-અપ અને વૉશ.'
  }
];

// Initial Dummy Queue with S-1, S-2, S-3 format
export const dummyQueueTokens = [
  {
    id: 'tok-1',
    tokenNumber: 'S-1',
    customerName: 'Aarav Patel',
    phone: '9876543210',
    barberId: 'barber-ravi',
    barberName: 'Ravi',
    chair: 1,
    status: 'called',
    source: 'online',
    services: ['Signature Haircut'],
    totalDuration: 30,
    totalPrice: 200,
    joinedAt: '11:15 AM',
    position: 1,
    estimatedWaitMinutes: 0,
  },
  {
    id: 'tok-2',
    tokenNumber: 'S-2',
    customerName: 'Jignesh Shah',
    phone: '9825123456',
    barberId: 'barber-amit',
    barberName: 'Amit',
    chair: 2,
    status: 'waiting',
    source: 'online',
    services: ['Signature Haircut', 'Beard Trim & Shape'],
    totalDuration: 50,
    totalPrice: 350,
    joinedAt: '11:30 AM',
    position: 2,
    estimatedWaitMinutes: 12,
  },
  {
    id: 'tok-3',
    tokenNumber: 'S-3',
    customerName: 'Ketan Trivedi',
    phone: '9909099090',
    barberId: 'barber-imran',
    barberName: 'Imran',
    chair: 3,
    status: 'waiting',
    source: 'online',
    services: ['Beard Trim & Shape'],
    totalDuration: 20,
    totalPrice: 150,
    joinedAt: '11:45 AM',
    position: 3,
    estimatedWaitMinutes: 25,
  }
];
