/**
 * __tests__/api-integration.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Comprehensive API integration tests for all Medi-Sync AI endpoints.
 * Tests all modules: Users, Prescriptions, Medications, Reminders, Drugs, Doctors, Voice
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Test Data ────────────────────────────────────────────────────────────────

const TEST_DATA = {
  users: {
    register: {
      phone_number: "+2348012345678",
      email: "test-user@example.com",
      name: "Test User",
      password: "SecurePassword@123",
      age: 35,
      gender: "female",
    },
    login: {
      email: "test-user@example.com",
      password: "SecurePassword@123",
    },
  },
  prescriptions: {
    create: {
      ocr_text: "Amoxicillin 500mg - Take 1 tablet 3 times daily for 7 days",
    },
  },
  medications: {
    create: {
      drug_name: "Amoxicillin",
      dosage: "500mg",
      frequency: "3 times daily",
      start_date: new Date().toISOString().split("T")[0],
      reminder_times: ["09:00", "13:00", "17:00"],
    },
  },
  reminders: {
    create: ["08:00", "14:00", "20:00"],
  },
  drugs: {
    search: "Aspirin",
  },
  doctors: {
    search: "Cardiologist",
  },
};

// ─── API Integration Tests ────────────────────────────────────────────────────

describe("API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let prescriptionId: number;
  let medicationId: number;
  let reminderId: number;

  // ─── Users Module ────────────────────────────────────────────────────────────
  describe("Users API", () => {
    it("should register a new user", async () => {
      const response = await fetch("https://olive-backend-bly2.onrender.com/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_DATA.users.register),
      });

      expect(response.status).toBe(201 || 200); // Some APIs return 200 for success
      const data = await response.json();
      expect(data).toHaveProperty("access_token");
      expect(data).toHaveProperty("user");
      expect(data.user).toHaveProperty("id");

      authToken = data.access_token;
      userId = data.user.id;
    });

    it("should login with credentials", async () => {
      const response = await fetch("https://olive-backend-bly2.onrender.com/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_DATA.users.login),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("access_token");
      expect(data).toHaveProperty("user");

      authToken = data.access_token;
      userId = data.user.id;
    });

    it("should get user profile", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("phone_number");
      expect(data.id).toBe(userId);
    });

    it("should update user profile", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name: "Updated User Name", age: 36 }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("Updated User Name");
      expect(data.age).toBe(36);
    });

    it("should verify phone and request OTP", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/users/${userId}/verify-phone`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({}),
        }
      );

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty("success");
    });

    it("should send email verification", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/users/${userId}/verify-email`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201]).toContain(response.status);
    });
  });

  // ─── Prescriptions Module ─────────────────────────────────────────────────────
  describe("Prescriptions API", () => {
    it("should create a new prescription", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/prescriptions/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(TEST_DATA.prescriptions.create),
        }
      );

      expect(response.status).toBe(201 || 200);
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("ocr_text");

      prescriptionId = data.id;
    });

    it("should get all user prescriptions", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/prescriptions/${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should get single prescription", async () => {
      if (!prescriptionId) return; // Skip if no prescription created

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/prescriptions/${prescriptionId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(prescriptionId);
    });

    it("should add drug to prescription", async () => {
      if (!prescriptionId) return; // Skip if no prescription created

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/prescriptions/${prescriptionId}/drugs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            drug_name: "Ibuprofen",
            dosage: "400mg",
            frequency: "2 times daily",
          }),
        }
      );

      expect([200, 201]).toContain(response.status);
    });
  });

  // ─── Medications Module ───────────────────────────────────────────────────────
  describe("Medications API", () => {
    it("should create a new medication", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(TEST_DATA.medications.create),
        }
      );

      expect(response.status).toBe(201 || 200);
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("drug_name");

      medicationId = data.id;
    });

    it("should get all medications", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should get single medication", async () => {
      if (!medicationId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/${medicationId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(medicationId);
    });

    it("should update medication", async () => {
      if (!medicationId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/${medicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ dosage: "1000mg" }),
        }
      );

      expect(response.status).toBe(200);
    });

    it("should record compliance", async () => {
      if (!medicationId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/${medicationId}/compliance`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201]).toContain(response.status);
    });
  });

  // ─── Reminders Module ─────────────────────────────────────────────────────────
  describe("Reminders API", () => {
    it("should create reminders for medication", async () => {
      if (!medicationId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/${medicationId}/reminders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(TEST_DATA.reminders.create),
        }
      );

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        reminderId = data[0].id;
      }
    });

    it("should get all reminders", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/reminders/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should get reminder stats", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/reminders/user/${userId}/stats`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("sent");
    });

    it("should snooze reminder", async () => {
      if (!reminderId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/reminders/${reminderId}/snooze?minutes=10`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201]).toContain(response.status);
    });

    it("should mark reminder as taken", async () => {
      if (!reminderId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/reminders/${reminderId}/taken`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201]).toContain(response.status);
    });
  });

  // ─── Drugs Module ─────────────────────────────────────────────────────────────
  describe("Drugs API", () => {
    it("should search drugs", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/drugs/search?q=${encodeURIComponent(
          TEST_DATA.drugs.search
        )}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("should get drug generics", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/drugs/Aspirin/generics`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 404]).toContain(response.status); // 404 if no generics found
    });

    it("should verify drug", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/drugs/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ reg_number: "NAFDAC/A4L/0001" }),
        }
      );

      expect([200, 201, 404]).toContain(response.status);
    });
  });

  // ─── Doctors Module ───────────────────────────────────────────────────────────
  describe("Doctors API", () => {
    it("should get all doctors", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/doctors`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("results");
    });

    it("should search doctors", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/doctors/search?q=cardiologist`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("results");
    });

    it("should get doctor specializations", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/doctors/specializations`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 404]).toContain(response.status);
    });
  });

  // ─── Voice Module ─────────────────────────────────────────────────────────────
  describe("Voice API", () => {
    it("should get supported languages", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/voice/supported-languages`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it("should test voice service connectivity", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/voice/test`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201, 404]).toContain(response.status);
    });

    it("should synthesize text to speech", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/voice/synthesize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            text: "Take your medication now",
            language: "en",
            speed: "normal",
            gender: "female",
          }),
        }
      );

      expect([200, 201, 404]).toContain(response.status);
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        expect(data).toHaveProperty("audio_url");
      }
    });
  });

  // ─── Health Check ────────────────────────────────────────────────────────────
  describe("Health Check API", () => {
    it("should return backend health status", async () => {
      const response = await fetch("https://olive-backend-bly2.onrender.com/health");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  describe("Cleanup", () => {
    it("should delete medication", async () => {
      if (!medicationId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/medications/${medicationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 204]).toContain(response.status);
    });

    it("should delete prescription", async () => {
      if (!prescriptionId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/prescriptions/${prescriptionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 204]).toContain(response.status);
    });

    it("should logout user", async () => {
      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/users/logout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201]).toContain(response.status);
    });

    it("should delete user account", async () => {
      if (!userId) return;

      const response = await fetch(
        `https://olive-backend-bly2.onrender.com/api/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 204]).toContain(response.status);
    });
  });
});
