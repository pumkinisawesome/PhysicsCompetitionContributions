# Instructions for setting up the Oculus/Meta Quest 2 for development use

## Developer Mode
> Enables unofficial applications to be sideloaded, and for settings to be
> modified
1. Go to [this website](https://developer.oculus.com/manage/organizations/create/), and register as a Developer.
2. Open up the Oculus app on your phone that you used to setup the headset, and get to the devices choices (hamburger leads to choices including devices)
3. Select the headset from the device list and connect to it.
4. Tap More Settings, then Developer Mode, and enable it.
5. Exit settings on the app, and reboot the headset using the side power button.
6. After restart, confirm in Oculus settings that Experimental is one of the
panels.  This confirms you are in developer mode.

## Android Debug Bridge
> This allows for port forwarding, so that localhost can be accessed.
1. Download and install [Android Debug Bridge]
  * [Installation](https://www.xda-developers.com/install-adb-windows-macos-linux/)  or just apt-get install android-tools-adb
  * [Instructions for use](https://developer.android.com/studio/command-line/adb.html).
2. Plug in the headset to the computer using a USB-C cable.
3. Run the following command: `adb devices`, which should show the connected
headset. 
4. The command `adb reverse tcp:<port> tcp:<port>` will forward the localhost
from your computer to the headset. To use this with physics competition, two
ports are needed: `1024` and `3001`, so these two commands should be run:
```
adb reverse tcp:1024 tcp:1024
adb reverse tcp:3001 tcp:3001
```
5. Then, if everything is running on your computer, you can visit https://localhost:1024 in the Oculus browser.

## SideQuest
> An application for sideloading Android APKs to the headset.

Instructions on how to setup SideQuest can be found [here](https://sidequestvr.com/setup-howto). Ignore the Easy Installer, as that can't sideload the needed 
development apps


## OVR Metrics Tool
> This creates an overlay that displays different metrics, such as the current
> frame rate, GPU and CPU usage. 
1. Download and install [OVR Metrics Tool](https://developer.oculus.com/downloads/package/ovr-metrics-tool/) onto your computer, and unzip it. 
2. Connect the headset to your computer using a USB-C cable.
3. Install SideQuest, if you haven't already.
4. Open SideQuest, and click on the icon at the top which says *"Install APK  file from folder on computer."*
5. Select the file called `OVRMetricsTool_vx.x.x.apk`, click "open", and wait for the installation to complete.
6. Put on the headset, and open the app library (icon that looks like a 3x3 
grid of boxes). Click on the dropdown at the top right which says "All", and select "Unknown Sources", then select OVR Metrics Tool.
7. Different options can be toggled on and off through this app. Enable Persistant Overlay to see the overlay at all times.