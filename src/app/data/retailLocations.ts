export type RetailLocation = {
  id: string;
  name: string;
  locality: string;
  lat: number;
  lng: number;
};

/** Points de vente SDN — source : Feuille de calcul sans titre.xlsx */
export const RETAIL_LOCATIONS: RetailLocation[] = [
  { id: 'sdn-1', name: 'Pharmacie El hadj Ahmed deme', locality: 'Sokone', lat: 14.669890400432369, lng: -17.430045276780934 }, 
  { id: 'sdn-2', name: 'Pharmacie Kermel (en ville)', locality: 'Dakar plateau', lat: 14.668817, lng: -17.437966 },
  { id: 'sdn-3', name: 'Pharmacie Fass Paillote', locality: 'Fass', lat: 14.683143, lng: -17.458412 },
  { id: 'sdn-4', name: 'Pharmacie Carrefour', locality: 'Castors', lat: 14.72272, lng: -17.448079 },
  { id: 'sdn-5', name: 'Pharmacie Djiddah', locality: 'Khar yallah', lat: 14.733381, lng: -17.452279 },
  { id: 'sdn-6', name: 'Pharmacie Lydior', locality: 'Sacré coeur 3', lat: 14.718298, lng: -17.464335 },
  { id: 'sdn-7', name: 'Pharmacie Hann Maristes', locality: 'Hann', lat: 14.724817, lng: -17.438124 },
  { id: 'sdn-8', name: 'Pharma Teranga (ville)', locality: 'Dakar plateau', lat: 14.665105, lng: -17.43594 },
  { id: 'sdn-9', name: 'Pharmacie Salsy', locality: 'Ouest Foire', lat: 14.750886, lng: -17.470208 },
  { id: 'sdn-10', name: 'Pharmacie Mohamed Rassoul', locality: 'Vdn', lat: 14.785701, lng: -17.393682 },
  { id: 'sdn-11', name: 'Pharmacie Sud Foire', locality: 'Vdn', lat: 14.781989, lng: -17.391656 },
  { id: 'sdn-12', name: 'Pharmacie Wassour', locality: 'Grand mbao', lat: 14.732741, lng: -17.316679 },
  { id: 'sdn-13', name: 'Pharmacie Al Amine', locality: 'Parcelles Assainies', lat: 14.759398, lng: -17.438825 },
  { id: 'sdn-14', name: 'Pharmacie El Hadj Mamadou Seydou Ba', locality: 'Bopp', lat: 14.705549, lng: -17.447043 },
  { id: 'sdn-15', name: 'Pharmacie Kuky', locality: 'Sacré Coeur', lat: 14.714217, lng: -17.471197 },
  { id: 'sdn-16', name: 'Pharmacie Xandar', locality: 'Yoff', lat: 14.743301, lng: -17.469239 },
  { id: 'sdn-17', name: 'Pharma Terminus Liberté 5', locality: 'Liberté 4', lat: 14.721436, lng: -17.459197 },
  { id: 'sdn-18', name: 'Pharmacie Sokhna Bousso', locality: 'Touba', lat: 14.848263, lng: -15.883831 },
  { id: 'sdn-19', name: 'Pharmacie Touba Madina Serigne Mbacké Madina', locality: 'Touba', lat: 14.844551, lng: -15.881805 },
  { id: 'sdn-20', name: 'Pharmacie Darou Salam', locality: 'Touba', lat: 14.847157, lng: -15.888314 },
  { id: 'sdn-21', name: 'Pharmacie Serigne Abdou Khadre Mbacké', locality: 'Touba', lat: 14.850413, lng: -15.879069 },
  { id: 'sdn-22', name: 'Pharmacie Massalikoul Jinane', locality: 'Touba', lat: 14.839378, lng: -15.885139 },
  { id: 'sdn-23', name: 'Pharmacie Nguiranene', locality: 'Touba', lat: 14.854357, lng: -15.888661 },
  { id: 'sdn-24', name: 'Pharmacie Serigne Niane Diop', locality: 'Touba', lat: 14.844035, lng: -15.873692 },
  { id: 'sdn-25', name: 'Pharmacie Rond Point', locality: 'Dakar plateau', lat: 14.667711, lng: -17.442449 },
  { id: 'sdn-26', name: 'Pharmacie Tabara', locality: 'Grand mbao', lat: 14.729029, lng: -17.314653 },
  { id: 'sdn-27', name: 'Pharmacie Adja Sokhna Fall', locality: 'VDN', lat: 14.785701, lng: -17.393682 },
  { id: 'sdn-28', name: 'Pharmacie Malang Lys', locality: 'Saint-Louis', lat: 16.498915, lng: -15.817627 },
  { id: 'sdn-29', name: 'Pharmacie Du Baol', locality: 'Diourbel', lat: 14.6565, lng: -16.2314 },
  { id: 'sdn-30', name: 'Pharmacie Waalo Yaye Mareme Ndiaye', locality: 'Dagana', lat: 16.504446, lng: -15.81294 },
  { id: 'sdn-31', name: 'Pharmacie Village Artisanal Kaolack', locality: 'Kaolack', lat: 14.1534, lng: -16.0726 },
  { id: 'sdn-32', name: 'Pharma Colobane', locality: 'Colobane', lat: 14.70597, lng: -17.440156 },
  { id: 'sdn-33', name: 'Pharmacie Khadim Rassoul', locality: 'Malika', lat: 14.792218, lng: -17.337994 },
  { id: 'sdn-34', name: 'Pharmacie Pout', locality: 'Pout', lat: 14.7724, lng: -17.061 },
  { id: 'sdn-35', name: 'Pharmacie Mame Aly Sylla', locality: 'Rufisque', lat: 14.7182, lng: -17.2667 },
  { id: 'sdn-36', name: 'Pharmacie Demba Koïta', locality: 'Cité Keur Gorgui', lat: 14.713189, lng: -17.468716 },
  { id: 'sdn-37', name: 'Pharmacie Lat Dior', locality: 'Thies', lat: 14.794037, lng: -16.92378 },
];

export const RETAIL_MAP_CENTER = { lat: 14.75, lng: -16.45 } as const;
export const RETAIL_MAP_ZOOM = 7;
