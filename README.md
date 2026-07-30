# KIRA TORNADO V3

Create a mobile-first web application called "KIRA TORNADO" for Free Fire tournaments with a Solo Leveling inspired UI/UX.



THEME & DESIGN:

- Dark theme (black + neon blue glow)

- Inspired by Solo Leveling system UI (floating pop-ups, glowing borders, game-like interface)

- Smooth animations and futuristic fonts

- All text mostly white with blue glowing highlights



APP FLOW:



1. SPLASH SCREEN:

- Show app logo "KIRA TORNADO"

- Black background with blue glow animation

- After 2–3 seconds → redirect to Register page



2. REGISTER PAGE (System UI style popup):

- Fields:

  - Username

  - Password

  - Player Name

  - Free Fire UID

  - Player Level

  - Referral Code (optional)

- Show instructions below:

  - "Multiple accounts not allowed"

  - "Follow fair play rules"

- "Register" button with glowing effect



3. HOME PAGE:



HEADER:

- Top left: App logo

- Top right: Wallet icon



WELCOME BANNER:

- Free Fire banner image

- Text: "Welcome to KIRA TORNADO" (white text with blue glow)



TOURNAMENT SECTIONS (Grid style 2x2):



Row 1:

- Left: Free Matches

- Right: Battle Royale



Row 2:

- Left: Classic Squad

- Right: Lone Wolf



Each section opens a popup with tournaments.



4. TOURNAMENT RULES:



FREE MATCHES:

- Entry: Free

- Slots: 50 players

- Daily 5 matches



BATTLE ROYALE:

- Entry Fee: 5 coins

- Slots: 50 players

- Solo players only



CLASSIC SQUAD:

- Entry Fee: 10 coins

- Slots: 8 teams (4 vs 4)



LONE WOLF:

- Entry Fee: 10 coins

- Slots: 2 vs 2 (4 players total)



MATCH FLOW:

- Show only 1 tournament at a time (not all at once)

- After scroll → show next tournaments



5. TOURNAMENT DETAILS PAGE:

- Square Free Fire banner

- Date and Time

- Note:

  "Room ID will be given 10 minutes before match.

   Match will start on time whether joined or not."



6. WALLET SYSTEM:

- Click wallet icon → open popup

- Options:

  - Add Coins

  - Withdraw

- Show QR Code

- Show UPI ID: kiratornado@ptyes



7. SIDE MENU:

- Click logo → open sidebar

- Options:

  - Profile Details

  - Customer Support

  - Feedback



8. TECH REQUIREMENTS:

- Use React (frontend)

- Firebase for backend (auth + database)

- Fully responsive mobile design

- Add PWA support (manifest + service worker)



9. APK CONVERSION READY:

- Optimize for WebView

- Provide steps to convert into APK using Android Studio or PWA wrapper



OUTPUT:

- Full working code

- Folder structure

- Deployment steps

- APK conversion guide

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kiratornado.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b8a7f42f-9ad2-4a94-bac4-f0571055e2ad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
