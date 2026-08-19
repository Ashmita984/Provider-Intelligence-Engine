import type { Provider } from '../types';

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'US10230946',
    npi: '1023094653',
    name: 'Dr. Sarah L. Jenkins, MD, FACC',
    title: 'Chief Senior Cardiologist',
    specialty: 'Cardiology',
    subSpecialty: 'Interventional Cardiology & Echocardiography',
    clinicName: 'Michigan Medicine - Frankel Cardiovascular Center',
    address: '1500 E Medical Center Dr',
    city: 'Ann Arbor',
    state: 'MI',
    zipCode: '48109',
    phone: '+1 (734) 555-0198',
    email: 'sjenkins@med.umich.edu',
    rating: 4.9,
    reviewCount: 428,
    distanceMiles: 1.8,
    networkTier: 'Tier 1 Preferred',
    acceptingNewPatients: true,
    telehealthAvailable: true,
    nextAvailableSlot: 'Tomorrow at 10:30 AM',
    languages: ['English', 'Spanish'],
    lat: 42.2828,
    lng: -83.7289,
    certifications: ['American Board of Internal Medicine - Cardiology', 'FACC (Fellow of ACC)'],
    hospitalAffiliation: 'University of Michigan Health'
  },
  {
    id: 'US10738868',
    npi: '1073886875',
    name: 'Dr. Marcus A. Vance, MD, FACP',
    title: 'Senior Cardiac & Vascular Specialist',
    specialty: 'Cardiology',
    subSpecialty: 'Adult Structural Heart Disease',
    clinicName: 'Detroit Medical Center (DMC) Heart Hospital',
    address: '311 Mack Ave',
    city: 'Detroit',
    state: 'MI',
    zipCode: '48201',
    phone: '+1 (313) 555-0142',
    email: 'mvance@dmc.org',
    rating: 4.85,
    reviewCount: 312,
    distanceMiles: 1.4,
    networkTier: 'Tier 1 Preferred',
    acceptingNewPatients: true,
    telehealthAvailable: true,
    nextAvailableSlot: 'Thursday at 2:00 PM',
    languages: ['English'],
    lat: 42.3486,
    lng: -83.0567,
    certifications: ['ABIM Cardiovascular Disease', 'FSCAI Member'],
    hospitalAffiliation: 'DMC Harper University Hospital'
  },
  {
    id: 'US18819403',
    npi: '1881940369',
    name: 'Dr. Elena R. Morales, MD',
    title: 'Director of Clinical Neurosciences',
    specialty: 'Neurology',
    subSpecialty: 'Stroke, Epilepsy & Cognitive Disorders',
    clinicName: 'Texas Medical Center - Houston Methodist Neurological Institute',
    address: '6565 Fannin St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77030',
    phone: '+1 (713) 555-0177',
    email: 'emorales@houstonmethodist.org',
    rating: 4.9,
    reviewCount: 512,
    distanceMiles: 3.5,
    networkTier: 'Tier 1 Preferred',
    acceptingNewPatients: true,
    telehealthAvailable: true,
    nextAvailableSlot: 'Friday at 9:15 AM',
    languages: ['English', 'Spanish'],
    lat: 29.7108,
    lng: -95.3995,
    certifications: ['American Board of Psychiatry and Neurology', 'UCNS Certified'],
    hospitalAffiliation: 'Houston Methodist Hospital'
  },
  {
    id: 'US11442998',
    npi: '1144299831',
    name: 'Dr. Christopher B. Hayes, MD',
    title: 'Chief Joint Replacement Surgeon',
    specialty: 'Orthopedics',
    subSpecialty: 'Robotic Knee & Spine Surgery',
    clinicName: 'UNC Health Rex Orthopedics',
    address: '4420 Lake Boone Trail',
    city: 'Raleigh',
    state: 'NC',
    zipCode: '27607',
    phone: '+1 (919) 555-0123',
    email: 'chayes@unchealth.unc.edu',
    rating: 4.75,
    reviewCount: 289,
    distanceMiles: 4.2,
    networkTier: 'Tier 1 Preferred',
    acceptingNewPatients: true,
    telehealthAvailable: false,
    nextAvailableSlot: 'Monday at 11:00 AM',
    languages: ['English'],
    lat: 35.8142,
    lng: -78.6985,
    certifications: ['American Board of Orthopaedic Surgery', 'AAOS Fellow'],
    hospitalAffiliation: 'UNC Rex Hospital'
  },
  {
    id: 'US14271890',
    npi: '1427189032',
    name: 'Dr. Rebecca M. Chen, MD',
    title: 'Senior Consultant Family Physician',
    specialty: 'Primary Care',
    subSpecialty: 'Preventive Healthcare & Diabetes Management',
    clinicName: 'Henry Ford Health Center - New Center One',
    address: '3031 W Grand Blvd',
    city: 'Detroit',
    state: 'MI',
    zipCode: '48202',
    phone: '+1 (313) 555-0188',
    email: 'rchen1@hfhs.org',
    rating: 4.95,
    reviewCount: 620,
    distanceMiles: 2.8,
    networkTier: 'Tier 1 Preferred',
    acceptingNewPatients: true,
    telehealthAvailable: true,
    nextAvailableSlot: 'Today at 3:30 PM',
    languages: ['English', 'Mandarin'],
    lat: 42.3688,
    lng: -83.0762,
    certifications: ['American Board of Family Medicine', 'NCQA Diabetes Recognition'],
    hospitalAffiliation: 'Henry Ford Hospital Detroit'
  }
];

