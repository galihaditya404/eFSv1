import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import fs from 'fs';
import path from 'path';

// Path untuk menyimpan database sementara (JSON file)
const dbPath = path.join(process.cwd(), 'faktur_data.json');

// Helper untuk membaca dan menulis database
function getDb() {
  if (!fs.existsSync(dbPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch(e) {
    return [];
  }
}

function saveDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  const data = getDb();
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(request) {
  try {
    const { index } = await request.json();
    const db = getDb();
    if (index >= 0 && index < db.length) {
      db.splice(index, 1); // Hapus item berdasarkan index
      saveDb(db);
    }
    return NextResponse.json({ success: true, data: db }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "QR Code kosong." }, { status: 400 });
    }

    let result = null;

    // --- SKENARIO 1: Format Kustom dipisah hashtag (#) ---
    if (url.includes("#")) {
      const parts = url.split("#");
      if (parts.length >= 6) {
        let bulan = "";
        let tahun = "";
        const tgl = parts[5];
        if (tgl) {
          const tglParts = tgl.split("-");
          if (tglParts.length >= 3) {
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const mIndex = parseInt(tglParts[1], 10) - 1;
            bulan = (mIndex >= 0 && mIndex < 12) ? monthNames[mIndex] : tglParts[1];
            tahun = tglParts[2];
          }
        }
        const rawPpn = parts.length > 7 ? parts[7] : "0";
        // Hilangkan titik ribuan dan potong desimal koma (79.200,00 -> 79200)
        const ppnString = rawPpn.split(',')[0].replace(/\./g, '');
        result = {
          nomorFaktur: parts[4] || "-",
          namaPenjual: parts[0] || "-",
          npwpPenjual: parts[1] || "-",
          bulan: bulan || "-",
          tahun: tahun || "-",
          jumlahPpn: ppnString || "0"
        };
      }
    }

    if (!result) {
      let xmlText = "";
      // --- SKENARIO 2 & 3: Format XML Mentah atau URL DJP ---
      if (url.trim().startsWith("<?xml") || url.trim().startsWith("<")) {
        xmlText = url;
      } else if (url.startsWith("http")) {
        if (!url.includes("pajak.go.id")) {
          return NextResponse.json({ error: "Bukan URL DJP. Teks: " + url.substring(0, 100) }, { status: 400 });
        }
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/xml, text/xml, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
        if (!response.ok) {
          throw new Error(`Server DJP menolak akses (Status: ${response.status}).`);
        }
        xmlText = await response.text();
      } else {
        return NextResponse.json({ error: "Format QR Code tidak dikenali. Isinya: " + url.substring(0, 200) }, { status: 400 });
      }

      const parser = new XMLParser({ parseTagValue: false });
      const jsonObj = parser.parse(xmlText);
      const fakturData = jsonObj?.fakturPajak || jsonObj?.resValidateFakturNd || jsonObj?.resValidateFakturPm || jsonObj?.resValidateFaktur || jsonObj;

      if (!fakturData || (!fakturData.nomorFaktur && !fakturData.npwpPenjual)) {
        throw new Error(`Gagal mengekstrak data. Root node tidak ditemukan. Isi mentah: ${xmlText.substring(0, 200)}...`);
      }

      let bulan = "";
      let tahun = "";
      if (fakturData.tanggalFaktur) {
        const separator = fakturData.tanggalFaktur.includes("/") ? "/" : "-";
        const parts = fakturData.tanggalFaktur.split(separator);
        if (parts.length >= 3) {
          const monthNum = parts[1];
          const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          const mIndex = parseInt(monthNum, 10) - 1;
          bulan = (mIndex >= 0 && mIndex < 12) ? monthNames[mIndex] : monthNum;
          tahun = parts[2];
        }
      }

      let noFaktur = fakturData.nomorFaktur || "-";
      if (fakturData.kdJenisTransaksi && fakturData.fgPengganti && noFaktur !== "-") {
        if (String(noFaktur).length <= 13) {
          noFaktur = String(fakturData.kdJenisTransaksi) + String(fakturData.fgPengganti) + String(noFaktur);
        }
      }

      result = {
        nomorFaktur: noFaktur,
        namaPenjual: fakturData.namaPenjual || "-",
        npwpPenjual: fakturData.npwpPenjual || "-",
        bulan: bulan || "-",
        tahun: tahun || "-",
        jumlahPpn: fakturData.jumlahPpn || "0"
      };
    }

    // --- SIMPAN KE DATABASE LOKAL ---
    const db = getDb();
    // Cek apakah sudah ada (hindari duplikasi)
    const isDuplicate = db.some(item => item.nomorFaktur === result.nomorFaktur);
    if (isDuplicate) {
      return NextResponse.json({ 
        error: "Faktur ini sudah pernah di-scan sebelumnya.",
        isDuplicate: true 
      }, { status: 409 });
    }
    
    db.push(result);
    saveDb(db);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
