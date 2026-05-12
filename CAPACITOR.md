# LandlordKu Android (Capacitor)

## Struktur

- Web app utama tetap di root repo: `index.html`, `app.js`, `i18n.js`, `styles.css`, dll.
- `scripts/build-capacitor-web.js` menyalin aset web ke `www/`.
- Capacitor membaca `www/` lalu menyinkronkan ke `android/app/src/main/assets/public/`.
- `www/` adalah output generated dan di-ignore dari Git.

## Command Harian

```powershell
npm run cap:build-web
npm run cap:sync
npm run cap:open
```

## Build Android

Setelah Java/JDK dan Android SDK tersedia:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Untuk upload Google Play, build release `.aab` dari Android Studio atau Gradle release flow.

## Catatan Environment Windows

Jika Gradle gagal dengan:

```text
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

Install Android Studio atau JDK 17+, lalu set `JAVA_HOME` ke folder JDK. Android Studio biasanya menyertakan JDK di folder `jbr`.

Contoh sementara di PowerShell:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Setelah itu ulangi:

```powershell
cd android
.\gradlew.bat assembleDebug
```

## App ID

Package Android saat ini:

```text
com.propertiku.app
```

Pilih package ini dengan hati-hati sebelum publish. Setelah rilis ke Google Play, package name tidak bisa diganti untuk app yang sama.
