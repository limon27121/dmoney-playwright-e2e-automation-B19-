import fs from 'fs';
import path from 'path';
import { UserData } from '../pages/RegisterPage';

const agentFile = path.join(__dirname, '..', 'test-data', 'agent.json');

const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export function generateAgent(): UserData {
  // BD mobile: 01 + operator code (3-9) + 8 digits
  const operatorCode = String(Math.floor(Math.random() * 7) + 3);
  return {
    name: 'limon Boss',
    email: `moontaser.limon+${Math.floor(Math.random() * 900) + 100}@gmail.com`,
    password: '1234',
    phone: `01${operatorCode}${randomDigits(8)}`,
    nid: `${Math.floor(Math.random() * 9) + 1}${randomDigits(9)}`,
    role: 'Agent',
  };
}

export function saveAgent(agent: UserData) {
  fs.mkdirSync(path.dirname(agentFile), { recursive: true });
  fs.writeFileSync(agentFile, JSON.stringify(agent, null, 2));
}

export function loadAgent(): UserData {
  return JSON.parse(fs.readFileSync(agentFile, 'utf-8'));
}