export const SPECIALTIES = [
  'Cardiology',
  'Primary Care',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Oncology',
  'Dermatology',
  'Gastroenterology',
  'Psychiatry',
  'Endocrinology'
];

export function buildPatientAppointmentMessage(provider: Provider, patientName: string = 'Member', userLocation: string = 'Detroit, MI'): string {
  return `[INSURANCE NETWORK ALERT] Hello ${patientName}, based on your search for ${provider.specialty} near ${userLocation}, we matched you with an In-Network specialist:

👤 Specialist: ${provider.name} (NPI: ${provider.npi})
🏥 Medical Center: ${provider.clinicName}
📍 Location: ${provider.address}, ${provider.city}, ${provider.state} ${provider.zipCode} (~${provider.distanceMiles} mi)
📞 Direct Contact: ${provider.phone}
🗓️ Next Slot: ${provider.nextAvailableSlot}
⭐ Rating: ${provider.rating}/5.0 (${provider.reviewCount} reviews) - ${provider.networkTier}
🌐 Telehealth: ${provider.telehealthAvailable ? 'Available' : 'In-person only'}

Call ${provider.phone} to schedule or reply C to confirm. Ref ID: ${provider.id}.`;
}

export const buildSmsMessage = buildPatientAppointmentMessage;

export function buildInsurerDispatchMessage(
  provider: Provider,
  recipientName: string = 'Insurance Claims Desk',
  userLocation: string = 'Detroit, MI',
  gapLevel: string = 'CRITICAL',
  actionRequired: boolean = false
): string {
  const actionFlag = actionRequired ? 'ACTION REQUIRED: YES - Manual review requested.' : 'ACTION REQUIRED: NONE - Automatic network balance confirmed.';
  return `[INSURER DISPATCH ALERT] Network Access Gap Status: RESOLVED (Gap Level: ${gapLevel})

📋 Ref ID: ${provider.id} | Provider NPI: ${provider.npi}
👤 Specialist: ${provider.name} (${provider.specialty})
🏥 Facility: ${provider.clinicName} (${provider.address}, ${provider.city}, ${provider.state})
📏 Distance: ${provider.distanceMiles} mi from target region (${userLocation})
🗓️ Next Slot: ${provider.nextAvailableSlot}
📞 Contact: ${provider.phone}

${actionFlag}`;
}

export function getPredefinedSpecialtyMessage(provider: Provider, patientName: string = 'Member'): string {
  const spec = provider.specialty || 'Healthcare';
  return `[HEALTHCARE MATCH ALERT] ${spec} Specialist Matched: ${provider.name} (NPI: ${provider.npi}). Center: ${provider.clinicName}. Slot: ${provider.nextAvailableSlot}. Call: ${provider.phone}. Reply C to confirm.`;
}

export function buildPatientAppointmentVoiceScript(provider: Provider, patientName: string = 'Member', userLocation: string = 'Detroit, MI'): string {
  return `Hello ${patientName}. This is an automated healthcare provider match notification from your care coordination team in ${userLocation}. Based on your request for a ${provider.specialty} specialist, we have matched you with ${provider.name} at ${provider.clinicName}, ${provider.address}, ${provider.city}, ${provider.state}. Next available appointment is ${provider.nextAvailableSlot}. Please contact their office directly at ${provider.phone}. Thank you!`;
}

export const buildVoiceScript = buildPatientAppointmentVoiceScript;

export function buildInsurerDispatchVoiceScript(
  provider: Provider,
  recipientName: string = 'Insurance Operations Team',
  userLocation: string = 'Detroit, MI',
  gapLevel: string = 'CRITICAL',
  actionRequired: boolean = false
): string {
  const actionText = actionRequired ? 'Action is required. Manual review is requested.' : 'No action required. Automatic network balance confirmed.';
  return `Insurer Dispatch Alert. Network Access Gap Status: RESOLVED for Gap Level ${gapLevel}. Reference ID ${provider.id}. Provider NPI ${provider.npi.split('').join(' ')}, ${provider.name}, ${provider.specialty} at ${provider.clinicName}, located ${provider.distanceMiles} miles from ${userLocation}. Next available slot: ${provider.nextAvailableSlot}. Office contact: ${provider.phone}. ${actionText}`;
}
