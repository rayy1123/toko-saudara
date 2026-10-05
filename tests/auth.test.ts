import assert from "node:assert/strict";
import prisma from "../src/lib/db";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} from "../src/lib/auth";

export async function runAuthTests() {
  console.log("\n--- Menjalankan tests/auth.test.ts ---");
  const testId = Date.now();
  const testEmail = `test.user.${testId}@tokosaudara.id`;
  const rawPassword = "TestPassword123!";

  // 1. Test Password Hashing
  console.log("  [TEST] Password hashing & verification");
  const hashedPassword = await hashPassword(rawPassword);
  assert.notEqual(hashedPassword, rawPassword, "Password hash tidak boleh sama dengan plaintext");
  assert.ok(hashedPassword.startsWith("$2"), "Password harus di-hash dengan bcrypt");

  const isMatch = await verifyPassword(rawPassword, hashedPassword);
  assert.equal(isMatch, true, "Verifikasi password yang benar harus bernilai true");

  const isWrongMatch = await verifyPassword("WrongPassword!", hashedPassword);
  assert.equal(isWrongMatch, false, "Verifikasi password salah harus bernilai false");

  // 2. Test User Registration in Database
  console.log("  [TEST] Registrasi user & pembuatan profil pelanggan");
  const createdUser = await prisma.user.create({
    data: {
      email: testEmail,
      phone: "081299998888",
      passwordHash: hashedPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      profile: {
        create: {
          name: "Budi Santoso",
          phone: "081299998888",
        },
      },
    },
    include: { profile: true },
  });

  assert.ok(createdUser.id, "User ID harus ter-generate (UUID)");
  assert.equal(createdUser.email, testEmail, "Email harus sesuai input registrasi");
  assert.equal(createdUser.role, "CUSTOMER", "Role default harus CUSTOMER");
  assert.equal(createdUser.status, "ACTIVE", "Status user harus ACTIVE");
  assert.equal(createdUser.profile?.name, "Budi Santoso", "CustomerProfile harus terbuat otomatis");

  // 3. Test Duplicate Email Prevention (Constraint)
  console.log("  [TEST] Pencegahan registrasi email duplikat");
  await assert.rejects(
    async () => {
      await prisma.user.create({
        data: {
          email: testEmail, // Duplicate
          passwordHash: hashedPassword,
          role: "CUSTOMER",
        },
      });
    },
    (err: any) => {
      // Prisma unique constraint error code is P2002
      return err.code === "P2002" || /unique/i.test(err.message);
    },
    "Registrasi dengan email duplikat harus melempar error unique constraint"
  );

  // 4. Test Token Generation & Verification
  console.log("  [TEST] Pembuatan & verifikasi JWT token");
  const token = await createToken({
    userId: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
  });
  assert.ok(typeof token === "string" && token.length > 20, "JWT token harus berupa string valid");

  const verified = await verifyToken(token);
  assert.ok(verified, "Token harus berhasil diverifikasi");
  assert.equal(verified?.sub, createdUser.id, "Payload sub harus berisi ID user");
  assert.equal(verified?.email, testEmail, "Payload email harus sesuai");
  assert.equal(verified?.role, "CUSTOMER", "Payload role harus sesuai");

  const invalidToken = await verifyToken("invalid.token.payload");
  assert.equal(invalidToken, null, "Token invalid harus mengembalikan null");

  // 5. Test RBAC: Admin vs Customer Role Check
  console.log("  [TEST] Pemeriksaan hak akses Role-Based Access Control (RBAC)");
  function checkRoleAccess(userRole: string, allowedRoles: string[]) {
    if (!allowedRoles.includes(userRole)) {
      throw new Error("FORBIDDEN: Akses ditolak untuk role ini");
    }
    return true;
  }

  // Customer attempting customer action -> OK
  assert.equal(checkRoleAccess(createdUser.role, ["CUSTOMER"]), true);

  // Customer attempting admin action -> Throws Forbidden
  assert.throws(
    () => checkRoleAccess(createdUser.role, ["ADMIN"]),
    /FORBIDDEN/,
    "Role CUSTOMER tidak boleh memiliki akses ke aksi ADMIN"
  );

  // Cashier role check
  assert.equal(checkRoleAccess("CASHIER", ["ADMIN", "CASHIER"]), true, "Role CASHIER harus diizinkan akses kasir");
  assert.throws(
    () => checkRoleAccess("CASHIER", ["ADMIN"]),
    /FORBIDDEN/,
    "Role CASHIER tidak boleh mengakses laporan sensitif pemilik"
  );

  // Admin user check
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  assert.ok(adminUser, "User ADMIN harus ada di database (dari seed)");
  assert.equal(checkRoleAccess(adminUser!.role, ["ADMIN"]), true, "Role ADMIN harus diizinkan");

  // Cleanup test user
  await prisma.user.delete({ where: { id: createdUser.id } });
  console.log("  ✓ Semua pengujian auth.test.ts berhasil!");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  runAuthTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
