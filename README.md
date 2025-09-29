# ShepherdBibleApp
Shepherd Bible App is a faith-driven tool that helps Christians grow deeper in God’s Word. With Scripture, Bible studies, and practical insights, it’s more than a reader—it’s a guide. For kids, Shepherd uses AR technology to bring Bible stories to life with fun animations, interactive lessons, and scripture-based activities.


# React Native Wireless Development Setup Guide

## 📱 Run Your React Native App on Your Phone Without Cables!

This guide will help you set up React Native development and run your app wirelessly on your Android phone.

---

## ⚙️ Prerequisites (What You Need First)

### 1. Install Required Software

**Node.js:**
- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS version (recommended)
- Install with default settings

**Android Studio:**
- Download from [developer.android.com](https://developer.android.com/studio)
- Install with default settings
- Open Android Studio and let it download additional components

**React Native CLI:**
```bash
npm install -g react-native-cli
```

### 2. Set Up Android Development

**Enable Developer Options on Your Phone:**
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. You'll see "Developer options enabled"
4. Go back to **Settings → Developer Options**
5. Enable **USB Debugging**
6. Enable **Wireless Debugging** (Android 11+ only)

**Connect Your Computer and Phone:**
- Make sure both are on the **same WiFi network**
- This is crucial for wireless connection!

---

## 🚀 Step-by-Step Setup

### Step 1: Create or Navigate to Your Project

**For New Project:**
```bash
npx react-native init YourAppName
cd YourAppName
```

**For Existing Project:**
```bash
cd path/to/your/project
```

### Step 2: Connect Phone via USB (First Time Only)

1. **Connect your phone with USB cable**
2. **Allow USB debugging** when prompted on phone
3. **Verify connection:**
   ```bash
   adb devices
   ```
   You should see your device listed like: `RF8XC05H8AZ     device`

### Step 3: Enable Wireless Connection

**Switch to WiFi mode:**
```bash
adb tcpip 5555
```
You should see: `restarting in TCP mode port: 5555`

**Find your phone's IP address:**
```bash
adb shell ip addr show wlan0
```
Look for the line with `inet` - example: `inet 192.168.1.72/24`
Your IP is `192.168.1.72` (yours will be different)

**Connect wirelessly:**
```bash
adb connect YOUR_PHONE_IP:5555
```
Replace `YOUR_PHONE_IP` with the actual IP address.

**Verify wireless connection:**
```bash
adb devices
```
You should see both USB and WiFi connections:
```
RF8XC05H8AZ                device
192.168.1.72:5555         device
```

### Step 4: Disconnect USB Cable

**Remove USB connection:**
```bash
adb disconnect RF8XC05H8AZ
```

**Now unplug the USB cable** - you're wireless! 📡

### Step 5: Start Development Server

**Start Metro (the development server):**
```bash
npx react-native start
```

You'll see:
```
Welcome to Metro
Dev server ready on http://localhost:8081
```

**Keep this terminal window open** - this is your development server.

### Step 6: Build and Install App

**Open a new terminal window** and navigate to your project:
```bash
cd path/to/your/project
npx react-native run-android
```

**First time setup takes 15-25 minutes** because:
- Gradle downloads (large build system)
- Android dependencies download
- Project compilation

**What you'll see:**
```
Downloading https://services.gradle.org/distributions/gradle-8.14.3-bin.zip
10%...20%...30%...100%
BUILD SUCCESSFUL
Installing APK on 192.168.1.72:5555
```

---

## 🎉 Success! Your App is Running Wirelessly

### What Should Happen:
1. ✅ **App installs** on your phone via WiFi
2. ✅ **App launches** automatically
3. ✅ **Metro server connects** to your phone
4. ✅ **Hot reloading works** - edit code and see instant changes

### Test Wireless Development:
1. **Edit** `App.js` or any component file
2. **Save** the file
3. **Watch** your phone - changes appear automatically! 

---

## 🛠️ Troubleshooting

### "Cannot connect to device"
**Check WiFi connection:**
- Both devices on same network?
- Try `adb connect YOUR_IP:5555` again

### "Gradle download timeout"
**Add to** `android/gradle.properties`:
```properties
systemProp.org.gradle.internal.http.connectionTimeout=600000
systemProp.org.gradle.internal.http.socketTimeout=600000
```

### "No apps connected"
**Shake your phone** or run:
```bash
adb shell input keyevent 82
```
In the dev menu → **Settings** → Set **Debug server host** to: `YOUR_COMPUTER_IP:8081`

### Find Your Computer's IP:
```bash
ipconfig
```
Look for your WiFi adapter's IPv4 address.

---

## ⚡ Daily Development Workflow

### Starting Development (After Initial Setup):

1. **Start Metro server:**
   ```bash
   npx react-native start
   ```

2. **If app isn't running, install it:**
   ```bash
   npx react-native run-android
   ```
   (Much faster after first time - usually 1-2 minutes)

3. **Code away!** 
   - Edit files and save
   - Changes appear instantly on phone
   - No cables needed! 

### Reconnecting After Restart:

If you restart your computer or phone:
```bash
adb connect YOUR_PHONE_IP:5555
```

---

## 🎯 Pro Tips

**Speed up builds:**
- Keep Metro server running between sessions
- Only run `npx react-native run-android` when you need to reinstall

**Better debugging:**
- Shake phone → **Enable Remote JS Debugging**
- Use Chrome DevTools for debugging

**Multiple devices:**
- Connect multiple phones to test on different devices
- Each gets its own IP address

**Network issues:**
- If WiFi is unstable, USB connection still works
- You can switch between USB and WiFi anytime

---

## 📱 Summary

**One-time setup:** ~30 minutes (mostly waiting for downloads)
**Daily development:** Just start Metro server and code!
**No more cables:** Your phone stays wirelessly connected
**Hot reloading:** Instant feedback as you code

**You're now ready to develop React Native apps like a pro!** 🚀

---

*Need help? The React Native community is very helpful on Stack Overflow and GitHub discussions!*
