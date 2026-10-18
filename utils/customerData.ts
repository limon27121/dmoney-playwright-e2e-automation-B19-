import fs from 'fs';
import path from 'path';
import { UserData } from '../pages/RegisterPage';
import { generateAgent } from './agentData';

const customerFile = path.join(__dirname, '..', 'test-data', 'customer.json');

// Fresh Customer per run so the 10,000 Tk wallet cap is never reached
export function generateCustomer(): UserData {
  return {
    ...generateAgent(),
    name: 'limon Customer',
    email: `moontaser.limon+customer${Date.now()}@gmail.com`,
    role: 'Customer',
  };
}

export function saveCustomer(customer: UserData) {
  fs.mkdirSync(path.dirname(customerFile), { recursive: true });
  fs.writeFileSync(customerFile, JSON.stringify(customer, null, 2));
}

export function loadCustomer(): UserData {
  return JSON.parse(fs.readFileSync(customerFile, 'utf-8'));
}
