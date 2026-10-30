import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import shippingService from '../modules/shipping/shipping.service.js';

async function run() {
  console.log('Fetching provinces...');
  try {
    const provinces = await shippingService.getProvinces();
    console.log(`Success! Fetched ${provinces.length} provinces.`);
    if (provinces.length > 0) {
      console.log('Sample province:', provinces[0]);
      
      const pId = provinces[0].ProvinceID;
      console.log(`Fetching districts for province ${pId}...`);
      const districts = await shippingService.getDistricts(pId);
      console.log(`Success! Fetched ${districts.length} districts.`);
      if (districts.length > 0) {
        console.log('Sample district:', districts[0]);
        
        const dId = districts[0].DistrictID;
        console.log(`Fetching wards for district ${dId}...`);
        const wards = await shippingService.getWards(dId);
        console.log(`Success! Fetched ${wards.length} wards.`);
        if (wards.length > 0) {
          console.log('Sample ward:', wards[0]);
        }
      }
    }
  } catch (err) {
    console.error('GHN API failed:', err.response?.data || err.message);
  }
}

run();
