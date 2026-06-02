import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---- Roles (RBAC) ----
  const adminRole = await prisma.role.upsert({
    where: { name: 'administradora' },
    update: {},
    create: { name: 'administradora', description: 'Acceso total al sistema' },
  });

  const secretariaRole = await prisma.role.upsert({
    where: { name: 'secretaria' },
    update: {},
    create: {
      name: 'secretaria',
      description: 'Maneja las empresas que tiene asignadas',
    },
  });

  // ---- Usuarios de prueba (contraseñas hasheadas con bcrypt) ----
  const adminPassword = await bcrypt.hash('Admin1234*', 10);
  const secretariaPassword = await bcrypt.hash('Secret1234*', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'developer03@pops.com.co' },
    update: {},
    create: {
      email: 'developer03@pops.com.co',
      password: adminPassword,
      fullName: 'Administradora Principal',
      roleId: adminRole.id,
    },
  });

  const secretaria = await prisma.user.upsert({
    where: { email: 'secretaria@lemapp.test' },
    update: {},
    create: {
      email: 'secretaria@lemapp.test',
      password: secretariaPassword,
      fullName: 'Secretaria de Prueba',
      roleId: secretariaRole.id,
    },
  });

  // ---- Empresas cliente ----
  const company1 = await prisma.company.upsert({
    where: { taxId: '900123456-1' },
    update: {},
    create: {
      name: 'Comercializadora Andina S.A.S.',
      taxId: '900123456-1',
      email: 'contacto@andina.co',
      phone: '+57 3001234567',
      address: 'Cra 10 # 20-30, Bogotá',
    },
  });

  const company2 = await prisma.company.upsert({
    where: { taxId: '901987654-2' },
    update: {},
    create: {
      name: 'Inversiones del Caribe Ltda.',
      taxId: '901987654-2',
      email: 'info@caribe.co',
      phone: '+57 3019876543',
      address: 'Calle 50 # 40-15, Barranquilla',
    },
  });

  // ---- Asignar la secretaria a ambas empresas (pivote) ----
  for (const company of [company1, company2]) {
    await prisma.companyAssignment.upsert({
      where: {
        companyId_userId: { companyId: company.id, userId: secretaria.id },
      },
      update: {},
      create: { companyId: company.id, userId: secretaria.id },
    });
  }

  console.log('✅ Seed completado:');
  console.table([
    { entidad: 'rol', valor: adminRole.name },
    { entidad: 'rol', valor: secretariaRole.name },
    { entidad: 'usuario (admin)', valor: admin.email },
    { entidad: 'usuario (secretaria)', valor: secretaria.email },
    { entidad: 'empresa', valor: company1.name },
    { entidad: 'empresa', valor: company2.name },
  ]);
  console.log('🔑 Credenciales de prueba:');
  console.log('   admin     -> developer03@pops.com.co / Admin1234*');
  console.log('   secretaria-> secretaria@lemapp.test  / Secret1234*');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed falló:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
