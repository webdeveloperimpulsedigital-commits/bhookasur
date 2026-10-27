const mysql = require('mysql2/promise');

const REAL_CITY_SPOTS = [
  // Lucknow
  { id: 2, name: 'Dastarkhwan', address: 'Near Tulsi Cinema, Hazratganj', area: 'Hazratganj', city: 'Lucknow', lat: 26.8500, lng: 80.9300 },
  { id: 3, name: 'Royal Cafe', address: '9/7, Shahnajaf Road, Hazratganj', area: 'Hazratganj', city: 'Lucknow', lat: 26.8480, lng: 80.9450 },
  { id: 4, name: 'Sharma Tea Stall', address: '1, Naval Kishore Road, Hazratganj', area: 'Hazratganj', city: 'Lucknow', lat: 26.8520, lng: 80.9400 },
  { id: 5, name: 'Idris Biryani', address: 'Raja Bazar, Chowk', area: 'Chowk', city: 'Lucknow', lat: 26.8650, lng: 80.9120 },

  // Mumbai
  { id: 10, name: 'Gajalee', address: 'Kadamgiri Complex, Hanuman Road, Vile Parle East', area: 'Vile Parle', city: 'Mumbai', lat: 19.0980, lng: 72.8530 },

  // Delhi
  { id: 11, name: "Karim's", address: '16, Gali Kababian, Jama Masjid', area: 'Old Delhi', city: 'Delhi', lat: 28.6507, lng: 77.2334 },

  // Hyderabad
  { id: 17, name: 'Hotel Shadab', address: 'High Court Road, Madina Circle, Ghansi Bazaar', area: 'Ghansi Bazaar', city: 'Hyderabad', lat: 17.3688, lng: 78.4735 },
  { id: 19, name: 'Govind Dosa', address: 'Gulzar Houz, Charkaman, Ghansi Bazaar', area: 'Charminar', city: 'Hyderabad', lat: 17.3620, lng: 78.4740 },

  // Indore
  { id: 20, name: 'Chappan Dukan', address: '56 Dukan, New Palasia', area: 'New Palasia', city: 'Indore', lat: 22.7240, lng: 75.8840 },
  { id: 21, name: 'Sarafa Night Market', address: 'Sarafa Bazar, Near Rajwada', area: 'Sarafa', city: 'Indore', lat: 22.7180, lng: 75.8550 },

  // Bengaluru
  { id: 23, name: 'CTR (Shri Sagar)', address: '7th Cross Road, Margosa Road, Malleshwaram', area: 'Malleshwaram', city: 'Bengaluru', lat: 12.9980, lng: 77.5710 },
  { id: 25, name: 'Meghana Foods', address: '124, 1st Cross, 5th Block, Koramangala', area: 'Koramangala', city: 'Bengaluru', lat: 12.9340, lng: 77.6220 },
  { id: 26, name: 'Corner House', address: 'Residency Road & Indiranagar', area: 'Indiranagar', city: 'Bengaluru', lat: 12.9780, lng: 77.6400 },

  // Kolkata
  { id: 29, name: 'Kusum Rolls', address: '21, Park Street', area: 'Park Street', city: 'Kolkata', lat: 22.5510, lng: 88.3530 },

  // Jaipur
  { id: 36, name: 'Laxmi Mishthan (LMB)', address: 'Johari Bazar, Biseswarji', area: 'Johari Bazaar', city: 'Jaipur', lat: 26.9200, lng: 75.8270 },
  { id: 37, name: 'Tapri The Tea House', address: 'B4-E, Prithviraj Road, C Scheme', area: 'C Scheme', city: 'Jaipur', lat: 26.9040, lng: 75.8080 },

  // Ahmedabad
  { id: 38, name: 'Manek Chowk', address: 'Manek Chowk, Old City, Danapidth', area: 'Manek Chowk', city: 'Ahmedabad', lat: 23.0225, lng: 72.5870 },

  // Amritsar
  { id: 40, name: 'Kesar Da Dhaba', address: 'Chowk Passian, Near Telephone Exchange', area: 'Chowk Passian', city: 'Amritsar', lat: 31.6260, lng: 74.8770 },
  { id: 41, name: 'Bharawan Da Dhaba', address: 'Near Town Hall, Katra Ahluwalia', area: 'Town Hall', city: 'Amritsar', lat: 31.6250, lng: 74.8780 },

  // Varanasi
  { id: 42, name: 'Kashi Chaat Bhandar', address: 'D.37/49, Godowlia Road, Dashashwamedh Ghat', area: 'Godowlia', city: 'Varanasi', lat: 25.3100, lng: 83.0070 },
  { id: 43, name: 'Blue Lassi Shop', address: 'CK 12/1, Kunj Gali, Near Manikarnika Ghat', area: 'Manikarnika Ghat', city: 'Varanasi', lat: 25.3110, lng: 83.0120 },

  // Chennai
  { id: 44, name: 'Murugan Idli Shop', address: '77-1/A, GN Chetty Road, T. Nagar', area: 'T. Nagar', city: 'Chennai', lat: 13.0410, lng: 80.2330 },
  { id: 45, name: 'Saravana Bhavan', address: 'Kennet Lane, Egmore / T. Nagar', area: 'T. Nagar', city: 'Chennai', lat: 13.0400, lng: 80.2320 },

  // Goa
  { id: 47, name: "Martin's Corner", address: 'Ranvaddo, Salcete, Betalbatim', area: 'Betalbatim', city: 'Goa', lat: 15.3050, lng: 73.9140 },

  // Agra
  { id: 48, name: 'Pinch of Spice', address: '1076/2, Fatehabad Road, Tajganj', area: 'Tajganj', city: 'Agra', lat: 27.1600, lng: 78.0100 },
  { id: 49, name: 'Panchi Petha', address: 'Hari Parbat Crossing, Civil Lines', area: 'Civil Lines', city: 'Agra', lat: 27.1700, lng: 78.0200 },
  { id: 50, name: 'Mama Franky House', address: 'A-4, Sadar Bazar, Agra Cantt', area: 'Sadar Bazar', city: 'Agra', lat: 27.1620, lng: 78.0120 },

  // Patna
  { id: 51, name: 'Bikanervala', address: 'Dak Bungalow Crossing, Fraser Road', area: 'Dak Bungalow', city: 'Patna', lat: 25.6120, lng: 85.1410 },
  { id: 52, name: 'Biryani Mahal', address: 'Near Patna Junction, Station Road', area: 'Station Road', city: 'Patna', lat: 25.6140, lng: 85.1380 },
  { id: 53, name: 'Harilal\'s', address: 'Maurya Lok Complex, Frazer Road', area: 'Frazer Road', city: 'Patna', lat: 25.6110, lng: 85.1430 },

  // Chandigarh
  { id: 54, name: 'Pal Dhaba', address: 'Booth 165-166, Sector 28-D', area: 'Sector 28', city: 'Chandigarh', lat: 30.7180, lng: 76.7800 },
  { id: 55, name: 'Nik Bakers', address: 'SCO 441-442, Sector 35-C & Sector 9', area: 'Sector 9', city: 'Chandigarh', lat: 30.7420, lng: 76.7900 },
  { id: 56, name: 'Garg Chaat', address: 'Sector 23 Market', area: 'Sector 23', city: 'Chandigarh', lat: 30.7290, lng: 76.7750 },

  // Bhopal
  { id: 57, name: 'Manohar Dairy & Restaurant', address: '6, Hamidia Road & MP Nagar', area: 'Hamidia Road', city: 'Bhopal', lat: 23.2330, lng: 77.4320 },
  { id: 58, name: 'Hakeem Hotel', address: 'Zone 1, MP Nagar, Near Chetak Bridge', area: 'MP Nagar', city: 'Bhopal', lat: 23.2350, lng: 77.4340 }
];

async function updateCoords() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  for (const spot of REAL_CITY_SPOTS) {
    await pool.query(
      `UPDATE restaurants 
       SET address = COALESCE(?, address), 
           area = COALESCE(?, area), 
           latitude = ?, 
           longitude = ? 
       WHERE id = ?`,
      [spot.address, spot.area, spot.lat, spot.lng, spot.id]
    );
  }

  console.log(`Successfully updated ${REAL_CITY_SPOTS.length} restaurants with verified real city coordinates!`);
  process.exit(0);
}

updateCoords().catch(err => {
  console.error(err);
  process.exit(1);
});
