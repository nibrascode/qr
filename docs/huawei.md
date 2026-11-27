# Nibras QR — HUAWEI AppGallery versiyası

Bu sənəd Nibras QR-ın AppGallery (Huawei) versiyasının necə qurulduğunu və
buraxılış üçün nələrin edilməli olduğunu izah edir. Google Play versiyası
olduğu kimi qalır.

## Necə işləyir

| | Google Play (`play`) | HUAWEI AppGallery (`huawei`) |
|---|---|---|
| Android flavor | `play` | `huawei` |
| Veb bundle | `npm run build:mobile` | `VITE_STORE=huawei npm run build:mobile` |
| Ödəniş | RevenueCat + Google Play Billing | HMS In-App Purchases (`HuaweiIap` plaqini) |
| Alışın yoxlanması | RevenueCat → `revenuecat-webhook` / `verify-entitlement` | `huawei-iap-verify` (+ `huawei-iap-notify`) |
| Giriş | Google (native, Credential Manager) | Google (brauzerdə, Supabase OAuth) + e-poçt kodu |
| `com.android.vending.BILLING` | var | silinib |

- **Pro = RevenueCat (Google Play) VƏ YA aktiv Huawei alışı.** `entitlements`
  cədvəlində hər mağazanın vəziyyəti ayrıca saxlanılır (`rc_*`, `huawei_*`),
  `is_pro` / `expires_at` isə birləşmiş nəticədir (`public.refresh_entitlement`).
- Huawei alışları **HUAWEI ID-yə** bağlıdır. Tətbiqə daxil olmadan da Pro cihazda
  işləyir. Daxil olduqda alışlar serverdə yoxlanılır və hesaba yazılır (bulud
  sinxronizasiyası, dinamik QR, digər cihazlar üçün).
- Bir alış tokeni yalnız bir Nibras QR hesabına bağlana bilər (ilk bağlayan hesab).
- `lifetime` məhsulu **consume edilmir** (yoxsa yenidən satılar).

### Kod xəritəsi

- `android/app/build.gradle` — `play` / `huawei` flavor-ları, `huaweiImplementation com.huawei.hms:iap`
- `android/build.gradle` — Huawei maven repo və `agcp` plaqini
- `android/app/src/huawei/AndroidManifest.xml` — BILLING silinir, HMS app id, `com.nibras.qr://auth-callback` deep link
- `android/app/src/huawei/java/com/nibras/qr/HuaweiIapPlugin.java` — native IAP körpüsü
  (`isEnvReady`, `getProducts`, `buy`, `ownedPurchases`, `consumeOrAck`, `manageSubscriptions`)
- `src/mobile/purchases.ts` — ümumi interfeys; `purchases.revenuecat.ts` (Play), `purchases.huawei.ts` (Huawei)
- `src/mobile/backend.ts` — brauzerdə Google girişi, e-poçt kodu, `verifyHuaweiPurchases`
- `src/mobile/email-sign-in.tsx`, `src/mobile/strings-store.ts`, `src/mobile/privacy-text.ts` (`huaweiPolicy`)
- `supabase/migrations/20261127090000_huawei_iap.sql` — `store_purchases`, `huawei_notifications`, `refresh_entitlement`, yeni `is_pro`
- `supabase/functions/_shared/huawei.ts`, `huawei-iap-verify`, `huawei-iap-notify`

## Məhsul ID-ləri (bir yerdə)

Fayl: **`supabase/functions/_shared/huawei-products.json`** — həm tətbiq, həm
server funksiyaları buradan oxuyur. ID dəyişsə, yalnız bu faylı dəyiş, tətbiqi
yenidən yığ və funksiyaları yenidən deploy et.

| ID | Növ (AGC) | Paket | Tövsiyə olunan qiymət |
|---|---|---|---|
| `monthly` | Auto-renewable subscription (abunə qrupu: məs. `Nibras QR Pro`) | Aylıq | 1.99 USD |
| `yearly` | Auto-renewable subscription (eyni qrup) | İllik | 9.99 USD |
| `lifetime` | Non-consumable | Ömürlük | 19.99 USD |

