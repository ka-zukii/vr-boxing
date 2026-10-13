# Panduan Demo VR Boxing

VR Boxing adalah game latihan tinju virtual. Pemain melihat arena melalui headset VR, lalu memukul target atau lawan menggunakan controller di kedua tangan.

## Perangkat yang dibutuhkan

- Komputer/laptop untuk menjalankan game.
- Headset VR dengan browser yang mendukung WebXR.
- Dua controller VR untuk bermain dengan pukulan.
- Untuk multiplayer lokal, komputer dan headset harus tersambung ke Wi-Fi yang sama.

Mode single player memerlukan headset VR. Multiplayer dapat dibuka dari headset dan browser PC, tetapi pemain PC belum bisa melakukan pukulan; untuk duel penuh, gunakan headset VR pada kedua pemain.

## Menjalankan game

1. Sambungkan komputer dan perangkat pemain ke Wi-Fi yang sama.
2. Buka PowerShell di folder project. Jika belum pernah menjalankan project ini, pasang dependensi terlebih dahulu:

   ```powershell
   npm install
   ```

3. Jalankan game:

   ```powershell
   npm run dev
   ```

4. Lihat alamat **Network** yang muncul di PowerShell. Buka alamat Wi-Fi tersebut di browser komputer dan headset. Contoh:

   ```text
   https://192.168.1.37:4173/
   ```

   Gunakan alamat Wi-Fi komputer, bukan `localhost`, `127.0.0.1`, atau alamat `vEthernet` saat membuka game di headset.

5. Jika browser menampilkan peringatan sertifikat (**Not secure**), pilih **Advanced / Lanjutan**, lalu **Proceed / Lanjutkan ke situs**.

Biarkan PowerShell dan komputer host tetap menyala selama permainan. Jika Windows meminta izin jaringan untuk Node.js, izinkan akses pada jaringan **Private**.

## Kontrol di headset VR

- Arahkan pandangan dengan menggerakkan kepala.
- Pukul dengan mengayunkan controller kiri atau kanan ke arah target/lawan. Tombol controller bukan tombol pukul.
- Multiplayer: joystick kiri untuk bergerak dan joystick kanan untuk berputar.
- Tunggu countdown selesai sebelum mulai memukul atau bergerak.
- Saat layar hasil muncul, arahkan controller ke tombol **PLAY AGAIN** atau **HOME**, lalu tekan trigger untuk memilih, tombol trigger ada di depan controller, lebih tepatnya di dekat jari telunjuk.
- untuk tombol select di menu gamenya bisa pakai tombol *A* di controller.

## Single player

1. Buka game dari browser headset.
2. Pilih **SINGLE PLAYER**.
3. Pilih mode permainan dan tingkat kesulitan.
4. Untuk mode **CLASSIC** atau **REFLEX**, pilih waktu ronde **30 SEC** atau **60 SEC**.
5. Tekan **PLAY**, lalu ikuti permintaan browser untuk masuk ke mode VR.
6. Setelah countdown selesai, pukul target yang muncul di arena.

| Mode | Cara bermain |
| --- | --- |
| **Classic** | Pukul target yang bergerak mengelilingi pemain dan kumpulkan skor sebelum waktu habis. |
| **Reflex** | Pukul target segera setelah muncul. Target hanya terlihat sebentar. |
| **Combo Chain** | Pukul target berturut-turut untuk mempertahankan combo. Jika pukulan meleset atau combo terputus, ronde berakhir. Mode ini tidak memakai timer. |
| **Survival** | Bertahan selama mungkin. Pemain mulai dengan 3 HP dan kehilangan 1 HP saat pukulan meleset. Mode ini tidak memakai timer. |

Tingkat kesulitan tersedia dalam **Easy**, **Normal**, dan **Hard**. Semakin tinggi tingkat kesulitan, semakin cepat dan menantang targetnya.

## Multiplayer

1. Host membuka URL game dan memilih **MULTIPLAYER**.
2. Host menekan **CREATE ROOM**. Bagikan kode room yang muncul kepada pemain kedua.
3. Pemain kedua membuka URL yang sama, memilih **MULTIPLAYER**, memasukkan kode room, lalu menekan **JOIN**.
4. Pemain kedua menekan **READY** dan tetap menunggu di room.
5. Setelah pemain kedua berstatus **READY**, host menekan **START MATCH**.
6. Jika pemain kedua memakai headset VR, setelah host memulai pertandingan tekan **ENTER XR TO JOIN** ketika tombol itu muncul. Browser memerlukan klik tersebut untuk mengizinkan sesi VR.
7. Tunggu layar **LOADING** dan countdown selesai. Setelah tulisan **FIGHT!** muncul, kedua pemain dapat mulai bertinju.

Kedua pemain memiliki HP. Pukulan yang mengenai lawan mengurangi HP lawan; pemain yang HP-nya habis lebih dulu kalah. Tidak ada batas waktu pertandingan.

Setelah hasil pertandingan muncul, tekan **PLAY AGAIN** untuk kembali ke room. Pemain kedua menekan **READY** lagi, lalu host menekan **START MATCH** untuk memulai ronde berikutnya. Tekan **HOME** untuk keluar dari pertandingan.

### Kontrol pemain PC di multiplayer

- **W**, **A**, **S**, **D**: bergerak.
- Klik area game, lalu gerakkan mouse: mengubah arah pandang.
- **Escape**: keluar dari room.
- **Enter**: memilih **PLAY AGAIN** saat layar hasil tampil.

Pemain PC dapat bergerak dan melihat arena, tetapi versi saat ini belum mendukung pukulan menggunakan mouse atau keyboard.
