// Runs in GitHub Actions after "npx cap add android": notification icon, labels and version number.
const fs = require("fs");
const path = require("path");

const res = "android/app/src/main/res";
fs.mkdirSync(path.join(res, "drawable"), { recursive: true });
fs.writeFileSync(path.join(res, "drawable", "ic_stat_pin.xml"),
`<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF"
      android:pathData="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"/>
</vector>
`);

const stringsPath = path.join(res, "values", "strings.xml");
let strings = fs.readFileSync(stringsPath, "utf8");
if (!strings.includes("capacitor_background_geolocation")) {
  strings = strings.replace("</resources>",
`    <string name="capacitor_background_geolocation_notification_channel_name">Trip tracking</string>
    <string name="capacitor_background_geolocation_notification_icon">drawable/ic_stat_pin</string>
    <string name="capacitor_background_geolocation_notification_color">#0E4D45</string>
</resources>`);
  fs.writeFileSync(stringsPath, strings);
}

const gradlePath = "android/app/build.gradle";
const n = parseInt(process.env.BUILD_NUMBER || "1", 10);
let gradle = fs.readFileSync(gradlePath, "utf8");
gradle = gradle.replace(/versionCode \d+/, `versionCode ${n}`).replace(/versionName "[^"]*"/, `versionName "1.${n}"`);
fs.writeFileSync(gradlePath, gradle);
console.log(`Android project ready, version 1.${n}`);