## AppGallery Connect-də ediləcəklər

Hazırdır: layihə **Nibras QR** (`101653523865888975`), tətbiq **App ID `120002599`**,
paket `com.nibras.qr`, IAP aktivdir.

1. **Merchant Service** (ödəniş hesabı): *Users and permissions → Merchant service*.
   Bank və şəxsiyyət yoxlaması bir neçə gün çəkə bilər; ödənişli məhsullar bunsuz satılmır.
2. **İmza sertifikatı:** *Project settings → General information → SHA-256 certificate fingerprint*
   — upload açarının (`qr-upload`) SHA-256-sını əlavə et (AppGallery app signing istifadə olunursa, onunkunu da).
   Almaq üçün: `keytool -list -v -keystore qr-upload.jks -alias qr-upload`.
3. **Məhsullar:** *Operate → Product management → Products*: yuxarıdakı 3 məhsulu yarat
   (iki abunə bir qrupda), qiymətləri təyin et, **Activate** et.
4. **IAP parametrləri** (*Earn → In-App Purchases → Settings*):
   - Public key — artıq var (`iap_public_key.txt`).
   - İmza alqoritmi: `SHA256WithRSA/PSS` (kod hər ikisini qəbul edir).
   - **Subscription notification URL** (versiya **v2**):
     `https://rbnhwyvpuobdmgqjdiyj.supabase.co/functions/v1/huawei-iap-notify?key=<HUAWEI_NOTIFY_KEY>`
5. **Sandbox testerlər:** *Users and permissions → Sandbox → Test accounts* — HUAWEI ID-ləri əlavə et.
6. **Server API açarları:** *Project settings → General information → App information*:
   OAuth 2.0 **Client ID** (bu tətbiqdə `120002599`, `agconnect-services.json` → `oauth_client.client_id`)
   və **Client secret / App secret**. Bunlar `HUAWEI_CLIENT_ID` / `HUAWEI_CLIENT_SECRET` olur.

## Gizli açarlar və dəyişənlər

### GitHub (repo → Settings → Secrets and variables → Actions)

| Ad | Növ | Dəyər |
|---|---|---|
| `AGCONNECT_SERVICES_JSON_BASE64` | **Secret** | `base64 -w0 agconnect-services.json` (faylda client secret və API key var, ona görə repoya qoyulmur) |
| `HUAWEI_IAP_PUBLIC_KEY` | Variable | IAP public key (base64, açıqdır) — tətbiq daxilində əlavə imza yoxlaması üçün |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Secret | mövcud imza açarları (hər iki mağaza üçün eynidir) |

### Supabase (Edge Functions → Secrets)

| Ad | Məcburi | Dəyər |
|---|---|---|
| `HUAWEI_IAP_PUBLIC_KEY` | bəli | IAP public key (base64) |
| `HUAWEI_CLIENT_ID` | tövsiyə | OAuth client ID (App ID `120002599`) |
| `HUAWEI_CLIENT_SECRET` | tövsiyə | həmin client-in secret-i |
| `HUAWEI_NOTIFY_KEY` | tövsiyə | uzun təsadüfi sətir; bildiriş URL-indəki `?key=` |
| `HUAWEI_IAP_SITES` | yox | yoxlanılacaq saytların sırası, standart `dra,dre,drru,drcn` |

`HUAWEI_CLIENT_ID/SECRET` olmadan alışlar yalnız IAP imzası ilə qəbul edilir
(`verified_by = 'signature'`); geri qaytarma/ləğv yalnız imzalı bildirişlə görünür.
Açarlar əlavə olunandan sonra hər alış Huawei serverində təsdiqlənir (`verified_by = 'server'`).

## Supabase deploy

