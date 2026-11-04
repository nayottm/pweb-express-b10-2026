import fs from "fs";
import path from "path";

interface PostmanRequestItem {
  name: string;
  request: {
    method: string;
    url: {
      raw: string;
    };
    body?: {
      raw?: string;
    };
    description?: string;
  };
}

async function run() {
  const collectionPath = path.resolve(process.cwd(), "..", "mlbb-shop-testcase.postman_collection.json");
  if (!fs.existsSync(collectionPath)) {
    console.error("File koleksi postman tidak ditemukan di:", collectionPath);
    process.exit(1);
  }

  const collection = JSON.parse(fs.readFileSync(collectionPath, "utf-8"));
  const items: PostmanRequestItem[] = collection.item;

  console.log(`\n🚀 Menjalankan ${items.length} Testcase ke http://localhost:3000...\n`);

  let passed = 0;
  let failed = 0;

  for (const item of items) {
    const { name, request } = item;
    const url = request.url.raw;
    const method = request.method;
    const expectedStatusMatch = request.description?.match(/Hasil yang benar:\s*(\d{3})/);
    const expectedStatus = expectedStatusMatch ? parseInt(expectedStatusMatch[1]) : null;

    try {
      const response = await fetch(url, {
        method,
        headers: request.body ? { "Content-Type": "application/json" } : undefined,
        body: request.body?.raw || undefined,
      });

      const isMatch = expectedStatus ? response.status === expectedStatus : response.ok;
      const statusIcon = isMatch ? "✅" : "❌";

      if (isMatch) {
        passed++;
        console.log(`${statusIcon} ${name} -> [${response.status}] (Sesuai)`);
      } else {
        failed++;
        console.log(`${statusIcon} ${name} -> [${response.status}] (Harapan: ${expectedStatus})`);
      }
    } catch (err: any) {
      failed++;
      console.log(`❌ ${name} -> Gagal koneksi (${err.message})`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Hasil Pengujian: ${passed} Berhasil, ${failed} Gagal`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();

