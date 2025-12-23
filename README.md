# 🎵 Twitch Music Request

Système de song request Twitch avec approbation via Discord et player YouTube intégré.

![Demo](https://img.shields.io/badge/Platform-Twitch-9147ff?style=flat-square&logo=twitch)
![Discord](https://img.shields.io/badge/Control-Discord-5865F2?style=flat-square&logo=discord)
![YouTube](https://img.shields.io/badge/Player-YouTube-FF0000?style=flat-square&logo=youtube)

## ✨ Fonctionnalités

- 🎤 **Commande chat** : Les viewers demandent des musiques avec `!music <titre ou lien>`
- 📱 **Approbation Discord** : Reçois les demandes sur Discord avec boutons Approuver/Refuser
- 🎬 **Player YouTube** : Lecture automatique des musiques approuvées
- 🔍 **Recherche auto** : Les viewers peuvent taper juste le nom de la chanson
- 🎨 **Overlay OBS** : Affiche "Now Playing" sur ton stream

## 📸 Aperçu

### Discord
Les demandes arrivent avec miniature, titre, artiste et boutons :

```
🎵 Demande de ViewerName
Never Gonna Give You Up
Artiste: Rick Astley
[✅ Approuver] [❌ Refuser]
```

### Player Web
Interface avec file d'attente et lecture automatique.

### Overlay OBS
Widget élégant affichant la musique en cours.

## 🚀 Installation

### 1. Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- Un compte Discord
- Une chaîne Twitch

### 2. Créer un bot Discord

1. Va sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique **"New Application"** → nomme-le → Create
3. Menu **"Bot"** → **"Reset Token"** → copie le token
4. Active **"Message Content Intent"**
5. Menu **"OAuth2"** → **"URL Generator"**
   - Coche `bot` et `applications.commands`
   - Permissions : `Send Messages`, `Embed Links`
   - Copie l'URL et invite le bot sur ton serveur
6. Clic droit sur le salon Discord → "Copier l'identifiant"

### 3. Configuration

```bash
# Clone le repo
git clone https://github.com/TON_USERNAME/twitch-music-request.git
cd twitch-music-request

# Installe les dépendances
npm install

# Copie le fichier de config
cp .env.example .env
```

Édite le fichier `.env` :

```env
TWITCH_CHANNEL=ta_chaine_twitch
DISCORD_TOKEN=ton_token_discord
DISCORD_CHANNEL_ID=id_du_salon
```

### 4. Lancement

```bash
npm start
```

Ouvre http://localhost:3000 et clique "Démarrer le Player".

## 📺 Intégration OBS

### Player (optionnel)
Si tu veux voir le player dans OBS :
1. Sources → + → Navigateur
2. URL : `http://localhost:3000`
3. Taille : 800x600

### Overlay Now Playing
1. Sources → + → Navigateur
2. URL : `http://localhost:3000/overlay.html`
3. Taille : 400x120
4. Place-le où tu veux sur ton stream

## 🎮 Utilisation

### Pour les viewers
```
!music never gonna give you up
!music https://www.youtube.com/watch?v=dQw4w9WgXcQ
!music lofi hip hop
```

### Pour toi
1. Lance l'app avec `npm start`
2. Ouvre le player http://localhost:3000
3. Clique "Démarrer le Player"
4. Gère les demandes depuis Discord sur ton tel/tablette

## 🛠️ Configuration avancée

### Changer la commande
Dans `server.js`, modifie :
```javascript
if (!message.toLowerCase().startsWith('!music ')) return;
```

### Port personnalisé
Dans `.env` :
```env
PORT=8080
```

## 📁 Structure

```
twitch-music-request/
├── server.js          # Serveur principal
├── package.json
├── .env               # Ta config (non partagée)
├── .env.example       # Template de config
├── .gitignore
└── public/
    ├── index.html     # Player web
    └── overlay.html   # Overlay OBS
```

## ❓ FAQ

**Q: La musique ne joue pas automatiquement ?**
R: C'est une restriction des navigateurs. Clique "Démarrer le Player" une fois au début du stream.

**Q: Le bot Discord ne répond pas ?**
R: Vérifie que "Message Content Intent" est activé dans les paramètres du bot.

**Q: Comment arrêter l'app ?**
R: `Ctrl+C` dans le terminal.

## 📄 Licence

MIT - Utilise-le comme tu veux !

## 🤝 Contribution

Les dons sont les bienvenus:
https://ko-fi.com/jimsofer

---

Créé avec ❤️ pour les streamers