```bash
npx supabase login
npx supabase link --project-ref rbnhwyvpuobdmgqjdiyj

# 1) Miqrasiya (store_purchases, huawei_notifications, refresh_entitlement, is_pro)
npx supabase db push            # və ya SQL Editor-də 20261127090000_huawei_iap.sql

# 2) Gizli açarlar
npx supabase secrets set HUAWEI_IAP_PUBLIC_KEY="$(tr -d '\n' < iap_public_key.txt)" \
  HUAWEI_CLIENT_ID=120002599 HUAWEI_CLIENT_SECRET=... HUAWEI_NOTIFY_KEY="$(openssl rand -hex 24)"

# 3) Funksiyalar (birləşmiş Pro məntiqi üçün köhnələr də yenidən deploy olunur)
npx supabase functions deploy huawei-iap-verify
npx supabase functions deploy huawei-iap-notify --no-verify-jwt
npx supabase functions deploy verify-entitlement
npx supabase functions deploy revenuecat-webhook --no-verify-jwt
npx supabase functions deploy delete-account
```

Miqrasiya funksiyalardan **əvvəl** tətbiq olunmalıdır (`saveProState` yeni sütunlara yazır).

### Supabase Auth (Huawei versiyasında giriş)

1. *Authentication → URL Configuration → Redirect URLs*: **`com.nibras.qr://auth-callback`** əlavə et.
2. *Authentication → Providers → Google*: aktivdir; Client ID + **Client secret** (Web client) dolu olmalıdır.
3. Google Cloud Console → Web client → *Authorized redirect URIs*:
   **`https://rbnhwyvpuobdmgqjdiyj.supabase.co/auth/v1/callback`**.
4. *Authentication → Providers → Email*: aktiv. *Email Templates → Magic Link* şablonuna kod əlavə et:
   `<p>Giriş kodun: <strong>{{ .Token }}</strong></p>` (tətbiq 6 rəqəmli kod istəyir).
5. Tövsiyə: *Authentication → SMTP Settings* — öz SMTP (Supabase-in standart poçtu saatda bir neçə məktubla məhdudlaşır).

## Lokal yığım

```bash
npm ci
cp /yol/agconnect-services.json android/app/src/huawei/   # gitignore-dadır

# Google Play
npm run build:mobile && npx cap sync android
(cd android && ./gradlew assemblePlayDebug)          # app/build/outputs/apk/play/debug/

# HUAWEI AppGallery
VITE_STORE=huawei VITE_HUAWEI_IAP_PUBLIC_KEY="$(tr -d '\n' < iap_public_key.txt)" npm run build:mobile
npx cap copy android
(cd android && ./gradlew assembleHuaweiDebug)        # app/build/outputs/apk/huawei/debug/
```

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` hər iki versiya üçün lazımdır.
**Diqqət:** veb bundle və flavor eyni mağaza üçün olmalıdır (Huawei APK-ya `VITE_STORE=huawei` ilə yığılmış bundle).

CI (`.github/workflows/build-apk.yml`) hər iki versiyanı yığır: `QR-debug-apk` / `QR-release-aab`
(Play) və `QR-huawei-debug-apk` / `QR-huawei-release` (AppGallery üçün imzalı APK + AAB).

## Test (sandbox)

1. Sandbox tester HUAWEI ID-si ilə Huawei cihazına (və ya HMS Core olan telefona) daxil ol.
2. `QR-huawei-release` APK-nı (imzası AGC-dəki SHA-256 ilə eyni olmalıdır) quraşdır.
3. Paywall → məhsullar AppGallery qiymətləri ilə görünməlidir → al → «Pro aktivdir».
4. Hesab → Google və ya e-poçt kodu ilə daxil ol → Supabase-də `store_purchases` sətri,
   `entitlements.huawei_is_pro = true`.
5. «Bərpa et», «İdarə et» (Huawei abunə ekranı), abunəni ləğv et → bildiriş `huawei_notifications`-a düşür.
