# EduPulse ERP ko Azure par deploy karein

## Aapka setup

| Kaam | Service |
| --- | --- |
| Next.js frontend aur backend | Azure App Service |
| Database | MongoDB Atlas M0 |
| Code | GitHub |
| Automatic deployment | GitHub Actions |

Is app mein frontend aur API dono Next.js ke andar hain. Isliye ise **Azure
App Service** par deploy karein, static website ki tarah nahi. `output: "export"`
enable na karein.

## Step 1: MongoDB Atlas taiyar karein

1. MongoDB Atlas account mein **M0 cluster** banayein.
2. Database user banayein aur uska username/password safe jagah par rakhein.
3. App Service banne ke baad uske **Properties** se **Outbound IP addresses**
   copy karein. Atlas ke **Network Access** mein ye IP addresses allow karein.
   Azure Overview par dikhne wale **Inbound IP addresses** use na karein.
   Production mein sabhi IPs (`0.0.0.0/0`) allow na karein.
4. Atlas se connection string copy karein. Ismein apna database user, password,
   aur database name (jaise `erp`) set karein. Is string ko secret rakhein.

## Step 2: Azure App Service banayein

Azure Portal mein **Create a resource > Web App** chunein. **Web App + Database**
option ki zaroorat nahi hai, kyunki database MongoDB Atlas mein hai.

| Azure option | Kya chunein |
| --- | --- |
| Publish | **Code** |
| Runtime stack | Azure mein available latest supported Node.js LTS |
| Operating System | **Linux** |
| Region | Apne users aur Atlas cluster ke nazdeek available region |
| Pricing plan | Apne budget aur student subscription ke hisaab se; price aur limits check karein |

App ka unique naam rakhein, jaise `edupulse-erp-school`. App banne ke baad
Azure Overview mein **Default domain** milega, jaise
`https://edupulse-erp-school-<generated-id>.centralindia-01.azurewebsites.net`.
Apne app ka exact domain use karein; example domain ko seedha copy na karein.

**Node version warning:** Agar Overview page bataye ki selected Node runtime
jaldi End of Life (EOL) hoga, App Service ki **Configuration / General
settings** mein kisi newer, supported LTS runtime par switch karein. GitHub
Actions workflow ke `actions/setup-node` step ka `node-version` bhi usi major
version se match karein.

**Pricing plan:** Screenshot mein F1 plan dikh raha hai. Ye testing ke liye
kaafi ho sakta hai, lekin iski availability, limits, sleep/availability
behavior, aur current cost apni Azure for Students subscription mein check
karein. Production se pehle zaroori performance aur availability test karein.

## Step 3: App ki settings dalein

Azure Portal mein apna App Service kholein. **Settings > Environment variables**
(kuch portals mein **Configuration > Application settings**) mein ye values
add karein:

| Setting ka naam | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Step 1 wali Atlas connection string |
| `JWT_SECRET` | Random, secret value; kam-se-kam 32 characters |
| `FRONTEND_URL` | Aapke app ka HTTPS URL |

`FRONTEND_URL` mein Azure Overview ka **Default domain** `https://` ke saath
dalein. Example:
`FRONTEND_URL=https://edupulse-erp-school-<generated-id>.centralindia-01.azurewebsites.net`

Password reset ke liye email bhejna ho to ye SMTP settings bhi add karein:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
Password aur connection string ko source code mein nahi, Azure settings mein
rakhein. Settings save karne ke baad app restart karein.

Startup command ke liye `npm start` set karein, agar Azure ne ise automatically
set na kiya ho.

## Step 4: GitHub ko Azure se connect karein

GitHub Actions workflow ko GitHub repository ke root par maujood
`.github/workflows` folder mein rakhein. Aapka Git root `Frontend/` folder hai,
isliye aapke computer par workflow ka path
`Frontend/.github/workflows/deploy-azure.yml` hoga. GitHub par ye
`.github/workflows/deploy-azure.yml` ke roop mein dikhega. App ka `package.json`
repository root par hai, isliye workflow wahin se build karta hai:

```text
repository/
|-- app/
|-- components/
|-- public/
|-- .gitignore
|-- package.json
|-- package-lock.json
`-- .github/
    `-- workflows/
        `-- deploy-azure.yml
```

Local workspace mein iska sambandh is tarah hai:

```text
ERP_PROJECT/
`-- Frontend/   <-- GitHub repository ka root
    |-- .github/
    |   `-- workflows/
    |       `-- deploy-azure.yml
    |-- app/
    |-- package.json
    `-- package-lock.json
```

GitHub Actions isi exact path se workflow detect karta hai. Aapki current
branch `master` hai, isliye workflow `master` par har push ke baad deploy karta
hai. Agar GitHub par default branch ko `main` karte hain, workflow ke branch
filter ko bhi `main` karein.

1. Azure App Service ke **Overview** page se **Get publish profile** download
   karein. Ye file password ki tarah secret hai.
2. GitHub mein apna repository kholein: **Settings > Secrets and variables >
   Actions > New repository secret**.
3. Ye do secrets banayein:

   | Secret ka naam | Value |
   | --- | --- |
   | `AZURE_WEBAPP_NAME` | App Service ka naam, URL nahi (example: `edupulse-erp-school`) |
   | `AZURE_WEBAPP_PUBLISH_PROFILE` | Publish profile file ka poora XML content |

Publish profile ko GitHub par file ke roop mein commit na karein.

## Step 5: Deploy karein

Repository mein `.github/workflows/deploy-azure.yml` workflow pehle se maujood
hai. Ye `master` branch par push hone par automatically:

1. Dependencies install karta hai.
2. Next.js production build karta hai.
3. App ko Azure App Service par deploy karta hai.

Manual deployment ke liye GitHub repository mein **Actions > Deploy to Azure App
Service > Run workflow** chunein.

## Step 6: App check karein

Workflow successful hone par apna Azure URL kholein. Website aur koi API-based
feature check karein. Deployment fail ho to GitHub ke **Actions** logs dekhein.
App start na ho to Azure App Service mein **Log stream** check karein.

## Dhyan rakhne wali baatein

- MongoDB connection string, JWT secret, SMTP password, ya admin password
  GitHub/source code mein na rakhein.
- MongoDB Atlas M0 aur Azure App Service plan ki current pricing, limits, aur
  student subscription eligibility deploy karne se pehle check karein.
- Uploaded images aur documents abhi app ke local disk par save hote hain. Ye
  storage deployments ya multiple app instances ke beech reliable/persistent
  nahi hai. Production uploads ke liye Azure Blob Storage jaise durable storage
  par shift karna recommended hai.
- Azure Static Web Apps hybrid Next.js hosting preview mein ho sakti hai;
  is project ke liye yahan documented App Service setup use karein.
