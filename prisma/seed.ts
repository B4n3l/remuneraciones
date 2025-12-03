import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create AFP providers (AFPs chilenas actuales)
  const afps = [
    { nombre: 'Capital', porcentaje: 11.44, comision: 1.44 },
    { nombre: 'Cuprum', porcentaje: 11.48, comision: 1.48 },
    { nombre: 'Habitat', porcentaje: 11.27, comision: 1.27 },
    { nombre: 'Modelo', porcentaje: 10.58, comision: 0.58 },
    { nombre: 'PlanVital', porcentaje: 11.16, comision: 1.16 },
    { nombre: 'Provida', porcentaje: 11.38, comision: 1.38 },
    { nombre: 'Uno', porcentaje: 10.69, comision: 0.69 },
  ];

  console.log('Creating AFP providers...');
  for (const afp of afps) {
    await prisma.aFP.upsert({
      where: { nombre: afp.nombre },
      update: {},
      create: afp,
    });
  }

  // Create current system values (valores aproximados de Diciembre 2025)
  console.log('Creating system values...');
  const today = new Date();
  
  await prisma.systemValue.upsert({
    where: {
      tipo_fecha: {
        tipo: 'UF',
        fecha: today,
      },
    },
    update: {},
    create: {
      tipo: 'UF',
      valor: 37880.50, // Valor aproximado
      fecha: today,
    },
  });

  await prisma.systemValue.upsert({
    where: {
      tipo_fecha: {
        tipo: 'UTM',
        fecha: today,
      },
    },
    update: {},
    create: {
      tipo: 'UTM',
      valor: 66613, // Valor aproximado
      fecha: today,
    },
  });

  await prisma.systemValue.upsert({
    where: {
      tipo_fecha: {
        tipo: 'SUELDO_MINIMO',
        fecha: today,
      },
    },
    update: {},
    create: {
      tipo: 'SUELDO_MINIMO',
      valor: 500000, // Valor aproximado
      fecha: today,
    },
  });

  // Create tax brackets for 2025 (valores aproximados - deben actualizarse)
  console.log('Creating tax brackets for 2025...');
  const taxBrackets2025 = [
    { fromUTM: 0, toUTM: 13.5, factor: 0, deduction: 0 },
    { fromUTM: 13.5, toUTM: 30, factor: 0.04, deduction: 0.54 },
    { fromUTM: 30, toUTM: 50, factor: 0.08, deduction: 1.74 },
    { fromUTM: 50, toUTM: 70, factor: 0.135, deduction: 4.49 },
    { fromUTM: 70, toUTM: 90, factor: 0.23, deduction: 11.14 },
    { fromUTM: 90, toUTM: 120, factor: 0.304, deduction: 17.8 },
    { fromUTM: 120, toUTM: 310, factor: 0.35, deduction: 23.32 },
    { fromUTM: 310, toUTM: null, factor: 0.40, deduction: 38.82 },
  ];

  for (const bracket of taxBrackets2025) {
    await prisma.taxBracket.upsert({
      where: {
        year_fromUTM: {
          year: 2025,
          fromUTM: bracket.fromUTM,
        },
      },
      update: {},
      create: {
        year: 2025,
        ...bracket,
      },
    });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
