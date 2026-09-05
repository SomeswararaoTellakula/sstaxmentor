import { google } from 'googleapis';
import logger from '../utils/logger.js';

let sheetsClient = null;

export function configureSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !key || !sheetId || key.includes('-----BEGIN') === false) {
    logger.warn('Google Sheets service account not configured — sync disabled');
    sheetsClient = null;
    return null;
  }
  const auth = new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/spreadsheets']);
  sheetsClient = google.sheets({ version: 'v4', auth });
  logger.info('Google Sheets configured');
  return sheetsClient;
}

export function getSheetsClient() {
  if (!sheetsClient) configureSheets();
  return sheetsClient;
}

export const HEADERS = [
  'Timestamp (IST)','Application ID','Status','Applicant Name','Mobile','Alt Mobile','Email',
  'Firm Name','Business Type','Nature','Address','City','State','PIN','Premises Type',
  'PAN','Aadhaar (masked)','Aadhaar Doc','PAN Doc','Photo','Electricity Bill',
  'Rental Agreement','Property Tax Receipt','Owner Name','Owner Mobile','Owner Aadhaar',
  'Witness Name','Witness Mobile','Witness Aadhaar','Bank Proof','Remarks','PDF Link',
];

export default { configureSheets, getSheetsClient, HEADERS };
