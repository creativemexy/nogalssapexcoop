# Fix Network Error When Logging In via Expo Go

## Quick Diagnosis

If you see "Network Error" when trying to login, follow these steps:

### Step 1: Verify Server is Running
```bash
# Check if server is running
netstat -tuln | grep :3000

# If not running, start it:
cd /home/mexy/Desktop/newNogalss
npm run dev
```

### Step 2: Check Your Computer's IP
```bash
hostname -I
```

Your IP should be: **192.168.8.107**

### Step 3: Test Connection from Phone

**On your phone's browser**, try to open:
```
http://192.168.8.107:3000
```

**If this doesn't load:**
- Phone and computer are NOT on the same WiFi network
- OR firewall is blocking the connection

### Step 4: Check Network Connection

**Ensure:**
- ✅ Phone and computer are on the **SAME WiFi network**
- ✅ WiFi network names match exactly
- ✅ No VPN is active on either device

### Step 5: Check Firewall

```bash
# Check firewall status
sudo ufw status

# Allow port 3000
sudo ufw allow 3000/tcp

# Or temporarily disable for testing
sudo ufw disable
```

### Step 6: Verify Server Binding

The server should be listening on **0.0.0.0** (all interfaces), not just localhost.

Check `package.json`:
```json
"dev": "next dev -H 0.0.0.0"
```

If it says `"dev": "next dev"`, update it to include `-H 0.0.0.0`.

### Step 7: Use Tunnel Mode (Recommended)

If you can't get same-network connection working, use tunnel mode:

```bash
cd nogalss-mobile-rn
npm run start:tunnel
```

This creates a public URL that works from anywhere, even on different networks.

## Common Issues

### Issue: "ECONNREFUSED"
**Solution:** Server is not running or not accessible
- Start server: `npm run dev`
- Check if listening on 0.0.0.0:3000

### Issue: "ENOTFOUND" or "Network Error"
**Solution:** Can't resolve the IP address
- Verify IP is correct: `hostname -I`
- Update `nogalss-mobile-rn/src/config/api.ts` with correct IP
- Ensure devices on same network

### Issue: Works in browser but not in Expo Go
**Solution:** Expo Go might be using different network
- Try tunnel mode: `npm run start:tunnel`
- Or ensure Expo Go and browser use same network

## Quick Test

Run this to test if server is accessible:
```bash
curl http://192.168.8.107:3000/api/auth/mobile/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

If you get a response (even error 400), server is reachable.

## Still Not Working?

1. **Check the exact error message** in the mobile app
2. **Check terminal logs** when you try to login
3. **Try tunnel mode** as a workaround
4. **Share the error details** for further troubleshooting

