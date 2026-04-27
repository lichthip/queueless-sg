import db, { initializeSchema } from './database';
import bcrypt from 'bcryptjs';

const CENTERS = [
  {
    name: 'Jurong Polyclinic',
    type: 'polyclinic',
    address: '190 Jurong East Ave 1, Singapore 609788',
    lat: 1.3437, lng: 103.7436,
    capacity: 120,
    operating_hours: '8:00 AM – 1:00 PM, 2:00 PM – 4:30 PM',
  },
  {
    name: 'Woodlands Polyclinic',
    type: 'polyclinic',
    address: '10 Woodlands St 31, Singapore 738579',
    lat: 1.4352, lng: 103.7860,
    capacity: 100,
    operating_hours: '8:00 AM – 1:00 PM, 2:00 PM – 4:30 PM',
  },
  {
    name: 'Geylang Polyclinic',
    type: 'polyclinic',
    address: '21 Geylang East Central, Singapore 389707',
    lat: 1.3179, lng: 103.8927,
    capacity: 90,
    operating_hours: '8:00 AM – 1:00 PM, 2:00 PM – 4:30 PM',
  },
  {
    name: 'Buona Vista Polyclinic',
    type: 'polyclinic',
    address: '1 Buona Vista Drive, Singapore 138883',
    lat: 1.3076, lng: 103.7902,
    capacity: 80,
    operating_hours: '8:00 AM – 1:00 PM, 2:00 PM – 4:30 PM',
  },
  {
    name: 'ICA Building',
    type: 'ICA',
    address: '10 Kallang Rd, Singapore 208718',
    lat: 1.3074, lng: 103.8641,
    capacity: 200,
    operating_hours: '8:00 AM – 5:00 PM',
  },
  {
    name: 'HDB Hub',
    type: 'HDB',
    address: '480 Toa Payoh Lorong 6, Singapore 310480',
    lat: 1.3325, lng: 103.8480,
    capacity: 150,
    operating_hours: '8:00 AM – 5:00 PM',
  },
  {
    name: 'CPF Building',
    type: 'CPF',
    address: '238B Thomson Road, Singapore 574650',
    lat: 1.3316, lng: 103.8375,
    capacity: 180,
    operating_hours: '8:00 AM – 5:00 PM',
  },
  {
    name: 'CDC West (Jurong)',
    type: 'CDC',
    address: '2 Jurong East Street 21, Singapore 609601',
    lat: 1.3330, lng: 103.7424,
    capacity: 80,
    operating_hours: '9:00 AM – 6:00 PM',
  },
];

function getBaseLoad(hour: number): number {
  const profile: Record<number, number> = {
    7: 0.20, 8: 0.60, 9: 0.85, 10: 0.75, 11: 0.60,
    12: 0.40, 13: 0.35, 14: 0.50, 15: 0.55, 16: 0.65,
    17: 0.45, 18: 0.20,
  };
  return profile[hour] ?? 0.10;
}

function seed() {
  initializeSchema();

  db.exec(`
    DELETE FROM queue_history;
    DELETE FROM queue_states;
    DELETE FROM staff;
    DELETE FROM centers;
    DELETE FROM sqlite_sequence;
  `);

  const insertCenter = db.prepare(`
    INSERT INTO centers (name, type, address, lat, lng, capacity, operating_hours)
    VALUES (@name, @type, @address, @lat, @lng, @capacity, @operating_hours)
  `);

  const insertQueue = db.prepare(`
    INSERT INTO queue_states (center_id, current_count, serving_number, avg_service_minutes, is_open)
    VALUES (@center_id, @current_count, @serving_number, @avg_service_minutes, @is_open)
  `);

  const runAll = db.transaction(() => {
    for (const center of CENTERS) {
      const { lastInsertRowid } = insertCenter.run(center);
      const centerId = lastInsertRowid as number;

      const hour = new Date().getHours();
      const load = getBaseLoad(hour);
      const count = Math.floor(load * center.capacity * (0.7 + Math.random() * 0.6));
      const serving = Math.max(0, count - Math.floor(Math.random() * 8));

      insertQueue.run({
        center_id: centerId,
        current_count: count,
        serving_number: serving,
        avg_service_minutes: 7 + Math.random() * 6,
        is_open: 1,
      });
    }
  });

  runAll();

  const hash = bcrypt.hashSync('admin123', 10);
  const insertStaff = db.prepare(
    'INSERT INTO staff (username, password_hash, center_id, role) VALUES (?, ?, ?, ?)'
  );
  insertStaff.run('admin', hash, null, 'admin');
  insertStaff.run('jurong_staff', hash, 1, 'staff');
  insertStaff.run('woodlands_staff', hash, 2, 'staff');

  console.log('✅  Database seeded');
  console.log('👤  admin / admin123        → all centres (admin)');
  console.log('👤  jurong_staff / admin123 → Jurong Polyclinic');
  console.log('👤  woodlands_staff / admin123 → Woodlands Polyclinic');
}

export default seed;
seed();