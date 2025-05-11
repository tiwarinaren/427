# Breathen - 4-2-7 Breathing App

A Progressive Web App (PWA) for breathing exercises using the 4-2-7 pattern (inhale for 4 seconds, hold for 2 seconds, exhale for 7 seconds).

## Features

- Minimal design with peaceful pastel colors
- Visual breathing animation with text cues
- Countdown timers for each phase (4-3-2-1, 2-1, 7-6-5-4-3-2-1)
- Dark/light mode toggle for comfortable use in any environment
- Audio cues (soft beeps by default, with option to toggle to voice instructions)
- Automatic start/stop when opening/closing the app
- Works offline (PWA functionality)
- Can be installed on iOS devices

## Setup Instructions

1. **Prepare Audio Files**
   - Place the following audio files in the `audio` directory:
     - `softbeep.mp3` - A soft beep sound
     - `inhale.mp3` - Voice saying "inhale"
     - `hold.mp3` - Voice saying "hold"
     - `exhale.mp3` - Voice saying "exhale"

2. **Generate App Icons**
   - Open `generate-icon.html` in a browser
   - Generate icons for all required sizes
   - Save the generated icons to the `icons` directory with the correct filenames

3. **Generate Splash Screens**
   - Open `generate-splash.html` in a browser
   - Generate splash screens for all required sizes
   - Save the generated splash screens to the `icons` directory with the correct filenames

4. **Deploy to a Web Server**
   - Upload all files to the root directory of your web server
   - The app expects to run from the root directory, not from a subfolder
   - Make sure the server is configured to serve the correct MIME types for the manifest file

## Using the App

1. Open the app in a mobile browser (Safari on iOS)
2. For the best experience on iOS, add the app to your home screen:
   - Tap the Share button
   - Select "Add to Home Screen"
   - Confirm by tapping "Add"
3. Launch the app from your home screen
4. The breathing exercise will start automatically
5. Toggle between beep (default) and voice audio cues by tapping the button at the bottom
6. Switch between dark and light mode using the toggle in the top right corner

## Customization

- Edit `styles.css` to change the color scheme
- Modify the breathing pattern timing in `script.js` (currently set to 4-2-7)
- Replace audio files with your own recordings

## Browser Compatibility

This app works best on:
- iOS Safari (as a PWA added to home screen)
- Chrome for Android
- Modern desktop browsers

## Troubleshooting

If the app doesn't work properly as a PWA:
1. Make sure all icon files are present and correctly named
2. Check that the manifest.json file is being served with the correct MIME type
3. Verify that the service worker is registered correctly
4. Clear browser cache and try again