# Accessing the App from Other Devices on Your Network

## Quick Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Find your computer's IP address:**
   - **Mac/Linux:** Run `ifconfig` or `ip addr` in terminal
   - **Windows:** Run `ipconfig` in Command Prompt
   - Look for your WiFi adapter (usually `en0` on Mac or `Wi-Fi` on Windows)
   - Find the IPv4 address (e.g., `192.168.1.100`)

3. **Access from your laptop:**
   - Open a browser on your laptop
   - Go to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

## Detailed Instructions

### Finding Your IP Address

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for something like `inet 192.168.1.100`

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter

**On Linux:**
```bash
ip addr show
```
or
```bash
hostname -I
```

### Starting the Server

The Vite dev server is now configured to accept connections from other devices. When you run:

```bash
npm run dev
```

You'll see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
```

Use the **Network** URL from your laptop!

### Troubleshooting

**Can't access from laptop?**
1. Make sure both devices are on the same WiFi network
2. Check your firewall settings - you may need to allow port 3000
3. Try disabling VPN if you're using one
4. Make sure the dev server shows a "Network" URL (not just Local)

**Firewall on Mac:**
- System Settings → Network → Firewall
- Make sure it's not blocking Node.js or the port

**Firewall on Windows:**
- Windows Defender Firewall → Allow an app
- Allow Node.js or port 3000

**Port already in use?**
- Change the port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001, // or any other port
    host: true
  }
  ```

### Using the App

Once you can access it from your laptop:
- Open EPUB files from your laptop
- All features work the same (dictionary, summaries, etc.)
- The app will work offline after initial load
- You can install it as a PWA on your laptop too!

## Production Build (Alternative)

If you want to serve the built app:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Preview the production build:**
   ```bash
   npm run preview -- --host
   ```

3. **Access from laptop:** Same as above, but use the preview URL

## Notes

- The dev server will automatically reload when you make changes
- Both devices will see the same updates
- Make sure your laptop's browser supports modern JavaScript (Chrome, Firefox, Safari, Edge)

